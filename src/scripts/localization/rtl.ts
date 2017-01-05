export class Rtl {
	private static rtlLanguageCodes = [ "ar", "fa", "he", "sd", "ug", "ur" ];

	/*
	 * Given a ISO 639-1 code (with optional ISO 3166 postfix), returns true
	 * if and only if our localized string servers support that language, and
	 * that language is RTL.
	 */
	public static isRtl(locale: string): boolean {
		if (!locale) {
			return false;
		}

		let iso639P1LocaleCode = Rtl.getIso639P1LocaleCode(locale);

		for (let languageCode of Rtl.rtlLanguageCodes) {
			if (iso639P1LocaleCode === languageCode) {
				return true;
			}
		}
		return false;
	}

	public static getIso639P1LocaleCode(locale: string): string {
		if (!locale) {
			return "";
		}
		return locale.split("-")[0].split("_")[0].toLowerCase();
	}
}
