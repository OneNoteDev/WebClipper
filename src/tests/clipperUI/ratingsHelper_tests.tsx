import {Clipper} from "../../scripts/clipperUI/frontEndGlobals";
import {RatingsHelper} from "../../scripts/clipperUI/ratingsHelper";

import {SmartValue} from "../../scripts/communicator/smartValue";

import {StubSessionLogger} from "../../scripts/logging/stubSessionLogger";

import {ClipperStorageKeys} from "../../scripts/storage/clipperStorageKeys";

import {Constants} from "../../scripts/constants";
import {ClientType} from "../../scripts/clientType";
import {Settings} from "../../scripts/settings";
import {Utils} from "../../scripts/utils";

import {HelperFunctions} from "../helperFunctions";

// MOCK STORAGE

let mockStorage: { [key: string]: string };
let mockStorageCache: { [key: string]: string };
Clipper.getStoredValue = (key: string, callback: (value: string) => void, cacheValue?: boolean) => {
	if (cacheValue) {
		mockStorageCache[key] = mockStorage[key];
	}
	callback(mockStorage[key]);
};
Clipper.storeValue = (key: string, value: string) => {
	if (key in mockStorageCache) {
		mockStorageCache[key] = value;
	}
	mockStorage[key] = value;
};
Clipper.preCacheStoredValues = (storageKeys: string[]) => {
	for (let key of storageKeys) {
		Clipper.getStoredValue(key, () => { }, true);
	}
};
Clipper.getCachedValue = (key: string) => {
	return mockStorageCache[key];
};

// SETUP

QUnit.module("ratingsHelper", {
	beforeEach: () => {
		Clipper.logger = new StubSessionLogger();
		Settings.setSettingsJsonForTesting({});

		mockStorage = {};
		mockStorageCache = {};
		RatingsHelper.preCacheNeededValues();
	}
});

export module TestConstants {
	export module LogCategories {
		export var oneNoteClipperUsage = "OneNoteClipperUsage";
	}
	export module Urls {
		export var clipperFeedbackUrl = "https://www.onenote.com/feedback";
	}
}

// setNumSuccessfulClipsRatingsEnablement

test("setNumSuccessfulClipsRatingsEnablement does not set the value when ClipperStorageKeys.doNotPromptRatings is set", (assert: QUnitAssert) => {
	let done = assert.async();

	let numClips = 12;
	Clipper.storeValue(ClipperStorageKeys.numSuccessfulClips, numClips.toString());
	Clipper.storeValue(ClipperStorageKeys.doNotPromptRatings, "true");

	RatingsHelper.setNumSuccessfulClipsRatingsEnablement();

	Clipper.getStoredValue(ClipperStorageKeys.numSuccessfulClipsRatingsEnablement, (numClipsAnchorAsStr: string) => {
		ok(Utils.isNullOrUndefined(numClipsAnchorAsStr));
		done();
	});
});

test("setNumSuccessfulClipsRatingsEnablement does not overwrite the value when it already exists", (assert: QUnitAssert) => {
	let done = assert.async();

	let numClips = 12;
	Clipper.storeValue(ClipperStorageKeys.numSuccessfulClips, numClips.toString());

	let expectedStorageValue = 999;
	Clipper.storeValue(ClipperStorageKeys.numSuccessfulClipsRatingsEnablement, expectedStorageValue.toString());

	RatingsHelper.setNumSuccessfulClipsRatingsEnablement();

	Clipper.getStoredValue(ClipperStorageKeys.numSuccessfulClipsRatingsEnablement, (numClipsAnchorAsStr: string) => {
		strictEqual(parseInt(numClipsAnchorAsStr, 10), expectedStorageValue);
		done();
	});
});

test("setNumSuccessfulClipsRatingsEnablement sets the value to (ClipperStorageKeys.numSuccessfulClips - 1) when applicable", (assert: QUnitAssert) => {
	let done = assert.async();

	let numClips = 12;
	Clipper.storeValue(ClipperStorageKeys.numSuccessfulClips, numClips.toString());

	RatingsHelper.setNumSuccessfulClipsRatingsEnablement();

	Clipper.getStoredValue(ClipperStorageKeys.numSuccessfulClipsRatingsEnablement, (numClipsAnchorAsStr: string) => {
		strictEqual(parseInt(numClipsAnchorAsStr, 10), numClips - 1);
		done();
	});
});

