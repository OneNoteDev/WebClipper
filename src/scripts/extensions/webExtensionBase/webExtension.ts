import {ClientType} from "../../clientType";

import {Localization} from "../../localization/localization";

import {ClipperData} from "../../storage/clipperData";
import {LocalStorage} from "../../storage/localStorage";

import {ExtensionBase} from "../extensionBase";
import {InvokeInfo} from "../invokeInfo";
import {InvokeSource} from "../invokeSource";
import {InvokeMode, InvokeOptions} from "../invokeOptions";

import {WebExtensionWorker} from "./webExtensionWorker";

// We are using the typing from chrome.d.ts, but it is the same for all of the WebExtensions
type Browser = typeof chrome;
type Tab = chrome.tabs.Tab;

export class WebExtension extends ExtensionBase<WebExtensionWorker, W3CTab, number> {
	public static browser: Browser;
	public static offscreenUrl: string;

	constructor(clientType: ClientType) {
		super(clientType, new ClipperData(new LocalStorage()));

		this.registerBrowserButton();

		// Listener registers synchronously at SW startup; menu items themselves need locStrings.
		this.registerContextMenuClickListener();
		this.clipperIdProcessed.then(() => {
			this.registerContextMenuItems();
		});
		this.registerInstallListener();
		this.registerTabCreateOrUpdateListener();
		this.registerTabRemoveListener();
	}

	public static getExtensionVersion(): string {
		return WebExtension.browser.runtime.getManifest().version;
	}

	protected createWorker(tab: W3CTab): WebExtensionWorker {
		return new WebExtensionWorker(tab, this.clientInfo, this.auth);
	}

	protected getIdFromTab(tab: W3CTab): number {
		return tab.id;
	}

	protected onFirstRun() {
		// Don't do anything since we're using the onInstalled functionality instead, unless it's not available
		// then we use our 'missing-clipperId' heuristic
		if (!this.onInstalledSupported()) {
			this.clipperIdProcessed.then(() => {
				this.onInstalled();
			});
		}
	}

	private invokeClipperInTab(tab: W3CTab, invokeInfo: InvokeInfo, options: InvokeOptions) {
		/**
		 * Create a worker only after the clipperId is processed, since the clientInfo is available
		 * only after the clipperId is processed. This is to ensure that the worker is created with the
		 * correct clientInfo.
		 */
		this.clipperIdProcessed.then(() => {
			let worker = this.getOrCreateWorkerForTab(tab, this.getIdFromTab);
			worker.closeAllFramesAndInvokeClipper(invokeInfo, options);
		});
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
		WebExtension.browser.action.onClicked.addListener((tab: W3CTab) => {
			this.invokeClipperInTab(tab, { invokeSource: InvokeSource.ExtensionButton }, { invokeMode: InvokeMode.Default });
		});
	}

	private registerContextMenuItems() {
		// Front-load our localization so our context menu is always localized
		this.fetchAndStoreLocStrings().then(() => {
			WebExtension.browser.contextMenus.removeAll(() => {
				let menus: chrome.contextMenus.CreateProperties[] = [{
					id: "WebClipper.Label.OneNoteWebClipper",
					title: Localization.getLocalizedString("WebClipper.Label.OneNoteWebClipper"),
					contexts: ["page"]
				}, {
					id: "WebClipper.Label.ClipSelectionToOneNote",
					title: Localization.getLocalizedString("WebClipper.Label.ClipSelectionToOneNote"),
					contexts: ["selection"]
				}, {
					id: "WebClipper.Label.ClipImageToOneNote",
					title: Localization.getLocalizedString("WebClipper.Label.ClipImageToOneNote"),
					contexts: ["image"]
				}, {
					id: "WebClipper.Label.ClipTranscriptToOneNote",
					title: "Clip Transcript to OneNote",
					contexts: ["page"]
				}];

				let documentUrlPatternList: string[];

				switch (this.clientInfo.get().clipperType) {
					case ClientType.ChromeExtension:
						documentUrlPatternList = [
							"http://*/*",
							"https://*/*",
							"chrome-extension://encfpfilknmenlmjemepncnlbbjlabkc/*", // PDF.js
							"chrome-extension://oemmndcbldboiebfnladdacbdfmadadm/*", // Ad PDF Viewer
							"chrome-extension://mhjfbmdgcfjbbpaeojofohoefgiehjai/*" // Chrome PDF Viewer
						];
						break;
					case ClientType.EdgeExtension:
						// Note that in Edge, the ms-browser-extension:// URL causes the context menus to break.
						documentUrlPatternList = [
							"http://*/*",
							"https://*/*"
						];
						break;
					case ClientType.FirefoxExtension:
						// Note that documentUrlPatterns is not supported in Firefox as of 07/22/16
						// https://developer.mozilla.org/en-US/Add-ons/WebExtensions/Chrome_incompatibilities
						// If you include documentUrlPatterns in Firefox, the context menu won't be added!
						break;
					default:
						break;
				}

				for (let i = 0; i < menus.length; i++) {
					if (documentUrlPatternList) {
						menus[i].documentUrlPatterns = documentUrlPatternList;
					}
					WebExtension.browser.contextMenus.create(menus[i]);
				}
			});
		});
	}

