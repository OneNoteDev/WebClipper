import {Constants} from "../constants";
import {Utils} from "../utils";

import {Localization} from "../localization/localization";

import * as Log from "../logging/log";

import {Clipper} from "./frontEndGlobals";

export module OneNoteApiUtils {
	export module Limits {
		export var imagesPerRequestLimit = 30;
	}

	export function logOneNoteApiRequestError(event: Log.Event.PromiseEvent, error: OneNoteApi.RequestError) {
		if (!event || !error) {
			return;
		}

		event.setCustomProperty(Log.PropertyName.Custom.CorrelationId, error.responseHeaders[Constants.HeaderValues.correlationId]);
		event.setStatus(Log.Status.Failed);
		event.setFailureInfo(error);

		let apiResponseCode: string = getApiResponseCode(error);
		if (!apiResponseCode) {
			return;
		}

		let responseCodeInfo = getResponseCodeInformation(apiResponseCode);
		if (!responseCodeInfo) {
			Clipper.logger.logFailure(Log.Failure.Label.UnhandledApiCode, Log.Failure.Type.Unexpected,
				undefined, apiResponseCode);
		}

		if (OneNoteApiUtils.isExpected(apiResponseCode)) {
			event.setFailureType(Log.Failure.Type.Expected);
		}

		event.setCustomProperty(Log.PropertyName.Custom.IsRetryable, OneNoteApiUtils.isRetryable(apiResponseCode));
	}

	export function getApiResponseCode(error: OneNoteApi.RequestError): string {
		if (!error || !error.response) {
			return;
		}

		let responseAsJson: any;
		try {
			responseAsJson = JSON.parse(error.response);
		} catch (e) {
			Clipper.logger.logJsonParseUnexpected(error.response);
		}

		let apiResponseCode: string;
		if (responseAsJson && responseAsJson.error && responseAsJson.error.code) {
			apiResponseCode = responseAsJson.error.code;
		}

		return apiResponseCode ? apiResponseCode : undefined;
	}

	export function getLocalizedErrorMessage(apiResponseCode: string): string {
		let responseCodeInfo = getResponseCodeInformation(apiResponseCode);
		return responseCodeInfo ? responseCodeInfo.message : Localization.getLocalizedString("WebClipper.Error.GenericError");
	}

	export function isExpected(apiResponseCode: string): boolean {
		let responseCodeInfo = getResponseCodeInformation(apiResponseCode);
		return responseCodeInfo ? responseCodeInfo.isExpected : false;
	}

	export function isRetryable(apiResponseCode: string): boolean {
		let responseCodeInfo = getResponseCodeInformation(apiResponseCode);
		return responseCodeInfo ? responseCodeInfo.isRetryable : false;
	}

	function getResponseCodeInformation(apiResponseCode: string): { message: string, isRetryable: boolean, isExpected: boolean } {
		let handledExtendedResponseCodes = {
			"10001": { message: Localization.getLocalizedString("WebClipper.Error.GenericError"), isRetryable: true, isExpected: true }, // UnexpectedServerError
			"10002": { message: Localization.getLocalizedString("WebClipper.Error.GenericError"), isRetryable: true, isExpected: true }, // ServiceUnavailable
			"10004": { message: Localization.getLocalizedString("WebClipper.Error.PasswordProtected"), isRetryable: false, isExpected: true }, // PasswordProtectedSection
			"10006": { message: Localization.getLocalizedString("WebClipper.Error.CorruptedSection"), isRetryable: false, isExpected: true }, // CorruptedSection
			"10007": { message: Localization.getLocalizedString("WebClipper.Error.GenericError"), isRetryable: true, isExpected: true }, // ServerTooBusy
			"10008": { message: Localization.getLocalizedString("WebClipper.SectionPicker.NotebookLoadUnretryableFailureMessage"), isRetryable: false, isExpected: true }, // SharepointQueryThrottled
			"19999": { message: Localization.getLocalizedString("WebClipper.Error.GenericError"), isRetryable: true, isExpected: false }, // GenericError
			"20102": { message: Localization.getLocalizedString("WebClipper.Error.ResourceDoesNotExist"), isRetryable: false, isExpected: true }, // ResourceDoesNotExist
			"30101": { message: Localization.getLocalizedString("WebClipper.Error.QuotaExceeded"), isRetryable: false, isExpected: true }, // OneDriveQuotaExceeded
			"30102": { message: Localization.getLocalizedString("WebClipper.Error.SectionTooLarge"), isRetryable: false, isExpected: true }, // SectionTooLarge
			"30103": { message: Localization.getLocalizedString("WebClipper.Error.GenericError"), isRetryable: true, isExpected: true }, // CoherencyFailure
			"30104": { message: Localization.getLocalizedString("WebClipper.Error.UserAccountSuspended"), isRetryable: false, isExpected: true }, // UserAccountSuspended
			"30105": { message: Localization.getLocalizedString("WebClipper.Error.NotProvisioned"), isRetryable: false, isExpected: true } // OneDriveForBusinessNotProvisioned
		};

		if (!apiResponseCode) {
			return;
		}
		return handledExtendedResponseCodes[apiResponseCode];
	}
}
