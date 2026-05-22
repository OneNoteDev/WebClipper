import {ClientInfo} from "../../clientInfo";

import {SmartValue} from "../../communicator/smartValue";

import {Failure} from "../log";
import { Logger } from "../logger";
import { OneNoteApi } from "../../oneNoteApi";

export module ErrorUtils {
	enum ErrorPropertyName {
		Error,
		StatusCode,
		Response,
		ResponseHeaders,
		Timeout
	}

	export function toString(originalError: OneNoteApi.GenericError): string {
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

	export function clone(originalError: OneNoteApi.GenericError): OneNoteApi.GenericError | OneNoteApi.RequestError {
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

	export interface FailureLogEventData {
		label: Failure.Label;
		properties: { failureType: Failure.Type, failureInfo: OneNoteApi.GenericError, stackTrace: string, failureId?: string };
		clientInfo?: SmartValue<ClientInfo>;
	}

	/**
	 * Logs a failure with relevant failure data
	 */
	export function sendFailureLogRequest(logger: Logger, data: FailureLogEventData): void {
		let failureInfoString = ErrorUtils.toString(data.properties.failureInfo);
		let callStack = data.properties.stackTrace;

		logger.logFailure(
			data.label,
			data.properties.failureType,
			{
				error: "failureInfo: " + failureInfoString + ", callStack: " + callStack,
			},
			data.properties.failureId
		);
	}
}
