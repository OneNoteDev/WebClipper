import * as Log from "./logging/log";
declare function require(name: string);

// Load up the settings file
let settings = require("../settings.json");

export class Settings {
	public static getSetting(name: string): any {
		let localResult = settings[name];

		if (!localResult || !localResult.Value) {
			return undefined;
		}

		return localResult.Value;
	}

	public static setSettingsJsonForTesting(jsonObject?: {}): void {
		if (jsonObject) {
			settings = jsonObject;
		} else {
			// revert to default
			settings = require("../settings.json");
		}
	}
}
