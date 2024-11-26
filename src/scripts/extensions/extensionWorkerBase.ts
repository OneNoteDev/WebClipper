import {BrowserUtils} from "../browserUtils";
import {ClientInfo} from "../clientInfo";
import {ClientType} from "../clientType";
import {ClipperUrls} from "../clipperUrls";
import {Constants} from "../constants";
import {Polyfills} from "../polyfills";
import {AuthType, UserInfo, UpdateReason} from "../userInfo";
import {Settings} from "../settings";

import {TooltipProps} from "../clipperUI/tooltipProps";
import {TooltipType} from "../clipperUI/tooltipType";

import {Communicator} from "../communicator/communicator";
import {MessageHandler} from "../communicator/messageHandler";
import {SmartValue} from "../communicator/smartValue";

import {ClipperCachedHttp} from "../http/clipperCachedHttp";

import {LocalizationHelper} from "../localization/localizationHelper";

import * as Log from "../logging/log";
import {LogHelpers} from "../logging/logHelpers";
import {SessionLogger} from "../logging/sessionLogger";

import {ClipperData} from "../storage/clipperData";
import {ClipperStorageKeys} from "../storage/clipperStorageKeys";

import {ChangeLog} from "../versioning/changeLog";

import {AuthenticationHelper} from "./authenticationHelper";
import {ExtensionBase} from "./extensionBase";
import {InvokeInfo} from "./invokeInfo";
import {InvokeSource} from "./invokeSource";
import {InvokeMode, InvokeOptions} from "./invokeOptions";

/**
 * The abstract base class for all of the extension workers
 */
export abstract class ExtensionWorkerBase<TTab, TTabIdentifier> {
	private onUnloading: () => void;
	private loggerId: string;
	private clipperFunnelAlreadyLogged = false;

	protected tab: TTab;
	protected tabId: TTabIdentifier;

	protected auth: AuthenticationHelper;
	protected clipperData: ClipperData;

	protected uiCommunicator: Communicator;
	protected pageNavUiCommunicator: Communicator;
	protected debugLoggingInjectCommunicator: Communicator;
	protected injectCommunicator: Communicator;
	protected pageNavInjectCommunicator: Communicator;

	protected logger: SessionLogger;

	protected clientInfo: SmartValue<ClientInfo>;
	protected sessionId: SmartValue<string>;