// clipSuccessDelayIsOver

test("clipSuccessDelayIsOver returns false when numClips is invalid", () => {
	let invalidParams = [undefined, NaN, -1];

	for (let numClips of invalidParams) {
		let over: boolean = RatingsHelper.clipSuccessDelayIsOver(numClips);
		strictEqual(over, false, "numClips is invalid with value " + numClips);
	}
});

test("clipSuccessDelayIsOver returns false when numClips is out of range", () => {
	let outOfRangeParams = [0, Constants.Settings.minClipSuccessForRatingsPrompt - 1, Constants.Settings.maxClipSuccessForRatingsPrompt + 1];

	for (let numClips of outOfRangeParams) {
		let over: boolean = RatingsHelper.clipSuccessDelayIsOver(numClips);
		strictEqual(over, false, "numClips is out of range with value " + numClips);
	}
});

test("clipSuccessDelayIsOver returns true when numClips is in range", () => {
	let validParams = [Constants.Settings.minClipSuccessForRatingsPrompt, Constants.Settings.minClipSuccessForRatingsPrompt + 1, Constants.Settings.maxClipSuccessForRatingsPrompt - 1, Constants.Settings.maxClipSuccessForRatingsPrompt];

	for (let numClips of validParams) {
		let over: boolean = RatingsHelper.clipSuccessDelayIsOver(numClips);
		strictEqual(over, true, "numClips is valid with value " + numClips);
	}
});

test("clipSuccessDelayIsOver returns false when anchorClipValue is greater than numClips", () => {
	let numClips = Constants.Settings.minClipSuccessForRatingsPrompt;
	let anchorClipValue = numClips + 1;
	let over: boolean = RatingsHelper.clipSuccessDelayIsOver(numClips, anchorClipValue);
	strictEqual(over, false, "anchorClipValue should never be greater than numClips");
});

test("clipSuccessDelayIsOver returns false when anchorClipValue is equal to numClips", () => {
	let numClips = Constants.Settings.minClipSuccessForRatingsPrompt;
	let anchorClipValue = numClips;
	let over: boolean = RatingsHelper.clipSuccessDelayIsOver(numClips, anchorClipValue);
	strictEqual(over, false, "anchorClipValue should never be equal to numClips");
});

test("clipSuccessDelayIsOver returns false when (numClips - anchorClipValue) is out of range", () => {
	let anchorClipValue = 1;
	let outOfRangeParams = [0, Constants.Settings.minClipSuccessForRatingsPrompt - 1, Constants.Settings.maxClipSuccessForRatingsPrompt + 1];

	for (let outOfRange of outOfRangeParams) {
		let numClips = outOfRange + anchorClipValue;
		let over: boolean = RatingsHelper.clipSuccessDelayIsOver(numClips, anchorClipValue);
		strictEqual(over, false, "(numClips - anchorClipValue) should be out of range. numClips: " + numClips + ". anchorClipValue: " + anchorClipValue);
	}
});

test("clipSuccessDelayIsOver returns true when anchorClipValue is invalid (and defaults to 0) but numClips is in range", () => {
	let invalidAnchors = [undefined, NaN, -1];

	for (let anchorClipValue of invalidAnchors) {
		let over: boolean = RatingsHelper.clipSuccessDelayIsOver(Constants.Settings.minClipSuccessForRatingsPrompt, anchorClipValue);
		strictEqual(over, true, "anchorClipValue is invalid with value " + anchorClipValue + ", but should be ignored since numClips is valid with value " + Constants.Settings.minClipSuccessForRatingsPrompt);
	}
});

test("clipSuccessDelayIsOver returns true when (numClips - anchorClipValue) is in range", () => {
	let anchorClipValue = 100;
	let validParams = [Constants.Settings.minClipSuccessForRatingsPrompt, Constants.Settings.minClipSuccessForRatingsPrompt + 1, Constants.Settings.maxClipSuccessForRatingsPrompt - 1, Constants.Settings.maxClipSuccessForRatingsPrompt];

	for (let outOfRange of validParams) {
		let numClips = outOfRange + anchorClipValue;
		let over: boolean = RatingsHelper.clipSuccessDelayIsOver(numClips, anchorClipValue);
		strictEqual(over, true, "(numClips - anchorClipValue) should be valid. numClips: " + numClips + ". anchorClipValue: " + anchorClipValue);
	}
});

// badRatingVersionDelayIsOver

