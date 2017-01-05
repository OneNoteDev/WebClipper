import * as Log from "../logging/log";

// Should we be referencing node.d.ts?
declare function require(name: string);

export enum FontFamily {
	Regular,
	Bold,
	Light,
	Semibold,
	Semilight
}

export class Localization {
	private static localizedStrings: {};
	private static formattedFontFamilies: {} = {};

	// The fallback for when we are unable to fetch locstrings from our server
	private static backupStrings = require("../../strings.json");

	public static FontFamily = FontFamily;

	/*
	 * Gets the matching localized string, or the fallback (unlocalized) string if
	 * unavailable.
	 */
	public static getLocalizedString(stringId: string): string {
		if (!stringId) {
			throw new Error("stringId must be a non-empty string, but was: " + stringId);
		}

		if (Localization.localizedStrings) {
			let localResult = Localization.localizedStrings[stringId];
			if (localResult) {
				return localResult;
			}
		}

		let backupResult = Localization.backupStrings[stringId];
		if (backupResult) {
			return backupResult;
		}

		throw new Error("getLocalizedString could not find a localized or fallback string: " + stringId);
	}

	public static setLocalizedStrings(localizedStringsAsJson: {}): void {
		Localization.localizedStrings = localizedStringsAsJson;
	}

	public static getFontFamilyAsStyle(family: FontFamily): string {
		return "font-family: " + Localization.getFontFamily(family) + ";";
	}

	public static getFontFamily(family: FontFamily): string {
		// Check cache first
		if (Localization.formattedFontFamilies[family]) {
			return Localization.formattedFontFamilies[family];
		}

		let stringId = "WebClipper.FontFamily." + FontFamily[family].toString();

		let fontFamily = Localization.getLocalizedString(stringId);
		Localization.formattedFontFamilies[family] = Localization.formatFontFamily(fontFamily);
		return Localization.formattedFontFamilies[family];
	}

	/*
	 * If we want to set font families through JavaScript, it uses a specific
	 * format. This helper function returns the formatted font family input.
	 */
	public static formatFontFamily(fontFamily: string): string {
		if (!fontFamily) {
			return "";
		}

		let splits = fontFamily.split(",");
		for (let i = 0; i < splits.length; i++) {
			splits[i] = splits[i].trim();
			if (splits[i].length > 0 && splits[i].indexOf(" ") >= 0 && splits[i][0] !== "'" && splits[i][splits.length - 1] !== "'") {
				splits[i] = "'" + splits[i] + "'";
			}
		}
		return splits.join(",");
	}
}
