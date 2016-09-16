import {DialogButton} from "../../scripts/clipperUI/panels/dialogPanel";
import {RatingsPanel} from "../../scripts/clipperUI/panels/ratingsPanel";

import {Clipper} from "../../scripts/clipperUI/frontEndGlobals";
import {RatingsHelper, RatingsPromptStage} from "../../scripts/clipperUI/ratingsHelper";

import {StubSessionLogger} from "../../scripts/logging/stubSessionLogger";

import {Constants} from "../../scripts/constants";
import {ClientType} from "../../scripts/clientType";
import {Settings} from "../../scripts/settings";
import {SmartValue} from "../../scripts/communicator/smartValue";
import {Utils} from "../../scripts/utils";

import {HelperFunctions} from "../helperFunctions";

// MOCK STORAGE

let mockStorage: { [key: string]: string };
let mockStorageCache: { [key: string]: string };
Clipper.Storage.getValue = (key: string, callback: (value: string) => void, cacheValue?: boolean) => {
	if (cacheValue) {
		mockStorageCache[key] = mockStorage[key];
	}
	callback(mockStorage[key]);
};
Clipper.Storage.setValue = (key: string, value: string) => {
	mockStorageCache[key] = value; // TODO is this ok?
	mockStorage[key] = value;
};
Clipper.Storage.getCachedValue = (key: string) => {
	return mockStorageCache[key];
};

// SETUP

