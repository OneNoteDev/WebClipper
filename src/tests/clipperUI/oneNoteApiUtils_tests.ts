/// <reference path="../../../typings/main/ambient/qunit/qunit.d.ts" />

import {Clipper} from "../../scripts/clipperUI/frontEndGlobals";
import {OneNoteApiUtils} from "../../scripts/clipperUI/oneNoteApiUtils";

import {StubSessionLogger} from "../../scripts/logging/stubSessionLogger";

declare function require(name: string);

QUnit.module("oneNoteApiUtils", {
	beforeEach: () => {
		Clipper.logger = new StubSessionLogger();
	}
});

test("getApiResponseCode should correctly parse out the http response code from the error object", () => {
	let expectedCode = "12345";
	let requestError: OneNoteApi.RequestError = {
		error: "err",
		statusCode: 404,
		response: JSON.stringify({
			error: {
				code: expectedCode,
				message: "Unable to create a page in this section because the hamster in the server room died.",
				"@api.url": "http://aka.ms/onenote-errors#C12345"
			}}),
		responseHeaders: {}
	};

	strictEqual(OneNoteApiUtils.getApiResponseCode(requestError), expectedCode,
		"The http response code should be correctly parsed out of the request error");
});

test("getApiResponseCode should return undefined if the error object is null", () => {
	/* tslint:disable:no-null-keyword */
	strictEqual(OneNoteApiUtils.getApiResponseCode(null), undefined,
		"Undefined should be returned");
	/* tslint:enable:no-null-keyword */
});

test("getApiResponseCode should return undefined if the error object is undefined", () => {
	strictEqual(OneNoteApiUtils.getApiResponseCode(undefined), undefined,
		"Undefined should be returned");
});

test("getApiResponseCode should return undefined if the response in the request error is undefined", () => {
	let requestError: OneNoteApi.RequestError = {
		error: "err",
		statusCode: 404,
		response: undefined,
		responseHeaders: {}
	};

	strictEqual(OneNoteApiUtils.getApiResponseCode(requestError), undefined,
		"Undefined should be returned");
});

test("getApiResponseCode should return undefined if the response's error in the request error is undefined", () => {
	let requestError: OneNoteApi.RequestError = {
		error: "err",
		statusCode: 404,
		response: JSON.stringify({
			error: undefined
		}),
		responseHeaders: {}
	};

	strictEqual(OneNoteApiUtils.getApiResponseCode(requestError), undefined,
		"Undefined should be returned");
});

test("getApiResponseCode should return undefined if the response's error's code in the request error is empty string", () => {
	let requestError: OneNoteApi.RequestError = {
		error: "err",
		statusCode: 404,
		response: JSON.stringify({
			error: {
				code: "",
				message: "Unable to create a page in this section because the hamster in the server room died.",
				"@api.url": "http://aka.ms/onenote-errors#C12345"
			}}),
		responseHeaders: {}
	};

	strictEqual(OneNoteApiUtils.getApiResponseCode(requestError), undefined,
		"Undefined should be returned");
});

test("getApiResponseCode should return undefined if the response's error's code in the request error is null", () => {
	/* tslint:disable:no-null-keyword */
	let requestError: OneNoteApi.RequestError = {
		error: "err",
		statusCode: 404,
		response: JSON.stringify({
			error: {
				code: null,
				message: "Unable to create a page in this section because the hamster in the server room died.",
				"@api.url": "http://aka.ms/onenote-errors#C12345"
			}}),
		responseHeaders: {}
	};

	strictEqual(OneNoteApiUtils.getApiResponseCode(requestError), undefined,
		"Undefined should be returned");
	/* tslint:enable:no-null-keyword */
});

test("getApiResponseCode should return undefined if the response's error's code in the request error is undefined", () => {
	let requestError: OneNoteApi.RequestError = {
		error: "err",
		statusCode: 404,
		response: JSON.stringify({
			error: {
				code: undefined,
				message: "Unable to create a page in this section because the hamster in the server room died.",
				"@api.url": "http://aka.ms/onenote-errors#C12345"
			}}),
		responseHeaders: {}
	};

	strictEqual(OneNoteApiUtils.getApiResponseCode(requestError), undefined,
		"Undefined should be returned");
});

test("For matching error codes, isRetryable should return true for error codes that should be retryable", () => {
	let retryableCodes = [ "10001", "10002", "10007", "19999", "30103" ];
	for (let i = 0; i < retryableCodes.length; i++) {
		ok(OneNoteApiUtils.isRetryable(retryableCodes[i]),
			"Code " + retryableCodes[i] + " should be retryable");
	}
});

test("For matching error codes, isRetryable should return false for error codes that should not be retryable", () => {
	let retryableCodes = [ "10003", "10004", "10006", "30101", "30102", "30104", "30105" ];
	for (let i = 0; i < retryableCodes.length; i++) {
		ok(!OneNoteApiUtils.isRetryable(retryableCodes[i]),
			"Code " + retryableCodes[i] + " should not be retryable");
	}
});

