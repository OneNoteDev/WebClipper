import {ClientInfo} from "../../clientInfo";
import {ClientType} from "../../clientType";
import {Constants} from "../../constants";
import {AuthType} from "../../userInfo";
import {Utils} from "../../utils";

import {Communicator} from "../../communicator/communicator";
import {SmartValue} from "../../communicator/smartValue";

import * as Log from "../../logging/log";

import {StorageBase} from "../../storage/storageBase";

import {ChangeLog} from "../../versioning/changeLog";

import {AuthenticationHelper} from "../authenticationHelper";
import {InvokeSource} from "../invokeSource";
import {ExtensionWorkerBase} from "../extensionWorkerBase";

import {SafariBackgroundMessageHandler} from "./safariMessageHandler";
import {SafariExtension} from "./safariExtension";

declare var safari;

export class SafariWorker extends ExtensionWorkerBase<SafariBrowserTab, SafariBrowserTab> {
	private noOpTrackerInvoked: boolean;

	constructor(tab: any, clientInfo: SmartValue<ClientInfo>, auth: AuthenticationHelper) {
		let messageHandlerThunk = () => { return new SafariBackgroundMessageHandler(tab); };
		super(clientInfo, auth, new StorageBase(), messageHandlerThunk, messageHandlerThunk);

		// The safari browser tab does not have an id so we use the object itself
		this.tab = tab;
		this.tabId = tab;
		this.noOpTrackerInvoked = false;

		this.logger.setContextProperty(Log.Context.Custom.InPrivateBrowsing, tab.private.toString());

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
		let signInUrl = Utils.generateSignInUrl(this.clientInfo.get().clipperId, usidQueryParamValue, AuthType[authType]);

		return this.launchSafariPopupAndWaitForClose(signInUrl, Constants.Urls.Authentication.authRedirectUrl);
	}

	/**
	 * Signs the user out
	 */
	protected doSignOutAction(authType: AuthType) {
		let usidQueryParamValue = this.getUserSessionIdQueryParamValue();
		let signOutUrl = Utils.generateSignOutUrl(this.clientInfo.get().clipperId, usidQueryParamValue, AuthType[authType]);

		// The signout doesn't work in an iframe in the Safari background page, so we need to launch a popup instead
		this.launchSafariPopupAndWaitForClose(signOutUrl, Constants.Urls.Authentication.authRedirectUrl);
	}

	/**
	 * Notify the UI to invoke the clipper. Resolve with true if it was thought to be successfully
	 * injected; otherwise resolves with false.
	 */
	protected invokeClipperBrowserSpecific(): Promise<boolean> {
		this.tab.page.dispatchMessage(Constants.FunctionKeys.invokeClipper, safari.extension.baseURI + "clipper.html");

		if (!this.noOpTrackerInvoked) {
			this.setUpNoOpTrackers(this.tab.url);
			this.noOpTrackerInvoked = true;
		}

		return Promise.resolve(true);
	}

	/**
	 * Notify the UI to invoke the frontend script that handles logging to the conosle. Resolve with
	 * true if it was thought to be successfully injected; otherwise resolves with false.
	 */
	protected invokeDebugLoggingBrowserSpecific(): Promise<boolean> {
		this.tab.page.dispatchMessage(Constants.FunctionKeys.invokeDebugLogging);
		return Promise.resolve(true);
	}

	protected invokePageNavBrowserSpecific(): Promise<boolean> {
		this.tab.page.dispatchMessage(Constants.FunctionKeys.invokePageNav, safari.extension.baseURI + "pageNav.html");
		return Promise.resolve(true);
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

	/**
	 * Gets the visible tab's screenshot as an image url
	 */
	protected takeTabScreenshot(): Promise<string> {
		return new Promise<string>((resolve) => {
			// Note: To work around a safari bug, this may be synchronous or asynchronous
			// See http://stackoverflow.com/questions/13765174/weird-behaviour-of-visiblecontentsasdataurl
			let imageUrl = safari.application.activeBrowserWindow.activeTab.visibleContentsAsDataURL();
			if (imageUrl) {
				resolve(imageUrl);
			} else {
				safari.application.activeBrowserWindow.activeTab.visibleContentsAsDataURL((imageUrl2) => {
					resolve(imageUrl2);
				});
			}
		});
	}

	private launchSafariPopupAndWaitForClose(url: string, autoCloseDestinationUrl: string): Promise<boolean> {
		return new Promise<boolean>((resolve, reject) => {
			let redirectOccurred = false;
			let newWindow = safari.application.openBrowserWindow();
			newWindow.activeTab.url = url;

			let errorObject;
			let redirectListener = (event) => {
				if (event && event.target && event.target.url && !event.target.url.toLowerCase().indexOf(autoCloseDestinationUrl)) {
					redirectOccurred = true;

					let error = Utils.getQueryValue(event.target.url, Constants.Urls.QueryParams.error);
					let errorDescription = Utils.getQueryValue(event.target.url, Constants.Urls.QueryParams.errorDescription);
					if (error || errorDescription) {
						errorObject = { error: error, errorDescription: errorDescription };
					}

					newWindow.removeEventListener(redirectListener);
					newWindow.close();
				}
			};
			newWindow.addEventListener("navigate", redirectListener);

			let closeListener = (event) => {
				errorObject ? reject(errorObject) : resolve(redirectOccurred);
				newWindow.removeEventListener(closeListener);
			};
			newWindow.addEventListener("close", closeListener);
		});
	}
}
