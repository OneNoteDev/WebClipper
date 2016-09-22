import {Constants} from "../constants";
import {Utils} from "../utils";

import {Localization} from "../localization/localization";

import * as Log from "../logging/log";

import {Clipper} from "./frontEndGlobals";

export module OneNoteApiUtils {
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

	/**
	 * Retrieves an error message for the response returned from fetching notebooks as HTML.
	 */
	export function getLocalizedErrorMessageForGetNotebooks(apiResponseCode: string): string {
		let fallback = Localization.getLocalizedString("WebClipper.SectionPicker.NotebookLoadUnretryableFailureMessage");

		let actionableLink = document.createElement("A") as HTMLAnchorElement;
		actionableLink.href = "https://aka.ms/onapi-too-many-items-actionable";
		actionableLink.innerText = Localization.getLocalizedString("WebClipper.SectionPicker.NotebookLoadUnretryableFailureLinkMessage");
		let actionableMessageAsHtml = Localization.getLocalizedString("WebClipper.SectionPicker.NotebookLoadUnretryableFailureMessageWithExplanation") + "\n" + actionableLink.outerHTML;

		// Actionable codes have a message that have a hyperlink to documentation that users can use to solve their issue
		let actionableResponseCodes = ["10008", "10013"];
		let responseCodeIsActionable = actionableResponseCodes.indexOf(apiResponseCode) > -1;
		if (responseCodeIsActionable) {
			return actionableMessageAsHtml;
		}

		// Fall back to a non-actionable message
		return fallback;
	}

	export function isExpected(apiResponseCode: string): boolean {
		let responseCodeInfo = getResponseCodeInformation(apiResponseCode);
		return responseCodeInfo ? responseCodeInfo.isExpected : false;
	}

	export function isRetryable(apiResponseCode: string): boolean {
		let responseCodeInfo = getResponseCodeInformation(apiResponseCode);
		return responseCodeInfo ? responseCodeInfo.isRetryable : false;
	}

	/**
	 * Retrieves response code information given that the context is in POSTing a clip.
	 */
	function getResponseCodeInformation(apiResponseCode: string): { message: string, isRetryable: boolean, isExpected: boolean } {
		let handledExtendedResponseCodes = {
			"10001": { message: Localization.getLocalizedString("WebClipper.Error.GenericError"), isRetryable: true, isExpected: true }, // UnexpectedServerError
			"10002": { message: Localization.getLocalizedString("WebClipper.Error.GenericError"), isRetryable: true, isExpected: true }, // ServiceUnavailable
			"10004": { message: Localization.getLocalizedString("WebClipper.Error.PasswordProtected"), isRetryable: false, isExpected: true }, // PasswordProtectedSection
			"10006": { message: Localization.getLocalizedString("WebClipper.Error.CorruptedSection"), isRetryable: false, isExpected: true }, // CorruptedSection
			"10007": { message: Localization.getLocalizedString("WebClipper.Error.GenericError"), isRetryable: true, isExpected: true }, // ServerTooBusy
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
