import * as Log from "../logging/log";

// Should we be referencing node.d.ts?
declare function require(name: string);

export module Localization {

	export enum FontFamily {
		Regular,
		Bold,
		Light,
		Semibold,
		Semilight
	}

	let localizedStrings: {};
	let formattedFontFamilies: {} = {};

	// The fallback for when we are unable to fetch locstrings from our server
	let backupStrings = require("../../strings.json");

	/*
	 * Gets the matching localized string, or the fallback (unlocalized) string if
	 * unavailable.
	 */
	export function getLocalizedString(stringId: string): string {
		if (!stringId) {
			throw new Error("stringId must be a non-empty string, but was: " + stringId);
		}

		if (localizedStrings) {
			let localResult = localizedStrings[stringId];
			if (localResult) {
				return localResult;
			}
		}

		let backupResult = backupStrings[stringId];
		if (backupResult) {
			return backupResult;
		}

		throw new Error("getLocalizedString could not find a localized or fallback string: " + stringId);
	}

	export function setLocalizedStrings(localizedStringsAsJson: {}): void {
		localizedStrings = localizedStringsAsJson;
	}

	export function getFontFamilyAsStyle(family: FontFamily): string {
		return "font-family: " + getFontFamily(family) + ";";
	}

	export function getFontFamily(family: FontFamily): string {
		// Check cache first
		if (formattedFontFamilies[family]) {
			return formattedFontFamilies[family];
		}

		let stringId = "WebClipper.FontFamily." + FontFamily[family].toString();

		let fontFamily = getLocalizedString(stringId);
		formattedFontFamilies[family] = formatFontFamily(fontFamily);
		return formattedFontFamilies[family];
	}

	/*
	 * If we want to set font families through JavaScript, it uses a specific
	 * format. This helper function returns the formatted font family input.
	 */
	export function formatFontFamily(fontFamily: string): string {
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
