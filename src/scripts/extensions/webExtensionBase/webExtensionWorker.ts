import {AuthType} from "../../userInfo";
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

import {InjectUrls} from "./injectUrls";
import {WebExtension} from "./webExtension";
import {WebExtensionBackgroundMessageHandler} from "./webExtensionMessageHandler";

type TabRemoveInfo = chrome.tabs.TabRemoveInfo;
type WebResponseCacheDetails = chrome.webRequest.WebResponseCacheDetails;
type Window = chrome.windows.Window;

export class WebExtensionWorker extends ExtensionWorkerBase<W3CTab, number> {
	private injectUrls: InjectUrls;
	private noOpTrackerInvoked: boolean;
	private activeRendererCleanup: () => void;

	constructor(injectUrls: InjectUrls, tab: W3CTab, clientInfo: SmartValue<ClientInfo>, auth: AuthenticationHelper) {
		let messageHandlerThunk = () => { return new WebExtensionBackgroundMessageHandler(tab.id); };
		super(clientInfo, auth, new ClipperData(new LocalStorage()), messageHandlerThunk, messageHandlerThunk);

		this.injectUrls = injectUrls;
		this.tab = tab;
		this.tabId = tab.id;
		this.noOpTrackerInvoked = false;

		this.activeRendererCleanup = () => { /* no-op */ };

		let isPrivateWindow: Boolean = !!tab.incognito || !!tab.inPrivate;

		this.consoleOutputEnabledFlagProcessed.then(() => {
			this.logger.setContextProperty(Log.Context.Custom.InPrivateBrowsing, isPrivateWindow.toString());
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
	 * Renders HTML in a temporary popup window and captures full-page screenshots.
	 * Mirrors the server-side DomEnhancer approach: opens an extension renderer page,
	 * communicates via chrome.runtime port, then scroll-captures it.
	 */
	protected takeFullPageScreenshot(htmlContent: string): Promise<string[]> {
		let rendererUrl = WebExtension.browser.runtime.getURL("renderer.html");

		return new Promise<string[]>((resolve) => {
			let renderWindowId: number;
			let pendingPort: chrome.runtime.Port;
			let windowReady = false;

			// Position renderer directly behind the user's window to hide it
			WebExtension.browser.windows.getCurrent((currentWindow: chrome.windows.Window) => {
			let renderWidth = Math.min(currentWindow ? currentWindow.width : 1280, 1280);
			let renderHeight = currentWindow ? currentWindow.height : 768;
			let renderLeft = currentWindow ? currentWindow.left : 0;
			let renderTop = currentWindow ? currentWindow.top : 0;

			let startCapture = (port: chrome.runtime.Port) => {
				let viewportHeight: number;
				let contentHeight: number;
				let captureCount = 0;
				let lastScrollY: number = -1;
				let lastScrollData: { scrollY: number; pageHeight: number };

				let cleaned = false;
				let cleanup = () => {
					if (cleaned) { return; }
					cleaned = true;
					this.activeRendererCleanup = () => { /* no-op */ };
					try { port.disconnect(); } catch (e) { /* ignore */ }
					WebExtension.browser.windows.remove(renderWindowId);
					chrome.storage.session.remove([
						"fullPageHtmlContent", "fullPageBaseUrl", "fullPageStatusText"
					]);
				};
				this.activeRendererCleanup = cleanup;

				// Handle renderer window being closed by user
				port.onDisconnect.addListener(() => {
					if (!cleaned) {
						cleanup();
						resolve({ success: false } as any);
					}
				});

				port.onMessage.addListener((message: any) => {
					if (message.action === "ready") {
						// Set zoom to 100% before loading content, then load
						let rendererTabId: number;
						try {
							WebExtension.browser.tabs.query({ windowId: renderWindowId }, (tabs: chrome.tabs.Tab[]) => {
								if (tabs && tabs.length > 0 && tabs[0].id) {
									rendererTabId = tabs[0].id;
									WebExtension.browser.tabs.setZoom(rendererTabId, 1, () => {
										port.postMessage({ action: "loadContent" });
									});
								} else {
									port.postMessage({ action: "loadContent" });
								}
							});
						} catch (e) {
							port.postMessage({ action: "loadContent" });
						}
					}

					if (message.action === "dimensions") {
						viewportHeight = message.viewportHeight;
						contentHeight = message.contentHeight;

						if (!viewportHeight) {
							cleanup();
							resolve([]);
							return;
						}

						// Initialize the renderer's stitch canvas
						port.postMessage({
							action: "initCanvas",
							viewportHeight: viewportHeight,
							contentHeight: contentHeight,
							pageHeight: message.pageHeight
						});

						port.postMessage({ action: "scroll", scrollTo: 0 });
					}

					if (message.action === "scrollResult") {
						lastScrollData = { scrollY: message.scrollY, pageHeight: message.pageHeight };
						setTimeout(() => {
							WebExtension.browser.tabs.captureVisibleTab(renderWindowId, { format: "png" }, (dataUrl: string) => {
								if (!dataUrl) {
									cleanup();
									resolve({ success: false } as any);
									return;
								}

								// Send capture to renderer for incremental stitching
								port.postMessage({
									action: "drawCapture",
									dataUrl: dataUrl,
									index: captureCount,
									scrollY: lastScrollData.scrollY,
									viewportHeight: viewportHeight
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
						let count = captureCount;
						cleanup();
						resolve({ success: true, count: count, format: "jpeg", cssWidth: renderWidth } as any);
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
					startCapture(port);
				} else {
					// Window.create callback hasn't fired yet, defer
					pendingPort = port;
				}
			};

			WebExtension.browser.runtime.onConnect.addListener(onConnect);

			// Create the renderer window. Must be focused so Chrome paints it
			// for captureVisibleTab. It auto-closes when capture completes.
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
					resolve([]);
					return;
				}
				renderWindowId = renderWindow.id;
				windowReady = true;

				// If port connected before window.create callback, start now
				if (pendingPort) {
					startCapture(pendingPort);
				}
			});
			}); // end getCurrent
		});
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