test("badRatingVersionDelayIsOver returns false when version string params are invalid", () => {
	let invalidParams: string[] = [undefined, "", "version", "12345", "a.b.c", "a.33.0", "33.b.0"];

	for (let badRatingVersion of invalidParams) {
		if (badRatingVersion === undefined) {
			continue; // this is a valid state for badRatingVersion
		}
		for (let lastSeenVersion of invalidParams) {
			let over: boolean = RatingsHelper.badRatingVersionDelayIsOver(badRatingVersion, lastSeenVersion);
			strictEqual(over, false,
				"one or both version string params is/are invalid. badRatingVersion: " + badRatingVersion + ". lastSeenVersion: " + lastSeenVersion);
		}
	}
});

test("badRatingVersionDelayIsOver returns false when there has not been a version update since the bad rating", () => {
	let invalidParams: string[] = ["-999.-999.-999", "2.999.999", "3.-999.999", "3.1.999", "3.2.0", "3.2.999"];
	let badRatingVersion = "3.2.0";

	for (let lastSeenVersion of invalidParams) {
		let over: boolean = RatingsHelper.badRatingVersionDelayIsOver(badRatingVersion, lastSeenVersion);
		strictEqual(over, false,
			"there has not been a version update since " + badRatingVersion + ". lastSeenVersion: " + lastSeenVersion);
	}
});

test("badRatingVersionDelayIsOver returns true when there has been a version update since the bad rating", () => {
	let invalidParams: string[] = ["3.3.0", "4.0.0"];
	let badRatingVersion = "3.2.0";

	for (let lastSeenVersion of invalidParams) {
		let over: boolean = RatingsHelper.badRatingVersionDelayIsOver(badRatingVersion, lastSeenVersion);
		strictEqual(over, true,
			"there has been a version update since " + badRatingVersion + ". lastSeenVersion: " + lastSeenVersion);
	}
});

// badRatingTimingDelayIsOver

test("badRatingTimingDelayIsOver returns false when date string params are invalid", () => {
	let invalidParams: number[] = [undefined, NaN, Constants.Settings.maximumJSTimeValue + 1, (Constants.Settings.maximumJSTimeValue * -1) - 1];

	for (let badRatingDate of invalidParams) {
		if (badRatingDate === undefined || isNaN(badRatingDate)) {
			continue; // these are valid states for badRatingDate
		}
		for (let currentDate of invalidParams) {
			let over: boolean = RatingsHelper.badRatingTimingDelayIsOver(badRatingDate, currentDate);
			strictEqual(over, false,
				"one or both date number params is/are invalid. badRatingDate: " + badRatingDate + ". currentDate: " + currentDate);
		}
	}

	let currentDate = Date.now();
	let badRatingDate = currentDate + 1;
	let over: boolean = RatingsHelper.badRatingTimingDelayIsOver(badRatingDate, currentDate);
	strictEqual(over, false, "bad rating somehow occurred after the current date. badRatingDate: " + badRatingDate + ". currentDate: " + currentDate);
});

test("badRatingTimingDelayIsOver returns false when the time between bad rating and the current date is less than the minimum allowed span", () => {
	let minTime: number = Constants.Settings.minTimeBetweenBadRatings;
	let timeBetweenRatings: number = minTime - 1;

	let currentDate = Date.now();
	let badRatingDate = currentDate - timeBetweenRatings;

	let over: boolean = RatingsHelper.badRatingTimingDelayIsOver(badRatingDate, currentDate);
	strictEqual(over, false, "Timespan between bad rating and current date means the delay is not over. badRatingDate: " + new Date(badRatingDate) + ". currentDate: " + new Date(currentDate));
});

test("badRatingTimingDelayIsOver returns true when the time between bad rating and the current date is greater than or equal to the minimum allowed span", () => {
	let minTime: number = Constants.Settings.minTimeBetweenBadRatings;
	let timeBetweenRatings: number[] = [minTime, minTime + 1];

	let currentDate = Date.now();

	for (let time of timeBetweenRatings) {
		let badRatingDate = currentDate - time;
		let over: boolean = RatingsHelper.badRatingTimingDelayIsOver(badRatingDate, currentDate);
		strictEqual(over, true, "Timespan between bad rating and current date means the delay is over. badRatingDate: " + new Date(badRatingDate) + ". currentDate: " + new Date(currentDate));
	}
});

