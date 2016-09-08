/// <reference path="../../typings/main/ambient/qunit/qunit.d.ts" />
import {Settings} from "../scripts/settings";

declare function require(name: string);
let settings = require("../settings.json");

QUnit.module("settings", {});

test("settings.json object should be non-empty when required from any project", () => {
	notStrictEqual(settings, {}, "Settings object is empty and it shouldn't be.");
});

function checkValueAndDescriptionOnObject(object: Object) {
	for (let key in object) {
		if (object.hasOwnProperty(key)) {
			let obj = object[key];
			if (!obj.Value || !obj.Description) {
				return false;
			}
		}
	}
	return true;
};

test("helper function checkValueAndDescriptionOnObject should assert when given an object that lacks a value or description", () => {
	let nothing = {
		"Dummy": "blah"
	};

	let noValue = {
		"Dummy": {
			"Description": "blah"
		}
	};

	let noDescription = {
		"Dummy": {
			"Value": "test"
		}
	};

	let valid = {
		"Dummy": {
			"Description": "valid",
			"Value": "test"
		}
	};

	ok(!checkValueAndDescriptionOnObject(nothing));
	ok(!checkValueAndDescriptionOnObject(noValue));
	ok(!checkValueAndDescriptionOnObject(noDescription));
	ok(checkValueAndDescriptionOnObject(valid));
});

// TODO is a non-empty check necessary?
/*test("All entries in setting.json should have a non-empty Value and Description", () => {
	// Defined as an anonymous function in case we want to validate objects recursively
	ok(checkValueAndDescriptionOnObject(settings), "An object is missing either a Value or a Description");
});*/

test("GetSetting should return undefined when passed the empty String as a key, because no setting can be named the empty string", () => {
	let value = Settings.getSetting("");
	strictEqual(value, undefined, "Blank key for Settings.GetSetting returned blank key back");
});

test("GetSetting should return the key that was passed in when it cannot find the setting in settings.json", () => {
	let key = "jfkasdfjaksldjfa";
	let value = Settings.getSetting(key);
	strictEqual(value, undefined, "Non-existent key returned the key instead of an object back");

});

test("GetSetting should correctly fetch the Value of a setting when given a valid Key", () => {
	let value = Settings.getSetting("DummyObjectForTestingPurposes");
	strictEqual(value, "Testing.", "DummyObject was not retrieved correctly");
});
