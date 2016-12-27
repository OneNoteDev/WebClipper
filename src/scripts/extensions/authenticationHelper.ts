import {SmartValue} from "../communicator/smartValue";

import * as Log from "../logging/log";
import {Logger} from "../logging/logger";

import {CachedHttp, TimeStampedData} from "../http/cachedHttp";
import {HttpWithRetries} from "../http/HttpWithRetries";

import {ClipperData} from "../storage/clipperData";
import {ClipperStorageKeys} from "../storage/clipperStorageKeys";

import {AuthType, UserInfo, UpdateReason} from "../userInfo";
import {Constants} from "../constants";
import {ObjectUtils} from "../objectUtils";
import {ResponsePackage} from "../responsePackage";
import {StringUtils} from "../stringUtils";
import {UserInfoData} from "../userInfo";
import {UrlUtils} from "../urlUtils";

declare var browser;

export class AuthenticationHelper {
	public user: SmartValue<UserInfo>;
	private logger: Logger;
	private clipperData: ClipperData;

	constructor(clipperData: ClipperData, logger: Logger) {
		this.user = new SmartValue<UserInfo>();
		this.logger = logger;
		this.clipperData = clipperData;
	}

	/**
	 * Updates the current user's information.
	 */
	public updateUserInfoData(clipperId: string, updateReason: UpdateReason): Promise<UserInfo> {
		return new Promise<UserInfo>((resolve) => {
			let updateInterval = 0;

			let storedUserInformation = this.clipperData.getValue(ClipperStorageKeys.userInformation);
			if (storedUserInformation) {
				let currentInfo: any;
				try {
					currentInfo = JSON.parse(storedUserInformation);
				} catch (e) {
					this.logger.logJsonParseUnexpected(storedUserInformation);
				}

				if (currentInfo && currentInfo.data && ObjectUtils.isNumeric(currentInfo.data.accessTokenExpiration)) {
					// Expiration is in seconds, not milliseconds. Give additional leniency to account for response time.
					updateInterval = Math.max((currentInfo.data.accessTokenExpiration * 1000) - 180000, 0);
				}
			}

			let getUserInformationFunction = () => {
				return new Promise<ResponsePackage<string>>((resolve2, reject2) => {
					this.getClipperInfoCookie(clipperId).then((cookie) => {
						this.retrieveUserInformation(clipperId, cookie).then((result) => {
							resolve2(result);
						}, (errorObject) => {
							reject2(errorObject);
						});
					});
				});
			};

			let getInfoEvent: Log.Event.PromiseEvent = new Log.Event.PromiseEvent(Log.Event.Label.GetExistingUserInformation);
			getInfoEvent.setCustomProperty(Log.PropertyName.Custom.UserInformationStored, !!storedUserInformation);
			this.clipperData.getFreshValue(ClipperStorageKeys.userInformation, getUserInformationFunction, updateInterval).then((response: TimeStampedData) => {
				let isValidUser = this.isValidUserInformationJsonString(response.data);
				getInfoEvent.setCustomProperty(Log.PropertyName.Custom.FreshUserInfoAvailable, isValidUser);

				let writeableCookies = this.isThirdPartyCookiesEnabled(response.data);
				getInfoEvent.setCustomProperty(Log.PropertyName.Custom.WriteableCookies, writeableCookies);

				if (isValidUser) {
					this.user.set({ user: response.data, lastUpdated: response.lastUpdated, updateReason: updateReason, writeableCookies: writeableCookies });
				} else {
					this.user.set({ updateReason: updateReason, writeableCookies: writeableCookies });
				}

				resolve(this.user.get());
			}, (error: OneNoteApi.GenericError) => {
				getInfoEvent.setStatus(Log.Status.Failed);
				getInfoEvent.setFailureInfo(error);
				this.user.set({ updateReason: updateReason });
				resolve(this.user.get());
			}).then(() => {
				this.logger.logEvent(getInfoEvent);
			});
		});
	}