	// Synchronous part of context-menu setup — dispatches on info.menuItemId only,
	// no locStrings dependency. See constructor for why this is split out.
	private registerContextMenuClickListener() {
		WebExtension.browser.contextMenus.onClicked.addListener((info, tab?: Tab) => {
			if (!tab) {
				return;
			}
			let clickedTab = tab as W3CTab;
			switch (info.menuItemId) {
				case "WebClipper.Label.OneNoteWebClipper":
					this.invokeClipperInTab(clickedTab, { invokeSource: InvokeSource.ContextMenu }, { invokeMode: InvokeMode.Default });
					break;
				case "WebClipper.Label.ClipSelectionToOneNote":
					let invokeOptions: InvokeOptions = { invokeMode: InvokeMode.ContextTextSelection };

					// If the tab index is negative, chances are the user is using some sort of PDF plugin,
					// and the tab object will be invalid. We need to get the parent tab in this scenario.
					if (clickedTab.index < 0) {
						// Since we are in a PDF plugin, Rangy won't work, so we rely on WebExtension API to grab pure text
						invokeOptions.invokeDataForMode = info.selectionText;
						WebExtension.browser.tabs.query({ active: true, currentWindow: true }, (tabs: Tab[]) => {
							// There will only be one tab that meets this criteria
							let parentTab = tabs[0] as W3CTab;
							this.invokeClipperInTab(parentTab, { invokeSource: InvokeSource.ContextMenu }, invokeOptions);
						});
					} else {
						this.invokeClipperInTab(clickedTab, { invokeSource: InvokeSource.ContextMenu }, invokeOptions);
					}
					break;
				case "WebClipper.Label.ClipImageToOneNote":
					// Even though we know the user right-clicked an image, srcUrl is only present if the src attr exists
					this.invokeClipperInTab(clickedTab, { invokeSource: InvokeSource.ContextMenu }, info.srcUrl ? {
						// srcUrl will always be the full url, not relative
						invokeDataForMode: info.srcUrl, invokeMode: InvokeMode.ContextImage
					} : { invokeMode: InvokeMode.Default });
					break;
				case "WebClipper.Label.ClipTranscriptToOneNote":
					this.invokeClipperInTab(clickedTab, { invokeSource: InvokeSource.ContextMenu }, { invokeMode: InvokeMode.ContextTranscript });
					break;
				default:
			}
		});
	}

