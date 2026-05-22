import {ClientInfo} from "../clientInfo";
import {ClientType} from "../clientType";
import {Polyfills} from "../polyfills";
import {AuthType} from "../userInfo";
import {Settings} from "../settings";

import {SmartValue} from "../communicator/smartValue";

import {ClipperCachedHttp} from "../http/clipperCachedHttp";

import {LocalizationHelper} from "../localization/localizationHelper";

import * as Log from "../logging/log";
import {LogHelpers} from "../logging/logHelpers";
import {SessionLogger} from "../logging/sessionLogger";

import {ClipperData} from "../storage/clipperData";
import {ClipperStorageKeys} from "../storage/clipperStorageKeys";

import {AuthenticationHelper} from "./authenticationHelper";
import {ExtensionBase} from "./extensionBase";
import {InvokeInfo} from "./invokeInfo";
import {InvokeSource} from "./invokeSource";
import {InvokeMode, InvokeOptions} from "./invokeOptions";

/**
 * The abstract base class for all of the extension workers
 */
export abstract class ExtensionWorkerBase<TTab, TTabIdentifier> {
	private clipperFunnelAlreadyLogged = false;
	private keepAlive: number;

	protected consoleOutputEnabledFlagProcessed: Promise<void>;
	protected tab: TTab;
	protected tabId: TTabIdentifier;

	protected auth: AuthenticationHelper;
	protected clipperData: ClipperData;

	protected logger: SessionLogger;

	protected clientInfo: SmartValue<ClientInfo>;
	protected sessionId: SmartValue<string>;

	constructor(clientInfo: SmartValue<ClientInfo>, auth: AuthenticationHelper, clipperData: ClipperData) {
		Polyfills.init();

		this.sessionId = new SmartValue<string>();
		this.clipperData = clipperData;
		this.auth = auth;
		this.clientInfo = clientInfo;
		this.consoleOutputEnabledFlagProcessed = LogHelpers.isConsoleOutputEnabled().then(() => {
			this.logger = LogManager.createExtLogger(this.sessionId);
			this.logger.logSessionStart();
			this.clipperData.setLogger(this.logger);

			this.initializeContextProperties();
		});
	}

	private initializeContextProperties() {
		let clientInfo = this.clientInfo.get();
		this.logger.setContextProperty(Log.Context.Custom.AppInfoId, Settings.getSetting("App_Id"));
		this.logger.setContextProperty(Log.Context.Custom.ExtensionLifecycleId, ExtensionBase.getExtensionId());
		this.logger.setContextProperty(Log.Context.Custom.UserInfoId, undefined);
		this.logger.setContextProperty(Log.Context.Custom.AuthType, "None");
		this.logger.setContextProperty(Log.Context.Custom.AppInfoVersion, clientInfo.clipperVersion);
		this.logger.setContextProperty(Log.Context.Custom.DeviceInfoId, clientInfo.clipperId);
		this.logger.setContextProperty(Log.Context.Custom.ClipperType, ClientType[clientInfo.clipperType]);

		// Sometimes the worker is created really early (e.g., pageNav, inline extension), so we need to wait
		// for flighting info to be returned before we set the context property
		if (!clientInfo.flightingInfo) {
			let clientInfoSetCb = ((newClientInfo) => {
				if (newClientInfo.flightingInfo) {
					this.clientInfo.unsubscribe(clientInfoSetCb);
					this.logger.setContextProperty(Log.Context.Custom.FlightInfo, newClientInfo.flightingInfo.join(","));
				}
			}).bind(this);
			this.clientInfo.subscribe(clientInfoSetCb, { callOnSubscribe: false });
		} else {
			this.logger.setContextProperty(Log.Context.Custom.FlightInfo, clientInfo.flightingInfo.join(","));
		}
	}

	private setKeepAlive() {
		if (!!this.keepAlive) {
			clearInterval(this.keepAlive);
		}
		this.keepAlive = setInterval(chrome.runtime.getPlatformInfo, 25 * 1000);
		// After 10 minutes, allow the service worker to become inactive.
		setTimeout(() => {
			if (!!this.keepAlive) {
				clearInterval(this.keepAlive);
				this.keepAlive = undefined;
			}
		}, 10 * 60 * 1000);
	}

	/**
	 * Get the unique id associated with this worker's tab. The type is any type that allows us to distinguish
	 * between tabs, and is dependent on the browser itself.
	 */
	public getUniqueId(): TTabIdentifier {
		return this.tabId;
	}

	/**
	 * Get the url associated with this worker's tab
	 */
	public abstract getUrl(): string;

	/**
	 * Launches the sign in window, rejecting with an error object if something went wrong on the server during
	 * authentication. Otherwise, it resolves with true if the redirect endpoint was hit as a result of a successful
	 * sign in attempt, and false if it was not hit (e.g., user manually closed the popup)
	 */
	protected abstract doSignInAction(authType: AuthType): Promise<boolean>;

	/**
	 * Signs the user out
	 */
	protected abstract doSignOutAction(authType: AuthType);

	/**
	 * Notify the UI to invoke the clipper. Resolve with true if it was thought to be successfully
	 * injected; otherwise resolves with false. Also performs logging.
	 */
	protected abstract invokeClipperBrowserSpecific(): Promise<boolean>;

	/**
	 * Notify the UI to invoke the frontend script that handles logging to the conosle. Resolve with
	 * true if it was thought to be successfully injected; otherwise resolves with false.
	 */
	protected abstract invokeDebugLoggingBrowserSpecific(): Promise<boolean>;