test("For an unknown error code, isRetryable should return false", () => {
	ok(!OneNoteApiUtils.isRetryable("-1"), "Code -1 should not be retryable");
	ok(!OneNoteApiUtils.isRetryable("3456"), "Code 3456 should not be retryable");
	ok(!OneNoteApiUtils.isRetryable(undefined));
});

test("For matching error codes, isExpected should return true for error codes that are expected", () => {
	let expectedCodes = [ "10001", "10002", "10004", "10006", "10007", "30101", "30102", "30103", "30104", "30105" ];
	for (let i = 0; i < expectedCodes.length; i++) {
		ok(OneNoteApiUtils.isExpected(expectedCodes[i]),
			"Code " + expectedCodes[i] + " should be expected");
	}
});

test("For matching error codes, isExpected should return false for error codes that are not expected", () => {
	let nonExpectedCodes = [ "19999" ];
	for (let i = 0; i < nonExpectedCodes.length; i++) {
		ok(!OneNoteApiUtils.isExpected(nonExpectedCodes[i]),
			"Code " + nonExpectedCodes[i] + " should not be expected");
	}
});

test("For an unknown error code, isExpected should return false", () => {
	ok(!OneNoteApiUtils.isExpected("-1"), "Code -1 should not be expected");
	ok(!OneNoteApiUtils.isExpected("123980123"), "Code 123980123 should not be expected");
});

test("For known error codes, the appropriate failure message should be returned from getLocalizedErrorMessage", () => {
	let stringsJson = require("../../strings.json");
	let codeMessagePairs = [
		{ code: "10001", message: stringsJson["WebClipper.Error.GenericError"] },
		{ code: "10002", message: stringsJson["WebClipper.Error.GenericError"] },
		{ code: "10003", message: stringsJson["WebClipper.Error.GenericError"] },
		{ code: "10004", message: stringsJson["WebClipper.Error.PasswordProtected"] },
		{ code: "10006", message: stringsJson["WebClipper.Error.CorruptedSection"] },
		{ code: "10007", message: stringsJson["WebClipper.Error.GenericError"] },
		{ code: "19999", message: stringsJson["WebClipper.Error.GenericError"] },
		{ code: "30101", message: stringsJson["WebClipper.Error.QuotaExceeded"] },
		{ code: "30102", message: stringsJson["WebClipper.Error.SectionTooLarge"] },
		{ code: "30103", message: stringsJson["WebClipper.Error.GenericError"] },
		{ code: "30104", message: stringsJson["WebClipper.Error.UserAccountSuspended"] },
		{ code: "30105", message: stringsJson["WebClipper.Error.NotProvisioned"] }
	];

	for (let i = 0; i < codeMessagePairs.length; i++) {
		strictEqual(OneNoteApiUtils.getLocalizedErrorMessage(codeMessagePairs[i].code), codeMessagePairs[i].message,
			"Code " + codeMessagePairs[i].code + " should be associated with the matching error message");
	}
});

test("For unknown error codes, the generic failure message should be returned from getLocalizedErrorMessage", () => {
	let stringsJson = require("../../strings.json");
	strictEqual(OneNoteApiUtils.getLocalizedErrorMessage("-1"), stringsJson["WebClipper.Error.GenericError"],
		"Unknown code -1 should be associated with the generic error message");
	strictEqual(OneNoteApiUtils.getLocalizedErrorMessage("47561234"), stringsJson["WebClipper.Error.GenericError"],
		"Unknown code 47561234 should be associated with the generic error message");
});

test("For known get notebooks error codes, the appropriate failure message should be returned from getLocalizedErrorMessageForGetNotebooks", () => {
	let stringsJson = require("../../strings.json");
	let message = "We couldn't load your notebooks because a list limit was exceeded in OneDrive.\n<a href=\"https://aka.ms/onapi-too-many-items-actionable\">Learn more</a>";
	let codeMessagePairs = [
		{ code: "10008", message: message },
		{ code: "10013", message: message }
	];

	for (let i = 0; i < codeMessagePairs.length; i++) {
		strictEqual(OneNoteApiUtils.getLocalizedErrorMessageForGetNotebooks(codeMessagePairs[i].code), codeMessagePairs[i].message,
			"Code " + codeMessagePairs[i].code + " should be associated with the matching error message");
	}
});

test("For unknown error codes in the get notebooks scenario, the generic get notebooks failure message should be returned from getLocalizedErrorMessageForGetNotebooks", () => {
	let stringsJson = require("../../strings.json");
	strictEqual(OneNoteApiUtils.getLocalizedErrorMessageForGetNotebooks("-1"), stringsJson["WebClipper.SectionPicker.NotebookLoadUnretryableFailureMessage"],
		"Unknown code -1 should be associated with the generic error message");
	strictEqual(OneNoteApiUtils.getLocalizedErrorMessageForGetNotebooks("30105"), stringsJson["WebClipper.SectionPicker.NotebookLoadUnretryableFailureMessage"],
		"Unknown code 30105 should be associated with the generic error message");
});