QUnit.module("ratingsHelper", {
	beforeEach: () => {
		Clipper.logger = new StubSessionLogger();
		Settings.setSettingsJsonForTesting();

		mockStorage = {};
		mockStorageCache = {};
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

// clipSuccessDelayIsOver

test("clipSuccessDelayIsOver returns false when numClips is invalid", () => {
	let invalidParams = [undefined, NaN];

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

// TODO > min && < max, % gap === 0, % gap !== 0

/*test("clipSuccessDelayIsOver returns false when numClips is not on the gap boundary", () => {
	let notOnGapBoundaryParams = [];

	for (let numClips of notOnGapBoundaryParams) {
		let over: boolean = RatingsHelper.clipSuccessDelayIsOver(numClips);
		strictEqual(over, false, "numClips is in range but not on the gap boundary with value " + numClips);
	}
});*/

test("clipSuccessDelayIsOver returns true when numClips is in range and on the gap boundary", () => {
	let validParams = [Constants.Settings.minClipSuccessForRatingsPrompt, Constants.Settings.maxClipSuccessForRatingsPrompt];

	for (let numClips of validParams) {
		let over: boolean = RatingsHelper.clipSuccessDelayIsOver(numClips);
		strictEqual(over, true, "numClips is valid with value " + numClips);
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
	let invalidParams: string[] = ["3.3.-999", "3.3.0", "4.-999.-999"];
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
	Settings.setSettingsJsonForTesting({});

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
	Settings.setSettingsJsonForTesting({});

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
	Settings.setSettingsJsonForTesting({});

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

// setLastBadRating

test("setLastBadRating sets lastBadRatingDate in storage and returns false when lastBadRatingDate does not exist in storage", (assert: QUnitAssert) => {
	let done = assert.async();

	let badRatingDateToSet: string = Date.now().toString();
	let badRatingVersionToSet = "3.0.0";

	let alreadyRatedBad: boolean = RatingsHelper.setLastBadRating(badRatingDateToSet, badRatingVersionToSet);
	strictEqual(alreadyRatedBad, false);
	Clipper.Storage.getValue(Constants.StorageKeys.lastBadRatingDate, (badRateDateAsStr: string) => {
		Clipper.Storage.getValue(Constants.StorageKeys.lastBadRatingVersion, (badRateVersionAsStr: string) => {
			strictEqual(badRateDateAsStr, badRatingDateToSet, "bad rating date is incorrect");
			strictEqual(badRateVersionAsStr, badRatingVersionToSet, "bad rating version is incorrect");
			done();
		});
	});
});

test("setLastBadRating sets lastBadRatingDate in storage and returns false when lastBadRatingDate is not a number", (assert: QUnitAssert) => {
	let done = assert.async();

	Clipper.Storage.setValue(Constants.StorageKeys.lastBadRatingDate, "not a number");

	let badRatingDateToSet: string = Date.now().toString();
	let badRatingVersionToSet = "3.0.0";

	let alreadyRatedBad: boolean = RatingsHelper.setLastBadRating(badRatingDateToSet, badRatingVersionToSet);
	strictEqual(alreadyRatedBad, false);
	Clipper.Storage.getValue(Constants.StorageKeys.lastBadRatingDate, (badRateDateAsStr: string) => {
		Clipper.Storage.getValue(Constants.StorageKeys.lastBadRatingVersion, (badRateVersionAsStr: string) => {
			strictEqual(badRateDateAsStr, badRatingDateToSet, "bad rating date is incorrect");
			strictEqual(badRateVersionAsStr, badRatingVersionToSet, "bad rating version is incorrect");
			done();
		});
	});
});

test("setLastBadRating sets lastBadRatingDate in storage and returns false when lastBadRatingDate is a number out of date range", (assert: QUnitAssert) => {
	let done = assert.async();

	Clipper.Storage.setValue(Constants.StorageKeys.lastBadRatingDate, (Constants.Settings.maximumJSTimeValue + 1).toString());

	let badRatingDateToSet: string = Date.now().toString();
	let badRatingVersionToSet = "3.0.0";

	let alreadyRatedBad: boolean = RatingsHelper.setLastBadRating(badRatingDateToSet, badRatingVersionToSet);
	strictEqual(alreadyRatedBad, false);
	Clipper.Storage.getValue(Constants.StorageKeys.lastBadRatingDate, (badRateDateAsStr: string) => {
		Clipper.Storage.getValue(Constants.StorageKeys.lastBadRatingVersion, (badRateVersionAsStr: string) => {
			strictEqual(badRateDateAsStr, badRatingDateToSet, "bad rating date is incorrect");
			strictEqual(badRateVersionAsStr, badRatingVersionToSet, "bad rating version is incorrect");
			done();
		});
	});
});

test("setLastBadRating sets lastBadRatingDate in storage and returns true when lastBadRatingDate is a valid number", (assert: QUnitAssert) => {
	let done = assert.async();

	Clipper.Storage.setValue(Constants.StorageKeys.lastBadRatingDate, Date.now().toString());

	let badRatingDateToSet: string = Date.now().toString();
	let badRatingVersionToSet = "3.0.0";

	let alreadyRatedBad: boolean = RatingsHelper.setLastBadRating(badRatingDateToSet, badRatingVersionToSet);
	strictEqual(alreadyRatedBad, true);
	Clipper.Storage.getValue(Constants.StorageKeys.lastBadRatingDate, (badRateDateAsStr: string) => {
		Clipper.Storage.getValue(Constants.StorageKeys.lastBadRatingVersion, (badRateVersionAsStr: string) => {
			strictEqual(badRateDateAsStr, badRatingDateToSet, "bad rating date is incorrect");
			strictEqual(badRateVersionAsStr, badRatingVersionToSet, "bad rating version is incorrect");
			done();
		});
	});
});

test("setLastBadRating rejects when badRatingDateToSet is not a valid date", () => {
	let badRatingDateToSet: string = (Constants.Settings.maximumJSTimeValue + 1).toString();
	let badRatingVersionToSet = "3.0.0";

	let alreadyRatedBad: boolean = RatingsHelper.setLastBadRating(badRatingDateToSet, badRatingVersionToSet);
	strictEqual(alreadyRatedBad, true);
});

test("setLastBadRating rejects when badRatingVersionToSet is not in a valid version format", () => {
	let badRatingDateToSet: string = Date.now().toString();
	let badRatingVersionToSet = "12345";

	let alreadyRatedBad: boolean = RatingsHelper.setLastBadRating(badRatingDateToSet, badRatingVersionToSet);
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

	Clipper.Storage.setValue(Constants.StorageKeys.doNotPromptRatings, "tRuE");

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

	Clipper.Storage.setValue(Constants.StorageKeys.doNotPromptRatings, "invalid");
	Clipper.Storage.setValue(Constants.StorageKeys.numSuccessfulClips, Constants.Settings.minClipSuccessForRatingsPrompt.toString());

	let clipperState = HelperFunctions.getMockClipperState();

	let shouldShowRatingsPrompt: boolean = RatingsHelper.shouldShowRatingsPrompt(clipperState);
	strictEqual(shouldShowRatingsPrompt, true);
});

test("shouldShowRatingsPrompt returns true when a valid configuration is provided", () => {
	Settings.setSettingsJsonForTesting({
		"ChromeExtension_RatingsEnabled": {
			"Value": "true"
		}
	});

	Clipper.Storage.setValue(Constants.StorageKeys.numSuccessfulClips, Constants.Settings.minClipSuccessForRatingsPrompt.toString());
	Clipper.Storage.setValue(Constants.StorageKeys.lastBadRatingDate, (Date.now() - Constants.Settings.minTimeBetweenBadRatings).toString());
	Clipper.Storage.setValue(Constants.StorageKeys.lastBadRatingVersion, "3.0.9");
	Clipper.Storage.setValue(Constants.StorageKeys.lastSeenVersion, "3.1.0");

	let clipperState = HelperFunctions.getMockClipperState();

	let shouldShowRatingsPrompt: boolean = RatingsHelper.shouldShowRatingsPrompt(clipperState);
	strictEqual(shouldShowRatingsPrompt, true);
});

test("shouldShowRatingsPrompt returns false when number of successful clips is below the min", () => {
	Settings.setSettingsJsonForTesting({
		"ChromeExtension_RatingsEnabled": {
			"Value": "true"
		}
	});

	Clipper.Storage.setValue(Constants.StorageKeys.numSuccessfulClips, (Constants.Settings.minClipSuccessForRatingsPrompt - 1).toString());
	Clipper.Storage.setValue(Constants.StorageKeys.lastBadRatingDate, (Date.now() - Constants.Settings.minTimeBetweenBadRatings).toString());
	Clipper.Storage.setValue(Constants.StorageKeys.lastBadRatingVersion, "3.0.9");
	Clipper.Storage.setValue(Constants.StorageKeys.lastSeenVersion, "3.1.0");

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

	Clipper.Storage.setValue(Constants.StorageKeys.numSuccessfulClips, Constants.Settings.minClipSuccessForRatingsPrompt.toString());
	Clipper.Storage.setValue(Constants.StorageKeys.lastBadRatingDate, (Date.now() - Constants.Settings.minTimeBetweenBadRatings + timeDiffInMs).toString());
	Clipper.Storage.setValue(Constants.StorageKeys.lastBadRatingVersion, "3.0.9");
	Clipper.Storage.setValue(Constants.StorageKeys.lastSeenVersion, "3.1.0");

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

	Clipper.Storage.setValue(Constants.StorageKeys.numSuccessfulClips, Constants.Settings.minClipSuccessForRatingsPrompt.toString());
	Clipper.Storage.setValue(Constants.StorageKeys.lastBadRatingDate, (Date.now() - Constants.Settings.minTimeBetweenBadRatings).toString());
	Clipper.Storage.setValue(Constants.StorageKeys.lastBadRatingVersion, "3.0.9");
	Clipper.Storage.setValue(Constants.StorageKeys.lastSeenVersion, "3.0.999");

	let clipperState = HelperFunctions.getMockClipperState();

	let shouldShowRatingsPrompt: boolean = RatingsHelper.shouldShowRatingsPrompt(clipperState);
	strictEqual(shouldShowRatingsPrompt, false);
});

// getDialogButtons

test("getDialogButtons: 'Positive' click at RatingsPromptStage.INIT goes to RatingsPromptStage.RATE when rate url exists", (assert: QUnitAssert) => {
	let done = assert.async();

	Settings.setSettingsJsonForTesting({
		"ChromeExtension_RatingUrl": {
			"Value": "https://chrome.google.com/webstore/detail/onenote-web-clipper/reviews"
		}
	});

	let clipperState = HelperFunctions.getMockClipperState();
	clipperState.showRatingsPrompt = new SmartValue<boolean>(true);

	let ratingsPanel = <RatingsPanel clipperState={clipperState} />;

	let controllerInstance = HelperFunctions.mountToFixture(ratingsPanel);

	let initPositive = document.getElementById(Constants.Ids.ratingsButtonInitYes);
	HelperFunctions.simulateAction(() => {
		initPositive.click();
	});

	strictEqual(RatingsPromptStage[controllerInstance.state.userSelectedRatingsPromptStage], RatingsPromptStage[RatingsPromptStage.RATE]);

	Clipper.Storage.getValue(Constants.StorageKeys.doNotPromptRatings, (doNotPromptRatingsAsStr: string) => {
		strictEqual(doNotPromptRatingsAsStr, "true");
		done();
	});
});

test("getDialogButtons: 'Positive' click at RatingsPromptStage.INIT goes to RatingsPromptStage.END when rate url does not exist", (assert: QUnitAssert) => {
	let done = assert.async();

	Settings.setSettingsJsonForTesting({});

	let clipperState = HelperFunctions.getMockClipperState();
	clipperState.showRatingsPrompt = new SmartValue<boolean>(true);

	let ratingsPanel = <RatingsPanel clipperState={clipperState} />;

	let controllerInstance = HelperFunctions.mountToFixture(ratingsPanel);

	let initPositive = document.getElementById(Constants.Ids.ratingsButtonInitYes);
	HelperFunctions.simulateAction(() => {
		initPositive.click();
	});

	strictEqual(RatingsPromptStage[controllerInstance.state.userSelectedRatingsPromptStage], RatingsPromptStage[RatingsPromptStage.END]);

	Clipper.Storage.getValue(Constants.StorageKeys.doNotPromptRatings, (doNotPromptRatingsAsStr: string) => {
		strictEqual(doNotPromptRatingsAsStr, "true");
		done();
	});
});

// TODO how to handle asyncronicity in 'Negative' click handler

test("getDialogButtons: 'Negative' click at RatingsPromptStage.INIT without a prior bad rating goes to RatingsPromptStage.FEEDBACK when feedback url exists (and doNotPromptRatings === undefined)", (assert: QUnitAssert) => {
	let done = assert.async();

	Settings.setSettingsJsonForTesting({
		"LogCategory_RatingsPrompt": {
			"Value": TestConstants.LogCategories.oneNoteClipperUsage
		}
	});

	Clipper.Storage.setValue(Constants.StorageKeys.lastSeenVersion, "3.1.0");

	let clipperState = HelperFunctions.getMockClipperState();
	clipperState.showRatingsPrompt = new SmartValue<boolean>(true);

	let ratingsPanel = <RatingsPanel clipperState={clipperState} />;

	let controllerInstance = HelperFunctions.mountToFixture(ratingsPanel);

	let initNegative = document.getElementById(Constants.Ids.ratingsButtonInitNo);
	HelperFunctions.simulateAction(() => {
		initNegative.click();
	});

	strictEqual(RatingsPromptStage[controllerInstance.state.userSelectedRatingsPromptStage], RatingsPromptStage[RatingsPromptStage.FEEDBACK]);

	Clipper.Storage.getValue(Constants.StorageKeys.doNotPromptRatings, (doNotPromptRatingsAsStr: string) => {
		strictEqual(doNotPromptRatingsAsStr, undefined);
		done();
	});
});

test("getDialogButtons: 'Negative' click at RatingsPromptStage.INIT without a prior bad rating goes to RatingsPromptStage.END when feedback url does not exist (and doNotPromptRatings === undefined)", (assert: QUnitAssert) => {
	let done = assert.async();

	Settings.setSettingsJsonForTesting({});

	Clipper.Storage.setValue(Constants.StorageKeys.lastSeenVersion, "3.1.0");

	let clipperState = HelperFunctions.getMockClipperState();
	clipperState.showRatingsPrompt = new SmartValue<boolean>(true);

	let ratingsPanel = <RatingsPanel clipperState={clipperState} />;

	let controllerInstance = HelperFunctions.mountToFixture(ratingsPanel);

	let initNegative = document.getElementById(Constants.Ids.ratingsButtonInitNo);
	HelperFunctions.simulateAction(() => {
		initNegative.click();
	});

	strictEqual(RatingsPromptStage[controllerInstance.state.userSelectedRatingsPromptStage], RatingsPromptStage[RatingsPromptStage.END]);

	Clipper.Storage.getValue(Constants.StorageKeys.doNotPromptRatings, (doNotPromptRatingsAsStr: string) => {
		strictEqual(doNotPromptRatingsAsStr, undefined);
		done();
	});
});

test("getDialogButtons: 'Negative' click at RatingsPromptStage.INIT with a prior bad rating sets doNotPromptRatings to 'true' (feedback url exists)", (assert: QUnitAssert) => {
	let done = assert.async();

	Settings.setSettingsJsonForTesting({
		"LogCategory_RatingsPrompt": {
			"Value": TestConstants.LogCategories.oneNoteClipperUsage
		}
	});

	Clipper.Storage.setValue(Constants.StorageKeys.lastBadRatingDate, (Date.now() - Constants.Settings.minTimeBetweenBadRatings).toString());
	Clipper.Storage.setValue(Constants.StorageKeys.lastSeenVersion, "3.1.0");

	let clipperState = HelperFunctions.getMockClipperState();
	clipperState.showRatingsPrompt = new SmartValue<boolean>(true);

	let ratingsPanel = <RatingsPanel clipperState={clipperState} />;

	let controllerInstance = HelperFunctions.mountToFixture(ratingsPanel);

	let initNegative = document.getElementById(Constants.Ids.ratingsButtonInitNo);
	HelperFunctions.simulateAction(() => {
		initNegative.click();
	});

	strictEqual(RatingsPromptStage[controllerInstance.state.userSelectedRatingsPromptStage], RatingsPromptStage[RatingsPromptStage.FEEDBACK]);

	Clipper.Storage.getValue(Constants.StorageKeys.doNotPromptRatings, (doNotPromptRatingsAsStr: string) => {
		strictEqual(doNotPromptRatingsAsStr, "true");
		done();
	});
});

test("getDialogButtons: 'Negative' click at RatingsPromptStage.INIT with a prior bad rating sets doNotPromptRatings to 'true' (feedback url does not exist)", (assert: QUnitAssert) => {
	let done = assert.async();

	Settings.setSettingsJsonForTesting({});

	Clipper.Storage.setValue(Constants.StorageKeys.lastBadRatingDate, (Date.now() - Constants.Settings.minTimeBetweenBadRatings).toString());
	Clipper.Storage.setValue(Constants.StorageKeys.lastSeenVersion, "3.1.0");

	let clipperState = HelperFunctions.getMockClipperState();
	clipperState.showRatingsPrompt = new SmartValue<boolean>(true);

	let ratingsPanel = <RatingsPanel clipperState={clipperState} />;

	let controllerInstance = HelperFunctions.mountToFixture(ratingsPanel);

	let initNegative = document.getElementById(Constants.Ids.ratingsButtonInitNo);
	HelperFunctions.simulateAction(() => {
		initNegative.click();
	});

	strictEqual(RatingsPromptStage[controllerInstance.state.userSelectedRatingsPromptStage], RatingsPromptStage[RatingsPromptStage.END]);

	Clipper.Storage.getValue(Constants.StorageKeys.doNotPromptRatings, (doNotPromptRatingsAsStr: string) => {
		strictEqual(doNotPromptRatingsAsStr, "true");
		done();
	});
});

test("getDialogButtons: 'Rate' click at RatingsPromptStage.RATE goes to RatingsPromptStage.END when rate url exists", () => {
	Settings.setSettingsJsonForTesting({
		"ChromeExtension_RatingUrl": {
			"Value": "https://chrome.google.com/webstore/detail/onenote-web-clipper/reviews"
		}
	});

	let clipperState = HelperFunctions.getMockClipperState();
	clipperState.showRatingsPrompt = new SmartValue<boolean>(true);

	let ratingsPanel = <RatingsPanel clipperState={clipperState} />;

	let controllerInstance = HelperFunctions.mountToFixture(ratingsPanel);

	// go to RATE panel, then click 'Rate'
	let initPositive = document.getElementById(Constants.Ids.ratingsButtonInitYes);
	HelperFunctions.simulateAction(() => {
		initPositive.click();
	});

	let ratePositive = document.getElementById(Constants.Ids.ratingsButtonRateYes);
	HelperFunctions.simulateAction(() => {
		ratePositive.click();
	});

	strictEqual(RatingsPromptStage[controllerInstance.state.userSelectedRatingsPromptStage], RatingsPromptStage[RatingsPromptStage.END]);
});

test("getDialogButtons: 'Rate' click at RatingsPromptStage.RATE not available when rate url does not exist", () => {
	let clipperState = HelperFunctions.getMockClipperState();
	clipperState.showRatingsPrompt = new SmartValue<boolean>(true);

	let ratingsPanel = <RatingsPanel clipperState={clipperState} />;

	let controllerInstance = HelperFunctions.mountToFixture(ratingsPanel);

	// go to RATE panel
	let initPositive = document.getElementById(Constants.Ids.ratingsButtonInitYes);
	HelperFunctions.simulateAction(() => {
		initPositive.click();
		// clearing rate url before rendering RATE panel
		// to test the unexpected case that we got to it without a rate url
		Settings.setSettingsJsonForTesting({});
	});

	let ratePositive = document.getElementById(Constants.Ids.ratingsButtonRateYes);

	ok(Utils.isNullOrUndefined(ratePositive), "'Rate' button should not exist");
	strictEqual(RatingsPromptStage[controllerInstance.state.userSelectedRatingsPromptStage], RatingsPromptStage[RatingsPromptStage.NONE]);
});

test("getDialogButtons: 'No Thanks' click at RatingsPromptStage.RATE goes to RatingsPromptStage.NONE when rate url exists", () => {
	Settings.setSettingsJsonForTesting({
		"ChromeExtension_RatingUrl": {
			"Value": "https://chrome.google.com/webstore/detail/onenote-web-clipper/reviews"
		}
	});

	let clipperState = HelperFunctions.getMockClipperState();
	clipperState.showRatingsPrompt = new SmartValue<boolean>(true);

	let ratingsPanel = <RatingsPanel clipperState={clipperState} />;

	let controllerInstance = HelperFunctions.mountToFixture(ratingsPanel);

	// go to RATE panel, then click 'No Thanks'
	let initPositive = document.getElementById(Constants.Ids.ratingsButtonInitYes);
	HelperFunctions.simulateAction(() => {
		initPositive.click();
	});

	let rateNegative = document.getElementById(Constants.Ids.ratingsButtonRateNo);
	HelperFunctions.simulateAction(() => {
		rateNegative.click();
	});

	strictEqual(RatingsPromptStage[controllerInstance.state.userSelectedRatingsPromptStage], RatingsPromptStage[RatingsPromptStage.NONE]);
});

test("getDialogButtons: 'No Thanks' click at RatingsPromptStage.RATE not available when rate url does not exist", () => {
	let clipperState = HelperFunctions.getMockClipperState();
	clipperState.showRatingsPrompt = new SmartValue<boolean>(true);

	let ratingsPanel = <RatingsPanel clipperState={clipperState} />;

	let controllerInstance = HelperFunctions.mountToFixture(ratingsPanel);

	// go to RATE panel
	let initPositive = document.getElementById(Constants.Ids.ratingsButtonInitYes);
	HelperFunctions.simulateAction(() => {
		initPositive.click();
		// clearing rate url before rendering RATE panel
		// to test the unexpected case that we got to it without a rate url
		Settings.setSettingsJsonForTesting({});
	});

	let rateNegative = document.getElementById(Constants.Ids.ratingsButtonRateNo);

	ok(Utils.isNullOrUndefined(rateNegative), "'No Thanks' button should not exist");
	strictEqual(RatingsPromptStage[controllerInstance.state.userSelectedRatingsPromptStage], RatingsPromptStage[RatingsPromptStage.NONE]);
});

// TODO how to handle asyncronicity in 'initNegative' click handler

test("getDialogButtons: 'Feedback' click at RatingsPromptStage.FEEDBACK goes to RatingsPromptStage.END when feedback url exists", () => {
	Settings.setSettingsJsonForTesting({
		"LogCategory_RatingsPrompt": {
			"Value": TestConstants.LogCategories.oneNoteClipperUsage
		}
	});

	Clipper.Storage.setValue(Constants.StorageKeys.lastSeenVersion, "3.1.0");

	let clipperState = HelperFunctions.getMockClipperState();
	clipperState.showRatingsPrompt = new SmartValue<boolean>(true);

	let ratingsPanel = <RatingsPanel clipperState={clipperState} />;

	let controllerInstance = HelperFunctions.mountToFixture(ratingsPanel);

	// go to FEEDBACK panel, then click 'Feedback'
	let initNegative = document.getElementById(Constants.Ids.ratingsButtonInitNo);
	HelperFunctions.simulateAction(() => {
		initNegative.click();
	});

	let feedbackPositive = document.getElementById(Constants.Ids.ratingsButtonFeedbackYes);
	HelperFunctions.simulateAction(() => {
		feedbackPositive.click();
	});

	strictEqual(RatingsPromptStage[controllerInstance.state.userSelectedRatingsPromptStage], RatingsPromptStage[RatingsPromptStage.END]);
});

test("getDialogButtons: 'Feedback' click at RatingsPromptStage.FEEDBACK not available when feedback url does not exist", () => {
	Clipper.Storage.setValue(Constants.StorageKeys.lastSeenVersion, "3.1.0");

	let clipperState = HelperFunctions.getMockClipperState();
	clipperState.showRatingsPrompt = new SmartValue<boolean>(true);

	let ratingsPanel = <RatingsPanel clipperState={clipperState} />;

	let controllerInstance = HelperFunctions.mountToFixture(ratingsPanel);

	// go to FEEDBACK panel
	let initNegative = document.getElementById(Constants.Ids.ratingsButtonInitNo);
	HelperFunctions.simulateAction(() => {
		initNegative.click();
		// clearing feedback url before rendering FEEDBACK panel
		// to test the unexpected case that we got to it without a feedback url
		Settings.setSettingsJsonForTesting({});
	});

	let feedbackPositive = document.getElementById(Constants.Ids.ratingsButtonFeedbackYes);

	ok(Utils.isNullOrUndefined(feedbackPositive), "'Feedback' button should not exist");
	strictEqual(RatingsPromptStage[controllerInstance.state.userSelectedRatingsPromptStage], RatingsPromptStage[RatingsPromptStage.NONE]);
});

test("getDialogButtons: 'No Thanks' click at RatingsPromptStage.FEEDBACK goes to RatingsPromptStage.NONE when feedback url exists", () => {
	Settings.setSettingsJsonForTesting({
		"LogCategory_RatingsPrompt": {
			"Value": TestConstants.LogCategories.oneNoteClipperUsage
		}
	});

	Clipper.Storage.setValue(Constants.StorageKeys.lastSeenVersion, "3.1.0");

	let clipperState = HelperFunctions.getMockClipperState();
	clipperState.showRatingsPrompt = new SmartValue<boolean>(true);

	let ratingsPanel = <RatingsPanel clipperState={clipperState} />;

	let controllerInstance = HelperFunctions.mountToFixture(ratingsPanel);

	// go to FEEDBACK panel, then click 'No Thanks'
	let initNegative = document.getElementById(Constants.Ids.ratingsButtonInitNo);
	HelperFunctions.simulateAction(() => {
		initNegative.click();
	});

	let feedbackNegative = document.getElementById(Constants.Ids.ratingsButtonFeedbackNo);
	HelperFunctions.simulateAction(() => {
		feedbackNegative.click();
	});

	strictEqual(RatingsPromptStage[controllerInstance.state.userSelectedRatingsPromptStage], RatingsPromptStage[RatingsPromptStage.NONE]);
});

test("getDialogButtons: 'No Thanks' click at RatingsPromptStage.FEEDBACK not available when feedback url does not exist", () => {
	Clipper.Storage.setValue(Constants.StorageKeys.lastSeenVersion, "3.1.0");

	let clipperState = HelperFunctions.getMockClipperState();
	clipperState.showRatingsPrompt = new SmartValue<boolean>(true);

	let ratingsPanel = <RatingsPanel clipperState={clipperState} />;

	let controllerInstance = HelperFunctions.mountToFixture(ratingsPanel);

	// go to FEEDBACK panel
	let initNegative = document.getElementById(Constants.Ids.ratingsButtonInitNo);
	HelperFunctions.simulateAction(() => {
		initNegative.click();
		// clearing feedback url before rendering FEEDBACK panel
		// to test the unexpected case that we got to it without a feedback url
		Settings.setSettingsJsonForTesting({});
	});

	let feedbackNegative = document.getElementById(Constants.Ids.ratingsButtonFeedbackNo);

	ok(Utils.isNullOrUndefined(feedbackNegative), "'No Thanks' button should not exist");
	strictEqual(RatingsPromptStage[controllerInstance.state.userSelectedRatingsPromptStage], RatingsPromptStage[RatingsPromptStage.NONE]);
});

// test("", () => { });