	private registerInstallListener() {
		// onInstalled is undefined as of Firefox 48
		if (this.onInstalledSupported()) {
			WebExtension.browser.runtime.onInstalled.addListener(details => {
				if (details.reason === "install") {
					this.clipperIdProcessed.then(() => {
						this.onInstalled();
					});
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

	private registerTabCreateOrUpdateListener() {
		const matchesAnyUnclippablePage = (url) => {
			const unclippablePages = ["chrome://*", "edge://*"];
			return unclippablePages.some(unclippablePage => url.match(unclippablePage));
		};

		WebExtension.browser.tabs.onCreated.addListener((tab: W3CTab) => {
			if (matchesAnyUnclippablePage(tab.url)) {
				WebExtension.browser.action.disable(tab.id);
			}
		});

		WebExtension.browser.tabs.onUpdated.addListener((tabId: number, changeInfo: any, tab: W3CTab) => {
			if (matchesAnyUnclippablePage(tab.url)) {
				WebExtension.browser.action.disable(tabId);
			}
		});
	}

	private onInstalledSupported(): boolean {
		return !!WebExtension.browser.runtime.onInstalled;
	}

	private captureTranscript(tab: W3CTab) {
		let tabId = tab.id as number;

		// DOM-based transcript extraction: click "Show transcript" button on YouTube,
		// wait for the panel to render, then scrape the transcript segments.
		(WebExtension.browser.scripting as any).executeScript({
			target: { tabId: tabId },
			func: async function() {
				try {
					let videoTitle = document.title || "";

					// Step 1: Expand the description if collapsed
					let expandBtn = document.querySelector(
						"tp-yt-paper-button#expand.ytd-text-inline-expander"
					) as HTMLElement | null;
					if (expandBtn) {
						expandBtn.click();
						// Brief wait for the description to expand and reveal the transcript button
						await new Promise(function(r) { setTimeout(r, 500); });
					}

					// Step 2: Click "Show transcript" button
					let transcriptBtn = document.querySelector(
						"ytd-video-description-transcript-section-renderer button[aria-label=\"Show transcript\"]"
					) as HTMLElement | null;
					if (!transcriptBtn) {
						return { success: false, error: "Could not find 'Show transcript' button. The video may not have a transcript available." };
					}
					transcriptBtn.click();

					// Step 3: Wait for the transcript panel to render
					let maxWait = 5000;
					let pollInterval = 250;
					let elapsed = 0;
					let transcriptPanel: Element | null = null;
					while (elapsed < maxWait) {
						await new Promise(function(r) { setTimeout(r, pollInterval); });
						elapsed += pollInterval;
						transcriptPanel = document.querySelector("ytd-transcript-renderer, ytd-engagement-panel-section-list-renderer[target-id=\"engagement-panel-searchable-transcript\"]");
						if (transcriptPanel) {
							// Wait a bit more for segments to populate
							await new Promise(function(r) { setTimeout(r, 500); });
							break;
						}
					}
					if (!transcriptPanel) {
						return { success: false, error: "Transcript panel did not appear within timeout." };
					}

					// Step 4: Scrape transcript segments from the DOM
					let segments = transcriptPanel.querySelectorAll("ytd-transcript-segment-renderer");
					if (!segments || segments.length === 0) {
						// Fallback: try generic segment selectors
						segments = transcriptPanel.querySelectorAll("[class*=\"segment\"]");
					}
					if (!segments || segments.length === 0) {
						return { success: false, error: "Transcript panel opened but no segments found." };
					}

					let entries: Array<{ timestamp: string; text: string }> = [];
					for (let i = 0; i < segments.length; i++) {
						let seg = segments[i] as HTMLElement;
						let timestampEl = seg.querySelector(".segment-timestamp, [class*=\"timestamp\"]") as HTMLElement | null;
						let textEl = seg.querySelector(".segment-text, yt-formatted-string, [class*=\"text\"]") as HTMLElement | null;
						let timestamp = timestampEl?.innerText?.trim() || "";
						let text = textEl?.innerText?.trim() || seg.innerText?.trim() || "";
						if (text) {
							entries.push({ timestamp: timestamp, text: text });
						}
					}

					if (entries.length === 0) {
						return { success: false, error: "Transcript panel rendered but could not extract text from segments." };
					}

					return {
						success: true,
						videoTitle: videoTitle,
						segmentCount: entries.length,
						transcript: entries
					};
				} catch (e: any) {
					return { success: false, error: "Exception: " + (e?.message ? e.message : String(e)) };
				}
			}
		}).then((results: any[]) => {
			let data = results?.[0]?.result;
			if (!data) {
				// eslint-disable-next-line no-console
				console.log("[Transcript] No result from executeScript");
				return;
			}
			if (!data.success) {
				// eslint-disable-next-line no-console
				console.log("[Transcript] Error:", data.error);
				return;
			}
			// eslint-disable-next-line no-console
			console.log("[Transcript] Video:", data.videoTitle);
			// eslint-disable-next-line no-console
			console.log("[Transcript] Segments:", data.segmentCount);
			// eslint-disable-next-line no-console
			console.log("[Transcript] First 10 entries:", JSON.stringify(data.transcript.slice(0, 10), null, 2));
			// eslint-disable-next-line no-console
			console.log("[Transcript] Full transcript text:", data.transcript.map(function(e: any) { return e.timestamp + " " + e.text; }).join("\n"));
		}).catch((err: any) => {
			// eslint-disable-next-line no-console
			console.log("[Transcript] executeScript error:", err);
		});
	}
}
