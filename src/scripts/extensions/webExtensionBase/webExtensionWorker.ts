import {AuthType} from "../../userInfo";
import {BrowserUtils} from "../../browserUtils";
import {ClientInfo} from "../../clientInfo";
import {ClientType} from "../../clientType";
import {ClipperUrls} from "../../clipperUrls";
import {Constants} from "../../constants";
import {UrlUtils} from "../../urlUtils";

import {Communicator} from "../../communicator/communicator";
import {SmartValue} from "../../communicator/smartValue";

import {Localization} from "../../localization/localization";

import * as Log from "../../logging/log";

import {ClipperData} from "../../storage/clipperData";
import {LocalStorage} from "../../storage/LocalStorage";

import {ChangeLog} from "../../versioning/changeLog";

import {AuthenticationHelper} from "../authenticationHelper";
import {ExtensionWorkerBase} from "../extensionWorkerBase";
import {InjectHelper} from "../injectHelper";
import {InvokeSource} from "../invokeSource";

import {InjectUrls} from "./injectUrls";
import {WebExtension} from "./webExtension";
import {WebExtensionBackgroundMessageHandler} from "./webExtensionMessageHandler";

type Tab = chrome.tabs.Tab;
type TabRemoveInfo = chrome.tabs.TabRemoveInfo;
type WebResponseCacheDetails = chrome.webRequest.WebResponseCacheDetails;
type Window = chrome.windows.Window;

export class WebExtensionWorker extends ExtensionWorkerBase<W3CTab, number> {
	private injectUrls: InjectUrls;
	private noOpTrackerInvoked: boolean;

	constructor(injectUrls: InjectUrls, tab: W3CTab, clientInfo: SmartValue<ClientInfo>, auth: AuthenticationHelper) {
		let messageHandlerThunk = () => { return new WebExtensionBackgroundMessageHandler(tab.id); };
		super(clientInfo, auth, new ClipperData(new LocalStorage()), messageHandlerThunk, messageHandlerThunk);

		this.injectUrls = injectUrls;
		this.tab = tab;
		this.tabId = tab.id;
		this.noOpTrackerInvoked = false;

		let isPrivateWindow: Boolean = !!tab.incognito || !!tab.inPrivate;
		this.logger.setContextProperty(Log.Context.Custom.InPrivateBrowsing, isPrivateWindow.toString());

		this.invokeDebugLoggingIfEnabled();
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
		BrowserUtils.appendHiddenIframeToDocument(signOutUrl);
	}

	/**
	 * Notify the UI to invoke the clipper. Resolve with true if it was thought to be successfully
	 * injected; otherwise resolves with false.
	 */
	protected invokeClipperBrowserSpecific(): Promise<boolean> {
		return new Promise<boolean>((resolve) => {
			WebExtension.browser.tabs.executeScript(this.tab.id, {
				code: 'var frameUrl = "' + WebExtension.browser.extension.getURL("clipper.html") + '";'
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

					// In Firefox, alert() is not callable from the background, so it looks like we have to no-op here
					if (this.clientInfo.get().clipperType !== ClientType.FirefoxExtension) {
						InjectHelper.alertUserOfUnclippablePage();
					}
					resolve(false);
				} else {
					if (this.clientInfo.get().clipperType === ClientType.FirefoxExtension) {
						WebExtension.browser.management.uninstallSelf();
					} else {
						WebExtension.browser.tabs.executeScript(this.tab.id, { file: this.injectUrls.webClipperInjectUrl });

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
			WebExtension.browser.tabs.executeScript(this.tab.id, { file: this.injectUrls.debugLoggingInjectUrl }, () => {
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
			WebExtension.browser.tabs.executeScript(this.tab.id, {
				code: 'var frameUrl = "' + WebExtension.browser.extension.getURL("pageNav.html") + '";'
			}, () => {
				// It's safest to not use lastError in the resolve due to special behavior in the Chrome API
				if (WebExtension.browser.runtime.lastError) {
					// We are probably on a page like about:blank, which is pretty normal
					resolve(false);
				} else {
					WebExtension.browser.tabs.executeScript(this.tab.id, { file: this.injectUrls.pageNavInjectUrl });
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

	private launchWebExtensionPopupAndWaitForClose(url: string, autoCloseDestinationUrl: string): Promise<boolean> {
		return new Promise<boolean>((resolve, reject) => {
			let popupWidth = 1000;
			let popupHeight = 700;
			let leftPosition: number = (screen && screen.width) ? Math.round((screen.width - popupWidth) / 2) : 0;
			let topPosition: number = (screen && screen.height) ? Math.round((screen.height - popupHeight) / 2) : 0;

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
	}
}
