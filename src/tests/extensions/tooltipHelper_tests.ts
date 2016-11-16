import {Constants} from "../../scripts/constants";

import {TooltipType} from "../../scripts/clipperUI/tooltipType";

import {TooltipHelper} from "../../scripts/extensions/tooltipHelper";

import {Storage} from "../../scripts/storage/storage";
import {ClipperStorageKeys} from "../../scripts/storage/clipperStorageKeys";

import {MockStorage} from "../storage/mockStorage";

import {TestModule} from "../testModule";

export class TooltipHelperTests extends TestModule {
	private tooltipHelper: TooltipHelper;
	private mockStorage: Storage;
	private testType = TooltipType.Pdf;
	private validTypes = [TooltipType.Pdf, TooltipType.Product, TooltipType.Recipe, TooltipType.Video];
	private baseTime = new Date("09/27/2016 00:00:00 PM").getTime();

	protected module() {
		return "this.tooltipHelper";
	}

	protected beforeEach() {
		this.mockStorage = new MockStorage();
		this.tooltipHelper = new TooltipHelper(this.mockStorage);
	}

	protected tests() {
		// undefined clipped time, undefined lastSeenTime should return 0
		// null clipped time, null lastSeenTime
		test("Null or undefined passed to getTooltipInformation should throw an Error", () => {
			/* tslint:disable:no-null-keyword */
			throws(() => {
				this.tooltipHelper.getTooltipInformation(undefined, undefined);
			});
			throws(() => {
				this.tooltipHelper.getTooltipInformation(ClipperStorageKeys.lastSeenTooltipTimeBase, undefined);
			});
			throws(() => {
				this.tooltipHelper.getTooltipInformation(undefined, this.testType);
			});
			throws(() => {
				this.tooltipHelper.getTooltipInformation(null, null);
			});
			throws(() => {
				this.tooltipHelper.getTooltipInformation(ClipperStorageKeys.lastSeenTooltipTimeBase, null);
			});
			throws(() => {
				this.tooltipHelper.getTooltipInformation(null, this.testType);
			});
			/* tslint:enable:no-null-keyword */
		});

		test("getTooltipInformation should return 0 for a value that is not in storage", () => {
			let value = this.tooltipHelper.getTooltipInformation(ClipperStorageKeys.lastSeenTooltipTimeBase, this.testType);
			strictEqual(value, 0);
		});

		test("getTooltipInformation should return 0 for an invalid value", () => {
			let storageKey = TooltipHelper.getStorageKeyForTooltip(ClipperStorageKeys.lastSeenTooltipTimeBase, this.testType);
			let expected = "blah";
			this.mockStorage.setValue(storageKey, expected);
			let value = this.tooltipHelper.getTooltipInformation(ClipperStorageKeys.lastSeenTooltipTimeBase, this.testType);
			strictEqual(value, 0);
		});

		test("getTooltipInformation should return correct information for a value that is in storage", () => {
			let storageKey = TooltipHelper.getStorageKeyForTooltip(ClipperStorageKeys.lastSeenTooltipTimeBase, this.testType);
			let expected = 1234;
			this.mockStorage.setValue(storageKey, expected.toString());
			let value = this.tooltipHelper.getTooltipInformation(ClipperStorageKeys.lastSeenTooltipTimeBase, this.testType);
			strictEqual(value, expected);
		});

		test("Null or undefined passed to setTooltipInformation should throw an Error", () => {
			/* tslint:disable:no-null-keyword */
			throws(() => {
				this.tooltipHelper.setTooltipInformation(undefined, undefined, "");
			});
			throws(() => {
				this.tooltipHelper.setTooltipInformation(ClipperStorageKeys.lastSeenTooltipTimeBase, undefined, "");
			});
			throws(() => {
				this.tooltipHelper.setTooltipInformation(undefined, this.testType, "");
			});
			throws(() => {
				this.tooltipHelper.setTooltipInformation(null, null, "");
			});
			throws(() => {
				this.tooltipHelper.setTooltipInformation(ClipperStorageKeys.lastSeenTooltipTimeBase, null, "");
			});
			throws(() => {
				this.tooltipHelper.setTooltipInformation(null, this.testType, "");
			});
			/* tslint:enable:no-null-keyword */
		});

		test("setTooltipInformation should correctly set the key and value when given valid arguments", () => {
			let val = 4134134;
			this.tooltipHelper.setTooltipInformation(ClipperStorageKeys.lastSeenTooltipTimeBase, this.testType, val.toString());
			let actual = this.tooltipHelper.getTooltipInformation(ClipperStorageKeys.lastSeenTooltipTimeBase, this.testType);
			strictEqual(actual, val);
		});

		test("Null or undefined passed to tooltipDelayIsOver should throw an Error", () => {
			/* tslint:disable:no-null-keyword */
			throws(() => {
				this.tooltipHelper.tooltipDelayIsOver(undefined, null);
			});
			throws(() => {
				this.tooltipHelper.tooltipDelayIsOver(null, null);
			});
			/* tslint:enable:no-null-keyword */
		});

		test("tooltipHasBeenSeenInLastTimePeriod should return FALSE when nothing is in storage", () => {
			ok(!this.tooltipHelper.tooltipHasBeenSeenInLastTimePeriod(this.baseTime, this.testType, Constants.Settings.timeBetweenSameTooltip));
		});

		test("tooltipHasBeenSeenInLastTimePeriod should return FALSE when a value is in storage but it is outside the time period", () => {
			this.setSeenTimeOutsideOfRange(this.testType, Constants.Settings.timeBetweenSameTooltip);
			ok(!this.tooltipHelper.tooltipHasBeenSeenInLastTimePeriod(this.baseTime, this.testType, Constants.Settings.timeBetweenSameTooltip));
		});

		test("tooltipHasBeenSeenInLastTimePeriod should return TRUE when a value is in storage and is within the time period", () => {
			this.setSeenTimeWithinRange(this.testType, Constants.Settings.timeBetweenSameTooltip);
			ok(this.tooltipHelper.tooltipHasBeenSeenInLastTimePeriod(this.testType, this.baseTime, Constants.Settings.timeBetweenSameTooltip));
		});

		test("hasAnyTooltipBeenSeenInLastTimePeriod should return FALSE when nothing is in storage", () => {
			ok(!this.tooltipHelper.hasAnyTooltipBeenSeenInLastTimePeriod(this.baseTime, this.validTypes, Constants.Settings.timeBetweenDifferentTooltips));
		});

		test("hasAnyTooltipBeenSeenInLastTimePeriod should return TRUE if at least one of the tooltips has a lastSeenTooltipTime in Storage within the time period", () => {
			this.setSeenTimeWithinRange(this.testType, Constants.Settings.timeBetweenDifferentTooltips);
			ok(this.tooltipHelper.hasAnyTooltipBeenSeenInLastTimePeriod(this.baseTime, this.validTypes, Constants.Settings.timeBetweenDifferentTooltips));
		});

		test("tooltipDelayIsOver should return TRUE when nothing in in storage", () => {
			ok(this.tooltipHelper.tooltipDelayIsOver(this.testType, this.baseTime));
		});

		// Have they clipped this content? If so, return FALSE
		test("tooltipDelayIsOver should return FALSE when the user has clipped this content type regardless of when they Clipped it and the rest of the values in storage", () => {
			this.setClipTimeWithinRange();
			ok(!this.tooltipHelper.tooltipDelayIsOver(this.testType, this.baseTime));
			this.setClipTimeOutsideOfRange();
			ok(!this.tooltipHelper.tooltipDelayIsOver(this.testType, this.baseTime));
		});

		// Have they seen ANY content? If so, return FALSE
		test("tooltipDelayIsOver should return FALSE when they have seen a tooltip in the last Constants.Settings.timeBetweenSameTooltip period", () => {
			this.setSeenTimeWithinRange(this.testType, Constants.Settings.timeBetweenSameTooltip);
			ok(!this.tooltipHelper.tooltipDelayIsOver(this.testType, this.baseTime));
		});

		test("tooltipDelayIsOver should return FALSE when they have seen a tooltip (not the same one) in the last Constants.Settings.timeBetweenDifferentTooltipsPeriod", () => {
			this.setSeenTimeWithinRange(TooltipType.Pdf, Constants.Settings.timeBetweenDifferentTooltips);
			ok(!this.tooltipHelper.tooltipDelayIsOver(TooltipType.Product, this.baseTime));
		});

		test("tooltipDelayIsOver should return TRUE if they have NOT seen a different tooltip in the last Constants.Settings.timeBetweenDifferentTooltipsPeriod", () => {
			this.setSeenTimeOutsideOfRange(TooltipType.Product, Constants.Settings.timeBetweenDifferentTooltips);
			ok(this.tooltipHelper.tooltipDelayIsOver(this.testType, this.baseTime));
		});

		// Has the user has seen the tooltip more than maxTooltipsShown times? If so, return FALSE
		test("tooltipDelayIsOVer should return FALSE when the user has seen this tooltip more than maxTooltipsShown times", () => {
			this.setNumTimesTooltipHasBeenSeen(Constants.Settings.maximumNumberOfTimesToShowTooltips);
			ok(!this.tooltipHelper.tooltipDelayIsOver(this.testType, this.baseTime));
		});

		test("tooltipDelayIsOver should return TRUE when the user hasn't seen a tooltip in a while, they've never clipped this content, and they haven't gone over the max number of times to see the tooltip", () => {
			this.setSeenTimeOutsideOfRange(this.testType, Constants.Settings.timeBetweenSameTooltip);
			ok(this.tooltipHelper.tooltipDelayIsOver(this.testType, this.baseTime));
		});

		test("tooltipDelayIsOver should return FALSE when the user has seen a tooltip in the last Constants.Settings.timeBetweenSameTooltip period, no matter the value of lastClippedTime", () => {
			this.setSeenTimeWithinRange(this.testType, Constants.Settings.timeBetweenSameTooltip);
			ok(!this.tooltipHelper.tooltipDelayIsOver(this.testType, this.baseTime));

			this.setClipTimeOutsideOfRange();
			ok(!this.tooltipHelper.tooltipDelayIsOver(this.testType, this.baseTime));

			this.setClipTimeWithinRange();
			ok(!this.tooltipHelper.tooltipDelayIsOver(this.testType, this.baseTime));
		});

		test("tooltipDelayIsOver should return FALSE when the user has clipped a tooltip, no matter the value of lastSeenTime", () => {
			this.setClipTimeWithinRange();
			ok(!this.tooltipHelper.tooltipDelayIsOver(this.testType, this.baseTime));

			this.setSeenTimeOutsideOfRange(this.testType, Constants.Settings.timeBetweenSameTooltip);
			ok(!this.tooltipHelper.tooltipDelayIsOver(this.testType, this.baseTime));

			this.setSeenTimeWithinRange(this.testType, Constants.Settings.timeBetweenSameTooltip);
			ok(!this.tooltipHelper.tooltipDelayIsOver(this.testType, this.baseTime));
		});
	}