// getFeedbackUrlIfExists

test("getFeedbackUrlIfExists returns undefined if log category for ratings prompt does not exist", () => {
	let url: string = RatingsHelper.getFeedbackUrlIfExists({});
	strictEqual(url, undefined, "setting for log category for ratings prompt does not exist");

	Settings.setSettingsJsonForTesting({
		"LogCategory_RatingsPrompt": {
			"Value": undefined
		}
	});

	url = RatingsHelper.getFeedbackUrlIfExists({});
	strictEqual(url, undefined, "value for log category for ratings prompt is undefined");

	Settings.setSettingsJsonForTesting({
		"LogCategory_RatingsPrompt": {
			"Value": ""
		}
	});

	url = RatingsHelper.getFeedbackUrlIfExists({});
	strictEqual(url, undefined, "value for log category for ratings prompt is empty");
});

test("getFeedbackUrlIfExists returns a feedback url if log category for ratings prompt exists", () => {
	Settings.setSettingsJsonForTesting({
		"LogCategory_RatingsPrompt": {
			"Value": TestConstants.LogCategories.oneNoteClipperUsage
		}
	});

	let clipperState = HelperFunctions.getMockClipperState();
	Clipper.sessionId.set(Utils.generateGuid());

	let expectedFeedbackUrl = "https://www.onenote.com/feedback"
		+ "?LogCategory=" + Settings.getSetting("LogCategory_RatingsPrompt")
		+ "&originalUrl=" + clipperState.pageInfo.rawUrl
		+ "&clipperId=" + clipperState.clientInfo.clipperId
		+ "&usid=" + Clipper.getUserSessionId()
		+ "&type=" + ClientType[clipperState.clientInfo.clipperType]
		+ "&version=" + clipperState.clientInfo.clipperVersion;

	let url = RatingsHelper.getFeedbackUrlIfExists(clipperState);

	strictEqual(url, expectedFeedbackUrl);
});

// getRateUrlIfExists

test("getRateUrlIfExists returns undefined if ClientType/ClipperType is invalid", () => {
	let url: string = RatingsHelper.getRateUrlIfExists(undefined);
	strictEqual(url, undefined, "Ratings url should be undefined on an undefined ClientType");

	let invalidClientType = 999;
	url = RatingsHelper.getRateUrlIfExists(invalidClientType);
	strictEqual(url, undefined, "Ratings url should be undefined on an invalid ClientType");
});

test("getRateUrlIfExists returns undefined if a client's rate url does not exist", () => {
	let clientType: ClientType = ClientType.ChromeExtension;
	let settingName: string = ClientType[clientType] + RatingsHelper.rateUrlSettingNameSuffix;

	let url: string = RatingsHelper.getRateUrlIfExists(clientType);
	strictEqual(url, undefined, "Ratings url should be undefined if " + settingName + " is not in settings");

	Settings.setSettingsJsonForTesting({
		"ChromeExtension_RatingUrl": {
			"Value": undefined
		}
	});

	url = RatingsHelper.getRateUrlIfExists(clientType);
	strictEqual(url, undefined, "Ratings url should be undefined if the value of " + settingName + " is undefined");

	Settings.setSettingsJsonForTesting({
		"ChromeExtension_RatingUrl": {
			"Value": ""
		}
	});

	url = RatingsHelper.getRateUrlIfExists(clientType);
	strictEqual(url, undefined, "Ratings url should be undefined if the value of " + settingName + " is empty");
});

test("getRateUrlIfExists returns a rating url if it exists", () => {
	let clientType: ClientType = ClientType.ChromeExtension;

	let expectedRatingUrl = "https://chrome.google.com/webstore/detail/onenote-web-clipper/reviews";

	Settings.setSettingsJsonForTesting({
		"ChromeExtension_RatingUrl": {
			"Value": expectedRatingUrl
		}
	});

	let url: string = RatingsHelper.getRateUrlIfExists(clientType);
	strictEqual(url, expectedRatingUrl);
});

// ratingsPromptEnabledForClient

test("ratingsPromptEnabledForClient returns false if ClientType/ClipperType is invalid", () => {
	let isEnabled: boolean = RatingsHelper.ratingsPromptEnabledForClient(undefined);
	strictEqual(isEnabled, false, "Ratings should be disabled on an undefined ClientType");

	let invalidClientType = 999;
	isEnabled = RatingsHelper.ratingsPromptEnabledForClient(invalidClientType);
	strictEqual(isEnabled, false, "Ratings should be disabled on an invalid ClientType");
});