	/**
	 * Returns true if the user has allowed our extension to access file:/// links. Edge does not have a function to
	 * check this as of 10/3/2016
	 */
	protected abstract isAllowedFileSchemeAccessBrowserSpecific(callback: (isAllowed: boolean) => void): void;

	/**
	 * Gets the visible tab's screenshot as an image url
	 */
	protected abstract takeTabScreenshot(): Promise<string>;

	/**
	 * Renders the given HTML in an offscreen context and captures full-page screenshots.
	 * Returns an array of data URL strings.
	 */
	protected abstract takeFullPageScreenshot(htmlContent: string): Promise<string[]>;

	/**
	 * Cancels an in-progress full-page screenshot capture.
	 */
	protected cancelFullPageScreenshot(): void {
		// Default no-op; overridden in WebExtensionWorker
	}

	/**
	 * Closes all active frames and notifies the UI to invoke the clipper.
	 */
	public closeAllFramesAndInvokeClipper(invokeInfo: InvokeInfo, options: InvokeOptions) {
		this.invokeClipper(invokeInfo, options);
	}

	public getLogger() {
		return this.logger;
	}

	/**
	 * Skeleton method that notifies the UI to invoke the Clipper. Also performs logging.
	 */
	public invokeClipper(invokeInfo: InvokeInfo, options: InvokeOptions) {
		this.setKeepAlive();

		Promise.all([this.consoleOutputEnabledFlagProcessed, this.invokeClipperBrowserSpecific()]).then(([v, wasInvoked]) => {
			if (wasInvoked && !this.clipperFunnelAlreadyLogged) {
				this.logger.logUserFunnel(Log.Funnel.Label.Invoke);
				this.clipperFunnelAlreadyLogged = true;
			}
			this.logClipperInvoke(invokeInfo, options || { invokeMode: InvokeMode.Default });
		});
	}

	/**
	 * Clean up anything related to the worker before it stops being used (aka the tab or window was closed)
	 */
	public destroy() {
		this.logger.logSessionEnd(Log.Session.EndTrigger.Unload);
	}

	/**
	 * Returns the current version of localized strings used in the UI.
	 */
	protected getLocalizedStrings(locale: string, callback?: Function) {
		this.logger.setContextProperty(Log.Context.Custom.BrowserLanguage, locale);

		this.clipperData.getValue(ClipperStorageKeys.locale).then((storedLocale) => {
			let localeInStorageIsDifferent = !storedLocale || storedLocale !== locale;

			let getLocaleEvent = new Log.Event.BaseEvent(Log.Event.Label.GetLocale);
			getLocaleEvent.setCustomProperty(Log.PropertyName.Custom.StoredLocaleDifferentThanRequested, localeInStorageIsDifferent);
			this.logger.logEvent(getLocaleEvent);

			let fetchStringDataFunction = () => { return LocalizationHelper.makeLocStringsFetchRequest(locale); };
			let updateInterval = localeInStorageIsDifferent ? 0 : ClipperCachedHttp.getDefaultExpiry();

			let getLocalizedStringsEvent = new Log.Event.PromiseEvent(Log.Event.Label.GetLocalizedStrings);
			getLocalizedStringsEvent.setCustomProperty(Log.PropertyName.Custom.ForceRetrieveFreshLocStrings, localeInStorageIsDifferent);
			this.clipperData.getFreshValue(ClipperStorageKeys.locStrings, fetchStringDataFunction, updateInterval).then((response) => {
				this.clipperData.setValue(ClipperStorageKeys.locale, locale);
				if (callback) {
					callback(response ? response.data : undefined);
				}
			}, (error: OneNoteApi.GenericError) => {
				getLocalizedStringsEvent.setStatus(Log.Status.Failed);
				getLocalizedStringsEvent.setFailureInfo(error);
				// Still proceed, as we have backup strings on the client
				if (callback) {
					callback(undefined);
				}
			}).then(() => {
				this.logger.logEvent(getLocalizedStringsEvent);
			});
		});
	}

	protected getLocalizedStringsForBrowser(callback: Function) {
		this.clipperData.getValue(ClipperStorageKeys.displayLanguageOverride).then((localeOverride) => {
			// navigator.userLanguage is only available in IE, and Typescript will not recognize this property
			let locale = localeOverride || navigator.language || (<any>navigator).userLanguage;
			this.getLocalizedStrings(locale, callback);
		});
	}

	protected getUserSessionIdQueryParamValue(): string {
		let usidQueryParamValue = this.logger.getUserSessionId();
		return usidQueryParamValue ? usidQueryParamValue : this.clientInfo.get().clipperId;
	}

	protected async invokeDebugLoggingIfEnabled(): Promise<boolean> {
		if (await LogHelpers.isConsoleOutputEnabled()) {
			return this.invokeDebugLoggingBrowserSpecific();
		}
		return Promise.resolve(false);
	}

	protected logClipperInvoke(invokeInfo: InvokeInfo, options: InvokeOptions) {
		let invokeClipperEvent = new Log.Event.BaseEvent(Log.Event.Label.InvokeClipper);
		invokeClipperEvent.setCustomProperty(Log.PropertyName.Custom.InvokeSource, InvokeSource[invokeInfo.invokeSource]);
		invokeClipperEvent.setCustomProperty(Log.PropertyName.Custom.InvokeMode, InvokeMode[options.invokeMode]);
		this.logger.logEvent(invokeClipperEvent);
	}
}
