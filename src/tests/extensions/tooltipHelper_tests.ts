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
	let timeToSet = baseTime - Constants.Settings.timeBetweenSameTooltip + 5000;
	tooltipHelper.setTooltipInformation(ClipperStorageKeys.lastClippedTooltipTimeBase, testType, timeToSet.toString());
}

function setClipTimeOutsideOfRange() {
	let timeToSet = baseTime - Constants.Settings.timeBetweenSameTooltip - 5000;
	tooltipHelper.setTooltipInformation(ClipperStorageKeys.lastClippedTooltipTimeBase, testType, timeToSet.toString());
}

function setSeenTimeWithinRange(tooltipType: TooltipType, timePeriod: number) {
	let timeToSet = baseTime - timePeriod + 5000;
	tooltipHelper.setTooltipInformation(ClipperStorageKeys.lastSeenTooltipTimeBase, tooltipType, timeToSet.toString());
}

function setSeenTimeOutsideOfRange(tooltipType: TooltipType, timePeriod: number) {
	let timeToSet = baseTime - timePeriod - 5000;
	tooltipHelper.setTooltipInformation(ClipperStorageKeys.lastSeenTooltipTimeBase, tooltipType, timeToSet.toString());
}

function setNumTimesTooltipHasBeenSeen(times: number) {
	tooltipHelper.setTooltipInformation(ClipperStorageKeys.numTimesTooltipHasBeenSeenBase, testType, times.toString());
}

test("tooltipHasBeenSeenInLastTimePeriod should return FALSE when nothing is in storage", () => {
	ok(!tooltipHelper.tooltipHasBeenSeenInLastTimePeriod(baseTime, testType, Constants.Settings.timeBetweenSameTooltip));
});

test("tooltipHasBeenSeenInLastTimePeriod should return FALSE when a value is in storage but it is outside the time period", () => {
	setSeenTimeOutsideOfRange(testType, Constants.Settings.timeBetweenSameTooltip);
	ok(!tooltipHelper.tooltipHasBeenSeenInLastTimePeriod(baseTime, testType, Constants.Settings.timeBetweenSameTooltip));
});

test("tooltipHasBeenSeenInLastTimePeriod should return TRUE when a value is in storage and is within the time period", () => {
	setSeenTimeWithinRange(testType, Constants.Settings.timeBetweenSameTooltip);
	ok(tooltipHelper.tooltipHasBeenSeenInLastTimePeriod(testType, baseTime, Constants.Settings.timeBetweenSameTooltip));
});

test("hasAnyTooltipBeenSeenInLastTimePeriod should return FALSE when nothing is in storage", () => {
	ok(!tooltipHelper.hasAnyTooltipBeenSeenInLastTimePeriod(baseTime, validTypes, Constants.Settings.timeBetweenDifferentTooltips));
});

test("hasAnyTooltipBeenSeenInLastTimePeriod should return TRUE if at least one of the tooltips has a lastSeenTooltipTime in Storage within the time period", () => {
	setSeenTimeWithinRange(testType, Constants.Settings.timeBetweenDifferentTooltips);
	ok(tooltipHelper.hasAnyTooltipBeenSeenInLastTimePeriod(baseTime, validTypes, Constants.Settings.timeBetweenDifferentTooltips));
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
test("tooltipDelayIsOver should return FALSE when they have seen a tooltip in the last Constants.Settings.timeBetweenSameTooltip period", () => {
	setSeenTimeWithinRange(testType, Constants.Settings.timeBetweenSameTooltip);
	ok(!tooltipHelper.tooltipDelayIsOver(testType, baseTime));
});

test("tooltipDelayIsOver should return FALSE when they have seen a tooltip (not the same one) in the last Constants.Settings.timeBetweenDifferentTooltipsPeriod", () => {
	setSeenTimeWithinRange(TooltipType.Pdf, Constants.Settings.timeBetweenDifferentTooltips);
	ok(!tooltipHelper.tooltipDelayIsOver(TooltipType.Product, baseTime));
});

test("tooltipDelayIsOver should return TRUE if they have NOT seen a different tooltip in the last Constants.Settings.timeBetweenDifferentTooltipsPeriod", () => {
	setSeenTimeOutsideOfRange(TooltipType.Product, Constants.Settings.timeBetweenDifferentTooltips);
	ok(tooltipHelper.tooltipDelayIsOver(testType, baseTime));
});

// Has the user has seen the tooltip more than maxTooltipsShown times? If so, return FALSE
test("tooltipDelayIsOVer should return FALSE when the user has seen this tooltip more than maxTooltipsShown times", () => {
	setNumTimesTooltipHasBeenSeen(Constants.Settings.maximumNumberOfTimesToShowTooltips);
	ok(!tooltipHelper.tooltipDelayIsOver(testType, baseTime));
});

test("tooltipDelayIsOver should return TRUE when the user hasn't seen a tooltip in a while, they've never clipped this content, and they haven't gone over the max number of times to see the tooltip", () => {
	setSeenTimeOutsideOfRange(testType, Constants.Settings.timeBetweenSameTooltip);
	ok(tooltipHelper.tooltipDelayIsOver(testType, baseTime));
});

test("tooltipDelayIsOver should return FALSE when the user has seen a tooltip in the last Constants.Settings.timeBetweenSameTooltip period, no matter the value of lastClippedTime", () => {
	setSeenTimeWithinRange(testType, Constants.Settings.timeBetweenSameTooltip);
	ok(!tooltipHelper.tooltipDelayIsOver(testType, baseTime));

	setClipTimeOutsideOfRange();
	ok(!tooltipHelper.tooltipDelayIsOver(testType, baseTime));

	setClipTimeWithinRange();
	ok(!tooltipHelper.tooltipDelayIsOver(testType, baseTime));
});

test("tooltipDelayIsOver should return FALSE when the user has clipped a tooltip, no matter the value of lastSeenTime", () => {
	setClipTimeWithinRange();
	ok(!tooltipHelper.tooltipDelayIsOver(testType, baseTime));

	setSeenTimeOutsideOfRange(testType, Constants.Settings.timeBetweenSameTooltip);
	ok(!tooltipHelper.tooltipDelayIsOver(testType, baseTime));

	setSeenTimeWithinRange(testType, Constants.Settings.timeBetweenSameTooltip);
	ok(!tooltipHelper.tooltipDelayIsOver(testType, baseTime));
});