	private setClipTimeWithinRange() {
		let timeToSet = this.baseTime - Constants.Settings.timeBetweenSameTooltip + 5000;
		this.tooltipHelper.setTooltipInformation(ClipperStorageKeys.lastClippedTooltipTimeBase, this.testType, timeToSet.toString());
	}

	private setClipTimeOutsideOfRange() {
		let timeToSet = this.baseTime - Constants.Settings.timeBetweenSameTooltip - 5000;
		this.tooltipHelper.setTooltipInformation(ClipperStorageKeys.lastClippedTooltipTimeBase, this.testType, timeToSet.toString());
	}

	private setSeenTimeWithinRange(tooltipType: TooltipType, timePeriod: number) {
		let timeToSet = this.baseTime - timePeriod + 5000;
		this.tooltipHelper.setTooltipInformation(ClipperStorageKeys.lastSeenTooltipTimeBase, tooltipType, timeToSet.toString());
	}

	private setSeenTimeOutsideOfRange(tooltipType: TooltipType, timePeriod: number) {
		let timeToSet = this.baseTime - timePeriod - 5000;
		this.tooltipHelper.setTooltipInformation(ClipperStorageKeys.lastSeenTooltipTimeBase, tooltipType, timeToSet.toString());
	}

	private setNumTimesTooltipHasBeenSeen(times: number) {
		this.tooltipHelper.setTooltipInformation(ClipperStorageKeys.numTimesTooltipHasBeenSeenBase, this.testType, times.toString());
	}
}

(new TooltipHelperTests()).runTests();
