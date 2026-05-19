/// <reference path="../../../../node_modules/onenoteapi/target/oneNoteApi.d.ts" />

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

import {ChangeLog} from "../../versioning/changeLog";

import {AuthenticationHelper} from "../authenticationHelper";
import {ExtensionWorkerBase} from "../extensionWorkerBase";
import {InjectHelper} from "../injectHelper";

import {InvokeInfo} from "../invokeInfo";
import {InvokeMode, InvokeOptions} from "../invokeOptions";
import {InjectUrls} from "./injectUrls";
import {WebExtension} from "./webExtension";
import {WebExtensionBackgroundMessageHandler} from "./webExtensionMessageHandler";

type TabRemoveInfo = chrome.tabs.TabRemoveInfo;
type WebResponseCacheDetails = chrome.webRequest.WebResponseCacheDetails;
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
	private injectUrls: InjectUrls;
	private noOpTrackerInvoked: boolean;
	private activeRendererCleanup: () => void;
	private activeRendererWindowId: number;
	// Set by closeAllFramesAndInvokeClipper from the InvokeOptions passed by the
	// caller; consumed by the contentCapture listener so the renderer's
	// loadContent payload can carry the original invocation intent
	// (e.g. ContextTextSelection -> auto-engage Selection mode after screenshot,
	//  ContextImage -> auto-engage Region mode with srcUrl pre-seeded).
	private pendingInvokeMode: string;
	// Companion to pendingInvokeMode: the InvokeOptions.invokeDataForMode value
	// (image srcUrl for ContextImage, selected text for PDF-plugin selection).
	private pendingInvokeData: string;

	constructor(injectUrls: InjectUrls, tab: W3CTab, clientInfo: SmartValue<ClientInfo>, auth: AuthenticationHelper) {
		let messageHandlerThunk = () => { return new WebExtensionBackgroundMessageHandler(tab.id); };
		super(clientInfo, auth, new ClipperData(new LocalStorage()), messageHandlerThunk, messageHandlerThunk);

		this.injectUrls = injectUrls;
		this.tab = tab;
		this.tabId = tab.id;
		this.noOpTrackerInvoked = false;
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

			this.invokeDebugLoggingIfEnabled();
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

		// Capture invokeMode + invokeDataForMode for the contentCapture listener
		// to forward to the renderer. ContextTextSelection -> auto-engage
		// Selection mode after screenshot; ContextImage -> auto-engage Region
		// mode with the right-clicked image (srcUrl) pre-seeded.
		this.pendingInvokeMode = (options && options.invokeMode !== undefined)
			? InvokeMode[options.invokeMode]
			: "";
		this.pendingInvokeData = (options && options.invokeDataForMode) ? options.invokeDataForMode : "";

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
	 * Notify the UI to invoke the clipper. Resolve with true if it was thought to be successfully
	 * injected; otherwise resolves with false.
	 */
	protected invokeClipperBrowserSpecific(): Promise<boolean> {
		return new Promise<boolean>((resolve) => {
			WebExtension.browser.scripting.executeScript({
				target: { tabId: this.tab.id },
				func: () => {}
			}, () => {
				if (WebExtension.browser.runtime.lastError) {
					Log.ErrorUtils.sendFailureLogRequest({
						label: Log.Failure.Label.UnclippablePage,
						properties: {
							failureType: Log.Failure.Type.Expected,
							failureInfo: { error: WebExtension.browser.runtime.lastError.message },
							stackTrace: Log.Failure.getStackTrace()
						},
						clientInfo: this.clientInfo
					});

					// In Firefox, alert() is not callable from the service worker, so it looks like we have to no-op here
					if (this.clientInfo.get().clipperType !== ClientType.FirefoxExtension) {
						InjectHelper.alertUserOfUnclippablePage();
					}
					resolve(false);
				} else {
					if (this.clientInfo.get().clipperType === ClientType.FirefoxExtension) {
						WebExtension.browser.management.uninstallSelf();
						resolve(true);
					} else {
						WebExtension.browser.scripting.executeScript({
							target: { tabId: this.tab.id },
							files: [this.injectUrls.webClipperInjectUrl]
						});

						if (!this.noOpTrackerInvoked) {
							this.setUpNoOpTrackers(this.tab.url);
							this.noOpTrackerInvoked = true;
						}
						resolve(true);
					}
				}
			});
		});
	}

	/**
	 * Notify the UI to invoke the frontend script that handles logging to the conosle. Resolve with
	 * true if it was thought to be successfully injected; otherwise resolves with false.
	 */
	protected invokeDebugLoggingBrowserSpecific(): Promise<boolean> {
		return new Promise<boolean>((resolve) => {
			WebExtension.browser.scripting.executeScript({
				target: { tabId: this.tab.id },
				files: [this.injectUrls.debugLoggingInjectUrl]
			}, () => {
				if (WebExtension.browser.runtime.lastError) {
					// We are probably on a page like about:blank, which is pretty normal
					resolve(false);
				} else {
					resolve(true);
				}
			});
		});
	}

	protected invokePageNavBrowserSpecific(): Promise<boolean> {
		return new Promise<boolean>((resolve) => {
			WebExtension.browser.scripting.executeScript({
				target: { tabId: this.tab.id },
				func: () => {}
			}, () => {
				// It's safest to not use lastError in the resolve due to special behavior in the Chrome API
				if (WebExtension.browser.runtime.lastError) {
					// We are probably on a page like about:blank, which is pretty normal
					resolve(false);
				} else {
					WebExtension.browser.scripting.executeScript({
						target: { tabId: this.tab.id },
						files: [this.injectUrls.pageNavInjectUrl]
					});
					resolve(true);
				}
			});
		});
	}

	/**
	 * Notify the UI to invoke the What's New tooltip. Resolve with true if it was thought to be successfully
	 * injected; otherwise resolves with false.
	 */
	protected invokeWhatsNewTooltipBrowserSpecific(newVersions: ChangeLog.Update[]): Promise<boolean> {
		return this.invokePageNavBrowserSpecific();
	}

	protected invokeTooltipBrowserSpecific(): Promise<boolean> {
		return this.invokePageNavBrowserSpecific();
	}

	protected isAllowedFileSchemeAccessBrowserSpecific(callback: (allowed: boolean) => void): void {
		if (!WebExtension.browser.extension.isAllowedFileSchemeAccess) {
			callback(true);
			return;
		}

		WebExtension.browser.extension.isAllowedFileSchemeAccess((isAllowed) => {
			if (!isAllowed && this.tab.url.indexOf("file:///") === 0) {
				callback(false);
			} else {
				callback(true);
			}
		});
	}

	/**
	 * Gets the visible tab's screenshot as an image url
	 */
	protected takeTabScreenshot(): Promise<string> {
		return new Promise<string>((resolve) => {
			WebExtension.browser.tabs.query({ active: true, lastFocusedWindow: true }, () => {
				WebExtension.browser.tabs.captureVisibleTab({ format: "png" }, (dataUrl: string) => {
					resolve(dataUrl);
				});
			});
		});
	}

	/**
	 * Cancels an in-progress full-page screenshot capture.
	 */
	protected cancelFullPageScreenshot(): void {
		this.activeRendererCleanup();
	}

	/**
	 * Legacy: called by clipper.tsx via communicator. In the new flow, openRendererWindow() is used instead.
	 */
	protected takeFullPageScreenshot(htmlContent: string): Promise<string[]> {
		this.openRendererWindow();
		return new Promise<string[]>(() => { /* renderer window handles everything */ });
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
			if (!sender.tab || sender.tab.id !== this.tab.id) { return; }
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
			let isLocalFile = this.tab.url && this.tab.url.indexOf("file:///") === 0;
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
					if (injectPromise && injectPromise.catch) {
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
		let browserWidth = currentWindow && currentWindow.width ? currentWindow.width : 1024;
		let browserHeight = currentWindow && currentWindow.height ? currentWindow.height : 768;
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
			let lastScrollY: number = -1;
			let lastScrollData: { scrollY: number; pageHeight: number };

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

				// --- V1 parity: refresh user state on renderer open ---
				// Matches legacy extensionWorkerBase.getInitialUser. The renderer
				// requests this on boot before kicking off the notebooks fetch,
				// so the OneNote API call uses a fresh access token.
				// auth.updateUserInfoData is cache-aware via clipperData.getFreshValue
				// with TTL = (accessTokenExpiration*1000) - 180000 -- if the cached
				// token is still within its expiry-minus-3-minutes window, returns
				// cached without a network call. Otherwise hits /webclipper/userinfo
				// (which uses the refresh-token cookie) and writes a fresh token to
				// localStorage. The renderer re-reads localStorage on userRefreshed.
				if (message.action === "refreshUser") {
					// On both success and failure, just notify "done" -- the renderer
					// inspects localStorage to decide what to do next, mirroring V1's
					// data-driven pattern (V1 returned the UserInfo and the UI looked
					// at .user presence; here the equivalent state is in localStorage).
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
						if (updatedUser && updatedUser.user) {
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

				if (message.action === "scrollResult") {
					lastScrollData = { scrollY: message.scrollY, pageHeight: message.pageHeight };
					setTimeout(() => {
						// Re-focus renderer window before capture — handles user clicking away
						WebExtension.browser.windows.update(renderWindowId, { focused: true }, () => {
							WebExtension.browser.tabs.captureVisibleTab(renderWindowId, { format: "png" }, (dataUrl: string) => {
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
								accessToken = userInfo && userInfo.data ? userInfo.data.accessToken : "";
							} catch (e) { /* ignore */ }

							if (!accessToken) {
								port.postMessage({ action: "saveResult", success: false, error: "Not signed in" });
								return;
							}

							// Build OneNote page content based on mode. Output shape mirrors V1
							// OneNotePage.getEntireOnml: `<html xmlns lang>` (no DOCTYPE, no
							// quotes around lang), `<head>` with title + created meta + one
							// `<meta>` per PageMetadata entry.
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
								let locale = (typeof chrome !== "undefined" && chrome.i18n && chrome.i18n.getUILanguage) ? chrome.i18n.getUILanguage() : "en";
								let metaTags = "";
								if (savePageMetadata) {
									for (let key in savePageMetadata) {
										if (Object.prototype.hasOwnProperty.call(savePageMetadata, key)) {
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
												pageUrl = data && data.links && data.links.oneNoteWebUrl ? data.links.oneNoteWebUrl.href : "";
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
							} else if (saveMode === "article" || saveMode === "selection") {
								// Selection mode shares the article save path -- same
								// body shape (font-wrapped HTML), same metadata
								// (AutoPageTags=Article), no images. Renderer composes
								// the body identically.
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
											let distLocale = (typeof chrome !== "undefined" && chrome.i18n && chrome.i18n.getUILanguage) ? chrome.i18n.getUILanguage() : "en";
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
						if (!t || !t.windowId) { return; }
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
						if (!sender.tab || sender.tab.id !== regionTabId) { return; }
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
			let onTabUpdated = (tabId: number, changeInfo: chrome.tabs.TabChangeInfo) => {
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
										correlationId = details.responseHeaders[i].value;
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
					// In the event that there was an exception thrown during the creation of the popup, fallback to using window.open with a monitor
					this.logger.logFailure(Log.Failure.Label.WebExtensionWindowCreate, Log.Failure.Type.Unexpected, { error: e.message });

					this.launchPopupAndWaitForClose(url).then((redirectOccurred) => {
						// From chrome's background, we currently are unable to reliably determine if the redirect happened
						resolve(true /* redirectOccurred */);
					}, (errorObject) => {
						reject(errorObject);
					});
				}
			});
		});
	}
}
