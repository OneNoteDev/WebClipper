import * as Log from "./logging/log";
declare function require(name: string);

// Load up the settings file
let settings = require("../settings.json");

export module Settings {
	export function getSetting(name: string): any {
		let localResult = settings[name];

		if (!localResult || !localResult.Value) {
			return undefined;
		}

		return localResult.Value;
	}
}
