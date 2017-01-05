import {ClientInfo} from "../../clientInfo";
import {ClientType} from "../../clientType";
import {Constants} from "../../constants";
import {ObjectUtils} from "../../objectUtils";
import {Settings} from "../../settings";

import {SmartValue} from "../../communicator/smartValue";

import {Localization} from "../../localization/localization";

import {Failure, LogDataPackage, LogMethods, NoOp, PropertyName, reportData, unknownValue} from "../log";

enum ErrorPropertyName {
	Error,
	StatusCode,
	Response,
	ResponseHeaders,
	Timeout
}

export interface FailureLogEventData {
	label: Failure.Label;
	properties: { failureType: Failure.Type, failureInfo: OneNoteApi.GenericError, stackTrace: string, failureId?: string };
	clientInfo?: SmartValue<ClientInfo>;
}

export interface NoOpLogEventData {
	label: NoOp.Label;
	channel: string;
	clientInfo: SmartValue<ClientInfo>;
	url: string;
}

export class ErrorUtils {
	public static toString(originalError: OneNoteApi.GenericError): string {
		if (!originalError) {
			return undefined;
		}

		let errorToObject: {} = {};
		errorToObject[ErrorPropertyName[ErrorPropertyName.Error].toLowerCase()] = originalError.error;

		let tryCastError: OneNoteApi.RequestError = <OneNoteApi.RequestError>originalError;
		if (tryCastError && tryCastError.statusCode !== undefined) {
			errorToObject[ErrorPropertyName[ErrorPropertyName.StatusCode].toLowerCase()] = tryCastError.statusCode;
			errorToObject[ErrorPropertyName[ErrorPropertyName.Response].toLowerCase()] = tryCastError.response;
			errorToObject[ErrorPropertyName[ErrorPropertyName.ResponseHeaders].toLowerCase()] = tryCastError.responseHeaders;
			if (tryCastError.timeout !== undefined) {
				errorToObject[ErrorPropertyName[ErrorPropertyName.Timeout].toLowerCase()] = tryCastError.timeout;
			}
		}

		return JSON.stringify(errorToObject);
	}

	public static clone(originalError: OneNoteApi.GenericError): OneNoteApi.GenericError | OneNoteApi.RequestError {
		if (!originalError) {
			return undefined;
		}

		let tryCastError: OneNoteApi.RequestError = <OneNoteApi.RequestError>originalError;
		if (tryCastError && tryCastError.statusCode !== undefined) {
			if (tryCastError.timeout !== undefined) {
				return { error: tryCastError.error, statusCode: tryCastError.statusCode, response: tryCastError.response, responseHeaders: tryCastError.responseHeaders, timeout: tryCastError.timeout };
			} else {
				return { error: tryCastError.error, statusCode: tryCastError.statusCode, response: tryCastError.response, responseHeaders: tryCastError.responseHeaders };
			}
		} else {
			return { error: originalError.error };
		}
	}

	/**
	 * Sends a request to the misc logging endpoint with relevant failure data as query parameters
	 */
	public static sendFailureLogRequest(data: FailureLogEventData): void {
		let propsObject: { [key: string]: string } = {};

		propsObject[Constants.Urls.QueryParams.failureType] = Failure.Type[data.properties.failureType];
		propsObject[Constants.Urls.QueryParams.failureInfo] = ErrorUtils.toString(data.properties.failureInfo);
		propsObject[Constants.Urls.QueryParams.stackTrace] = data.properties.stackTrace;

		if (!ObjectUtils.isNullOrUndefined(data.properties.failureId)) {
			propsObject[Constants.Urls.QueryParams.failureId] = data.properties.failureId;
		}

		let clientInfo: SmartValue<ClientInfo> = data.clientInfo as SmartValue<ClientInfo>;
		ErrorUtils.addDelayedSetValuesOnNoOp(propsObject, clientInfo);

		LogManager.sendMiscLogRequest({
			label: Failure.Label[data.label],
			category: Failure.category,
			properties: propsObject
		}, true);
	}

	public static handleCommunicatorError(channel: string, e: Error, clientInfo: SmartValue<ClientInfo>, message?: string) {
		let errorValue: string;
		if (message) {
			errorValue = JSON.stringify({ message: message, error: e.toString() });
		} else {
			errorValue = e.toString();
		}

		ErrorUtils.sendFailureLogRequest({
			label: Failure.Label.UnhandledExceptionThrown,
			properties: {
				failureType: Failure.Type.Unexpected,
				failureInfo: { error: errorValue },
				failureId: "Channel " + channel,
				stackTrace: Failure.getStackTrace(e)
			},
			clientInfo: clientInfo
		});
		throw e;
	}

	/*
	* Sends a request to the misc logging endpoint with noop-relevant data as query parameters
	*	and shows an alert if the relevant property is set.
	*/
	public static sendNoOpTrackerRequest(props: NoOpLogEventData, shouldShowAlert = false): void {
		let propsObject: { [key: string]: string } = {};

		propsObject[Constants.Urls.QueryParams.channel] = props.channel;
		propsObject[Constants.Urls.QueryParams.url] = encodeURIComponent(props.url);
		propsObject[Constants.Urls.QueryParams.timeoutInMs] = Constants.Settings.noOpTrackerTimeoutDuration.toString();

		let clientInfo: SmartValue<ClientInfo> = props.clientInfo as SmartValue<ClientInfo>;
		ErrorUtils.addDelayedSetValuesOnNoOp(propsObject, clientInfo);

		LogManager.sendMiscLogRequest({
			label: NoOp.Label[props.label],
			category: NoOp.category,
			properties: propsObject
		}, true);

		if (shouldShowAlert && window) {
			window.alert(Localization.getLocalizedString("WebClipper.Error.NoOpError"));
		}
	}

	/*
	* Returns a TimeOut that should be cleared, otherwise sends a request to onenote.com/count
	*	with relevant no-op tracking data
	*/
	public static setNoOpTrackerRequestTimeout(props: NoOpLogEventData, shouldShowAlert = false) {
		return setTimeout(() => {
			ErrorUtils.sendNoOpTrackerRequest(props, shouldShowAlert);
		}, Constants.Settings.noOpTrackerTimeoutDuration);
	}

	/**
	 * During a noop scenario, most properties are retrieved at the construction of the NoOpProperties
	 * object for setNoOpTrackerRequestTimeout. But some properties could benefit from waiting
	 * until after the noop timeout before we attempt to retrieve them (e.g., smart values).
	 * This is a helper function for adding these values to the props object on delay.
	 */
	private static addDelayedSetValuesOnNoOp(props: {[key: string]: string}, clientInfo?: SmartValue<ClientInfo>): void {
		if (clientInfo) {
			props[Constants.Urls.QueryParams.clientType] = ObjectUtils.isNullOrUndefined(clientInfo.get()) ? unknownValue : ClientType[clientInfo.get().clipperType];
			props[Constants.Urls.QueryParams.clipperVersion] = ObjectUtils.isNullOrUndefined(clientInfo.get()) ? unknownValue : clientInfo.get().clipperVersion;
			props[Constants.Urls.QueryParams.clipperId] = ObjectUtils.isNullOrUndefined(clientInfo.get()) ? unknownValue : clientInfo.get().clipperId;
		}
	}
}