test("ratingsPromptEnabledForClient returns false if a client's enable value does not exist", () => {
	let clientType: ClientType = ClientType.ChromeExtension;
	let settingName: string = ClientType[clientType] + RatingsHelper.ratingsPromptEnabledSettingNameSuffix;

	let isEnabled: boolean = RatingsHelper.ratingsPromptEnabledForClient(clientType);
	strictEqual(isEnabled, false, "Ratings should be disabled if " + settingName + " is not in settings");

	Settings.setSettingsJsonForTesting({
		"ChromeExtension_RatingsEnabled": {
			"Value": undefined
		}
	});

	isEnabled = RatingsHelper.ratingsPromptEnabledForClient(clientType);
	strictEqual(isEnabled, false, "Ratings should be disabled if the value of " + settingName + " is undefined");

	Settings.setSettingsJsonForTesting({
		"ChromeExtension_RatingsEnabled": {
			"Value": ""
		}
	});

	isEnabled = RatingsHelper.ratingsPromptEnabledForClient(clientType);
	strictEqual(isEnabled, false, "Ratings should be disabled if the value of " + settingName + " is empty");
});

test("ratingsPromptEnabledForClient returns false if a client's enable value is not 'true' (case-insensitive)", () => {
	let clientType: ClientType = ClientType.ChromeExtension;

	Settings.setSettingsJsonForTesting({
		"ChromeExtension_RatingsEnabled": {
			"Value": "false"
		}
	});

	let isEnabled: boolean = RatingsHelper.ratingsPromptEnabledForClient(clientType);
	strictEqual(isEnabled, false);

	Settings.setSettingsJsonForTesting({
		"ChromeExtension_RatingsEnabled": {
			"Value": "garbage"
		}
	});

	isEnabled = RatingsHelper.ratingsPromptEnabledForClient(clientType);
	strictEqual(isEnabled, false);
});

test("ratingsPromptEnabledForClient returns true if a client's enable value is 'true' (case-insensitive)", () => {
	let clientType: ClientType = ClientType.ChromeExtension;

	Settings.setSettingsJsonForTesting({
		"ChromeExtension_RatingsEnabled": {
			"Value": "true"
		}
	});

	let isEnabled: boolean = RatingsHelper.ratingsPromptEnabledForClient(clientType);
	strictEqual(isEnabled, true);

	Settings.setSettingsJsonForTesting({
		"ChromeExtension_RatingsEnabled": {
			"Value": "TrUe"
		}
	});

	isEnabled = RatingsHelper.ratingsPromptEnabledForClient(clientType);
	strictEqual(isEnabled, true);
});

// badRatingAlreadyOccurred

test("badRatingAlreadyOccurred returns false when lastBadRatingDate does not exist in storage", () => {
	let alreadyRatedBad: boolean = RatingsHelper.badRatingAlreadyOccurred();
	strictEqual(alreadyRatedBad, false);
});

test("badRatingAlreadyOccurred returns false when lastBadRatingDate is not a number", () => {
	Clipper.storeValue(ClipperStorageKeys.lastBadRatingDate, "not a number");

	let alreadyRatedBad: boolean = RatingsHelper.badRatingAlreadyOccurred();
	strictEqual(alreadyRatedBad, false);
});

test("badRatingAlreadyOccurred returns false when lastBadRatingDate is a number out of date range", () => {
	Clipper.storeValue(ClipperStorageKeys.lastBadRatingDate, (Constants.Settings.maximumJSTimeValue + 1).toString());

	let alreadyRatedBad: boolean = RatingsHelper.badRatingAlreadyOccurred();
	strictEqual(alreadyRatedBad, false);
});

test("badRatingAlreadyOccurred returns true when lastBadRatingDate is a valid number", () => {
	Clipper.storeValue(ClipperStorageKeys.lastBadRatingDate, Date.now().toString());

	let alreadyRatedBad: boolean = RatingsHelper.badRatingAlreadyOccurred();
	strictEqual(alreadyRatedBad, true);
});

// shouldShowRatingsPrompt

test("shouldShowRatingsPrompt returns hardcoded false when clipperState is undefined", () => {
	let shouldShowRatingsPrompt: boolean = RatingsHelper.shouldShowRatingsPrompt(undefined);
	strictEqual(shouldShowRatingsPrompt, false);
});