	/**
	 * The call to get the user information relies on the proper cookies being passed along or things just don't work. Unfortunately,
	 * right now the Edge browser doesn't pass those cookies along properly, so we need to do a little work to make sure things are set
	 * correctly. This uses the WebExtension APIs to retrieve the needed cookie manually.
	 */
	public getClipperInfoCookie(clipperId: string): Promise<string> {
		return new Promise<string>((resolve) => {
			// This is to work around a bug in Edge where the cookies.get call doesn't return if the cookie isn't set and there is more
			// than one tab open.  Basically, we're giving it 3 seconds to return and then giving up.
			let getCookieTimeout = setTimeout(() => {
				resolve(undefined);
			}, 3000);

			if (navigator.userAgent.search(/edge/i) !== -1) {
				browser.cookies.get({ "url": Constants.Urls.serviceDomain, "name": Constants.Cookies.clipperInfo }, (cookie) => {
					clearTimeout(getCookieTimeout);
					resolve(cookie ? cookie.value : "");
				});
			} else {
				clearTimeout(getCookieTimeout);
				resolve(undefined);
			}
		});
	}

	/**
	 * Similar to getClipperInfoCookie(), The calls from the background process don't delete cookies as well, so we need a way to
	 * do it manually.  This method essentially forces the delete of the cookies we rely on for authentication.
	 */
	public deleteUserAuthenticationCookies(authType: AuthType): void {
		browser.cookies.remove({ "url": Constants.Urls.serviceDomain, "name": Constants.Cookies.clipperInfo });

		let authenticationDomain = Constants.Urls.msaDomain;
		if (authType === AuthType.OrgId) {
			authenticationDomain = Constants.Urls.orgIdDomain;
		}

		// This part is a little ugly. Because the call to sign out the user is also done in the background, it hits the same issue
		// where the needed cookies are not being passed along with the request. So, the user never really signs out. To work around
		// it we are basically manually deleting all of the cookies on the authentication domain. Yeah, it's ugly.
		browser.cookies.getAll({ "url": authenticationDomain }, (cookies) => {
			for (let i = 0; i < cookies.length; i++) {
				browser.cookies.remove({ "url": authenticationDomain + cookies[i].path, name: cookies[i].name });
			}
		});
	}

	/**
	 * Makes a call to the authentication proxy to retrieve the user's information.
	 */
	public retrieveUserInformation(clipperId: string, cookie: string = undefined): Promise<ResponsePackage<string>> {
		return new Promise<ResponsePackage<string>>((resolve, reject: (error: OneNoteApi.RequestError) => void) => {
			let userInfoUrl = UrlUtils.addUrlQueryValue(Constants.Urls.Authentication.userInformationUrl, Constants.Urls.QueryParams.clipperId, clipperId);
			let retrieveUserInformationEvent = new Log.Event.PromiseEvent(Log.Event.Label.RetrieveUserInformation);

			let correlationId = StringUtils.generateGuid();
			retrieveUserInformationEvent.setCustomProperty(Log.PropertyName.Custom.CorrelationId, correlationId);

			let headers = {};
			headers["Content-type"] = "application/x-www-form-urlencoded";
			headers[Constants.HeaderValues.correlationId] = correlationId;

			let postData = "";
			if (!ObjectUtils.isNullOrUndefined(cookie)) {
				// The data is encoded/decoded automatically, but because the '+' sign can also be interpreted as a space, we want to explicitly encode this one.
				postData = cookie.replace(/\+/g, "%2B");
			}

			HttpWithRetries.post(userInfoUrl, postData, headers).then((request: XMLHttpRequest) => {
				let response = request.response;

				resolve({ parsedResponse: response, request: request });
			}, (error: OneNoteApi.RequestError) => {
				retrieveUserInformationEvent.setStatus(Log.Status.Failed);
				retrieveUserInformationEvent.setFailureInfo(error);
				reject(error);
			}).then(() => {
				this.logger.logEvent(retrieveUserInformationEvent);
			});
		});
	}

	/**
	 * Determines whether or not the given string is valid JSON and has the required elements.
	 */
	public isValidUserInformationJsonString(userInfo: UserInfoData): boolean {
		if (userInfo && userInfo.accessToken && userInfo.accessTokenExpiration > 0 && userInfo.authType) {
			return true;
		}

		return false;
	}

	/**
	 * Determins whether or not the given string is valid JSON and has the flag which lets us know if cookies are enabled.
	 */
	public isThirdPartyCookiesEnabled(userInfo: UserInfoData): boolean {
		return userInfo.cookieInRequest;
	}
}
