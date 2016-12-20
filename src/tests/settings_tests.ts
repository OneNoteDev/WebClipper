import {Settings} from "../scripts/settings";

import {TestModule} from "./testModule";

declare function require(name: string);

export class SettingsTests extends TestModule {
	protected module() {
		return "settings";
	}

	protected tests() {
		let settings = require("../settings.json");

		test("helper method checkValueAndDescriptionOnObject should assert when given an object that lacks a value or description", () => {
			let nothing = {
				Dummy: "blah"
			};

			let noValue = {
				Dummy: {
					Description: "blah"
				}
			};

			let noDescription = {
				Dummy: {
					Value: "test"
				}
			};

			let valid = {
				Dummy: {
					Description: "valid",
					Value: "test"
				}
			};

			ok(!this.checkValueAndDescriptionOnObject(nothing));
			ok(!this.checkValueAndDescriptionOnObject(noValue));
			ok(!this.checkValueAndDescriptionOnObject(noDescription));
			ok(this.checkValueAndDescriptionOnObject(valid));
		});

		test("getSetting should return undefined when passed the empty String as a key, because no setting can be named the empty string", () => {
			let value = Settings.getSetting("");
			strictEqual(value, undefined, "Blank key for Settings.GetSetting returned blank key back");
		});

		test("getSetting should return the key that was passed in when it cannot find the setting in settings.json", () => {
			let key = "jfkasdfjaksldjfa";
			let value = Settings.getSetting(key);
			strictEqual(value, undefined, "Non-existent key returned the key instead of an object back");
		});

		test("getSetting should correctly fetch the Value of a setting when given a valid Key", () => {
			let value = Settings.getSetting("DummyObjectForTestingPurposes");
			strictEqual(value, "Testing.", "DummyObject was not retrieved correctly");
		});

		test("settings.json object should be non-empty when required from any project", () => {
			notStrictEqual(settings, {}, "Settings object is empty and it shouldn't be.");
		});
	}

	private checkValueAndDescriptionOnObject(object: Object) {
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
}

(new SettingsTests()).runTests();
