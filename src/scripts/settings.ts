import * as importedSettings from "../../generated/settings.json";

let settings = importedSettings;

export module Settings {
	export function getSetting(name: string): any {
		let localResult = settings[name];

		if (!localResult || !localResult.Value) {
			return undefined;
		}

		return localResult.Value;
	}

	export function setSettingsJsonForTesting(jsonObject?): void {
		if (jsonObject) {
			settings = jsonObject;
		}
	}
}
