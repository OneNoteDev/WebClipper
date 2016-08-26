export module Rtl {
	let rtlLanguageCodes = [ "ar", "fa", "he", "sd", "ug", "ur" ];

	/*
	 * Given a ISO 639-1 code (with optional ISO 3166 postfix), returns true
	 * if and only if our localized string servers support that language, and
	 * that language is RTL.
	 */
	export function isRtl(locale: string): boolean {
		if (!locale) {
			return false;
		}

		let iso639P1LocaleCode = getIso639P1LocaleCode(locale);

		for (let i = 0; i < rtlLanguageCodes.length; i++) {
			if (iso639P1LocaleCode === rtlLanguageCodes[i]) {
				return true;
			}
		}
		return false;
	}

	export function getIso639P1LocaleCode(locale: string): string {
		if (!locale) {
			return "";
		}
		return locale.split("-")[0].split("_")[0].toLowerCase();
	}
}