test("shouldShowRatingsPrompt returns cached false when shouldShowRatingsPrompt is already set to false", () => {
	let clipperState = HelperFunctions.getMockClipperState();
	clipperState.showRatingsPrompt = new SmartValue<boolean>(false);

	let shouldShowRatingsPrompt: boolean = RatingsHelper.shouldShowRatingsPrompt(clipperState);
	strictEqual(shouldShowRatingsPrompt, false);
});

test("shouldShowRatingsPrompt returns cached true when shouldShowRatingsPrompt is already set to true", () => {
	let clipperState = HelperFunctions.getMockClipperState();
	clipperState.showRatingsPrompt = new SmartValue<boolean>(true);

	let shouldShowRatingsPrompt: boolean = RatingsHelper.shouldShowRatingsPrompt(clipperState);
	strictEqual(shouldShowRatingsPrompt, true);
});

test("shouldShowRatingsPrompt returns false when ratings prompt is disabled for the client", () => {
	Settings.setSettingsJsonForTesting({
		"ChromeExtension_RatingsEnabled": {
			"Value": "false"
		}
	});

	let clipperState = HelperFunctions.getMockClipperState();

	let shouldShowRatingsPrompt: boolean = RatingsHelper.shouldShowRatingsPrompt(clipperState);
	strictEqual(shouldShowRatingsPrompt, false);
});

test("shouldShowRatingsPrompt returns false when do not prompt ratings is set in storage to 'true' (case-insensitive)", () => {
	Settings.setSettingsJsonForTesting({
		"ChromeExtension_RatingsEnabled": {
			"Value": "true"
		}
	});

	Clipper.storeValue(ClipperStorageKeys.doNotPromptRatings, "tRuE");

	let clipperState = HelperFunctions.getMockClipperState();

	let shouldShowRatingsPrompt: boolean = RatingsHelper.shouldShowRatingsPrompt(clipperState);
	strictEqual(shouldShowRatingsPrompt, false);
});

test("shouldShowRatingsPrompt returns true when do not prompt ratings is set in storage but to an invalid value", () => {
	Settings.setSettingsJsonForTesting({
		"ChromeExtension_RatingsEnabled": {
			"Value": "true"
		}
	});

	Clipper.storeValue(ClipperStorageKeys.doNotPromptRatings, "invalid");
	Clipper.storeValue(ClipperStorageKeys.numSuccessfulClips, Constants.Settings.minClipSuccessForRatingsPrompt.toString());
	Clipper.storeValue(ClipperStorageKeys.numSuccessfulClipsRatingsEnablement, "0");

	let clipperState = HelperFunctions.getMockClipperState();

	let shouldShowRatingsPrompt: boolean = RatingsHelper.shouldShowRatingsPrompt(clipperState);
	strictEqual(shouldShowRatingsPrompt, true);
});

test("shouldShowRatingsPrompt returns true when a valid configuration is provided", () => {
	Settings.setSettingsJsonForTesting({
		"FirefoxExtension_RatingsEnabled": {
			"Value": "true"
		}
	});

	let anchorClipValue = Constants.Settings.maxClipSuccessForRatingsPrompt + 1;

	Clipper.storeValue(ClipperStorageKeys.numSuccessfulClips, (anchorClipValue + Constants.Settings.maxClipSuccessForRatingsPrompt).toString());
	Clipper.storeValue(ClipperStorageKeys.numSuccessfulClipsRatingsEnablement, anchorClipValue.toString());
	Clipper.storeValue(ClipperStorageKeys.lastBadRatingDate, (Date.now() - Constants.Settings.minTimeBetweenBadRatings).toString());
	Clipper.storeValue(ClipperStorageKeys.lastBadRatingVersion, "3.0.9");
	Clipper.storeValue(ClipperStorageKeys.lastSeenVersion, "3.1.0");

	let clipperState = HelperFunctions.getMockClipperState();
	clipperState.clientInfo.clipperType = ClientType.FirefoxExtension;

	let shouldShowRatingsPrompt: boolean = RatingsHelper.shouldShowRatingsPrompt(clipperState);
	strictEqual(shouldShowRatingsPrompt, true);
});