	constructor(clientInfo: SmartValue<ClientInfo>, auth: AuthenticationHelper, clipperData: ClipperData, uiMessageHandlerThunk: () => MessageHandler, injectMessageHandlerThunk: () => MessageHandler) {
		Polyfills.init();

		this.onUnloading = () => { };

		this.uiCommunicator = new Communicator(uiMessageHandlerThunk(), Constants.CommunicationChannels.extensionAndUi);
		this.pageNavUiCommunicator = new Communicator(uiMessageHandlerThunk(), Constants.CommunicationChannels.extensionAndPageNavUi);
		this.debugLoggingInjectCommunicator = new Communicator(injectMessageHandlerThunk(), Constants.CommunicationChannels.debugLoggingInjectedAndExtension);
		this.injectCommunicator = new Communicator(injectMessageHandlerThunk(), Constants.CommunicationChannels.injectedAndExtension);
		this.pageNavInjectCommunicator = new Communicator(injectMessageHandlerThunk(), Constants.CommunicationChannels.pageNavInjectedAndExtension);

		this.sessionId = new SmartValue<string>();
		this.logger = LogManager.createExtLogger(this.sessionId, LogHelpers.isConsoleOutputEnabled() ? this.debugLoggingInjectCommunicator : undefined);
		this.logger.logSessionStart();

		this.clipperData = clipperData;
		this.clipperData.setLogger(this.logger);

		this.auth = auth;
		this.clientInfo = clientInfo;

		this.initializeCommunicators();
		this.initializeContextProperties();
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
	 * Notify the UI to invoke the What's New tooltip. Resolve with true if it was thought to be successfully
	 * injected; otherwise resolves with false.
	 */
	protected abstract invokeWhatsNewTooltipBrowserSpecific(newVersions: ChangeLog.Update[]): Promise<boolean>;

	/**
	 * Notify the UI to invoke a specific tooltip. Resolve with true if successfully injected, and false otherwise;
	 */
	protected abstract invokeTooltipBrowserSpecific(tooltipType: TooltipType): Promise<boolean>;

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
	 * Closes all active frames and notifies the UI to invoke the clipper.
	 */
	public closeAllFramesAndInvokeClipper(invokeInfo: InvokeInfo, options: InvokeOptions) {
		this.pageNavInjectCommunicator.callRemoteFunction(Constants.FunctionKeys.closePageNavTooltip);
		this.invokeClipper(invokeInfo, options);
	}

	public getLogger() {
		return this.logger;
	}

	/**
	 * Skeleton method that notifies the UI to invoke the Clipper. Also performs logging.
	 */
	public invokeClipper(invokeInfo: InvokeInfo, options: InvokeOptions) {
		// For safety, we enforce that the object we send is never undefined.
		let invokeOptionsToSend: InvokeOptions = {
			invokeDataForMode: options ? options.invokeDataForMode : undefined,
			invokeMode: options ? options.invokeMode : InvokeMode.Default
		};

		this.sendInvokeOptionsToInject(invokeOptionsToSend);

		this.isAllowedFileSchemeAccessBrowserSpecific((isAllowed) => {
			if (!isAllowed) {
				this.uiCommunicator.callRemoteFunction(Constants.FunctionKeys.extensionNotAllowedToAccessLocalFiles);
			}
		});

		this.invokeClipperBrowserSpecific().then((wasInvoked) => {
			if (wasInvoked && !this.clipperFunnelAlreadyLogged) {
				this.logger.logUserFunnel(Log.Funnel.Label.Invoke);
				this.clipperFunnelAlreadyLogged = true;
			}
			this.logClipperInvoke(invokeInfo, invokeOptionsToSend);
		});
	}

	/**
	 * Notify the UI to invoke the What's New experience. Resolve with true if it was thought to be successfully
	 * injected; otherwise resolves with false.
	 */
	public invokeWhatsNewTooltip(newVersions: ChangeLog.Update[]): Promise<boolean> {
		let invokeWhatsNewEvent = new Log.Event.PromiseEvent(Log.Event.Label.InvokeWhatsNew);

		return this.registerLocalizedStringsForPageNav().then((successful) => {
			if (successful) {
				this.registerWhatsNewCommunicatorFunctions(newVersions);
				return this.invokeWhatsNewTooltipBrowserSpecific(newVersions).then((wasInvoked) => {
					if (!wasInvoked) {
						invokeWhatsNewEvent.setStatus(Log.Status.Failed);
						invokeWhatsNewEvent.setFailureInfo({ error: "invoking the What's New experience failed" });
					}
					this.logger.logEvent(invokeWhatsNewEvent);
					return Promise.resolve(wasInvoked);
				});
			} else {
				invokeWhatsNewEvent.setStatus(Log.Status.Failed);
				invokeWhatsNewEvent.setFailureInfo({ error: "getLocalizedStringsForBrowser returned undefined/null" });
				this.logger.logEvent(invokeWhatsNewEvent);
				return Promise.resolve(false);
			}
		});
	}

	public invokeTooltip(tooltipType: TooltipType): Promise<boolean> {
		let tooltipInvokeEvent = new Log.Event.PromiseEvent(Log.Event.Label.InvokeTooltip);
		tooltipInvokeEvent.setCustomProperty(Log.PropertyName.Custom.TooltipType, TooltipType[tooltipType]);

		return this.registerLocalizedStringsForPageNav().then((successful) => {
			if (successful) {
				this.registerTooltipCommunicatorFunctions(tooltipType);
				return this.invokeTooltipBrowserSpecific(tooltipType).then((wasInvoked) => {
					this.logger.logEvent(tooltipInvokeEvent);
					return Promise.resolve(wasInvoked);
				});
			} else {
				tooltipInvokeEvent.setStatus(Log.Status.Failed);
				tooltipInvokeEvent.setFailureInfo({ error: "getLocalizedStringsForBrowser returned undefined/null" });
				this.logger.logEvent(tooltipInvokeEvent);
				return Promise.resolve(false);
			}
		});
	}

	/**
	 * Sets the hook method that will be called when this worker object goes away.
	 */
	public setOnUnloading(callback: () => void) {
		this.onUnloading = callback;
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
		this.clipperData.getValue(ClipperStorageKeys.displayLanguageOverride)
			.then((localeOverride) => {
				// navigator.userLanguage is only available in IE, and Typescript will not recognize this property
				let locale = localeOverride || navigator.language || (<any>navigator).userLanguage;
				this.getLocalizedStrings(locale, callback);
			});
	}

	protected getUserSessionIdQueryParamValue(): string {
		let usidQueryParamValue = this.logger.getUserSessionId();
		return usidQueryParamValue ? usidQueryParamValue : this.clientInfo.get().clipperId;
	}

	protected invokeDebugLoggingIfEnabled(): Promise<boolean> {
		if (LogHelpers.isConsoleOutputEnabled()) {
			return this.invokeDebugLoggingBrowserSpecific();
		}
		return Promise.resolve(false);
	}

	protected launchPopupAndWaitForClose(url: string): Promise<boolean> {
		return new Promise<boolean>((resolve, reject) => {
			let signInWindow: Window = BrowserUtils.openPopupWindow(url);

			let errorObject;
			let popupMessageHandler = (event: MessageEvent) => {
				if (event.source === signInWindow) {
					let dataAsJson: any;
					try {
						dataAsJson = JSON.parse(event.data);
					} catch (e) {
						this.logger.logJsonParseUnexpected(event.data);
					}

					if (dataAsJson && (dataAsJson[Constants.Urls.QueryParams.error] || dataAsJson[Constants.Urls.QueryParams.errorDescription])) {
						errorObject = {
							correlationId: dataAsJson[Constants.Urls.QueryParams.correlationId],
							error: dataAsJson[Constants.Urls.QueryParams.error],
							errorDescription: dataAsJson[Constants.Urls.QueryParams.errorDescription]
						};
					}
				}
			};
			window.addEventListener("message", popupMessageHandler);

			let timer = setInterval(() => {
				if (!signInWindow || signInWindow.closed) {
					clearInterval(timer);
					window.removeEventListener("message", popupMessageHandler);
					// We always resolve with true in the non-error case as we can't reliably detect redirects
					// on non-IE bookmarklets
					errorObject ? reject(errorObject) : resolve(true);
				}
			}, 100);
		});
	}

	protected logClipperInvoke(invokeInfo: InvokeInfo, options: InvokeOptions) {
		let invokeClipperEvent = new Log.Event.BaseEvent(Log.Event.Label.InvokeClipper);
		invokeClipperEvent.setCustomProperty(Log.PropertyName.Custom.InvokeSource, InvokeSource[invokeInfo.invokeSource]);
		invokeClipperEvent.setCustomProperty(Log.PropertyName.Custom.InvokeMode, InvokeMode[options.invokeMode]);
		this.logger.logEvent(invokeClipperEvent);
	}

	/**
	 * Registers the tooltip type that needs to appear in the Page Nav experience, as well as any props it needs
	 */
	protected registerTooltipToRenderInPageNav(tooltipType: TooltipType, tooltipProps?: any) {
		this.pageNavUiCommunicator.registerFunction(Constants.FunctionKeys.getTooltipToRenderInPageNav, () => {
			return Promise.resolve(tooltipType);
		});
		this.pageNavUiCommunicator.registerFunction(Constants.FunctionKeys.getPageNavTooltipProps, () => {
			return Promise.resolve(tooltipProps);
		});
	}

	/**
	 * Register communicator functions specific to the What's New experience
	 */
	protected registerWhatsNewCommunicatorFunctions(newVersions: ChangeLog.Update[]) {
		this.registerTooltipToRenderInPageNav(TooltipType.WhatsNew, {
			updates: newVersions
		} as TooltipProps.WhatsNew);
	}

	protected registerTooltipCommunicatorFunctions(tooltipType: TooltipType) {
		this.registerTooltipToRenderInPageNav(tooltipType);
	}

	protected sendInvokeOptionsToInject(options: InvokeOptions) {
		this.injectCommunicator.callRemoteFunction(Constants.FunctionKeys.setInvokeOptions, {
			param: options
		});
	}

	protected setUpNoOpTrackers(url: string) {
		// No-op tracker for communication with inject
		let injectNoOpTrackerTimeout = Log.ErrorUtils.setNoOpTrackerRequestTimeout({
			label: Log.NoOp.Label.InitializeCommunicator,
			channel: Constants.CommunicationChannels.injectedAndExtension,
			clientInfo: this.clientInfo,
			url: url
		}, true);

		this.injectCommunicator.callRemoteFunction(Constants.FunctionKeys.noOpTracker, {
			param: new Date().getTime(),
			callback: () => {
				clearTimeout(injectNoOpTrackerTimeout);
			}
		});

		// No-op tracker for communication with the UI
		let uiNoOpTrackerTimeout = Log.ErrorUtils.setNoOpTrackerRequestTimeout({
			label: Log.NoOp.Label.InitializeCommunicator,
			channel: Constants.CommunicationChannels.extensionAndUi,
			clientInfo: this.clientInfo,
			url: url
		}, true);

		this.uiCommunicator.callRemoteFunction(Constants.FunctionKeys.noOpTracker, {
			param: new Date().getTime(),
			callback: () => {
				clearTimeout(uiNoOpTrackerTimeout);
			}
		});
	}

	/**
	 * Signs the user out on in the frontend. TODO: this was implemented as an Edge workaround, and
	 * should be removed when they fix their iframes not properly loading in the background.
	 */
	private doSignOutActionInFrontEnd(authType: AuthType) {
		let usidQueryParamValue = this.getUserSessionIdQueryParamValue();
		let signOutUrl = ClipperUrls.generateSignOutUrl(this.clientInfo.get().clipperId, usidQueryParamValue, AuthType[authType]);
		this.uiCommunicator.callRemoteFunction(Constants.FunctionKeys.createHiddenIFrame, {
			param: signOutUrl
		});
	}

	private initializeCommunicators() {
		this.initializeDebugLoggingCommunicators();
		this.initializeClipperCommunicators();
		this.initializePageNavCommunicators();
	}

	private initializeClipperCommunicators() {
		this.initializeClipperUiCommunicator();
		this.initializeClipperInjectCommunicator();
	}

	private initializeClipperUiCommunicator() {
		this.uiCommunicator.broadcastAcrossCommunicator(this.auth.user, Constants.SmartValueKeys.user);
		this.uiCommunicator.broadcastAcrossCommunicator(this.clientInfo, Constants.SmartValueKeys.clientInfo);
		this.uiCommunicator.broadcastAcrossCommunicator(this.sessionId, Constants.SmartValueKeys.sessionId);

		this.uiCommunicator.registerFunction(Constants.FunctionKeys.clipperStrings, () => {
			return new Promise<string>((resolve) => {
				this.getLocalizedStringsForBrowser((dataResult: string) => {
					resolve(dataResult);
				});
			});
		});

		this.uiCommunicator.registerFunction(Constants.FunctionKeys.getStorageValue, (key: string) => {
			return new Promise<string>((resolve) => {
				let value = this.clipperData.getValue(key);
				resolve(value);
			});
		});

		this.uiCommunicator.registerFunction(Constants.FunctionKeys.getMultipleStorageValues, (keys: string[]) => {
			return new Promise<{ [key: string]: string }>(async (resolve) => {
				let values: { [key: string]: string } = {};
				for (let key of keys) {
					values[key] = await this.clipperData.getValue(key);
				}
				resolve(values);
			});
		});

		this.uiCommunicator.registerFunction(Constants.FunctionKeys.setStorageValue, (keyValuePair: { key: string, value: string }) => {
			this.clipperData.setValue(keyValuePair.key, keyValuePair.value);
		});

		this.uiCommunicator.registerFunction(Constants.FunctionKeys.getInitialUser, () => {
			return this.auth.updateUserInfoData(this.clientInfo.get().clipperId, UpdateReason.InitialRetrieval);
		});

		this.uiCommunicator.registerFunction(Constants.FunctionKeys.signInUser, (authType: AuthType) => {
			return this.doSignInAction(authType).then((redirectOccurred) => {
				// Recently, a change in sign-in flow broke our redirect detection, so now we give the benefit of the doubt
				// and always attempt to update userInfo regardless
				return this.auth.updateUserInfoData(this.clientInfo.get().clipperId, UpdateReason.SignInAttempt).then((updatedUser: UserInfo) => {
					// While redirect detection is somewhat unreliable, it's still sometimes correct. So we try and
					// detect this case only after we try get the latest userInfo
					if ((!updatedUser || !updatedUser.user) && !redirectOccurred) {
						let userInfoToSet: UserInfo = { updateReason: UpdateReason.SignInCancel };
						this.auth.user.set(userInfoToSet);
						return Promise.resolve(userInfoToSet);
					}
					return Promise.resolve(updatedUser);
				});
			}).catch((errorObject) => {
				// Set the user info object to undefined as a result of an attempted sign in
				this.auth.user.set({ updateReason: UpdateReason.SignInAttempt });

				// Right now we're adding the update reason to the errorObject as well so that it is preserved in the callback.
				// The right thing to do is revise the way we use callbacks in the communicator and instead use Promises so that
				// we are able to return distinct objects.
				errorObject.updateReason = UpdateReason.SignInAttempt;
				return Promise.reject(errorObject);
			});
		});

		this.uiCommunicator.registerFunction(Constants.FunctionKeys.signOutUser, (authType: AuthType) => {
			if (this.clientInfo.get().clipperType === ClientType.EdgeExtension) {
				this.doSignOutActionInFrontEnd(authType);
			} else {
				this.doSignOutAction(authType);
			}

			this.auth.user.set({ updateReason: UpdateReason.SignOutAction });
			this.clipperData.setValue(ClipperStorageKeys.userInformation, undefined);
			this.clipperData.setValue(ClipperStorageKeys.currentSelectedSection, undefined);
			this.clipperData.setValue(ClipperStorageKeys.cachedNotebooks, undefined);
		});

		this.uiCommunicator.registerFunction(Constants.FunctionKeys.telemetry, (data: Log.LogDataPackage) => {
			Log.parseAndLogDataPackage(data, this.logger);
		});

		this.uiCommunicator.registerFunction(Constants.FunctionKeys.ensureFreshUserBeforeClip, () => {
			return this.auth.updateUserInfoData(this.clientInfo.get().clipperId, UpdateReason.TokenRefreshForPendingClip);
		});

		this.uiCommunicator.registerFunction(Constants.FunctionKeys.takeTabScreenshot, () => {
			return this.takeTabScreenshot();
		});

		this.uiCommunicator.setErrorHandler((e: Error) => {
			Log.ErrorUtils.handleCommunicatorError(Constants.CommunicationChannels.extensionAndUi, e, this.clientInfo);
		});
	}

	private initializeClipperInjectCommunicator() {
		this.injectCommunicator.broadcastAcrossCommunicator(this.clientInfo, Constants.SmartValueKeys.clientInfo);

		this.injectCommunicator.registerFunction(Constants.FunctionKeys.unloadHandler, () => {
			this.tearDownCommunicators();
			this.onUnloading();
		});

		this.injectCommunicator.registerFunction(Constants.FunctionKeys.setStorageValue, (keyValuePair: { key: string, value: string }) => {
			this.clipperData.setValue(keyValuePair.key, keyValuePair.value);
		});

		this.injectCommunicator.setErrorHandler((e: Error) => {
			Log.ErrorUtils.handleCommunicatorError(Constants.CommunicationChannels.injectedAndExtension, e, this.clientInfo);
		});
	}

	private initializeDebugLoggingCommunicators() {
		this.debugLoggingInjectCommunicator.registerFunction(Constants.FunctionKeys.unloadHandler, () => {
			this.tearDownCommunicators();
			this.onUnloading();
		});
	}

	private initializePageNavCommunicators() {
		this.initializePageNavUiCommunicator();
		this.initializePageNavInjectCommunicator();
	}

	private initializePageNavUiCommunicator() {
		this.pageNavUiCommunicator.registerFunction(Constants.FunctionKeys.telemetry, (data: Log.LogDataPackage) => {
			Log.parseAndLogDataPackage(data, this.logger);
		});

		this.pageNavUiCommunicator.registerFunction(Constants.FunctionKeys.invokeClipperFromPageNav, (invokeSource: InvokeSource) => {
			this.closeAllFramesAndInvokeClipper({ invokeSource: invokeSource }, { invokeMode: InvokeMode.Default });
		});
	}

	private initializePageNavInjectCommunicator() {
		this.pageNavInjectCommunicator.registerFunction(Constants.FunctionKeys.telemetry, (data: Log.LogDataPackage) => {
			Log.parseAndLogDataPackage(data, this.logger);
		});
		this.pageNavInjectCommunicator.registerFunction(Constants.FunctionKeys.unloadHandler, () => {
			this.tearDownCommunicators();
			this.onUnloading();
		});
	}

	/**
	 * Fetches fresh localized strings and prepares a remote function for the Page Nav UI to fetch them.
	 * Resolves with true if successful; false otherwise.
	 */
	private registerLocalizedStringsForPageNav(): Promise<boolean> {
		return new Promise<boolean>((resolve) => {
			this.getLocalizedStringsForBrowser((localizedStrings) => {
				if (localizedStrings) {
					this.pageNavUiCommunicator.registerFunction(Constants.FunctionKeys.clipperStringsFrontLoaded, () => {
						return Promise.resolve(localizedStrings);
					});
				}
				resolve(!!localizedStrings);
			});
		});
	}

	private tearDownCommunicators() {
		this.uiCommunicator.tearDown();
		this.pageNavUiCommunicator.tearDown();
		this.injectCommunicator.tearDown();
		this.pageNavInjectCommunicator.tearDown();
	}
}
