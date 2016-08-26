import {TooltipHelper} from "../../scripts/extensions/tooltipHelper";

import {TooltipType} from "../../scripts/clipperUI/tooltipType";

import {Constants} from "../../scripts/constants";

import {MockStorageBase} from "./mockStorageBase";

let tooltipHelper: TooltipHelper;
let mockStorageBase: MockStorageBase;
let testType = TooltipType.Pdf;
let baseDate = new Date("09/27/1993 09:27:00 PM");

QUnit.module("tooltipHelper", {
	beforeEach: () => {
		mockStorageBase = new MockStorageBase();
		tooltipHelper = new TooltipHelper(mockStorageBase);
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
		tooltipHelper.getTooltipInformation(Constants.StorageKeys.lastSeenTooltipTimeBase, undefined);
	});
	throws(() => {
		tooltipHelper.getTooltipInformation(undefined, testType);
	});
	throws(() => {
		tooltipHelper.getTooltipInformation(null, null);
	});
	throws(() => {
		tooltipHelper.getTooltipInformation(Constants.StorageKeys.lastSeenTooltipTimeBase, null);
	});
	throws(() => {
		tooltipHelper.getTooltipInformation(null, testType);
	});
	/* tslint:enable:no-null-keyword */
});

test("getTooltipInformation should return 0 for a value that is not in storage", () => {
	let value = tooltipHelper.getTooltipInformation(Constants.StorageKeys.lastSeenTooltipTimeBase, testType);
	strictEqual(value, 0);
});

test("getTooltipInformation should return 0 for an invalid value", () => {
	let storageKey = TooltipHelper.getStorageKeyForTooltip(Constants.StorageKeys.lastSeenTooltipTimeBase, testType);
	let expected = "blah";
	mockStorageBase.setValue(storageKey, expected);
	let value = tooltipHelper.getTooltipInformation(Constants.StorageKeys.lastSeenTooltipTimeBase, testType);
	strictEqual(value, 0);
});

test("getTooltipInformation should return correct information for a value that is in storage", () => {
	let storageKey = TooltipHelper.getStorageKeyForTooltip(Constants.StorageKeys.lastSeenTooltipTimeBase, testType);
	let expected = 1234;
	mockStorageBase.setValue(storageKey, expected.toString());
	let value = tooltipHelper.getTooltipInformation(Constants.StorageKeys.lastSeenTooltipTimeBase, testType);
	strictEqual(value, expected);
});

test("Null or undefined passed to setTooltipInformation should throw an Error", () => {
	/* tslint:disable:no-null-keyword */
	throws(() => {
		tooltipHelper.setTooltipInformation(undefined, undefined, "");
	});
	throws(() => {
		tooltipHelper.setTooltipInformation(Constants.StorageKeys.lastSeenTooltipTimeBase, undefined, "");
	});
	throws(() => {
		tooltipHelper.setTooltipInformation(undefined, testType, "");
	});
	throws(() => {
		tooltipHelper.setTooltipInformation(null, null, "");
	});
	throws(() => {
		tooltipHelper.setTooltipInformation(Constants.StorageKeys.lastSeenTooltipTimeBase, null, "");
	});
	throws(() => {
		tooltipHelper.setTooltipInformation(null, testType, "");
	});
	/* tslint:enable:no-null-keyword */
});

test("setTooltipInformation should correctly set the key and value when given valid arguments", () => {
	let val = 4134134;
	tooltipHelper.setTooltipInformation(Constants.StorageKeys.lastSeenTooltipTimeBase, testType, val.toString());
	let actual = tooltipHelper.getTooltipInformation(Constants.StorageKeys.lastSeenTooltipTimeBase, testType);
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
	let timeToSet = baseDate.getTime() - Constants.Settings.timeBetweenTooltips + 5000;
	tooltipHelper.setTooltipInformation(Constants.StorageKeys.lastClippedTooltipTimeBase, testType, timeToSet.toString());
}

function setClipTimeOutsideOfRange() {
	let timeToSet = baseDate.getTime() - Constants.Settings.timeBetweenTooltips - 5000;
	tooltipHelper.setTooltipInformation(Constants.StorageKeys.lastClippedTooltipTimeBase, testType, timeToSet.toString());
}

function setSeenTimeWithinRange() {
	let timeToSet = baseDate.getTime() - Constants.Settings.timeBetweenTooltips + 5000;
	tooltipHelper.setTooltipInformation(Constants.StorageKeys.lastSeenTooltipTimeBase, testType, timeToSet.toString());
}

function setSeenTimeOutsideOfRange() {
	let timeToSet = baseDate.getTime() - Constants.Settings.timeBetweenTooltips - 5000;
	tooltipHelper.setTooltipInformation(Constants.StorageKeys.lastSeenTooltipTimeBase, testType, timeToSet.toString());
}

test("tooltipDelayIsOver should return true when nothing in in storage", () => {
	strictEqual(tooltipHelper.tooltipDelayIsOver(testType, Date.now()), true);
});

test("tooltipDelayIsOver should return true when they haven't seen a tooltip in 21 days and the key for lastClippedTime is empty", () => {
	setSeenTimeOutsideOfRange();
	strictEqual(tooltipHelper.tooltipDelayIsOver(testType, baseDate.getTime()), true);
});

test("tooltipDelayIsOver should return true when they haven't clipped in 21 days and the key for lastSeenTime is empty", () => {
	setClipTimeOutsideOfRange();
	strictEqual(tooltipHelper.tooltipDelayIsOver(testType, baseDate.getTime()), true);
});

test("tooltipDelayIsOver should return true when the user hasn't clipped in 21 days and hasn't seen a tooltip in 21 days", () => {
	setClipTimeOutsideOfRange();
	setSeenTimeOutsideOfRange();
	strictEqual(tooltipHelper.tooltipDelayIsOver(testType, baseDate.getTime()), true);
});

test("tooltipDelayIsOver should return false when the user has seen a tooltip in the last 21 days, no matter the value of lastClippedTime", () => {
	setSeenTimeWithinRange();
	strictEqual(tooltipHelper.tooltipDelayIsOver(testType, baseDate.getTime()), false);

	setClipTimeOutsideOfRange();
	strictEqual(tooltipHelper.tooltipDelayIsOver(testType, baseDate.getTime()), false);

	setClipTimeWithinRange();
	strictEqual(tooltipHelper.tooltipDelayIsOver(testType, baseDate.getTime()), false);
});

test("tooltipDelayIsOver should return false when the user has clipped a tooltip in the last 21 days, no matter the value of lastSeenTime", () => {
	setClipTimeWithinRange();
	strictEqual(tooltipHelper.tooltipDelayIsOver(testType, baseDate.getTime()), false);

	setSeenTimeOutsideOfRange();
	strictEqual(tooltipHelper.tooltipDelayIsOver(testType, baseDate.getTime()), false);

	setSeenTimeWithinRange();
	strictEqual(tooltipHelper.tooltipDelayIsOver(testType, baseDate.getTime()), false);
});
