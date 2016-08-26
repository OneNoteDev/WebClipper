/// <reference path="../../../node_modules/onenoteapi/target/oneNoteApi.d.ts" />

import {SmartValue} from "../communicator/smartValue";

import * as Log from "../logging/log";
import {Logger} from "../logging/logger";

import {Constants} from "../constants";
import {ResponsePackage} from "../responsePackage";
import {UserInfoData} from "../userInfo";
import {AuthType, UserInfo, UpdateReason} from "../userInfo";
import {Utils} from "../utils";

import {StorageBase, TimeStampedData} from "./storageBase";

declare var browser;

export class AuthenticationHelper {
	public user: SmartValue<UserInfo>;
	private logger: Logger;
	private storage: StorageBase;

	constructor(storage: StorageBase, logger: Logger) {
		this.user = new SmartValue<UserInfo>();
		this.logger = logger;
		this.storage = storage;
	}

	/**
	 * Updates the current user's information.
	 */
	public updateUserInfoData(clipperId: string, updateReason: UpdateReason): Promise<UserInfo> {
		return new Promise<UserInfo>((resolve) => {
			let updateInterval = 0;

			let storedUserInformation = this.storage.getValue(Constants.StorageKeys.userInformation);
			if (storedUserInformation) {
				let currentInfo: any;
				try {
					currentInfo = JSON.parse(storedUserInformation);
				} catch (e) {
					this.logger.logJsonParseUnexpected(storedUserInformation);
				}

				if (currentInfo && currentInfo.data && Utils.isNumeric(currentInfo.data.accessTokenExpiration)) {
					// Expiration is in seconds, not milliseconds. Give additional leniency to account for response time.
					updateInterval = Math.max((currentInfo.data.accessTokenExpiration * 1000) - 180000, 0);
				}
			}

			let getUserInformationFunction = () => {
				return new Promise<ResponsePackage<string>>((resolve2, reject2) => {
					AuthenticationHelper.getClipperInfoCookie(clipperId).then((cookie) => {
						AuthenticationHelper.retrieveUserInformation(clipperId, cookie).then((result) => {
							resolve2(result);
						}, (errorObject) => {
							reject2(errorObject);
						});
					});
				});
			};

			let getInfoEvent: Log.Event.PromiseEvent = new Log.Event.PromiseEvent(Log.Event.Label.GetExistingUserInformation);
			getInfoEvent.setCustomProperty(Log.PropertyName.Custom.UserInformationStored, !!storedUserInformation);
			this.storage.getFreshValue(Constants.StorageKeys.userInformation, getUserInformationFunction, updateInterval).then((response: TimeStampedData) => {
				getInfoEvent.setCustomProperty(Log.PropertyName.Custom.FreshUserInfoAvailable, !!response);

				if (response) {
					this.user.set({ user: response.data, lastUpdated: response.lastUpdated, updateReason: updateReason });
				} else {
					this.user.set({ updateReason: updateReason });
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
	public static getClipperInfoCookie(clipperId: string): Promise<string> {
		return new Promise<string>((resolve) => {
			// This is to work around a bug in Edge where the cookies.get call doesn't return if the cookie isn't set and there is more
			// than one tab open.  Basically, we're giving it 3 seconds to return and then giving up.
			let getCookieTimeout  = setTimeout(() => {
				resolve(undefined);
			}, 3000);

			if (navigator.userAgent.search(/edge/i) !== -1) {
				browser.cookies.get({ "url": Constants.Urls.serviceDomain, "name": Constants.Cookies.clipperInfo }, (cookie) => {
					clearTimeout(getCookieTimeout);
					resolve(cookie ? cookie.value : "");
				});
			} else {
				resolve(undefined);
			}
		});
	}

	/**
	 * Similar to getClipperInfoCookie(), The calls from the background process don't delete cookies as well, so we need a way to
	 * do it manually.  This method essentially forces the delete of the cookies we rely on for authentication.
	 */
	public static deleteUserAuthenticationCookies(authType: AuthType): void {
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
	public static retrieveUserInformation(clipperId: string, cookie: string = undefined): Promise<ResponsePackage<string>> {
		return new Promise<ResponsePackage<string>>((resolve, reject: (error: OneNoteApi.RequestError) => void) => {
			let userInfoUrl = Utils.addUrlQueryValue(Constants.Urls.Authentication.userInformationUrl, Constants.Urls.QueryParams.clipperId, clipperId);

			let request = new XMLHttpRequest();
			request.open("POST", userInfoUrl);

			request.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
			request.timeout = 30000;

			request.onload = () => {
				if (request.status === 200) {
					let response = request.response;
					// The false case is expected behavior if the user has not signed in or credentials have expired
					resolve({ parsedResponse: this.isValidUserInformationJsonString(response) ? response : undefined, request: request });
				} else {
					reject(OneNoteApi.ErrorUtils.createRequestErrorObject(request, OneNoteApi.RequestErrorType.UNEXPECTED_RESPONSE_STATUS));
				}
			};
			request.ontimeout = () => {
				reject(OneNoteApi.ErrorUtils.createRequestErrorObject(request, OneNoteApi.RequestErrorType.REQUEST_TIMED_OUT));
			};
			request.onerror = () => {
				reject(OneNoteApi.ErrorUtils.createRequestErrorObject(request, OneNoteApi.RequestErrorType.NETWORK_ERROR));
			};

			let postData = "";
			if (!Utils.isNullOrUndefined(cookie)) {
				// The data is encoded/decoded automatically, but because the '+' sign can also be interpreted as a space, we want to explicitly encode this one.
				postData = cookie.replace(/\+/g, "%2B");
			}

			request.send(postData);
		});
	}

	/**
	 * Determines whether or not the given string is valid JSON and has the required elements.
	 */
	public static isValidUserInformationJsonString(userInfo: string): boolean {
		let userInfoJson: UserInfoData;
		try {
			userInfoJson = JSON.parse(userInfo);
		} catch (e) {
			// intentionally not logging this as a JsonParse failure
			return false;
		}

		if (userInfoJson && userInfoJson.accessToken && userInfoJson.accessTokenExpiration > 0 && userInfoJson.authType) {
			return true;
		}

		return false;
	}
}
