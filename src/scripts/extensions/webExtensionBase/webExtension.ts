/// <reference path="./w3cExtension.d.ts"/>
import {ClientType} from "../../clientType";
import {Constants} from "../../constants";
import {ResponsePackage} from "../../responsePackage";
import {Utils} from "../../utils";

import {TooltipType} from "../../clipperUI/tooltipType";

import {VideoUtils} from "../../domParsers/videoUtils";

import {Localization} from "../../localization/localization";

import * as Log from "../../logging/log";

import {ClipperData} from "../../storage/clipperData";
import {LocalStorage} from "../../storage/localStorage";

import {ChangeLog} from "../../versioning/changeLog";
import {Version} from "../../versioning/version";

import {ExtensionBase} from "../extensionBase";
import {InvokeInfo} from "../invokeInfo";
import {InvokeSource} from "../invokeSource";
import {InvokeMode, InvokeOptions} from "../invokeOptions";

import {InjectUrls} from "./injectUrls";
import {WebExtensionWorker} from "./webExtensionWorker";

// We are using the typing from chrome.d.ts, but it is the same for all of the WebExtensions
type Browser = typeof chrome;
type Tab = chrome.tabs.Tab;

export class WebExtension extends ExtensionBase<WebExtensionWorker, W3CTab, number> {
	public static browser: Browser;

	public injectUrls: InjectUrls;

	constructor(clientType: ClientType, injectUrls: InjectUrls) {
		super(clientType, new ClipperData(new LocalStorage()));

		this.injectUrls = injectUrls;

		this.registerBrowserButton();
		this.registerContextMenuItems();
		this.registerInstallListener();
		this.registerTabRemoveListener();
	}

	public static getExtensionVersion(): string {
		return WebExtension.browser.runtime.getManifest().version;
	}

	protected addPageNavListener(callback: (tab: W3CTab) => void) {
		WebExtension.browser.webNavigation.onCompleted.addListener((details) => {
			// The callback is called on iframes as well, so we ignore those as we are only interested in main frame navigation
			if (details.frameId === 0) {
				WebExtension.browser.tabs.get(details.tabId, (tab: W3CTab) => {
					if (!WebExtension.browser.runtime.lastError && tab) {
						callback(tab);
					}
				});
			}
		});
	}

	protected checkIfTabIsOnWhitelistedUrl(tab: W3CTab): boolean {
		return Utils.onWhitelistedDomain(tab.url);
	}

	protected createWorker(tab: W3CTab): WebExtensionWorker {
		return new WebExtensionWorker(this.injectUrls, tab, this.clientInfo, this.auth);
	}

	protected getIdFromTab(tab: W3CTab): number {
		return tab.id;
	}

	protected onFirstRun() {
		// Don't do anything since we're using the onInstalled functionality instead, unless it's not available
		// then we use our 'missing-clipperId' heuristic
		if (!this.onInstalledSupported()) {
			this.onInstalled();
		}
	}

	protected checkIfTabMatchesATooltipType(tab: W3CTab, tooltipTypes: TooltipType[]): TooltipType {
		return Utils.checkIfUrlMatchesAContentType(tab.url, tooltipTypes);
	}

	protected checkIfTabIsAVideoDomain(tab: W3CTab): boolean {
		let domain = VideoUtils.videoDomainIfSupported(tab.url);
		return !!domain;
	}

	private invokeClipperInTab(tab: W3CTab, invokeInfo: InvokeInfo, options: InvokeOptions) {
		let worker = this.getOrCreateWorkerForTab(tab, this.getIdFromTab);
		worker.closeAllFramesAndInvokeClipper(invokeInfo, options);
	}

	private onInstalled() {
		// Send users to our installed page (redirect if they're already on our page, else open a new tab)
		WebExtension.browser.tabs.query({ active: true, lastFocusedWindow: true }, (tabs: Tab[]) => {
			let isInlineInstall: boolean = ExtensionBase.isOnOneNoteDomain(tabs[0].url);
			let installUrl = this.getClipperInstalledPageUrl(this.clientInfo.get().clipperId, this.clientInfo.get().clipperType, isInlineInstall);

			if (isInlineInstall) {
				WebExtension.browser.tabs.update(tabs[0].id, { url: installUrl });
			} else {
				WebExtension.browser.tabs.create({ url: installUrl });
			}
		});
	}