test("shouldShowRatingsPrompt returns false when number of successful clips is below the min", () => {
	Settings.setSettingsJsonForTesting({
		"ChromeExtension_RatingsEnabled": {
			"Value": "true"
		}
	});

	Clipper.storeValue(ClipperStorageKeys.numSuccessfulClips, (Constants.Settings.minClipSuccessForRatingsPrompt - 1).toString());
	Clipper.storeValue(ClipperStorageKeys.numSuccessfulClipsRatingsEnablement, "0");
	Clipper.storeValue(ClipperStorageKeys.lastBadRatingDate, (Date.now() - Constants.Settings.minTimeBetweenBadRatings).toString());
	Clipper.storeValue(ClipperStorageKeys.lastBadRatingVersion, "3.0.9");
	Clipper.storeValue(ClipperStorageKeys.lastSeenVersion, "3.1.0");

	let clipperState = HelperFunctions.getMockClipperState();

	let shouldShowRatingsPrompt: boolean = RatingsHelper.shouldShowRatingsPrompt(clipperState);
	strictEqual(shouldShowRatingsPrompt, false);
});

test("shouldShowRatingsPrompt returns false when last bad rating date is too recent", () => {
	Settings.setSettingsJsonForTesting({
		"ChromeExtension_RatingsEnabled": {
			"Value": "true"
		}
	});

	let timeDiffInMs = 1000 * 60 * 60 * 24; // to make last bad rating date 1 day sooner than the min time delay

	Clipper.storeValue(ClipperStorageKeys.numSuccessfulClips, Constants.Settings.minClipSuccessForRatingsPrompt.toString());
	Clipper.storeValue(ClipperStorageKeys.numSuccessfulClipsRatingsEnablement, "0");
	Clipper.storeValue(ClipperStorageKeys.lastBadRatingDate, (Date.now() - Constants.Settings.minTimeBetweenBadRatings + timeDiffInMs).toString());
	Clipper.storeValue(ClipperStorageKeys.lastBadRatingVersion, "3.0.9");
	Clipper.storeValue(ClipperStorageKeys.lastSeenVersion, "3.1.0");

	let clipperState = HelperFunctions.getMockClipperState();

	let shouldShowRatingsPrompt: boolean = RatingsHelper.shouldShowRatingsPrompt(clipperState);
	strictEqual(shouldShowRatingsPrompt, false);
});

test("shouldShowRatingsPrompt returns false when there has not been a significant version update since the last bad rating", () => {
	Settings.setSettingsJsonForTesting({
		"ChromeExtension_RatingsEnabled": {
			"Value": "true"
		}
	});

	Clipper.storeValue(ClipperStorageKeys.numSuccessfulClips, Constants.Settings.minClipSuccessForRatingsPrompt.toString());
	Clipper.storeValue(ClipperStorageKeys.numSuccessfulClipsRatingsEnablement, "0");
	Clipper.storeValue(ClipperStorageKeys.lastBadRatingDate, (Date.now() - Constants.Settings.minTimeBetweenBadRatings).toString());
	Clipper.storeValue(ClipperStorageKeys.lastBadRatingVersion, "3.0.9");
	Clipper.storeValue(ClipperStorageKeys.lastSeenVersion, "3.0.999");

	let clipperState = HelperFunctions.getMockClipperState();

	let shouldShowRatingsPrompt: boolean = RatingsHelper.shouldShowRatingsPrompt(clipperState);
	strictEqual(shouldShowRatingsPrompt, false);
});

test("shouldShowRatingsPrompt returns false when (numSuccessfulClips - numSuccessfulClipsRatingsEnablement) is out of range", () => {
	Settings.setSettingsJsonForTesting({
		"FirefoxExtension_RatingsEnabled": {
			"Value": "true"
		}
	});

	let anchorClipValue = Constants.Settings.maxClipSuccessForRatingsPrompt + 1;

	Clipper.storeValue(ClipperStorageKeys.numSuccessfulClips, (anchorClipValue + Constants.Settings.maxClipSuccessForRatingsPrompt + 1).toString());
	Clipper.storeValue(ClipperStorageKeys.numSuccessfulClipsRatingsEnablement, anchorClipValue.toString());

	let clipperState = HelperFunctions.getMockClipperState();
	clipperState.clientInfo.clipperType = ClientType.FirefoxExtension;

	let shouldShowRatingsPrompt: boolean = RatingsHelper.shouldShowRatingsPrompt(clipperState);
	strictEqual(shouldShowRatingsPrompt, false);
});

// test("", () => { });
