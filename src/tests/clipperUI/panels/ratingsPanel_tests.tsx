import {DialogButton} from "../../../scripts/clipperUI/panels/dialogPanel";
import {RatingsPanel} from "../../../scripts/clipperUI/panels/ratingsPanel";

import {Clipper} from "../../../scripts/clipperUI/frontEndGlobals";
import {RatingsHelper, RatingsPromptStage} from "../../../scripts/clipperUI/ratingsHelper";

import {SmartValue} from "../../../scripts/communicator/smartValue";

import {StubSessionLogger} from "../../../scripts/logging/stubSessionLogger";

import {ClipperStorageKeys} from "../../../scripts/storage/clipperStorageKeys";

import {Constants} from "../../../scripts/constants";
import {ObjectUtils} from "../../../scripts/objectUtils";
import {Settings} from "../../../scripts/settings";

import {HelperFunctions} from "../../helperFunctions";
import {MithrilUtils} from "../../mithrilUtils";
import {MockProps} from "../../mockProps";
import {TestModule} from "../../testModule";

module TestConstants {
	export module LogCategories {
		export var oneNoteClipperUsage = "OneNoteClipperUsage";
	}
	export module Urls {
		export var clipperFeedbackUrl = "https://www.onenote.com/feedback";
	}
}

export class RatingsPanelTests extends TestModule {
	private mockStorage: { [key: string]: string };
	private mockStorageCache: { [key: string]: string };

	protected module() {
		return "ratingsPanel";
	}

	protected beforeEach() {
		Settings.setSettingsJsonForTesting({});

		this.mockStorage = {};
		this.mockStorageCache = {};
		HelperFunctions.mockFrontEndGlobals(this.mockStorage, this.mockStorageCache);
		RatingsHelper.preCacheNeededValues();
	}

