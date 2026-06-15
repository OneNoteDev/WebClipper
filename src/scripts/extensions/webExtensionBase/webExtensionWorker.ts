import {AuthType, UpdateReason, UserInfo} from "../../userInfo";
import {ClientInfo} from "../../clientInfo";
import {ClientType} from "../../clientType";
import {ClipperUrls} from "../../clipperUrls";
import {Constants} from "../../constants";
import {UrlUtils} from "../../urlUtils";

import {SmartValue} from "../../communicator/smartValue";

import * as Log from "../../logging/log";

import {ClipperData} from "../../storage/clipperData";
import {LocalStorage} from "../../storage/localStorage";

import {getTranscriptPlatform} from "../../contentCapture/transcriptPlatforms";

import {AuthenticationHelper} from "../authenticationHelper";
import {ExtensionWorkerBase} from "../extensionWorkerBase";

import {InvokeInfo} from "../invokeInfo";
import {InvokeMode, InvokeOptions} from "../invokeOptions";
import {WebExtension} from "./webExtension";

type TabRemoveInfo = chrome.tabs.OnRemovedInfo;
type WebResponseCacheDetails = chrome.webRequest.OnCompletedDetails;
type Window = chrome.windows.Window;

// Escape user-provided strings before inlining into the OneNote citation HTML
// the worker constructs. saveUrl arrives via port message and ends up in both
// an href attribute and visible text — quotes/brackets must be neutralized
// either way to prevent attribute or tag escape.
function escapeAttr(s: string): string {
	return s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function escapeHtml(s: string): string {
	return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export class WebExtensionWorker extends ExtensionWorkerBase<W3CTab, number> {
	private activeRendererCleanup: () => void;
	private activeRendererWindowId: number;
	// Original InvokeOptions, set by closeAllFramesAndInvokeClipper and forwarded
	// to the renderer via loadContent so it can auto-engage the right mode.
	private pendingInvokeMode: string;
	private pendingInvokeData: string;

	constructor(tab: W3CTab, clientInfo: SmartValue<ClientInfo>, auth: AuthenticationHelper) {
		super(clientInfo, auth, new ClipperData(new LocalStorage()));

		this.tab = tab;
		this.tabId = tab.id;
		this.pendingInvokeMode = "";
		this.pendingInvokeData = "";

		this.activeRendererCleanup = () => { /* no-op */ };
		this.activeRendererWindowId = 0;

		let isPrivateWindow: Boolean = !!tab.incognito || !!tab.inPrivate;

		this.consoleOutputEnabledFlagProcessed.then(() => {
			this.logger.setContextProperty(Log.Context.Custom.InPrivateBrowsing, isPrivateWindow.toString());

			// Ensure BrowserLanguage context is set — required by ProductionRequirements for event flush.
			// The old flow set this via getLocalizedStrings() when the legacy sidebar requested strings,
			// but the new renderer reads i18n directly from localStorage, bypassing that code path.
			let locale = navigator.language || (navigator as any).userLanguage || "en";
			this.logger.setContextProperty(Log.Context.Custom.BrowserLanguage, locale);

			// Ensure FlightInfo is set even if flighting API hasn't responded — empty string satisfies requirement.
			let clientInfoData = this.clientInfo.get();
			if (!clientInfoData.flightingInfo) {
				this.logger.setContextProperty(Log.Context.Custom.FlightInfo, "");
			}
		});
	}

	/**
	 * Get the url associated with this worker's tab
	 */
	public getUrl(): string {
		return this.tab.url;
	}

	/**
	 * Launches the sign in window, rejecting with an error object if something went wrong on the server during
	 * authentication. Otherwise, it resolves with true if the redirect endpoint was hit as a result of a successful
	 * sign in attempt, and false if it was not hit (e.g., user manually closed the popup)
	 */
	protected doSignInAction(authType: AuthType): Promise<boolean> {
		let usidQueryParamValue = this.getUserSessionIdQueryParamValue();
		let signInUrl = ClipperUrls.generateSignInUrl(this.clientInfo.get().clipperId, usidQueryParamValue, AuthType[authType]);

		return this.launchWebExtensionPopupAndWaitForClose(signInUrl, Constants.Urls.Authentication.authRedirectUrl);
	}

	/**
	 * Signs the user out
	 */
	protected doSignOutAction(authType: AuthType) {
		let usidQueryParamValue = this.getUserSessionIdQueryParamValue();
		let signOutUrl = ClipperUrls.generateSignOutUrl(this.clientInfo.get().clipperId, usidQueryParamValue, AuthType[authType]);
		fetch(signOutUrl);
	}

	/**
	 * Override: open the renderer window directly instead of injecting clipperInject.ts.
	 * If a renderer window is already open, focus it.
	 */
	public closeAllFramesAndInvokeClipper(invokeInfo: InvokeInfo, options: InvokeOptions) {
		// InvokeClipper event — match legacy extensionWorkerBase.logClipperInvoke()
		// Logger is set asynchronously — defer if not ready yet
		this.consoleOutputEnabledFlagProcessed.then(() => {
			this.logClipperInvoke(invokeInfo, options);
		});

		// Capture invocation intent for the contentCapture listener to forward.
		this.pendingInvokeMode = (options?.invokeMode !== undefined)
			? InvokeMode[options.invokeMode]
			: "";
		this.pendingInvokeData = options?.invokeDataForMode ?? "";

		if (this.activeRendererWindowId) {
			WebExtension.browser.windows.update(this.activeRendererWindowId, { focused: true }, () => {
				if (WebExtension.browser.runtime.lastError) {
					this.activeRendererWindowId = 0;
				}
			});
			return;
		}
		// Refresh locStrings before opening so `displayLocaleOverride` (set via
		// localStorage for testing or honored from navigator.language) takes
		// effect end-to-end — html dir/lang AND translated strings. The fetch
		// is short-circuited by clipperData's cache when the locale matches
		// what's already in storage; only a locale change forces a network hit.
		this.getLocalizedStringsForBrowser(() => {
			this.openRendererWindow();
		});
	}

	/**
	 * Opens the renderer window directly (no clipperInject.ts injection).
	 * Checks sign-in state: if signed in, injects content capture and starts capture.
	 * If not signed in, renderer shows sign-in panel and waits.
	 */
	private openRendererWindow() {
		if (this.activeRendererWindowId) {
			WebExtension.browser.windows.update(this.activeRendererWindowId, { focused: true }, () => {
				if (WebExtension.browser.runtime.lastError) {
					this.activeRendererWindowId = 0;
				}
			});
			return;
		}

		this.clipperData.getValue("isUserLoggedIn").then((val: string) => {
			let signedIn = val === "true";
			this.launchRenderer(signedIn);
		}, () => {
			this.launchRenderer(false);
		});
	}

	// Generate a RFC4122 v4 UUID (matches StringUtils.generateGuid)
	private static newGuid(): string {
		return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function(c) {
			let r = Math.random() * 16 | 0;
			return (c === "x" ? r : (r & 0x3 | 0x8)).toString(16);
		});
	}

	private launchRenderer(signedIn: boolean) {
		let rendererUrl = WebExtension.browser.runtime.getURL("renderer.html");
		let renderWindowId: number;
		let pendingPort: chrome.runtime.Port;
		let windowReady = false;
		let contentCaptured = false;
		// Holds the captured page payload (html/title/url/contentType/etc.) until
		// the renderer's port is ready; then it's flushed into a single loadContent
		// port message. Replaces the earlier chrome.storage.session round-trip —
		// lives in worker memory for the lifetime of this open-renderer flow.
		let pendingContent: any;
		// Build the loadContent payload by copying pendingContent's keys (TS lib
		// here is too old for Object.assign / spread, so manual merge it is).
		let buildLoadContent = () => {
			let m: any = { action: "loadContent" };
			if (pendingContent) {
				for (let k in pendingContent) {
					if (pendingContent.hasOwnProperty(k)) { m[k] = pendingContent[k]; }
				}
			}
			return m;
		};
		let activePort: chrome.runtime.Port;

		// Per-session USID for API call correlation and feedback URL.
		// Matches old logger pattern: "cccccccc-" prefix + v4 UUID tail.
		let sessionUsid = "cccccccc-" + WebExtensionWorker.newGuid().substring(9);

		// Listener for contentCaptureInject.ts messages — buffers page data in
		// pendingContent so the eventual loadContent port message can carry the
		// full payload in one shot.
		let captureListener = (rawMsg: any, sender: any) => {
			if (sender.tab?.id !== this.tab.id) { return; }
			let msg: any;
			try { msg = typeof rawMsg === "string" ? JSON.parse(rawMsg) : rawMsg; } catch (e) { return; }
			if (msg.action !== "contentCaptureComplete") { return; }
			chrome.runtime.onMessage.removeListener(captureListener);

			pendingContent = {
				html: msg.html || "",
				baseUrl: msg.baseUrl || "",
				title: msg.title || "",
				url: msg.url || "",
				statusText: "Capturing page...",
				contentType: msg.contentType || "html",
				selectionHtml: msg.selectionHtml || "",
				invokeMode: this.pendingInvokeMode || "",
				invokeData: this.pendingInvokeData || ""
			};
			contentCaptured = true;
			if (activePort) {
				activePort.postMessage(buildLoadContent());
			}
		};

		// If signed in, inject content capture script immediately (runs in parallel with window opening)
		if (signedIn) {
			// Check local file permission before injecting — file:/// tabs need explicit permission
			let isLocalFile = this.tab.url?.indexOf("file:///") === 0;
			let sendLocalFileNotAllowed = () => {
				let tabUrl = this.tab.url || "";
				let isPdf = /\.pdf$/i.test(tabUrl);
				pendingContent = {
					html: "",
					baseUrl: "",
					title: this.tab.title || "",
					url: tabUrl,
					contentType: isPdf ? "pdf" : "html",
					localFileNotAllowed: true
				};
				contentCaptured = true;
				if (activePort) {
					activePort.postMessage(buildLoadContent());
				}
			};
			if (isLocalFile) {
				// Try injecting — catch both sync throws and async promise rejections
				// (MV3 scripting.executeScript returns a Promise that rejects if blocked)
				chrome.runtime.onMessage.addListener(captureListener);
				try {
					let injectPromise = WebExtension.browser.scripting.executeScript({
						target: { tabId: this.tab.id as number },
						files: ["contentCaptureInject.js"]
					});
					// Handle promise rejection (MV3 "Blocked" error on file:// without permission)
					if (injectPromise?.catch) {
						injectPromise.catch(function() {
							chrome.runtime.onMessage.removeListener(captureListener);
							sendLocalFileNotAllowed();
						});
					}
				} catch (e) {
					chrome.runtime.onMessage.removeListener(captureListener);
					sendLocalFileNotAllowed();
				}
			} else {
				chrome.runtime.onMessage.addListener(captureListener);
				WebExtension.browser.scripting.executeScript({
					target: { tabId: this.tab.id as number },
					files: ["contentCaptureInject.js"]
				});
			}
		}

		WebExtension.browser.windows.getCurrent((currentWindow: chrome.windows.Window) => {
			let sidebarWidth = 321; // matches renderer.less #sidebar { width: 321px }
			let screenMargin = 32; // leave breathing room so renderer doesn't cover the full screen
			let browserWidth = currentWindow?.width ?? 1024;
			let browserHeight = currentWindow?.height ?? 768;
			let browserLeft = currentWindow ? (currentWindow.left || 0) : 0;
			let browserTop = currentWindow ? (currentWindow.top || 0) : 0;

			// Content width: cap at 1024 (matches legacy clipper). Lower than the
			// 1280 ceiling we used to ship — keeps the popup from covering most of
			// the screen when the browser is large. Trade-off: sites with desktop
			// breakpoints between 1024 and 1280 (e.g. some MS Learn navs) may
			// render their tablet/mobile layout in our captures.
			let contentWidth = Math.min(browserWidth, 1024);
			let renderWidth = contentWidth + sidebarWidth;

			// Clamp to browser window bounds so we don't overflow off-screen.
			// Browser window is our best proxy for screen size (no screen API in service worker).
			// If browser is smaller than our desired width, shrink content to fit.
			let maxWidth = Math.max(browserWidth, 1000); // at least 1000px (sidebar + 679px content)
			if (renderWidth > maxWidth) {
				renderWidth = maxWidth;
				contentWidth = renderWidth - sidebarWidth;
			}

			// Height: cap at 980px so the popup doesn't fill near-full-height on
			// 1080p+ monitors. Floor at 600 so capture progress UI fits comfortably.
			// On smaller browsers we still shrink to fit (browserHeight - margin).
			let renderHeight = Math.max(Math.min(browserHeight - screenMargin, 980), 600);

			// Position: align with browser window's top-left
			let renderLeft = browserLeft;
			let renderTop = browserTop;

			let setupPort = (port: chrome.runtime.Port) => {
				activePort = port;
				let viewportHeight: number;
				let captureContentHeight: number;
				let captureCount = 0;
				let lastScrollY = -1;
				let lastScrollData: { scrollY: number; pageHeight: number };
				// Set true on cancelCapture to short-circuit the capture loop and stop focus-stealing.
				let captureCancelled = false;

				// Per-port save accumulator — images streamed via saveImage chunks
				let pendingSave: any = undefined; // tslint:disable-line:no-null-keyword
				let saveImages: string[] = [];
				let saveAttachmentData = "";
				let saveImagesReceived = 0;
				let saveAttachmentReceived = false;

				let cleaned = false;
				let cleanup = () => {
					if (cleaned) { return; }
					cleaned = true;
					this.activeRendererCleanup = () => { /* no-op */ };
					this.activeRendererWindowId = 0;
					try { port.disconnect(); } catch (e) { /* ignore */ }
					WebExtension.browser.windows.remove(renderWindowId, () => {
						if (WebExtension.browser.runtime.lastError) { /* window may already be closed */ }
					});
					// Drop the in-memory captured payload so the worker doesn't hold
					// onto multi-megabyte HTML after the renderer is gone.
					pendingContent = undefined;
					try { chrome.runtime.onMessage.removeListener(captureListener); } catch (e) { /* ignore */ }
					try { WebExtension.browser.tabs.onUpdated.removeListener(navListener); } catch (e) { /* ignore */ }
				};
				this.activeRendererCleanup = cleanup;

				// Detect when user navigates away on the original tab — renderer becomes stale
				let navListener = (tabId: number, changeInfo: any) => {
					if (tabId === this.tab.id && changeInfo.url && !cleaned) {
					// Log equivalent of legacy HideClipperDueToSpaNavigate
						let navEvent = new Log.Event.BaseEvent(Log.Event.Label.HideClipperDueToSpaNavigate);
						this.logger.logEvent(navEvent);
						// Notify renderer so it can close
						try { port.postMessage({ action: "pageNavigated" }); } catch (e) { /* port may be dead */ }
					}
				};
				WebExtension.browser.tabs.onUpdated.addListener(navListener);

				// Handle renderer window being closed by user
				port.onDisconnect.addListener(() => {
					if (!cleaned) { cleanup(); }
				});

				let workerSelf = this; // capture for use in executeSave (function declarations can't access arrow `this`)
				port.onMessage.addListener((message: any) => {
					if (message.action === "ready") {
					// Set zoom to 100% before loading content
						let flushLoadContent = () => {
							if (contentCaptured && pendingContent) {
								port.postMessage(buildLoadContent());
							}
						};
						try {
							WebExtension.browser.tabs.query({ windowId: renderWindowId }, (tabs: chrome.tabs.Tab[]) => {
								if (tabs && tabs.length > 0 && tabs[0].id) {
									WebExtension.browser.tabs.setZoom(tabs[0].id, 1, flushLoadContent);
								} else {
									flushLoadContent();
								}
							});
						} catch (e) {
							flushLoadContent();
						}
					}

					// V1 parity: refresh user state on renderer open (legacy getInitialUser).
					// updateUserInfoData is cache-aware — no network call if cached token
					// is fresh. Renderer reads localStorage on userRefreshed.
					if (message.action === "refreshUser") {
						let notify = () => {
							try { port.postMessage({ action: "userRefreshed" }); } catch (e) { /* port may be dead */ }
						};
						this.auth.updateUserInfoData(this.clientInfo.get().clipperId, UpdateReason.InitialRetrieval).then(notify, notify);
					}

					// --- Sign-in from renderer (self-contained sign-in) ---
					if (message.action === "signIn") {
						let authType: AuthType = (AuthType as any)[message.authType];
						this.doSignInAction(authType).then(() => {
							return this.auth.updateUserInfoData(this.clientInfo.get().clipperId, UpdateReason.SignInAttempt);
						}).then((updatedUser: UserInfo) => {
							if (updatedUser?.user) {
								this.clipperData.setValue("isUserLoggedIn", "true");
								port.postMessage({
									action: "signInResult",
									success: true,
									user: {
										email: updatedUser.user.emailAddress || "",
										name: updatedUser.user.fullName || "",
										authType: updatedUser.user.authType || "",
										cid: updatedUser.user.cid || ""
									}
								});
								// Now inject content capture into original tab
								chrome.runtime.onMessage.addListener(captureListener);
								WebExtension.browser.scripting.executeScript({
									target: { tabId: this.tab.id },
									files: ["contentCaptureInject.js"]
								});
							} else {
							// Cancellation: no error string. Renderer just resets
							// the sign-in panel buttons (matches legacy clipper).
								port.postMessage({ action: "signInResult", success: false, cancelled: true });
							}
						}).catch((errorObject: any) => {
							let errMsg = errorObject.errorDescription || errorObject.error || "Sign-in failed";
							port.postMessage({ action: "signInResult", success: false, error: errMsg });
						});
					}

					if (message.action === "dimensions") {
						viewportHeight = message.viewportHeight;
						captureContentHeight = message.contentHeight;
						// Reset capture loop state — handles re-capture after sign-out/sign-in
						captureCount = 0;
						lastScrollY = -1;
						lastScrollData = { scrollY: 0, pageHeight: 0 };
						captureCancelled = false;

						if (!viewportHeight) {
							cleanup();
							return;
						}

						// Initialize the renderer's stitch canvas
						port.postMessage({
							action: "initCanvas",
							viewportHeight: viewportHeight,
							contentHeight: captureContentHeight,
							pageHeight: message.pageHeight
						});

						port.postMessage({ action: "scroll", scrollTo: 0 });
					}

					if (message.action === "cancelCapture") {
						captureCancelled = true;
					}

					if (message.action === "scrollResult") {
						lastScrollData = { scrollY: message.scrollY, pageHeight: message.pageHeight };
						setTimeout(() => {
							if (captureCancelled) { return; }
							// Re-focus renderer window before capture — handles user clicking away
							WebExtension.browser.windows.update(renderWindowId, { focused: true }, () => {
								if (captureCancelled) { return; }
								WebExtension.browser.tabs.captureVisibleTab(renderWindowId, { format: "png" }, (dataUrl: string) => {
									if (captureCancelled) { return; }
									if (!dataUrl) {
										cleanup();
										return;
									}

									// Send capture to renderer for incremental stitching
									let estimatedTotal = Math.ceil((captureContentHeight || lastScrollData.pageHeight) / viewportHeight);
									port.postMessage({
										action: "drawCapture",
										dataUrl: dataUrl,
										index: captureCount,
										scrollY: lastScrollData.scrollY,
										viewportHeight: viewportHeight,
										totalViewports: Math.max(estimatedTotal, captureCount + 1)
									});
								});
							});
						}, 500);
					}

					if (message.action === "drawComplete") {
						if (captureCancelled) { return; }
						// Detect scroll stall: if scrollY didn't change, we've hit the
						// real bottom even if scrollHeight is inflated
						let scrollStalled = captureCount > 0 && lastScrollData.scrollY === lastScrollY;
						lastScrollY = lastScrollData.scrollY;
						captureCount++;

						let maxCaptureHeight = 16384;
						let atBottom = lastScrollData.scrollY + viewportHeight >= lastScrollData.pageHeight
						|| scrollStalled
						|| (captureCount * viewportHeight) >= maxCaptureHeight;

						if (atBottom) {
							port.postMessage({ action: "finalize" });
						} else {
							port.postMessage({ action: "scroll", scrollTo: captureCount * viewportHeight });
						}
					}

					if (message.action === "finalizeComplete") {
					// Keep window alive — user can switch modes, edit title, then save
					}

					// --- Telemetry from renderer — route to worker's logger ---
					if (message.action === "telemetry") {
						try {
							Log.parseAndLogDataPackage(message.data as Log.LogDataPackage, this.logger);
						} catch (e) { /* ignore malformed telemetry */ }
					}

					if (message.action === "save") {
					// Store save metadata — wait for image chunks before executing
						pendingSave = message;
						saveImages = [];
						saveAttachmentData = "";
						saveImagesReceived = 0;
						saveAttachmentReceived = false;

						let expectedImages = message.saveImageCount || 0;
						if (expectedImages === 0 && !message.saveAttachment) {
						// No images to wait for (article/bookmark) — execute immediately
							executeSave();
						}
					}

					if (message.action === "saveImage") {
						saveImages[message.index] = message.dataUrl;
						saveImagesReceived++;
						checkSaveReady();
					}

					if (message.action === "saveAttachment") {
						saveAttachmentData = message.dataUrl;
						saveAttachmentReceived = true;
						checkSaveReady();
					}

					if (message.action === "requestTranscript") {
						let transcriptTabId = this.tab.id as number;
						let platform = getTranscriptPlatform(this.tab.url || "");
						if (!platform) {
							port.postMessage({ action: "transcriptResult", success: false, errorCode: "unsupported", error: "This page is not a supported video platform." });
							return;
						}

						// A single generic scraper, driven entirely by the platform's selector
						// config, opens the transcript panel and extracts its entries. Adding a
						// new platform requires only a new entry in transcriptPlatforms.ts.
						(WebExtension.browser.scripting as any).executeScript({
							target: { tabId: transcriptTabId },
							args: [platform.scrape, platform.id],
							func: async function(scrape: any, platformId: string) {
								function wait(ms: number) { return new Promise(function(r) { setTimeout(r, ms); }); }
								try {
									let videoTitle = document.title || "";

									// Step 1: Optionally reveal the transcript control.
									if (scrape.expandSelector) {
										let expandBtn = document.querySelector(scrape.expandSelector) as HTMLElement | null;
										if (expandBtn) {
											expandBtn.click();
											await wait(scrape.expandWaitMs || 500);
										}
									}

									// Step 2: Open the transcript panel.
									let openBtn = document.querySelector(scrape.openSelector) as HTMLElement | null;
									if (!openBtn) {
										return { success: false, errorCode: "buttonNotFound", error: "Could not find the transcript button. This video may not have a transcript available." };
									}
									let alreadyOpen = scrape.respectAriaExpanded && openBtn.getAttribute("aria-expanded") === "true";
									if (!alreadyOpen) {
										openBtn.click();
										await wait(scrape.openWaitMs || 800);
									}

									// Step 3: Wait for the transcript line items to render.
									let maxWait = 8000;
									let pollInterval = 300;
									let elapsed = 0;
									let items: NodeListOf<Element> | null = null;
									while (elapsed < maxWait) {
										items = document.querySelectorAll(scrape.itemSelector);
										if (items && items.length > 0) {
											break;
										}
										await wait(pollInterval);
										elapsed += pollInterval;
									}
									if (!items || items.length === 0) {
										return { success: false, errorCode: "noEntries", error: "The transcript panel did not load any entries." };
									}

									// Step 4: Collect entries. A virtualized panel (e.g. Fluent UI
									// ms-List) only keeps the rows near the viewport in the DOM, so
									// scroll it top-to-bottom and accumulate rows keyed by their
									// stable index as the DOM recycles them.
									function parseItem(item: HTMLElement) {
										let timestampEl = scrape.timestampSelector ? item.querySelector(scrape.timestampSelector) as HTMLElement | null : null;
										let textEl = scrape.textSelector ? item.querySelector(scrape.textSelector) as HTMLElement | null : null;
										let speakerEl = scrape.speakerSelector ? item.querySelector(scrape.speakerSelector) as HTMLElement | null : null;
										return {
											timestamp: timestampEl?.innerText?.trim() || "",
											text: textEl?.innerText?.trim() || item.innerText?.trim() || "",
											speaker: speakerEl?.innerText?.trim() || ""
										};
									}

									let collected: { [key: string]: { idx: number; timestamp: string; text: string; speaker: string } } = {};
									let autoOrder = 0;
									function harvest() {
										let cells = document.querySelectorAll(scrape.itemSelector);
										for (let c = 0; c < cells.length; c++) {
											let cell = cells[c] as HTMLElement;
											let parsed = parseItem(cell);
											if (!parsed.text) { continue; }
											let key: string;
											let idx: number;
											let attr = scrape.indexAttribute ? cell.getAttribute(scrape.indexAttribute) : null;
											if (attr !== null) {
												key = attr;
												idx = parseInt(attr, 10);
											} else {
												key = "auto-" + autoOrder;
												idx = autoOrder;
												autoOrder++;
											}
											if (!collected[key]) {
												collected[key] = { idx: idx, timestamp: parsed.timestamp, text: parsed.text, speaker: parsed.speaker };
											}
										}
									}

									function getScrollParent(el: HTMLElement | null): HTMLElement | null {
										let node = el ? el.parentElement : null;
										while (node) {
											let style = window.getComputedStyle(node);
											if ((style.overflowY === "auto" || style.overflowY === "scroll") && node.scrollHeight > node.clientHeight + 4) {
												return node;
											}
											node = node.parentElement;
										}
										return null;
									}

									if (scrape.virtualized) {
										let scroller = getScrollParent(items[0] as HTMLElement);
										if (scroller) {
											let startScroll = Date.now();
											let maxDurationMs = 120000;
											scroller.scrollTop = 0;
											await wait(300);
											harvest();
											let stall = 0;
											while (Date.now() - startScroll < maxDurationMs) {
												let prevTop = scroller.scrollTop;
												let step = Math.max(scroller.clientHeight - 40, 100);
												scroller.scrollTop = Math.min(scroller.scrollTop + step, scroller.scrollHeight);
												await wait(220);
												harvest();
												let atBottom = scroller.scrollTop + scroller.clientHeight >= scroller.scrollHeight - 2;
												stall = (scroller.scrollTop === prevTop) ? stall + 1 : 0;
												if (atBottom || stall >= 3) {
													await wait(300);
													harvest();
													break;
												}
											}
										} else {
											harvest();
										}
									} else {
										harvest();
									}

									// Order entries by their stable index (insertion order otherwise).
									let orderedKeys = Object.keys(collected);
									orderedKeys.sort(function(a, b) { return collected[a].idx - collected[b].idx; });
									let entries: Array<{ timestamp: string; text: string; speaker: string }> = [];
									for (let k = 0; k < orderedKeys.length; k++) {
										let c = collected[orderedKeys[k]];
										entries.push({ timestamp: c.timestamp, text: c.text, speaker: c.speaker });
									}

									if (entries.length === 0) {
										return { success: false, errorCode: "noText", error: "The transcript panel opened but no text could be extracted." };
									}

									return {
										success: true,
										platform: platformId,
										videoTitle: videoTitle,
										transcript: entries
									};
								} catch (e: any) {
									return { success: false, errorCode: "exception", error: "Exception: " + (e?.message ? e.message : String(e)) };
								}
							}
						}).then((results: any[]) => {
							let data = results?.[0]?.result;
							if (!data) {
								port.postMessage({ action: "transcriptResult", success: false, errorCode: "noResult", error: "No result from transcript extraction." });
								return;
							}
							port.postMessage({ action: "transcriptResult", success: data.success, errorCode: data.errorCode || "", error: data.error || "", videoTitle: data.videoTitle || "", platform: data.platform || "", transcript: data.transcript || [] });
						}).catch((err: any) => {
							port.postMessage({ action: "transcriptResult", success: false, errorCode: "scriptError", error: "Script execution error: " + (err?.message || String(err)) });
						});
					}

					function checkSaveReady() {
						if (!pendingSave) { return; }
						let expectedImages = pendingSave.saveImageCount || 0;
						let needsAttachment = pendingSave.saveAttachment || false;
						if (saveImagesReceived >= expectedImages && (!needsAttachment || saveAttachmentReceived)) {
							executeSave();
						}
					}

					function executeSave() {
						if (!pendingSave) { return; }
						let msg = pendingSave;
						pendingSave = undefined; // prevent re-entry

						let saveMode = msg.mode || "fullpage";
						let saveTitle = msg.title || "";
						let saveAnnotation = msg.annotation || "";
						let saveSectionId = msg.sectionId || "";
						let saveUrl = msg.url || "";
						let savePageMetadata: { [key: string]: string } | undefined = msg.pageMetadata;

						// Ensure fresh token before save (matches old clipper.tsx ensureFreshUserBeforeClip)
						workerSelf.auth.updateUserInfoData(workerSelf.clientInfo.get().clipperId, UpdateReason.TokenRefreshForPendingClip).then(() => {
							return workerSelf.clipperData.getValue("userInformation");
						}, () => {
							return workerSelf.clipperData.getValue("userInformation");
						}).then((userInfoJson: string) => {
							let accessToken = "";
							try {
								let userInfo = JSON.parse(userInfoJson);
								accessToken = userInfo?.data ? userInfo.data.accessToken : "";
							} catch (e) { /* ignore */ }

							if (!accessToken) {
								port.postMessage({ action: "saveResult", success: false, error: "Not signed in" });
								return;
							}

							// Output shape mirrors V1 OneNotePage.getEntireOnml.
							let buildPage = (bodyOnml: string, imageParts: { name: string; blob: Blob; type: string }[]) => {
								let boundary = "OneNoteRendererBoundary" + Date.now();
								let now = new Date();
								let offset = now.getTimezoneOffset();
								let offsetSign = offset >= 0 ? "-" : "+";
								offset = Math.abs(offset);
								let offsetHours = Math.floor(offset / 60).toString();
								let offsetMins = Math.round(offset % 60).toString();
								if (parseInt(offsetHours, 10) < 10) { offsetHours = "0" + offsetHours; }
								if (parseInt(offsetMins, 10) < 10) { offsetMins = "0" + offsetMins; }
								let createdTime = offsetSign + offsetHours + ":" + offsetMins;
								let fontStyle = "font-size: 16px; font-family: Verdana;";
								let locale = (typeof chrome !== "undefined" && chrome.i18n?.getUILanguage) ? chrome.i18n.getUILanguage() : "en";
								let metaTags = "";
								if (savePageMetadata) {
									for (let key in savePageMetadata) {
										if (Object.hasOwn(savePageMetadata, key)) {
											metaTags += "<meta name=\"" + escapeAttr(key)
												+ "\" content=\"" + escapeAttr(savePageMetadata[key]) + "\" />";
										}
									}
								}
								let presentationHtml = "<html xmlns=\"http://www.w3.org/1999/xhtml\" lang=" + locale + ">"
									+ "<head>"
									+ "<title>" + escapeHtml(saveTitle) + "</title>"
									+ "<meta name=\"created\" content=\"" + createdTime + " \">"
									+ metaTags
									+ "</head><body>";
								if (saveAnnotation) {
									let escaped = saveAnnotation.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
									presentationHtml += "<div style=\"" + fontStyle + "\">&quot;" + escaped + "&quot;</div>";
								}
								if (saveUrl && saveMode !== "bookmark") {
									presentationHtml += "<div style=\"" + fontStyle + "\">Clipped from: <a href=\"" + escapeAttr(saveUrl) + "\">" + escapeHtml(saveUrl) + "</a></div>";
								}
								presentationHtml += bodyOnml;
								presentationHtml += "</body></html>";

								let parts: (string | Blob)[] = [];
								parts.push("--" + boundary + "\r\n");
								parts.push("Content-Type: application/xhtml+xml\r\n");
								parts.push("Content-Disposition: form-data; name=\"Presentation\"\r\n\r\n");
								parts.push(presentationHtml);
								for (let img of imageParts) {
									parts.push("\r\n--" + boundary + "\r\n");
									parts.push("Content-Type: " + img.type + "\r\n");
									parts.push("Content-Disposition: form-data; name=\"" + img.name + "\"\r\n\r\n");
									parts.push(img.blob);
								}
								parts.push("\r\n--" + boundary + "--\r\n");

								let body = new Blob(parts);
								let apiUrl = "https://www.onenote.com/api/v1.0/me/notes"
									+ (saveSectionId ? "/sections/" + encodeURIComponent(saveSectionId) : "")
									+ "/pages";

								let correlationId = WebExtensionWorker.newGuid();
								let requestDate = new Date().toISOString();

								fetch(apiUrl, {
									method: "POST",
									headers: {
										"Authorization": "Bearer " + accessToken,
										"Content-Type": "multipart/form-data; boundary=" + boundary,
										"X-CorrelationId": correlationId,
										"X-UserSessionId": sessionUsid
									},
									body: body
								}).then((response) => {
									let serverCorrelation = response.headers.get("X-CorrelationId") || correlationId;
									let serverRequestId = response.headers.get("X-UserSessionId") || "";
									if (response.ok) {
										response.json().then((data) => {
											let pageUrl = "";
											try {
												pageUrl = data?.links?.oneNoteWebUrl ? data.links.oneNoteWebUrl.href : "";
											} catch (e) { /* ignore */ }
											port.postMessage({ action: "saveResult", success: true, pageUrl: pageUrl });
										}).catch(() => {
											port.postMessage({ action: "saveResult", success: true, pageUrl: "" });
										});
									} else {
										response.text().then((text) => {
											let errorMsg = "";
											try { errorMsg = JSON.parse(text).error.message || text.substring(0, 200); } catch (e) { errorMsg = text.substring(0, 200); }
											let debugInfo = errorMsg
												+ "\n\nDate: " + requestDate
												+ "\nStatus: " + response.status
												+ "\nX-CorrelationId: " + serverCorrelation
												+ (serverRequestId ? "\nX-UserSessionId: " + serverRequestId : "");
											port.postMessage({ action: "saveResult", success: false, error: debugInfo });
										});
									}
								}).catch((err) => {
									let debugInfo = (err.message || "Network error: Unknown")
										+ "\nX-CorrelationId: " + correlationId
										+ "\nDate: " + requestDate;
									port.postMessage({ action: "saveResult", success: false, error: debugInfo });
								});
							};

							if (saveMode === "fullpage") {
								let dataUrl = saveImages[0] || "";
								if (dataUrl) {
									fetch(dataUrl).then((r) => r.blob()).then((blob) => {
										let imgName = "fullPageImage";
										let imgCssWidth = msg.imageWidth || contentWidth;
										let bodyOnml = "<p><img src=\"name:" + imgName + "\" width=\"" + imgCssWidth + "\" /></p>";
										buildPage(bodyOnml, [{ name: imgName, blob: blob, type: "image/jpeg" }]);
									});
								} else {
									port.postMessage({ action: "saveResult", success: false, error: "No screenshot data" });
								}
							} else if (saveMode === "region") {
								if (saveImages.length === 0) {
									port.postMessage({ action: "saveResult", success: false, error: "No region data" });
									return;
								}
								Promise.all(saveImages.map((dataUrl: string, idx: number) =>
									fetch(dataUrl).then((r) => r.blob()).then((blob) => ({
										name: "regionImage" + idx,
										blob: blob,
										type: dataUrl.indexOf("image/png") !== -1 ? "image/png" : "image/jpeg"
									}))
								)).then((imageParts) => {
									let bodyOnml = imageParts.map((p) =>
										"<p><img src=\"name:" + p.name + "\" /></p>"
									).join("&nbsp;");
									buildPage(bodyOnml, imageParts);
								});
							} else if (saveMode === "article" || saveMode === "selection" || saveMode === "transcript") {
								// Selection and transcript share the article save path; renderer composes the body.
								let articleHtml = msg.contentHtml || "";
								buildPage(articleHtml, []);
							} else if (saveMode === "bookmark") {
								let bookmarkHtml = msg.contentHtml || "";
								buildPage(bookmarkHtml, []);
							} else if (saveMode === "pdf") {
								let pdfAttachEnabled = msg.pdfAttach || false;
								let pdfDistributeEnabled = msg.pdfDistribute || false;
								let pdfAttachName = msg.pdfAttachName || "Original.pdf";
								let pageLabel = msg.pageLabel || "Page";
								let pdfPageNumbers: number[] = msg.pdfPageNumbers || [];

								if (saveImages.length === 0) {
									port.postMessage({ action: "saveResult", success: false, error: "No PDF page data" });
									return;
								}

								if (pdfDistributeEnabled) {
									// Distributed: one OneNote page per PDF page (sequential POSTs)
									let distributeSave = (pageIdx: number, savedCount: number, firstPageUrl: string) => {
										if (pageIdx >= saveImages.length) {
											port.postMessage({ action: "saveResult", success: true, pageUrl: firstPageUrl });
											return;
										}
										let pageTitle = saveTitle;
										if (saveImages.length > 1) {
											let actualPageNum = pdfPageNumbers[pageIdx] || (pageIdx + 1);
											pageTitle = saveTitle + ": " + pageLabel + " " + actualPageNum;
										}
										let imgDataUrl = saveImages[pageIdx];
										fetch(imgDataUrl).then((r) => r.blob()).then((blob) => {
											let imgName = "pdfPage" + pageIdx;
											let bodyOnml = "<p><img src=\"name:" + imgName + "\" /></p>&nbsp;";
											let distBoundary = "OneNoteRendererBoundary" + Date.now() + pageIdx;
											let now2 = new Date();
											let offset2 = now2.getTimezoneOffset();
											let offsetSign2 = offset2 >= 0 ? "-" : "+";
											offset2 = Math.abs(offset2);
											let oH = Math.floor(offset2 / 60).toString();
											let oM = Math.round(offset2 % 60).toString();
											if (parseInt(oH, 10) < 10) { oH = "0" + oH; }
											if (parseInt(oM, 10) < 10) { oM = "0" + oM; }
											let ct = offsetSign2 + oH + ":" + oM;
											let fStyle = "font-size: 16px; font-family: Verdana;";
											let distLocale = (typeof chrome !== "undefined" && chrome.i18n?.getUILanguage) ? chrome.i18n.getUILanguage() : "en";
											let distHtml = "<html xmlns=\"http://www.w3.org/1999/xhtml\" lang=" + distLocale + ">"
												+ "<head>"
												+ "<title>" + escapeHtml(pageTitle) + "</title>"
												+ "<meta name=\"created\" content=\"" + ct + " \">"
												+ "</head><body>";
											if (pageIdx === 0 && saveAnnotation) {
												let escaped = saveAnnotation.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
												distHtml += "<div style=\"" + fStyle + "\">&quot;" + escaped + "&quot;</div>";
											}
											if (pageIdx === 0 && saveUrl) {
												distHtml += "<div style=\"" + fStyle + "\">Clipped from: <a href=\"" + escapeAttr(saveUrl) + "\">" + escapeHtml(saveUrl) + "</a></div>";
											}
											// Attachment <object> goes before page image (matches legacy ordering)
											if (pageIdx === 0 && pdfAttachEnabled && saveAttachmentData) {
												distHtml += "<object data-attachment=\"" + pdfAttachName + "\" data=\"name:Attachment\" type=\"application/pdf\" />";
											}
											distHtml += bodyOnml;
											distHtml += "</body></html>";

											let distParts: (string | Blob)[] = [];
											distParts.push("--" + distBoundary + "\r\n");
											distParts.push("Content-Type: application/xhtml+xml\r\n");
											distParts.push("Content-Disposition: form-data; name=\"Presentation\"\r\n\r\n");
											distParts.push(distHtml);
											distParts.push("\r\n--" + distBoundary + "\r\n");
											distParts.push("Content-Type: image/png\r\n");
											distParts.push("Content-Disposition: form-data; name=\"" + imgName + "\"\r\n\r\n");
											distParts.push(blob);
											// Attach PDF binary on first page if enabled
											if (pageIdx === 0 && pdfAttachEnabled && saveAttachmentData) {
												fetch(saveAttachmentData).then((ar) => ar.blob()).then((pdfBlob) => {
													distParts.push("\r\n--" + distBoundary + "\r\n");
													distParts.push("Content-Type: application/pdf\r\n");
													distParts.push("Content-Disposition: form-data; name=\"Attachment\"\r\n\r\n");
													distParts.push(pdfBlob);
													distParts.push("\r\n--" + distBoundary + "--\r\n");
													doDistributePost(distParts, distBoundary, pageIdx, savedCount, firstPageUrl);
												});
											} else {
												distParts.push("\r\n--" + distBoundary + "--\r\n");
												doDistributePost(distParts, distBoundary, pageIdx, savedCount, firstPageUrl);
											}
										});
									};

									let doDistributePost = (parts: (string | Blob)[], boundary: string, pageIdx: number, savedCount: number, firstPageUrl: string) => {
										let body = new Blob(parts);
										let apiUrl2 = "https://www.onenote.com/api/v1.0/me/notes"
											+ (saveSectionId ? "/sections/" + encodeURIComponent(saveSectionId) : "")
											+ "/pages";
										let cid2 = WebExtensionWorker.newGuid();
										fetch(apiUrl2, {
											method: "POST",
											headers: {
												"Authorization": "Bearer " + accessToken,
												"Content-Type": "multipart/form-data; boundary=" + boundary,
												"X-CorrelationId": cid2,
												"X-UserSessionId": sessionUsid
											},
											body: body
										}).then((resp) => {
											if (resp.ok) {
												resp.json().then((data) => {
													let pUrl = firstPageUrl;
													if (pageIdx === 0) {
														try { pUrl = data.links.oneNoteWebUrl.href; } catch (e) { /* ignore */ }
													}
													port.postMessage({ action: "saveProgress", current: savedCount + 1, total: saveImages.length });
													distributeSave(pageIdx + 1, savedCount + 1, pUrl);
												}).catch(() => {
													distributeSave(pageIdx + 1, savedCount + 1, firstPageUrl);
												});
											} else {
												resp.text().then((text) => {
													port.postMessage({ action: "saveResult", success: false, error: "Failed on page " + (pageIdx + 1) + ": " + text.substring(0, 200) });
												});
											}
										}).catch((err) => {
											port.postMessage({ action: "saveResult", success: false, error: "Network error on page " + (pageIdx + 1) + ": " + (err.message || "Unknown") });
										});
									};

									distributeSave(0, 0, "");

								} else {
									// Non-distributed: single OneNote page with all PDF page images
									Promise.all(saveImages.map((dataUrl: string, idx: number) =>
										fetch(dataUrl).then((r) => r.blob()).then((blob) => ({
											name: "pdfPage" + idx,
											blob: blob,
											type: "image/png"
										}))
									)).then((imageParts) => {
										let pageImagesOnml = imageParts.map((p) =>
											"<p><img src=\"name:" + p.name + "\" /></p>&nbsp;"
										).join("");
										if (pdfAttachEnabled && saveAttachmentData) {
											fetch(saveAttachmentData).then((r) => r.blob()).then((pdfBlob) => {
												let attachMimeName = "Attachment";
												imageParts.push({ name: attachMimeName, blob: pdfBlob, type: "application/pdf" });
												let bodyOnml = "<object data-attachment=\"" + pdfAttachName + "\" data=\"name:" + attachMimeName + "\" type=\"application/pdf\" />" + pageImagesOnml;
												buildPage(bodyOnml, imageParts);
											});
										} else {
											buildPage(pageImagesOnml, imageParts);
										}
									});
								}
							} else {
								port.postMessage({ action: "saveResult", success: false, error: "Unsupported mode" });
							}
						});
					}

					if (message.action === "startRegion") {
					// Focus original tab, inject standalone overlay, listen for result
						let regionTabId = this.tab.id as number;
						let regionWindowId = 0;
						WebExtension.browser.tabs.get(regionTabId, (t: any) => {
							if (!t?.windowId) { return; }
							regionWindowId = t.windowId;
							WebExtension.browser.windows.update(regionWindowId, { focused: true }, () => {
								if (WebExtension.browser.runtime.lastError) { /* ignore */ }
								// Inject i18n strings before overlay script so it can read them.
								// Define as non-writable / non-configurable so page JS can't swap
								// in spoofed UI strings between the two executeScript calls.
								let regionStrings = message.regionStrings || {};
								WebExtension.browser.scripting.executeScript({
									target: { tabId: regionTabId },
									func: function(s: any) {
										try {
											Object.defineProperty(window, "__regionStrings", {
												value: Object.freeze(s),
												writable: false,
												configurable: false,
												enumerable: false
											});
										} catch (e) {
										// Property already locked from a prior region invocation — keep existing.
										}
									},
									args: [regionStrings]
								}, () => {
									WebExtension.browser.scripting.executeScript({
										target: { tabId: regionTabId },
										files: ["regionOverlay.js"]
									});
								});
							});
						});

						// Listen for overlay messages (regionSelected / regionCancelled)
						// Messages are JSON strings (required by offscreen.ts message handler)
						let regionListener = (rawMsg: any, sender: any) => {
							if (sender.tab?.id !== regionTabId) { return; }
							let msg: any;
							try { msg = typeof rawMsg === "string" ? JSON.parse(rawMsg) : rawMsg; } catch (e) { return; }

							if (msg.action === "regionSelected") {
								WebExtension.browser.runtime.onMessage.removeListener(regionListener);
								// Brief delay for overlay DOM removal, then capture
								setTimeout(() => {
									WebExtension.browser.tabs.captureVisibleTab(regionWindowId, { format: "jpeg", quality: 95 }, (dataUrl: string) => {
										if (!dataUrl) {
											port.postMessage({ action: "regionCancelled" });
										} else {
										// Send full image + coords via port (same pattern as drawCapture in fullpage)
											port.postMessage({
												action: "regionCaptured",
												dataUrl: dataUrl,
												x: msg.x, y: msg.y, width: msg.width, height: msg.height, dpr: msg.dpr
											});
										}
										WebExtension.browser.windows.update(renderWindowId, { focused: true }, () => {
											if (WebExtension.browser.runtime.lastError) { /* ignore */ }
										});
									});
								}, 150);
							}

							if (msg.action === "regionCancelled") {
								WebExtension.browser.runtime.onMessage.removeListener(regionListener);
								port.postMessage({ action: "regionCancelled" });
								WebExtension.browser.windows.update(renderWindowId, { focused: true }, () => {
									if (WebExtension.browser.runtime.lastError) { /* ignore */ }
								});
							}
						};
						WebExtension.browser.runtime.onMessage.addListener(regionListener);
					}

					if (message.action === "signOut") {
						let authType: AuthType = (AuthType as any)[message.authType];
						if (authType !== undefined) {
							this.doSignOutAction(authType);
						}
						// Clear user data from storage
						this.clipperData.removeKey("userInformation");
						this.clipperData.removeKey("curSection");
						this.clipperData.removeKey("notebooks");
						this.clipperData.removeKey("isUserLoggedIn");

						// Tell renderer to show sign-in panel (keep window open)
						port.postMessage({ action: "signOutComplete" });
					}

					if (message.action === "openFeedback") {
						let ci = this.clientInfo.get();
						let usid = sessionUsid;
						let feedbackUrl = "https://feedbackportal.microsoft.com/feedback/post/c06dcc30-2e1c-ec11-b6e7-0022481f8472";
						feedbackUrl += "?LogCategory=OneNoteClipperUsage";
						if (message.pageUrl) { feedbackUrl += "&originalUrl=" + encodeURIComponent(message.pageUrl); }
						if (ci.clipperId) { feedbackUrl += "&clipperId=" + encodeURIComponent(ci.clipperId); }
						if (usid) { feedbackUrl += "&usid=" + encodeURIComponent(usid); }
						if (ci.clipperVersion) { feedbackUrl += "&version=" + encodeURIComponent(ci.clipperVersion); }
						feedbackUrl += "&type=" + encodeURIComponent(ClientType[ci.clipperType]);
						WebExtension.browser.windows.create({
							url: feedbackUrl,
							type: "popup",
							width: 1000,
							height: 700,
							focused: true
						});
					}
				});
			};

			// Listen for the renderer page to connect via port
			let onConnect = (port: chrome.runtime.Port) => {
				if (port.name !== "renderer") {
					return;
				}
				WebExtension.browser.runtime.onConnect.removeListener(onConnect);

				if (windowReady) {
					setupPort(port);
				} else {
				// Window.create callback hasn't fired yet, defer
					pendingPort = port;
				}
			};

			WebExtension.browser.runtime.onConnect.addListener(onConnect);

			// Create the renderer window. Must be focused so Chrome paints it
			// for captureVisibleTab.
			WebExtension.browser.windows.create({
				url: rendererUrl,
				type: "popup",
				width: renderWidth,
				height: renderHeight,
				left: renderLeft,
				top: renderTop,
				focused: true
			}, (renderWindow: chrome.windows.Window) => {
				if (!renderWindow) {
					WebExtension.browser.runtime.onConnect.removeListener(onConnect);
					return;
				}
				renderWindowId = renderWindow.id;
				this.activeRendererWindowId = renderWindowId;
				windowReady = true;

				// Close renderer if the source tab navigates away
				let onTabUpdated = (tabId: number, changeInfo: chrome.tabs.OnUpdatedInfo) => {
					if (tabId === this.tab.id && changeInfo.url) {
						WebExtension.browser.tabs.onUpdated.removeListener(onTabUpdated);
						this.activeRendererCleanup();
					}
				};
				WebExtension.browser.tabs.onUpdated.addListener(onTabUpdated);

				// If port connected before window.create callback, start now
				if (pendingPort) {
					setupPort(pendingPort);
				}
			});
		}); // end getCurrent
	}

	private launchWebExtensionPopupAndWaitForClose(url: string, autoCloseDestinationUrl: string): Promise<boolean> {
		return new Promise<boolean>((resolve, reject) => {
			let popupWidth = 1000;
			let popupHeight = 700;
			WebExtension.browser.windows.getCurrent((currentWindow: Window) => {
				let leftPosition: number = currentWindow.left + Math.round((currentWindow.width - popupWidth) / 2);
				let topPosition: number = currentWindow.top + Math.round((currentWindow.height - popupHeight) / 2);

				try {
					/* As of 7/19/2016, Firefox does not yet supported the "focused" key for windows.create in the WebExtensions API */
					/* See bug filed here: https://bugzilla.mozilla.org/show_bug.cgi?id=1213484 */
					let windowOptions: chrome.windows.CreateData = {
						height: popupHeight,
						left: leftPosition,
						top: topPosition,
						type: "popup",
						url: url,
						width: popupWidth
					};

					if (this.clientInfo.get().clipperType !== ClientType.FirefoxExtension) {
						windowOptions.focused = true;
					}

					WebExtension.browser.windows.create(windowOptions, (newWindow: Window) => {
						let redirectOccurred = false;
						let errorObject;
						let correlationId: string;

						let redirectListener = (details: WebResponseCacheDetails) => {
							redirectOccurred = true;

							// Find and get correlation id
							if (details.responseHeaders) {
								for (let i = 0; i < details.responseHeaders.length; i++) {
									if (details.responseHeaders[i].name === Constants.HeaderValues.correlationId) {
										correlationId = details.responseHeaders[i].value || "";
										break;
									}
								}
							}

							let redirectUrl = details.url;
							let error = UrlUtils.getQueryValue(redirectUrl, Constants.Urls.QueryParams.error);
							let errorDescription = UrlUtils.getQueryValue(redirectUrl, Constants.Urls.QueryParams.errorDescription);
							if (error || errorDescription) {
								errorObject = { error: error, errorDescription: errorDescription, correlationId: correlationId };
							}

							WebExtension.browser.webRequest.onCompleted.removeListener(redirectListener);
							WebExtension.browser.tabs.remove(details.tabId);
						};

						WebExtension.browser.webRequest.onCompleted.addListener(redirectListener, {
							windowId: newWindow.id, urls: [autoCloseDestinationUrl + "*"]
						}, ["responseHeaders"]);

						let closeListener = (tabId: number, tabRemoveInfo: TabRemoveInfo) => {
							if (tabRemoveInfo.windowId === newWindow.id) {
								errorObject ? reject(errorObject) : resolve(redirectOccurred);
								WebExtension.browser.tabs.onRemoved.removeListener(closeListener);
							}
						};

						WebExtension.browser.tabs.onRemoved.addListener(closeListener);
					});
				} catch (e) {
					let errorMessage = (e as Error).message;
					this.logger.logFailure(Log.Failure.Label.WebExtensionWindowCreate, Log.Failure.Type.Unexpected, { error: errorMessage });
					reject({ error: errorMessage });
				}
			});
		});
	}
}
