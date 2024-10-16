import {SmartValue} from "../communicator/smartValue";

import * as Log from "../logging/log";
import {Logger} from "../logging/logger";

import {CachedHttp, TimeStampedData} from "../http/cachedHttp";
import {HttpWithRetries} from "../http/httpWithRetries";

import {ClipperData} from "../storage/clipperData";
import {ClipperStorageKeys} from "../storage/clipperStorageKeys";

import {UserInfo, UpdateReason} from "../userInfo";
import {Constants} from "../constants";
import {ObjectUtils} from "../objectUtils";
import {ResponsePackage} from "../responsePackage";
import {StringUtils} from "../stringUtils";
import {UserInfoData} from "../userInfo";
import { UrlUtils } from "../urlUtils";
import { UserDataBoundaryHelper } from "./userDataBoundaryHelper";
import { DataBoundary } from "./dataBoundary";

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
				return this.retrieveUserInformation(clipperId, undefined);
			};

			let getInfoEvent: Log.Event.PromiseEvent = new Log.Event.PromiseEvent(Log.Event.Label.GetExistingUserInformation);
			getInfoEvent.setCustomProperty(Log.PropertyName.Custom.UserInformationStored, !!storedUserInformation);
			this.clipperData.getFreshValue(ClipperStorageKeys.userInformation, getUserInformationFunction, updateInterval).then(async (response: TimeStampedData) => {
				let isValidUser = this.isValidUserInformation(response.data);
				getInfoEvent.setCustomProperty(Log.PropertyName.Custom.FreshUserInfoAvailable, isValidUser);

				let writeableCookies = this.isThirdPartyCookiesEnabled(response.data);
				getInfoEvent.setCustomProperty(Log.PropertyName.Custom.WriteableCookies, writeableCookies);

				getInfoEvent.setCustomProperty(Log.PropertyName.Custom.UserUpdateReason, UpdateReason[updateReason]);

				if (isValidUser) {
					const dataBoundaryHelper = new UserDataBoundaryHelper();
					let userDataBoundary: string = await dataBoundaryHelper.getUserDataBoundary(response.data);
					// The default logging has been configured to EU Pipeline. Once we find the
					// userdataboundary and if it is different from EUDB , reinit the logger with WW Pipeline
					if (userDataBoundary === DataBoundary[DataBoundary.GLOBAL] || userDataBoundary === DataBoundary[DataBoundary.PUBLIC]) {
						LogManager.reInitLoggerForDataBoundaryChange(userDataBoundary);
					}
					getInfoEvent.setCustomProperty(Log.PropertyName.Custom.DataBoundary, userDataBoundary);
					response.data.dataBoundary = userDataBoundary;
					this.user.set({ user: response.data, lastUpdated: response.lastUpdated, updateReason: updateReason, writeableCookies: writeableCookies });
				} else {
					this.user.set({ updateReason: updateReason, writeableCookies: writeableCookies });
				}

			}, (error: OneNoteApi.GenericError) => {
				getInfoEvent.setStatus(Log.Status.Failed);
				getInfoEvent.setFailureInfo(error);
				this.user.set({ updateReason: updateReason });
			}).then(() => {
				this.logger.logEvent(getInfoEvent);

				resolve(this.user.get());
			});
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

			HttpWithRetries.post(userInfoUrl, postData, headers).then((response: Response) => {
				response.text().then((responseText: string) => {
					resolve({ parsedResponse: responseText, response: response });
				});
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
	protected isValidUserInformation(userInfo: UserInfoData): boolean {
		if (userInfo && userInfo.accessToken && userInfo.accessTokenExpiration > 0 && userInfo.authType) {
			return true;
		}

		return false;
	}

	/**
	 * Determines whether or not the given string is valid JSON and has the flag which lets us know if cookies are enabled.
	 */
	protected isThirdPartyCookiesEnabled(userInfo: UserInfoData): boolean {
		// Note that we are returning true by default to ensure the N-1 scenario.
		return userInfo.cookieInRequest !== undefined ? userInfo.cookieInRequest : true;
	}
}
