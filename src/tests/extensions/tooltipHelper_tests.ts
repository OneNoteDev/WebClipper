import {Constants} from "../../scripts/constants";

import {TooltipType} from "../../scripts/clipperUI/tooltipType";

import {TooltipHelper} from "../../scripts/extensions/tooltipHelper";

import {Storage} from "../../scripts/storage/storage";
import {ClipperStorageKeys} from "../../scripts/storage/clipperStorageKeys";

import {MockStorage} from "../storage/mockStorage";

let tooltipHelper: TooltipHelper;
let mockStorage: Storage;
let testType = TooltipType.Pdf;
let validTypes = [TooltipType.Pdf, TooltipType.Product, TooltipType.Recipe, TooltipType.Video];
let baseTime = new Date("09/27/2016 00:00:00 PM").getTime();

QUnit.module("tooltipHelper", {
	beforeEach: () => {
		mockStorage = new MockStorage();
		tooltipHelper = new TooltipHelper(mockStorage);
	}
});

// undefined clipped time, undefined lastSeenTime should return 0
// null clipped time, null lastSeenTime
test("Null or undefined passed to getTooltipInformation should throw an Error", () => {
	/* tslint:disable:no-null-keyword */
	throws(() => {
		tooltipHelper.getTooltipInformation(undefined, undefined);
	});
	throws(() => {
		tooltipHelper.getTooltipInformation(ClipperStorageKeys.lastSeenTooltipTimeBase, undefined);
	});
	throws(() => {
		tooltipHelper.getTooltipInformation(undefined, testType);
	});
	throws(() => {
		tooltipHelper.getTooltipInformation(null, null);
	});
	throws(() => {
		tooltipHelper.getTooltipInformation(ClipperStorageKeys.lastSeenTooltipTimeBase, null);
	});
	throws(() => {
		tooltipHelper.getTooltipInformation(null, testType);
	});
	/* tslint:enable:no-null-keyword */
});

test("getTooltipInformation should return 0 for a value that is not in storage", () => {
	let value = tooltipHelper.getTooltipInformation(ClipperStorageKeys.lastSeenTooltipTimeBase, testType);
	strictEqual(value, 0);
});

test("getTooltipInformation should return 0 for an invalid value", () => {
	let storageKey = TooltipHelper.getStorageKeyForTooltip(ClipperStorageKeys.lastSeenTooltipTimeBase, testType);
	let expected = "blah";
	mockStorage.setValue(storageKey, expected);
	let value = tooltipHelper.getTooltipInformation(ClipperStorageKeys.lastSeenTooltipTimeBase, testType);
	strictEqual(value, 0);
});

test("getTooltipInformation should return correct information for a value that is in storage", () => {
	let storageKey = TooltipHelper.getStorageKeyForTooltip(ClipperStorageKeys.lastSeenTooltipTimeBase, testType);
	let expected = 1234;
	mockStorage.setValue(storageKey, expected.toString());
	let value = tooltipHelper.getTooltipInformation(ClipperStorageKeys.lastSeenTooltipTimeBase, testType);
	strictEqual(value, expected);
});

test("Null or undefined passed to setTooltipInformation should throw an Error", () => {
	/* tslint:disable:no-null-keyword */
	throws(() => {
		tooltipHelper.setTooltipInformation(undefined, undefined, "");
	});
	throws(() => {
		tooltipHelper.setTooltipInformation(ClipperStorageKeys.lastSeenTooltipTimeBase, undefined, "");
	});
	throws(() => {
		tooltipHelper.setTooltipInformation(undefined, testType, "");
	});
	throws(() => {
		tooltipHelper.setTooltipInformation(null, null, "");
	});
	throws(() => {
		tooltipHelper.setTooltipInformation(ClipperStorageKeys.lastSeenTooltipTimeBase, null, "");
	});
	throws(() => {
		tooltipHelper.setTooltipInformation(null, testType, "");
	});
	/* tslint:enable:no-null-keyword */
});

test("setTooltipInformation should correctly set the key and value when given valid arguments", () => {
	let val = 4134134;
	tooltipHelper.setTooltipInformation(ClipperStorageKeys.lastSeenTooltipTimeBase, testType, val.toString());
	let actual = tooltipHelper.getTooltipInformation(ClipperStorageKeys.lastSeenTooltipTimeBase, testType);
	strictEqual(actual, val);
});

test("Null or undefined passed to tooltipDelayIsOver should throw an Error", () => {
	/* tslint:disable:no-null-keyword */
	throws(() => {
		tooltipHelper.tooltipDelayIsOver(undefined, null);
	});
	throws(() => {
		tooltipHelper.tooltipDelayIsOver(null, null);
	});
	/* tslint:enable:no-null-keyword */
});

function setClipTimeWithinRange() {
	let timeToSet = baseTime - Constants.Settings.timeBetweenTooltips + 5000;
	tooltipHelper.setTooltipInformation(ClipperStorageKeys.lastClippedTooltipTimeBase, testType, timeToSet.toString());
}

function setClipTimeOutsideOfRange() {
	let timeToSet = baseTime - Constants.Settings.timeBetweenTooltips - 5000;
	tooltipHelper.setTooltipInformation(ClipperStorageKeys.lastClippedTooltipTimeBase, testType, timeToSet.toString());
}

