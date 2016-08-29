/// <reference path="../../../../typings/main/ambient/safari-extension/safari-extension.d.ts"/>

import {ClientType} from "../../clientType";
import {Constants} from "../../constants";
import {Utils} from "../../utils";

import {TooltipType} from "../../clipperUI/tooltipType";

import {VideoUtils} from "../../domParsers/videoUtils";

import {Localization} from "../../localization/localization";

import {StorageBase} from "../../storage/storageBase";

import {Version} from "../../versioning/version";

import {ExtensionBase} from "../extensionBase";
import {InvokeInfo} from "../invokeInfo";
import {InvokeMode, InvokeOptions} from "../invokeOptions";
import {InvokeSource} from "../invokeSource";

import {ContextItemParameter, ContextType} from "./safariContext";
import {SafariWorker} from "./safariWorker";

export class SafariExtension extends ExtensionBase<SafariWorker, SafariBrowserTab, SafariBrowserTab> {
	// We use this to pass 'parameters' to the invoke method as Safari does not provide a means of doing this more naturally!
	private currentContextItemParameter: ContextItemParameter;

	constructor() {
		super(ClientType.SafariExtension, new StorageBase());

		// Listen for the Toolbar button it be invoked
		safari.application.addEventListener("command", (event: SafariValidateEvent) => {
			// Defined in "Info.plist"
			if (event.command === "ClipperInvoker") {
				this.invokeClipperInCurrentTab({ invokeSource: InvokeSource.ExtensionButton }, { invokeMode: InvokeMode.Default });
			} else if (event.command === "ContextClipperInvoker") {
				this.invokeClipperInCurrentTab({ invokeSource: InvokeSource.ContextMenu }, { invokeMode: InvokeMode.Default });
			} else if (event.command === "ContextClipperInvokerWithImage") {
				this.invokeClipperInCurrentTab({ invokeSource: InvokeSource.ContextMenu }, {
					invokeDataForMode: this.currentContextItemParameter.parameters.src,
					invokeMode: InvokeMode.ContextImage
				});
			} else if (event.command === "ContextClipperInvokerWithSelection") {
				this.invokeClipperInCurrentTab({ invokeSource: InvokeSource.ContextMenu }, {
					invokeMode: InvokeMode.ContextTextSelection
				});
			}
		}, false);

		this.registerContextMenuItems();
	}

	public static getExtensionVersion(): string {
		return safari.extension.bundleVersion;
	}

	protected addPageNavListener(callback: (tab: any) => void) {
		safari.application.addEventListener("navigate", (event: SafariEvent) => {
			callback(event.target as SafariBrowserTab);
		}, true);
	}

	protected checkIfTabIsOnWhitelistedUrl(tab: SafariBrowserTab): boolean {
		return Utils.onWhitelistedDomain(tab.url);
	}

	protected createWorker(tab: SafariBrowserTab): SafariWorker {
		return new SafariWorker(tab, this.clientInfo, this.auth);
	}

	protected getIdFromTab(tab: SafariBrowserTab): SafariBrowserTab {
		return tab;
	}

	protected onFirstRun() {
		// Send users to our installed page (redirect if they're already on our page, else open a new tab)
		let activeWindow = safari.application.activeBrowserWindow;
		let isInlineInstall: boolean = ExtensionBase.isOnOneNoteDomain(activeWindow.activeTab.url);
		let installUrl = this.getClipperInstalledPageUrl(this.clientInfo.get().clipperId, this.clientInfo.get().clipperType, isInlineInstall);
		if (activeWindow) {
			if (isInlineInstall) {
				activeWindow.activeTab.url = installUrl;
			} else {
				activeWindow.openTab().url = installUrl;
			}
		} else {
			safari.application.openBrowserWindow().activeTab.url = installUrl;
		}
	}

	protected checkIfTabMatchesATooltipType(tab: SafariBrowserTab, tooltipType: TooltipType): boolean {
		return Utils.checkIfUrlMatchesAContentType(tab.url, tooltipType);
	}

	protected checkIfTabIsAVideoDomain(tab: SafariBrowserTab): boolean {
		return !!VideoUtils.videoDomainIfSupported(tab.url);

	}

	private invokeClipperInCurrentTab(invokeInfo: InvokeInfo, options: InvokeOptions) {
		let activeTab = safari.application.activeBrowserWindow.activeTab;
		let worker = this.getOrCreateWorkerForTab(activeTab, this.getIdFromTab);
		worker.closeAllFramesAndInvokeClipper(invokeInfo, options);
	}

	/**
	 * A contextmenu event is fired when the user right-clicks, and we have to add the relevant buttons
	 * programmatically depending on what we think the user right-clicked on
	 */
	private registerContextMenuItems() {
		// We need to clear old context item parameter data from any previous right-clicks
		this.currentContextItemParameter = undefined;

		this.fetchAndStoreLocStrings().then(() => {
			safari.application.addEventListener("contextmenu", (event: SafariExtensionContextMenuEvent) => {
				if (event.userInfo) {
					// User info was passed from the inject script. If we can do something 'interesting' e.g., invoking the
					// Clipper with a specific image, we provide that option. Otherwise, provide the 'normal' invoke option.
					this.currentContextItemParameter = JSON.parse(event.userInfo);

					if (this.currentContextItemParameter.type === ContextType.Img && this.currentContextItemParameter.parameters.src) {
						event.contextMenu.appendContextMenuItem("ContextClipperInvokerWithImage",
							Localization.getLocalizedString("WebClipper.Label.ClipImageToOneNote"));
					} else if (this.currentContextItemParameter.type === ContextType.Selection) {
						event.contextMenu.appendContextMenuItem("ContextClipperInvokerWithSelection",
							Localization.getLocalizedString("WebClipper.Label.ClipSelectionToOneNote"));
					} else {
						this.registerSimpleInvokeContextMenuItem(event);
					}
				} else {
					// No user info was passed from the inject script, so we assume it's just an arbitrary right-click on some
					// point in the page
					this.registerSimpleInvokeContextMenuItem(event);
				}
			}, false);
		});
	}

	/**
	 * Register the context menu item which the user can use to invoke the Clipper in 'normal' mode
	 */
	private registerSimpleInvokeContextMenuItem(event: SafariExtensionContextMenuEvent) {
		event.contextMenu.appendContextMenuItem("ContextClipperInvoker",
			Localization.getLocalizedString("WebClipper.Label.OneNoteWebClipper"));
	}
}

let safariExtension = new SafariExtension();
