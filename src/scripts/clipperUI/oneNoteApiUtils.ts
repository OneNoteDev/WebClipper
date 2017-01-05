import {Constants} from "../constants";

import {Localization} from "../localization/localization";

import * as Log from "../logging/log";

import {Clipper} from "./frontEndGlobals";

export class OneNoteApiUtils {
	public Limits = {
		imagesPerRequestLimit: 30
	};

	public static logOneNoteApiRequestError(event: Log.Event.PromiseEvent, error: OneNoteApi.RequestError) {
		if (!event || !error) {
			return;
		}

		event.setCustomProperty(Log.PropertyName.Custom.CorrelationId, error.responseHeaders[Constants.HeaderValues.correlationId]);
		event.setStatus(Log.Status.Failed);
		event.setFailureInfo(error);

		let apiResponseCode: string = this.getApiResponseCode(error);
		if (!apiResponseCode) {
			return;
		}

		let responseCodeInfo = this.getResponseCodeInformation(apiResponseCode);
		if (!responseCodeInfo) {
			Clipper.logger.logFailure(Log.Failure.Label.UnhandledApiCode, Log.Failure.Type.Unexpected,
				undefined, apiResponseCode);
		}

		if (OneNoteApiUtils.isExpected(apiResponseCode)) {
			event.setFailureType(Log.Failure.Type.Expected);
		}

		event.setCustomProperty(Log.PropertyName.Custom.IsRetryable, OneNoteApiUtils.isRetryable(apiResponseCode));
	}

	public static getApiResponseCode(error: OneNoteApi.RequestError): string {
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

	public static getLocalizedErrorMessage(apiResponseCode: string): string {
		let responseCodeInfo = this.getResponseCodeInformation(apiResponseCode);
		return responseCodeInfo ? responseCodeInfo.message : Localization.getLocalizedString("WebClipper.Error.GenericError");
	}

	/**
	 * Retrieves an error message for the response returned from fetching notebooks as HTML.
	 */
	public static getLocalizedErrorMessageForGetNotebooks(apiResponseCode: string): string {
		let fallback = Localization.getLocalizedString("WebClipper.SectionPicker.NotebookLoadUnretryableFailureMessage");

		// Actionable codes have a message that have a hyperlink to documentation that users can use to solve their issue
		let actionableResponseCodes = ["10008", "10013"];
		let responseCodeIsActionable = actionableResponseCodes.indexOf(apiResponseCode) > -1;
		if (responseCodeIsActionable) {
			let actionableLink = document.createElement("A") as HTMLAnchorElement;
			actionableLink.href = "https://aka.ms/onapi-too-many-items-actionable";
			actionableLink.innerText = Localization.getLocalizedString("WebClipper.SectionPicker.NotebookLoadUnretryableFailureLinkMessage");
			let actionableMessageAsHtml = Localization.getLocalizedString("WebClipper.SectionPicker.NotebookLoadUnretryableFailureMessageWithExplanation") + "\n" + actionableLink.outerHTML;
			return actionableMessageAsHtml;
		}

		// See if there's a specific message we can show
		let responseCodeInfo = this.getResponseCodeInformation(apiResponseCode);
		if (responseCodeInfo && responseCodeInfo.message) {
			return responseCodeInfo.message;
		}

		// Fall back to a non-retryable message
		return fallback;
	}

	public static requiresSignout(apiResponseCode: string): boolean {
		let responseCodeInfo = this.getResponseCodeInformation(apiResponseCode);
		return responseCodeInfo ? responseCodeInfo.requiresSignout : false;
	}

	public static isExpected(apiResponseCode: string): boolean {
		let responseCodeInfo = this.getResponseCodeInformation(apiResponseCode);
		return responseCodeInfo ? responseCodeInfo.isExpected : false;
	}

	public static isRetryable(apiResponseCode: string): boolean {
		let responseCodeInfo = this.getResponseCodeInformation(apiResponseCode);
		return responseCodeInfo ? responseCodeInfo.isRetryable : false;
	}

	public static createPatchRequestBody(dataUrls: string[]): OneNoteApi.Revision[] {
		let requestBody = [];
		dataUrls.forEach((dataUrl) => {
			let content = "<p><img src=\"" + dataUrl + "\" /></p>&nbsp;";
			requestBody.push({
				target: "body",
				action: "append",
				content: content
			});
		});
		return requestBody;
	}

	/**
	 * Retrieves response code information given that the context is in POSTing a clip.
	 */
	private static getResponseCodeInformation(apiResponseCode: string): { message: string, isRetryable: boolean, isExpected: boolean, requiresSignout?: boolean } {
		let handledExtendedResponseCodes = {
			10001: { message: Localization.getLocalizedString("WebClipper.Error.GenericError"), isRetryable: true, isExpected: true }, // UnexpectedServerError
			10002: { message: Localization.getLocalizedString("WebClipper.Error.GenericError"), isRetryable: true, isExpected: true }, // ServiceUnavailable
			10004: { message: Localization.getLocalizedString("WebClipper.Error.PasswordProtected"), isRetryable: false, isExpected: true }, // PasswordProtectedSection
			10006: { message: Localization.getLocalizedString("WebClipper.Error.CorruptedSection"), isRetryable: false, isExpected: true }, // CorruptedSection
			10007: { message: Localization.getLocalizedString("WebClipper.Error.GenericError"), isRetryable: true, isExpected: true }, // ServerTooBusy
			19999: { message: Localization.getLocalizedString("WebClipper.Error.GenericError"), isRetryable: true, isExpected: false }, // GenericError
			20102: { message: Localization.getLocalizedString("WebClipper.Error.ResourceDoesNotExist"), isRetryable: false, isExpected: true }, // ResourceDoesNotExist
			30101: { message: Localization.getLocalizedString("WebClipper.Error.QuotaExceeded"), isRetryable: false, isExpected: true }, // OneDriveQuotaExceeded
			30102: { message: Localization.getLocalizedString("WebClipper.Error.SectionTooLarge"), isRetryable: false, isExpected: true }, // SectionTooLarge
			30103: { message: Localization.getLocalizedString("WebClipper.Error.GenericError"), isRetryable: true, isExpected: true }, // CoherencyFailure
			30104: { message: Localization.getLocalizedString("WebClipper.Error.UserAccountSuspended"), isRetryable: false, isExpected: true }, // UserAccountSuspended
			30105: { message: Localization.getLocalizedString("WebClipper.Error.NotProvisioned"), isRetryable: false, isExpected: true }, // OneDriveForBusinessNotProvisioned
			40004: { message: Localization.getLocalizedString("WebClipper.Error.UserDoesNotHaveUpdatePermission"), isRetryable: false, isExpected: true, requiresSignout: true } // UserOnlyHasCreatePermissions
		};

		if (!apiResponseCode) {
			return;
		}
		return handledExtendedResponseCodes[apiResponseCode];
	}
}
