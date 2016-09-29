import {DialogButton} from "../../../scripts/clipperUI/panels/dialogPanel";
import {RatingsPanel} from "../../../scripts/clipperUI/panels/ratingsPanel";

import {Clipper} from "../../../scripts/clipperUI/frontEndGlobals";
import {RatingsHelper, RatingsPromptStage} from "../../../scripts/clipperUI/ratingsHelper";

import {SmartValue} from "../../../scripts/communicator/smartValue";

import {StubSessionLogger} from "../../../scripts/logging/stubSessionLogger";

import {ClipperStorageKeys} from "../../../scripts/storage/clipperStorageKeys";

import {Constants} from "../../../scripts/constants";
import {Settings} from "../../../scripts/settings";
import {Utils} from "../../../scripts/utils";

import {HelperFunctions} from "../../helperFunctions";

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

QUnit.module("ratingsPanel", {
	beforeEach: () => {
		Clipper.logger = new StubSessionLogger();
		Settings.setSettingsJsonForTesting();

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

test("'Positive' click at RatingsPromptStage.Init goes to RatingsPromptStage.Rate when rate url exists", (assert: QUnitAssert) => {
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

	strictEqual(RatingsPromptStage[controllerInstance.state.userSelectedRatingsPromptStage], RatingsPromptStage[RatingsPromptStage.Rate]);

	Clipper.getStoredValue(ClipperStorageKeys.doNotPromptRatings, (doNotPromptRatingsAsStr: string) => {
		strictEqual(doNotPromptRatingsAsStr, "true");
		done();
	});
});

test("'Positive' click at RatingsPromptStage.Init goes to RatingsPromptStage.End when rate url does not exist", (assert: QUnitAssert) => {
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

	strictEqual(RatingsPromptStage[controllerInstance.state.userSelectedRatingsPromptStage], RatingsPromptStage[RatingsPromptStage.End]);

	Clipper.getStoredValue(ClipperStorageKeys.doNotPromptRatings, (doNotPromptRatingsAsStr: string) => {
		strictEqual(doNotPromptRatingsAsStr, "true");
		done();
	});
});

test("'Negative' click at RatingsPromptStage.Init without a prior bad rating goes to RatingsPromptStage.Feedback when feedback url exists (and doNotPromptRatings === undefined)", (assert: QUnitAssert) => {
	let done = assert.async();

	Settings.setSettingsJsonForTesting({
		"LogCategory_RatingsPrompt": {
			"Value": TestConstants.LogCategories.oneNoteClipperUsage
		}
	});

	Clipper.storeValue(ClipperStorageKeys.lastSeenVersion, "3.1.0");

	let clipperState = HelperFunctions.getMockClipperState();
	clipperState.showRatingsPrompt = new SmartValue<boolean>(true);

	let ratingsPanel = <RatingsPanel clipperState={clipperState} />;

	let controllerInstance = HelperFunctions.mountToFixture(ratingsPanel);

	let initNegative = document.getElementById(Constants.Ids.ratingsButtonInitNo);
	HelperFunctions.simulateAction(() => {
		initNegative.click();
	});

	strictEqual(RatingsPromptStage[controllerInstance.state.userSelectedRatingsPromptStage], RatingsPromptStage[RatingsPromptStage.Feedback]);

	Clipper.getStoredValue(ClipperStorageKeys.doNotPromptRatings, (doNotPromptRatingsAsStr: string) => {
		strictEqual(doNotPromptRatingsAsStr, undefined, "doNotPromptRatings should be undefined");
		done();
	});
});

test("'Negative' click at RatingsPromptStage.Init without a prior bad rating goes to RatingsPromptStage.End when feedback url does not exist (and doNotPromptRatings === undefined)", (assert: QUnitAssert) => {
	let done = assert.async();

	Settings.setSettingsJsonForTesting({});

	Clipper.storeValue(ClipperStorageKeys.lastSeenVersion, "3.1.0");

	let clipperState = HelperFunctions.getMockClipperState();
	clipperState.showRatingsPrompt = new SmartValue<boolean>(true);

	let ratingsPanel = <RatingsPanel clipperState={clipperState} />;

	let controllerInstance = HelperFunctions.mountToFixture(ratingsPanel);

	let initNegative = document.getElementById(Constants.Ids.ratingsButtonInitNo);
	HelperFunctions.simulateAction(() => {
		initNegative.click();
	});

	strictEqual(RatingsPromptStage[controllerInstance.state.userSelectedRatingsPromptStage], RatingsPromptStage[RatingsPromptStage.End]);

	Clipper.getStoredValue(ClipperStorageKeys.doNotPromptRatings, (doNotPromptRatingsAsStr: string) => {
		strictEqual(doNotPromptRatingsAsStr, undefined, "doNotPromptRatings should be undefined");
		done();
	});
});

test("'Negative' click at RatingsPromptStage.Init with a prior bad rating sets doNotPromptRatings to 'true' (feedback url exists)", (assert: QUnitAssert) => {
	let done = assert.async();

	Settings.setSettingsJsonForTesting({
		"LogCategory_RatingsPrompt": {
			"Value": TestConstants.LogCategories.oneNoteClipperUsage
		}
	});

	Clipper.storeValue(ClipperStorageKeys.lastBadRatingDate, (Date.now() - Constants.Settings.minTimeBetweenBadRatings).toString());
	Clipper.storeValue(ClipperStorageKeys.lastSeenVersion, "3.1.0");

	let clipperState = HelperFunctions.getMockClipperState();
	clipperState.showRatingsPrompt = new SmartValue<boolean>(true);

	let ratingsPanel = <RatingsPanel clipperState={clipperState} />;

	let controllerInstance = HelperFunctions.mountToFixture(ratingsPanel);

	let initNegative = document.getElementById(Constants.Ids.ratingsButtonInitNo);
	HelperFunctions.simulateAction(() => {
		initNegative.click();
	});

	strictEqual(RatingsPromptStage[controllerInstance.state.userSelectedRatingsPromptStage], RatingsPromptStage[RatingsPromptStage.Feedback]);

	Clipper.getStoredValue(ClipperStorageKeys.doNotPromptRatings, (doNotPromptRatingsAsStr: string) => {
		strictEqual(doNotPromptRatingsAsStr, "true");
		done();
	});
});

test("'Negative' click at RatingsPromptStage.Init with a prior bad rating sets doNotPromptRatings to 'true' (feedback url does not exist)", (assert: QUnitAssert) => {
	let done = assert.async();

	Settings.setSettingsJsonForTesting({});

	Clipper.storeValue(ClipperStorageKeys.lastBadRatingDate, (Date.now() - Constants.Settings.minTimeBetweenBadRatings).toString());
	Clipper.storeValue(ClipperStorageKeys.lastSeenVersion, "3.1.0");

	let clipperState = HelperFunctions.getMockClipperState();
	clipperState.showRatingsPrompt = new SmartValue<boolean>(true);

	let ratingsPanel = <RatingsPanel clipperState={clipperState} />;

	let controllerInstance = HelperFunctions.mountToFixture(ratingsPanel);

	let initNegative = document.getElementById(Constants.Ids.ratingsButtonInitNo);
	HelperFunctions.simulateAction(() => {
		initNegative.click();
	});

	strictEqual(RatingsPromptStage[controllerInstance.state.userSelectedRatingsPromptStage], RatingsPromptStage[RatingsPromptStage.End]);

	Clipper.getStoredValue(ClipperStorageKeys.doNotPromptRatings, (doNotPromptRatingsAsStr: string) => {
		strictEqual(doNotPromptRatingsAsStr, "true");
		done();
	});
});

/*test("'Rate' click at RatingsPromptStage.Rate goes to RatingsPromptStage.End when rate url exists", () => {
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

	strictEqual(RatingsPromptStage[controllerInstance.state.userSelectedRatingsPromptStage], RatingsPromptStage[RatingsPromptStage.End]);
});

test("'Rate' click at RatingsPromptStage.Rate not available when rate url does not exist", () => {
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
	strictEqual(RatingsPromptStage[controllerInstance.state.userSelectedRatingsPromptStage], RatingsPromptStage[RatingsPromptStage.None]);
});

test("'No Thanks' click at RatingsPromptStage.Rate goes to RatingsPromptStage.None when rate url exists", () => {
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

	strictEqual(RatingsPromptStage[controllerInstance.state.userSelectedRatingsPromptStage], RatingsPromptStage[RatingsPromptStage.None]);
});

test("'No Thanks' click at RatingsPromptStage.Rate not available when rate url does not exist", () => {
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
	strictEqual(RatingsPromptStage[controllerInstance.state.userSelectedRatingsPromptStage], RatingsPromptStage[RatingsPromptStage.None]);
});

test("'Feedback' click at RatingsPromptStage.Feedback goes to RatingsPromptStage.End when feedback url exists", () => {
	Settings.setSettingsJsonForTesting({
		"LogCategory_RatingsPrompt": {
			"Value": TestConstants.LogCategories.oneNoteClipperUsage
		}
	});

	Clipper.storeValue(ClipperStorageKeys.lastSeenVersion, "3.1.0");

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

	strictEqual(RatingsPromptStage[controllerInstance.state.userSelectedRatingsPromptStage], RatingsPromptStage[RatingsPromptStage.End]);
});

test("'Feedback' click at RatingsPromptStage.Feedback not available when feedback url does not exist", () => {
	Clipper.storeValue(ClipperStorageKeys.lastSeenVersion, "3.1.0");

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
	strictEqual(RatingsPromptStage[controllerInstance.state.userSelectedRatingsPromptStage], RatingsPromptStage[RatingsPromptStage.None]);
});

test("'No Thanks' click at RatingsPromptStage.Feedback goes to RatingsPromptStage.None when feedback url exists", () => {
	Settings.setSettingsJsonForTesting({
		"LogCategory_RatingsPrompt": {
			"Value": TestConstants.LogCategories.oneNoteClipperUsage
		}
	});

	Clipper.storeValue(ClipperStorageKeys.lastSeenVersion, "3.1.0");

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

	strictEqual(RatingsPromptStage[controllerInstance.state.userSelectedRatingsPromptStage], RatingsPromptStage[RatingsPromptStage.None]);
});

test("'No Thanks' click at RatingsPromptStage.Feedback not available when feedback url does not exist", () => {
	Clipper.storeValue(ClipperStorageKeys.lastSeenVersion, "3.1.0");

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
	strictEqual(RatingsPromptStage[controllerInstance.state.userSelectedRatingsPromptStage], RatingsPromptStage[RatingsPromptStage.None]);
});*/
