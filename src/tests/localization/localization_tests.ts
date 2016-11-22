import {Localization} from "../../scripts/localization/localization";

import {TestModule} from "../testModule";

declare function require(name: string);

export class LocalizationTests extends TestModule {
	private backupStrings = require("../../strings.json");
	private localizedStrings: { [key: string]: string } = {};
	private existKey: string;

	constructor() {
		super();

		// Set up localized strings as backup + postfix for testing
		for (let property in this.backupStrings) {
			if (this.backupStrings.hasOwnProperty(property)) {
				this.localizedStrings[property] = this.backupStrings[property] + "-LOCALIZED";
				// Used for testing keys that can be found in the backup strings
				if (!this.existKey) {
					this.existKey = property;
				}
			}
		}
	}

	protected module() {
		return "localization";
	}

	protected tests() {
		test("getLocalizedString returns the localized string if there is a matching key", () => {
			let mockLocalizedStrings = this.getMockLocalizedStrings();
			Localization.setLocalizedStrings(mockLocalizedStrings);
			strictEqual(Localization.getLocalizedString(this.existKey), mockLocalizedStrings[this.existKey],
				"If the key exists, the localized string should be fetched");
		});

		test("getLocalizedString returns the backup string if there is no matching key", () => {
			let mockLocalizedStrings = this.getMockLocalizedStrings();
			delete mockLocalizedStrings[this.existKey];
			Localization.setLocalizedStrings(mockLocalizedStrings);
			strictEqual(Localization.getLocalizedString(this.existKey), this.backupStrings[this.existKey],
				"If the key does not exist, the backup string should be fetched");
		});

		test("getLocalizedString returns the backup string if there is no localized strings populated", () => {
			strictEqual(Localization.getLocalizedString(this.existKey), this.backupStrings[this.existKey],
				"If no localized strings exist, the backup string should be fetched");
		});

		test("getLocalizedString should throw an error if there is no matching key in the localized or backup strings", () => {
			throws(() => {
				let mockLocalizedStrings = this.getMockLocalizedStrings();
				Localization.setLocalizedStrings(mockLocalizedStrings);
				Localization.getLocalizedString("Non.Existing.Key");
			}, Error("getLocalizedString could not find a localized or fallback string: Non.Existing.Key"));
		});

		test("getLocalizedString should throw an error if there is no matching key in the backup strings and no localized strings were set", () => {
			throws(() => {
				Localization.getLocalizedString("Non.Existing.Key");
			}, Error("getLocalizedString could not find a localized or fallback string: Non.Existing.Key"));
		});

		test("getLocalizedString should throw an error if the parameter is the empty string", () => {
			throws(() => {
				Localization.getLocalizedString("");
			}, Error("stringId must be a non-empty string, but was: "));
		});

		test("getLocalizedString should throw an error if the parameter is null", () => {
			/* tslint:disable:no-null-keyword */
			throws(() => {
				Localization.getLocalizedString(null);
			}, Error("stringId must be a non-empty string, but was: null"));
			/* tslint:enable:no-null-keyword */
		});

		test("getLocalizedString should throw an error if the parameter is undefined", () => {
			throws(() => {
				Localization.getLocalizedString(undefined);
			}, Error("stringId must be a non-empty string, but was: undefined"));
		});

		test("formatFontFamily should ensure that font family names that contain inner-spaces should be wrapped in single quotes", () => {
			let fontFamily = "Segoe UI Bold,Segoe UI,Segoe,Segoe WP,Helvetica Neue,Roboto,Helvetica,Arial,Tahoma,Verdana,sans-serif";
			let formattedFontFamily = Localization.formatFontFamily(fontFamily);
			strictEqual(formattedFontFamily, "'Segoe UI Bold','Segoe UI',Segoe,'Segoe WP','Helvetica Neue',Roboto,Helvetica,Arial,Tahoma,Verdana,sans-serif",
				"Values containing inner spaces are wrapped in single quotes");
		});

		test("formatFontFamily should not format an already-formatted input, but should simply return the input", () => {
			let fontFamily = "'Segoe UI Bold','Segoe UI',Segoe,'Segoe WP','Helvetica Neue',Roboto,Helvetica,Arial,Tahoma,Verdana,sans-serif";
			let formattedFontFamily = Localization.formatFontFamily(fontFamily);
			strictEqual(formattedFontFamily, fontFamily, "Already-formatted values are left as-is");
		});

		test("formatFontFamily should correctly format an inner-space containing name if it is the only one in the input", () => {
			let fontFamily = "My Family";
			let formattedFontFamily = Localization.formatFontFamily(fontFamily);
			strictEqual(formattedFontFamily, "'My Family'", "Unformatted name is formatted if it is the only one in the input");
		});

		test("formatFontFamily should leave an already-formatted name as-is if it is the only one in the input", () => {
			let fontFamily = "'Already Formatted'";
			let formattedFontFamily = Localization.formatFontFamily(fontFamily);
			strictEqual(formattedFontFamily, fontFamily, "Already-formatted name is left as-is if it is the only one in the input");
		});

		test("formatFontFamily should trim names with unecessary whitespace", () => {
			let fontFamily = "Segoe UI Bold,Segoe UI,   Segoe    ,Segoe WP,   Helvetica Neue,Roboto   ,Helvetica,\tArial,Tahoma\n,Verdana,sans-serif";
			let formattedFontFamily = Localization.formatFontFamily(fontFamily);
			strictEqual(formattedFontFamily, "'Segoe UI Bold','Segoe UI',Segoe,'Segoe WP','Helvetica Neue',Roboto,Helvetica,Arial,Tahoma,Verdana,sans-serif",
				"Values are all trimmed of outer whitespace");
		});

		test("formatFontFamily should return empty string when passed an empty string", () => {
			let formattedFontFamily = Localization.formatFontFamily("");
			strictEqual(formattedFontFamily, "", "Input of empty string results in an output of empty string");
		});

		test("formatFontFamily should return empty string when passed null", () => {
			/* tslint:disable:no-null-keyword */
			let formattedFontFamily = Localization.formatFontFamily(null);
			strictEqual(formattedFontFamily, "", "Input of null results in an output of empty string");
			/* tslint:enable:no-null-keyword */
		});

		test("formatFontFamily should return empty string when passed undefined", () => {
			let formattedFontFamily = Localization.formatFontFamily(undefined);
			strictEqual(formattedFontFamily, "", "Input of undefined results in an output of empty string");
		});
	}

	private getMockLocalizedStrings = () => {
		return JSON.parse(JSON.stringify(this.localizedStrings));
	}
}

(new LocalizationTests()).runTests();