function setSeenTimeWithinRange() {
	let timeToSet = baseTime - Constants.Settings.timeBetweenTooltips + 5000;
	tooltipHelper.setTooltipInformation(ClipperStorageKeys.lastSeenTooltipTimeBase, testType, timeToSet.toString());
}

function setSeenTimeOutsideOfRange() {
	let timeToSet = baseTime - Constants.Settings.timeBetweenTooltips - 5000;
	tooltipHelper.setTooltipInformation(ClipperStorageKeys.lastSeenTooltipTimeBase, testType, timeToSet.toString());
}

function setNumTimesTooltipHasBeenSeen(times: number) {
	tooltipHelper.setTooltipInformation(ClipperStorageKeys.numTimesTooltipHasBeenSeenBase, testType, times.toString());
}

test("tooltipHasBeenSeenInLastTimePeriod should return FALSE when nothing is in storage", () => {
	ok(!tooltipHelper.tooltipHasBeenSeenInLastTimePeriod(baseTime, testType, Constants.Settings.timeBetweenTooltips));
});

test("tooltipHasBeenSeenInLastTimePeriod should return FALSE when a value is in storage but it is outside the time period", () => {
	setSeenTimeOutsideOfRange();
	ok(!tooltipHelper.tooltipHasBeenSeenInLastTimePeriod(baseTime, testType, Constants.Settings.timeBetweenTooltips));
});

test("tooltipHasBeenSeenInLastTimePeriod should return TRUE when a value is in storage and is within the time period", () => {
	tooltipHelper.setTooltipInformation(ClipperStorageKeys.lastSeenTooltipTimeBase, testType, "15");
	ok(tooltipHelper.tooltipHasBeenSeenInLastTimePeriod(testType, 25, 11));
});

test("hasAnyTooltipBeenSeenInLastTimerPeriod should return FALSE when nothing is in storage", () => {
	ok(!tooltipHelper.hasAnyTooltipBeenSeenInLastTimePeriod(baseTime, validTypes, Constants.Settings.timeBetweenTooltips));
});

test("hasAnyTooltipBeenSeenInLastTimePeriod should return TRUE if at least one of the tooltips has a lastSeenTooltipTime in Storage within the time period", () => {
	setSeenTimeWithinRange();
	ok(tooltipHelper.hasAnyTooltipBeenSeenInLastTimePeriod(baseTime, validTypes, Constants.Settings.timeBetweenTooltips));
});

test("tooltipDelayIsOver should return TRUE when nothing in in storage", () => {
	ok(tooltipHelper.tooltipDelayIsOver(testType, baseTime));
});

// Have they clipped this content? If so, return FALSE
test("tooltipDelayIsOver should return FALSE when the user has clipped this content type regardless of when they Clipped it and the rest of the values in storage", () => {
	setClipTimeWithinRange();
	ok(!tooltipHelper.tooltipDelayIsOver(testType, baseTime));
	setClipTimeOutsideOfRange();
	ok(!tooltipHelper.tooltipDelayIsOver(testType, baseTime));

});

// Have they seen ANY content? If so, return FALSE
test("tooltipDelayIsOver should return TRUE when they haven't seen a tooltip in 21 days and the key for lastClippedTime is empty", () => {
	setSeenTimeWithinRange();
	ok(!tooltipHelper.tooltipDelayIsOver(testType, baseTime));
});

// Has the user has seen the tooltip more than maxTooltipsShown times? If so, return FALSE
test("tooltipDelayIsOVer should return FALSE when the user has seen this tooltip more than maxTooltipsShown times", () => {
	setNumTimesTooltipHasBeenSeen(Constants.Settings.maximumNumberOfTimesToShowTooltips);
	ok(!tooltipHelper.tooltipDelayIsOver(testType, baseTime));
});

test("tooltipDelayIsOver should return TRUE when the user hasn't seen a tooltip in a while, they've never clipped this content, and they haven't gone over the max number of times to see the tooltip", () => {
	setSeenTimeOutsideOfRange();
	ok(tooltipHelper.tooltipDelayIsOver(testType, baseTime));
});

test("tooltipDelayIsOver should return FALSE when the user has seen a tooltip in the last 21 days, no matter the value of lastClippedTime", () => {
	setSeenTimeWithinRange();
	strictEqual(tooltipHelper.tooltipDelayIsOver(testType, baseTime), false);

	setClipTimeOutsideOfRange();
	strictEqual(tooltipHelper.tooltipDelayIsOver(testType, baseTime), false);

	setClipTimeWithinRange();
	strictEqual(tooltipHelper.tooltipDelayIsOver(testType, baseTime), false);
});

test("tooltipDelayIsOver should return FALSE when the user has clipped a tooltip, no matter the value of lastSeenTime", () => {
	setClipTimeWithinRange();
	strictEqual(tooltipHelper.tooltipDelayIsOver(testType, baseTime), false);

	setSeenTimeOutsideOfRange();
	strictEqual(tooltipHelper.tooltipDelayIsOver(testType, baseTime), false);

	setSeenTimeWithinRange();
	strictEqual(tooltipHelper.tooltipDelayIsOver(testType, baseTime), false);
});