	protected tests() {
		test("'Positive' click at RatingsPromptStage.Init goes to RatingsPromptStage.Rate when rate url exists", (assert: QUnitAssert) => {
			let done = assert.async();

			Settings.setSettingsJsonForTesting({
				"ChromeExtension_RatingUrl": {
					"Value": "https://chrome.google.com/webstore/detail/onenote-web-clipper/reviews"
				}
			});

			let clipperState = MockProps.getMockClipperState();
			clipperState.showRatingsPrompt = true;

			let ratingsPanel = <RatingsPanel clipperState={clipperState} />;

			let controllerInstance = MithrilUtils.mountToFixture(ratingsPanel);

			let initPositive = document.getElementById(Constants.Ids.ratingsButtonInitYes);
			MithrilUtils.simulateAction(() => {
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

			let clipperState = MockProps.getMockClipperState();
			clipperState.showRatingsPrompt = true;

			let ratingsPanel = <RatingsPanel clipperState={clipperState} />;

			let controllerInstance = MithrilUtils.mountToFixture(ratingsPanel);

			let initPositive = document.getElementById(Constants.Ids.ratingsButtonInitYes);
			MithrilUtils.simulateAction(() => {
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

			let clipperState = MockProps.getMockClipperState();
			clipperState.showRatingsPrompt = true;

			let ratingsPanel = <RatingsPanel clipperState={clipperState} />;

			let controllerInstance = MithrilUtils.mountToFixture(ratingsPanel);

			let initNegative = document.getElementById(Constants.Ids.ratingsButtonInitNo);
			MithrilUtils.simulateAction(() => {
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

			Clipper.storeValue(ClipperStorageKeys.lastSeenVersion, "3.1.0");

			let clipperState = MockProps.getMockClipperState();
			clipperState.showRatingsPrompt = true;

			let ratingsPanel = <RatingsPanel clipperState={clipperState} />;

			let controllerInstance = MithrilUtils.mountToFixture(ratingsPanel);

			let initNegative = document.getElementById(Constants.Ids.ratingsButtonInitNo);
			MithrilUtils.simulateAction(() => {
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

			let clipperState = MockProps.getMockClipperState();
			clipperState.showRatingsPrompt = true;

			let ratingsPanel = <RatingsPanel clipperState={clipperState} />;

			let controllerInstance = MithrilUtils.mountToFixture(ratingsPanel);

			let initNegative = document.getElementById(Constants.Ids.ratingsButtonInitNo);
			MithrilUtils.simulateAction(() => {
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

			Clipper.storeValue(ClipperStorageKeys.lastBadRatingDate, (Date.now() - Constants.Settings.minTimeBetweenBadRatings).toString());
			Clipper.storeValue(ClipperStorageKeys.lastSeenVersion, "3.1.0");

			let clipperState = MockProps.getMockClipperState();
			clipperState.showRatingsPrompt = true;

			let ratingsPanel = <RatingsPanel clipperState={clipperState} />;

			let controllerInstance = MithrilUtils.mountToFixture(ratingsPanel);

			let initNegative = document.getElementById(Constants.Ids.ratingsButtonInitNo);
			MithrilUtils.simulateAction(() => {
				initNegative.click();
			});

			strictEqual(RatingsPromptStage[controllerInstance.state.userSelectedRatingsPromptStage], RatingsPromptStage[RatingsPromptStage.End]);

			Clipper.getStoredValue(ClipperStorageKeys.doNotPromptRatings, (doNotPromptRatingsAsStr: string) => {
				strictEqual(doNotPromptRatingsAsStr, "true");
				done();
			});
		});

		test("'Rate' click at RatingsPromptStage.Rate goes to RatingsPromptStage.End when rate url exists", () => {
			Settings.setSettingsJsonForTesting({
				"ChromeExtension_RatingUrl": {
					"Value": "https://chrome.google.com/webstore/detail/onenote-web-clipper/reviews"
				}
			});

			let clipperState = MockProps.getMockClipperState();
			clipperState.showRatingsPrompt = true;

			let ratingsPanel = <RatingsPanel clipperState={clipperState} />;

			let controllerInstance = MithrilUtils.mountToFixture(ratingsPanel);

			// skip to RATE panel
			controllerInstance.setState({ currentRatingsPromptStage: RatingsPromptStage.Rate });
			m.redraw(true);

			let ratePositive = document.getElementById(Constants.Ids.ratingsButtonRateYes);
			MithrilUtils.simulateAction(() => {
				ratePositive.click();
			});

			strictEqual(RatingsPromptStage[controllerInstance.state.userSelectedRatingsPromptStage], RatingsPromptStage[RatingsPromptStage.End]);
		});

		test("'Rate' click at RatingsPromptStage.Rate not available when rate url does not exist (unexpected scenario)", () => {
			let clipperState = MockProps.getMockClipperState();
			clipperState.showRatingsPrompt = true;

			let ratingsPanel = <RatingsPanel clipperState={clipperState} />;

			let controllerInstance = MithrilUtils.mountToFixture(ratingsPanel);

			// skip to RATE panel
			controllerInstance.setState({ currentRatingsPromptStage: RatingsPromptStage.Rate });
			m.redraw(true);

			let ratePositive = document.getElementById(Constants.Ids.ratingsButtonRateYes);
			ok(ObjectUtils.isNullOrUndefined(ratePositive), "'Rate' button should not exist");

			strictEqual(RatingsPromptStage[controllerInstance.state.userSelectedRatingsPromptStage], RatingsPromptStage[RatingsPromptStage.None]);
		});

		test("'No Thanks' click at RatingsPromptStage.Rate goes to RatingsPromptStage.None when rate url exists", () => {
			Settings.setSettingsJsonForTesting({
				"ChromeExtension_RatingUrl": {
					"Value": "https://chrome.google.com/webstore/detail/onenote-web-clipper/reviews"
				}
			});

			let clipperState = MockProps.getMockClipperState();
			clipperState.showRatingsPrompt = true;

			let ratingsPanel = <RatingsPanel clipperState={clipperState} />;

			let controllerInstance = MithrilUtils.mountToFixture(ratingsPanel);

			// skip to RATE panel
			controllerInstance.setState({ currentRatingsPromptStage: RatingsPromptStage.Rate });
			m.redraw(true);

			let rateNegative = document.getElementById(Constants.Ids.ratingsButtonRateNo);
			MithrilUtils.simulateAction(() => {
				rateNegative.click();
			});

			strictEqual(RatingsPromptStage[controllerInstance.state.userSelectedRatingsPromptStage], RatingsPromptStage[RatingsPromptStage.None]);
		});

		test("'No Thanks' click at RatingsPromptStage.Rate not available when rate url does not exist (unexpected scenario)", () => {
			let clipperState = MockProps.getMockClipperState();
			clipperState.showRatingsPrompt = true;

			let ratingsPanel = <RatingsPanel clipperState={clipperState} />;

			let controllerInstance = MithrilUtils.mountToFixture(ratingsPanel);

			// skip to RATE panel
			controllerInstance.setState({ currentRatingsPromptStage: RatingsPromptStage.Rate });
			m.redraw(true);

			let rateNegative = document.getElementById(Constants.Ids.ratingsButtonRateNo);
			ok(ObjectUtils.isNullOrUndefined(rateNegative), "'No Thanks' button should not exist");

			strictEqual(RatingsPromptStage[controllerInstance.state.userSelectedRatingsPromptStage], RatingsPromptStage[RatingsPromptStage.None]);
		});

		test("'Feedback' click at RatingsPromptStage.Feedback goes to RatingsPromptStage.End when feedback url exists", () => {
			Settings.setSettingsJsonForTesting({
				"LogCategory_RatingsPrompt": {
					"Value": TestConstants.LogCategories.oneNoteClipperUsage
				}
			});

			Clipper.storeValue(ClipperStorageKeys.lastSeenVersion, "3.1.0");

			let clipperState = MockProps.getMockClipperState();
			clipperState.showRatingsPrompt = true;

			let ratingsPanel = <RatingsPanel clipperState={clipperState} />;

			let controllerInstance = MithrilUtils.mountToFixture(ratingsPanel);

			// skip to FEEDBACK panel
			controllerInstance.setState({ currentRatingsPromptStage: RatingsPromptStage.Feedback });
			m.redraw(true);

			let feedbackPositive = document.getElementById(Constants.Ids.ratingsButtonFeedbackYes);
			MithrilUtils.simulateAction(() => {
				feedbackPositive.click();
			});

			strictEqual(RatingsPromptStage[controllerInstance.state.userSelectedRatingsPromptStage], RatingsPromptStage[RatingsPromptStage.End]);
		});

		test("'Feedback' click at RatingsPromptStage.Feedback not available when feedback url does not exist (unexpected scenario)", () => {
			Clipper.storeValue(ClipperStorageKeys.lastSeenVersion, "3.1.0");

			let clipperState = MockProps.getMockClipperState();
			clipperState.showRatingsPrompt = true;

			let ratingsPanel = <RatingsPanel clipperState={clipperState} />;

			let controllerInstance = MithrilUtils.mountToFixture(ratingsPanel);

			// skip to FEEDBACK panel
			controllerInstance.setState({ currentRatingsPromptStage: RatingsPromptStage.Feedback });
			m.redraw(true);

			let feedbackPositive = document.getElementById(Constants.Ids.ratingsButtonFeedbackYes);
			ok(ObjectUtils.isNullOrUndefined(feedbackPositive), "'Feedback' button should not exist");

			strictEqual(RatingsPromptStage[controllerInstance.state.userSelectedRatingsPromptStage], RatingsPromptStage[RatingsPromptStage.None]);
		});

		test("'No Thanks' click at RatingsPromptStage.Feedback goes to RatingsPromptStage.None when feedback url exists", () => {
			Settings.setSettingsJsonForTesting({
				"LogCategory_RatingsPrompt": {
					"Value": TestConstants.LogCategories.oneNoteClipperUsage
				}
			});

			Clipper.storeValue(ClipperStorageKeys.lastSeenVersion, "3.1.0");

			let clipperState = MockProps.getMockClipperState();
			clipperState.showRatingsPrompt = true;

			let ratingsPanel = <RatingsPanel clipperState={clipperState} />;

			let controllerInstance = MithrilUtils.mountToFixture(ratingsPanel);

			// skip to FEEDBACK panel
			controllerInstance.setState({ currentRatingsPromptStage: RatingsPromptStage.Feedback });
			m.redraw(true);

			let feedbackNegative = document.getElementById(Constants.Ids.ratingsButtonFeedbackNo);
			MithrilUtils.simulateAction(() => {
				feedbackNegative.click();
			});

			strictEqual(RatingsPromptStage[controllerInstance.state.userSelectedRatingsPromptStage], RatingsPromptStage[RatingsPromptStage.None]);
		});

		test("'No Thanks' click at RatingsPromptStage.Feedback not available when feedback url does not exist (unexpected scenario)", () => {
			Clipper.storeValue(ClipperStorageKeys.lastSeenVersion, "3.1.0");

			let clipperState = MockProps.getMockClipperState();
			clipperState.showRatingsPrompt = true;

			let ratingsPanel = <RatingsPanel clipperState={clipperState} />;

			let controllerInstance = MithrilUtils.mountToFixture(ratingsPanel);

			// skip to FEEDBACK panel
			controllerInstance.setState({ currentRatingsPromptStage: RatingsPromptStage.Feedback });
			m.redraw(true);

			let feedbackNegative = document.getElementById(Constants.Ids.ratingsButtonFeedbackNo);
			ok(ObjectUtils.isNullOrUndefined(feedbackNegative), "'No Thanks' button should not exist");

			strictEqual(RatingsPromptStage[controllerInstance.state.userSelectedRatingsPromptStage], RatingsPromptStage[RatingsPromptStage.None]);
		});
	}
}

(new RatingsPanelTests()).runTests();
