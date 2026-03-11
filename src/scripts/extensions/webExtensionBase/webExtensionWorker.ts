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
import {InvokeOptions} from "../invokeOptions";
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
	private activeRendererWindowId: number;

	constructor(injectUrls: InjectUrls, tab: W3CTab, clientInfo: SmartValue<ClientInfo>, auth: AuthenticationHelper) {
		let messageHandlerThunk = () => { return new WebExtensionBackgroundMessageHandler(tab.id); };
		super(clientInfo, auth, new ClipperData(new LocalStorage()), messageHandlerThunk, messageHandlerThunk);

		this.injectUrls = injectUrls;
		this.tab = tab;
		this.tabId = tab.id;
		this.noOpTrackerInvoked = false;

		this.activeRendererCleanup = () => { /* no-op */ };
		this.activeRendererWindowId = 0;

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
	 * Override: open the renderer window directly instead of injecting clipperInject.ts.
	 * If a renderer window is already open, focus it.
	 */
	public closeAllFramesAndInvokeClipper(invokeInfo: InvokeInfo, options: InvokeOptions) {
		if (this.activeRendererWindowId) {
			WebExtension.browser.windows.update(this.activeRendererWindowId, { focused: true }, () => {
				if (WebExtension.browser.runtime.lastError) {
					this.activeRendererWindowId = 0;
				}
			});
			return;
		}
		this.openRendererWindow();
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

	private launchRenderer(signedIn: boolean) {
		let rendererUrl = WebExtension.browser.runtime.getURL("renderer.html");
		let renderWindowId: number;
		let pendingPort: chrome.runtime.Port;
		let windowReady = false;
		let contentCaptured = false;
		let activePort: chrome.runtime.Port;

		// Listener for contentCaptureInject.ts messages — stores page data in session storage
		let captureListener = (rawMsg: any, sender: any) => {
			if (!sender.tab || sender.tab.id !== this.tab.id) { return; }
			let msg: any;
			try { msg = typeof rawMsg === "string" ? JSON.parse(rawMsg) : rawMsg; } catch (e) { return; }
			if (msg.action !== "contentCaptureComplete") { return; }
			chrome.runtime.onMessage.removeListener(captureListener);

			let storageData: any = {
				fullPageHtmlContent: msg.html || "",
				fullPageBaseUrl: msg.baseUrl || "",
				fullPageTitle: msg.title || "",
				fullPageUrl: msg.url || "",
				fullPageStatusText: "Capturing page..."
			};
			chrome.storage.session.set(storageData, () => {
				contentCaptured = true;
				if (activePort) {
					activePort.postMessage({ action: "loadContent" });
				}
			});
		};

		// If signed in, inject content capture script immediately (runs in parallel with window opening)
		if (signedIn) {
			chrome.runtime.onMessage.addListener(captureListener);
			WebExtension.browser.scripting.executeScript({
				target: { tabId: this.tab.id },
				files: ["contentCaptureInject.js"]
			});
		}

		WebExtension.browser.windows.getCurrent((currentWindow: chrome.windows.Window) => {
		let sidebarWidth = 322;
		let contentWidth = Math.min(currentWindow && currentWindow.width ? currentWindow.width : 1280, 1280);
		let renderWidth = contentWidth + sidebarWidth;
		let renderHeight = currentWindow ? currentWindow.height : 768;
		let renderLeft = currentWindow ? currentWindow.left : 0;
		let renderTop = currentWindow ? currentWindow.top : 0;

		let setupPort = (port: chrome.runtime.Port) => {
			activePort = port;
			let viewportHeight: number;
			let captureContentHeight: number;
			let captureCount = 0;
			let lastScrollY: number = -1;
			let lastScrollData: { scrollY: number; pageHeight: number };

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
				// Clean up all session storage from this capture session
				chrome.storage.session.get(null, (all: any) => {
					let keys = Object.keys(all || {}).filter(function(k) {
						return k.indexOf("fullPage") === 0 || k.indexOf("regionImage") === 0;
					});
					if (keys.length > 0) { chrome.storage.session.remove(keys); }
				});
				try { chrome.runtime.onMessage.removeListener(captureListener); } catch (e) { /* ignore */ }
			};
			this.activeRendererCleanup = cleanup;

			// Handle renderer window being closed by user
			port.onDisconnect.addListener(() => {
				if (!cleaned) { cleanup(); }
			});

			port.onMessage.addListener((message: any) => {
				if (message.action === "ready") {
					// Set zoom to 100% before loading content
					try {
						WebExtension.browser.tabs.query({ windowId: renderWindowId }, (tabs: chrome.tabs.Tab[]) => {
							if (tabs && tabs.length > 0 && tabs[0].id) {
								WebExtension.browser.tabs.setZoom(tabs[0].id, 1, () => {
									// Only send loadContent if content capture already completed
									if (contentCaptured) {
										port.postMessage({ action: "loadContent" });
									}
								});
							} else if (contentCaptured) {
								port.postMessage({ action: "loadContent" });
							}
						});
					} catch (e) {
						if (contentCaptured) {
							port.postMessage({ action: "loadContent" });
						}
					}
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
									authType: updatedUser.user.authType || ""
								}
							});
							// Now inject content capture into original tab
							chrome.runtime.onMessage.addListener(captureListener);
							WebExtension.browser.scripting.executeScript({
								target: { tabId: this.tab.id },
								files: ["contentCaptureInject.js"]
							});
						} else {
							port.postMessage({ action: "signInResult", success: false, error: "Sign-in cancelled" });
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
					// Save to OneNote API from unified renderer window
					let saveMode = message.mode || "fullpage";
					let saveTitle = message.title || "";
					let saveAnnotation = message.annotation || "";
					let saveSectionId = message.sectionId || "";
					let saveUrl = message.url || "";

					// Ensure fresh token before save (matches old clipper.tsx ensureFreshUserBeforeClip)
					this.auth.updateUserInfoData(this.clientInfo.get().clipperId, UpdateReason.TokenRefreshForPendingClip).then(() => {
						// Get (now-fresh) access token from local storage via offscreen
						return this.clipperData.getValue("userInformation");
					}, () => {
						// Token refresh failed — try with cached token anyway
						return this.clipperData.getValue("userInformation");
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

							// Build OneNote page content based on mode
							let buildPage = (bodyOnml: string, imageParts: { name: string; blob: Blob; type: string }[]) => {
								let boundary = "OneNoteRendererBoundary" + Date.now();
								// UTC offset string — same format as OneNoteApi.OneNotePage.formUtcOffsetString
								let now = new Date();
								let offset = now.getTimezoneOffset();
								let offsetSign = offset >= 0 ? "-" : "+";
								offset = Math.abs(offset);
								let offsetHours = Math.floor(offset / 60).toString();
								let offsetMins = Math.round(offset % 60).toString();
								if (parseInt(offsetHours, 10) < 10) { offsetHours = "0" + offsetHours; }
								if (parseInt(offsetMins, 10) < 10) { offsetMins = "0" + offsetMins; }
								let createdTime = offsetSign + offsetHours + ":" + offsetMins;
								// Font styling matches OneNoteSaveableFactory.createPostProcessessedHtml
								let fontStyle = "font-size: 16px; font-family: Verdana;";
								let presentationHtml = "<!DOCTYPE html><html><head>"
									+ "<title>" + saveTitle.replace(/</g, "&lt;").replace(/>/g, "&gt;") + "</title>"
									+ "<meta name=\"created\" content=\"" + createdTime + " \">"
									+ "</head><body>";
								// Order matches OneNoteSaveableFactory: annotation → citation → content
								if (saveAnnotation) {
									let escaped = saveAnnotation.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
									presentationHtml += "<div style=\"" + fontStyle + "\">&quot;" + escaped + "&quot;</div>";
								}
								if (saveUrl && saveMode !== "bookmark") {
									presentationHtml += "<div style=\"" + fontStyle + "\">Clipped from: <a href=\"" + saveUrl + "\">" + saveUrl + "</a></div>";
								}
								presentationHtml += bodyOnml;
								presentationHtml += "</body></html>";

								// Build multipart body
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

								let correlationId = "ON-" + Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
								let requestDate = new Date().toISOString();

								fetch(apiUrl, {
									method: "POST",
									headers: {
										"Authorization": "Bearer " + accessToken,
										"Content-Type": "multipart/form-data; boundary=" + boundary,
										"X-CorrelationId": correlationId
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
									let debugInfo = "Network error: " + (err.message || "Unknown")
										+ "\nX-CorrelationId: " + correlationId
										+ "\nDate: " + requestDate;
									port.postMessage({ action: "saveResult", success: false, error: debugInfo });
								});
							};

							if (saveMode === "fullpage") {
								// Read JPEG from session storage
								chrome.storage.session.get(["fullPageFinalImage"], (imgStored: any) => {
									let dataUrl = imgStored && imgStored.fullPageFinalImage ? imgStored.fullPageFinalImage : "";
									if (dataUrl) {
										fetch(dataUrl).then((r) => r.blob()).then((blob) => {
											let imgName = "fullPageImage";
											let bodyOnml = "<p><img src=\"name:" + imgName + "\" width=\"" + contentWidth + "\" /></p>";
											buildPage(bodyOnml, [{ name: imgName, blob: blob, type: "image/jpeg" }]);
										});
									} else {
										port.postMessage({ action: "saveResult", success: false, error: "No screenshot data" });
									}
								});
							} else if (saveMode === "region") {
								// Read region images from separate session storage keys (avoids size limits)
								chrome.storage.session.get(["regionImageCount"], (countStored: any) => {
									let count = countStored && countStored.regionImageCount ? countStored.regionImageCount : 0;
									if (count === 0) {
										port.postMessage({ action: "saveResult", success: false, error: "No region data" });
										return;
									}
									let keys: string[] = [];
									for (let i = 0; i < count; i++) { keys.push("regionImage_" + i); }
									chrome.storage.session.get(keys, (imgStored: any) => {
										let images: string[] = [];
										for (let i = 0; i < count; i++) {
											if (imgStored["regionImage_" + i]) { images.push(imgStored["regionImage_" + i]); }
										}
										if (images.length === 0) {
											port.postMessage({ action: "saveResult", success: false, error: "No region data" });
											return;
										}
										Promise.all(images.map((dataUrl: string, idx: number) =>
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
									});
								});
							} else if (saveMode === "article") {
								let articleHtml = message.contentHtml || "";
								buildPage(articleHtml, []);
							} else if (saveMode === "bookmark") {
								let bookmarkHtml = message.contentHtml || "";
								buildPage(bookmarkHtml, []);
							} else {
								port.postMessage({ action: "saveResult", success: false, error: "Unsupported mode" });
							}
						});
				}

				if (message.action === "startRegion") {
					// Focus original tab, inject standalone overlay, listen for result
					let regionTabId = this.tab.id;
					let regionWindowId = 0;
					WebExtension.browser.tabs.get(regionTabId, (t: any) => {
						if (!t || !t.windowId) { return; }
						regionWindowId = t.windowId;
						WebExtension.browser.windows.update(regionWindowId, { focused: true }, () => {
							if (WebExtension.browser.runtime.lastError) { /* ignore */ }
							WebExtension.browser.scripting.executeScript({
								target: { tabId: regionTabId },
								files: ["regionOverlay.js"]
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