	private registerBrowserButton() {
		WebExtension.browser.browserAction.onClicked.addListener((tab: W3CTab) => {
			this.invokeClipperInTab(tab, { invokeSource: InvokeSource.ExtensionButton }, { invokeMode: InvokeMode.Default });
		});
	}

	private registerContextMenuItems() {
		// Front-load our localization so our context menu is always localized
		this.fetchAndStoreLocStrings().then(() => {
			WebExtension.browser.contextMenus.removeAll(() => {
				let menus: chrome.contextMenus.CreateProperties[] = [{
					title: Localization.getLocalizedString("WebClipper.Label.OneNoteWebClipper"),
					contexts: ["page"],
					onclick: (info, tab: W3CTab) => {
						this.invokeClipperInTab(tab, { invokeSource: InvokeSource.ContextMenu }, { invokeMode: InvokeMode.Default });
					}
				}, {
					title: Localization.getLocalizedString("WebClipper.Label.ClipSelectionToOneNote"),
					contexts: ["selection"],
					onclick: (info, tab: W3CTab) => {
						let invokeOptions: InvokeOptions = { invokeMode: InvokeMode.ContextTextSelection };

						// If the tab index is negative, chances are the user is using some sort of PDF plugin,
						// and the tab object will be invalid. We need to get the parent tab in this scenario.
						if (tab.index < 0) {
							// Since we are in a PDF plugin, Rangy won't work, so we rely on WebExtension API to grab pure text
							invokeOptions.invokeDataForMode = info.selectionText;
							WebExtension.browser.tabs.query({ active: true, currentWindow: true }, (tabs: W3CTab[]) => {
								// There will only be one tab that meets this criteria
								let parentTab = tabs[0];
								this.invokeClipperInTab(parentTab, { invokeSource: InvokeSource.ContextMenu }, invokeOptions);
							});
						} else {
							this.invokeClipperInTab(tab, { invokeSource: InvokeSource.ContextMenu }, invokeOptions);
						}
					}
				}, {
					title: Localization.getLocalizedString("WebClipper.Label.ClipImageToOneNote"),
					contexts: ["image"],
					onclick: (info, tab: W3CTab) => {
						// Even though we know the user right-clicked an image, srcUrl is only present if the src attr exists
						this.invokeClipperInTab(tab, { invokeSource: InvokeSource.ContextMenu }, info.srcUrl ? {
							// srcUrl will always be the full url, not relative
							invokeDataForMode: info.srcUrl, invokeMode: InvokeMode.ContextImage
						} : undefined);
					}
				}];

				let isFirefox = this.clientInfo.get().clipperType === ClientType.FirefoxExtension;

				for (let i = 0; i < menus.length; i++) {
					// Note that documentUrlPatterns is not supported in Firefox as of 07/22/16
					// https://developer.mozilla.org/en-US/Add-ons/WebExtensions/Chrome_incompatibilities
					// If you include documentUrlPatterns in Firefox, the context menu won't be added!
					if (!isFirefox) {
						menus[i].documentUrlPatterns = [
							"http://*/*",
							"https://*/*",
							"chrome-extension://encfpfilknmenlmjemepncnlbbjlabkc/*", // PDF.js
							"chrome-extension://oemmndcbldboiebfnladdacbdfmadadm/*", // Ad PDF Viewer
							"chrome-extension://mhjfbmdgcfjbbpaeojofohoefgiehjai/*" // Chrome PDF Viewer
						];
					}
					WebExtension.browser.contextMenus.create(menus[i]);
				}
			});
		});
	}

	private registerInstallListener() {
		// onInstalled is undefined as of Firefox 48
		if (this.onInstalledSupported()) {
			WebExtension.browser.runtime.onInstalled.addListener(details => {
				if (details.reason === "install") {
					this.onInstalled();
				}
			});
		}
	}

	private registerTabRemoveListener() {
		WebExtension.browser.tabs.onRemoved.addListener((tabId: number) => {
			let worker = this.getExistingWorkerForTab(tabId);
			if (worker) {
				this.removeWorker(worker);
			}
		});
	}

	private onInstalledSupported(): boolean {
		return !!WebExtension.browser.runtime.onInstalled;
	}
}
