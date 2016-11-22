import {Rtl} from "../../scripts/localization/rtl";

import {TestModule} from "../testModule";

export class RtlTests extends TestModule {
	protected module() {
		return "rtl";
	}

	protected tests() {
		test("isRtl should return true for all ISO 691-1 codes that are RTL that we support", () => {
			let codes = [ "ar", "fa", "he", "sd", "ug", "ur" ];
			for (let i = 0; i < codes.length; i++) {
				let code = codes[i];
				ok(Rtl.isRtl(code), code + " detected as RTL");
			}
		});

		test("isRtl should return true for RTL ISO 691-1 codes that have a ISO 3166-1 code appended", () => {
			let code = "ar-LY";
			ok(Rtl.isRtl(code), code + " detected as RTL");
		});

		test("isRtl should return true for RTL ISO 691-1 codes that are capitalized", () => {
			let code = "SD";
			ok(Rtl.isRtl(code), code + " detected as RTL");
		});

		test("isRtl should return true for RTL ISO 691-1 codes that are capitalized and have a ISO 3166-1 code appended", () => {
			let code = "AR-LY";
			ok(Rtl.isRtl(code), code + " detected as RTL");
		});

		test("isRtl should return true for RTL ISO 691-1 codes that have an invalid ISO 3166-1 code appended", () => {
			let code = "ar-NOTEXIST";
			ok(Rtl.isRtl(code), code + " detected as RTL");
		});

		test("isRtl should return false when passed an ISO 639-1 code that corresponds to a LTR language", () => {
			let code = "ja";
			ok(!Rtl.isRtl(code), code + "detected as non RTL");
		});

		test("isRtl should return false when passed an ISO 639-1 code that does not correspond to an existing language", () => {
			let code = "jz";
			ok(!Rtl.isRtl(code), code + "detected as non RTL");
		});

		test("isRtl should return false when passed a capitalized ISO 639-1 code that does not correspond to an existing language", () => {
			let code = "JZ";
			ok(!Rtl.isRtl(code), code + "detected as non RTL");
		});

		test("isRtl should return false when passed the empty string", () => {
			ok(!Rtl.isRtl(""), "Empty string detected as non RTL");
		});

		test("isRtl should return false when passed undefined", () => {
			ok(!Rtl.isRtl(undefined), "Undefined detected as non RTL");
		});

		test("isRtl should return false when passed the null", () => {
			/* tslint:disable:no-null-keyword */
			ok(!Rtl.isRtl(null), "Null string detected as non RTL");
			/* tslint:enable:no-null-keyword */
		});

		test("getIso639P1LocaleCode should return the ISO 639-1 code in the general case", () => {
			let code = "en-US";
			strictEqual(Rtl.getIso639P1LocaleCode(code), "en");
		});

		test("getIso639P1LocaleCode should return the ISO 639-1 code even if underscores are used", () => {
			let code = "en_US";
			strictEqual(Rtl.getIso639P1LocaleCode(code), "en");
		});

		test("getIso639P1LocaleCode should return the ISO 639-1 code when it is already passed in", () => {
			let code = "en";
			strictEqual(Rtl.getIso639P1LocaleCode(code), "en");
		});

		test("getIso639P1LocaleCode should return the ISO 639-1 code for codes with more than one dash", () => {
			let code = "en-en-US";
			strictEqual(Rtl.getIso639P1LocaleCode(code), "en");
		});

		test("getIso639P1LocaleCode should return the ISO 639-1 code when there's a mix of dashes and underscores", () => {
			strictEqual(Rtl.getIso639P1LocaleCode("ar-US_US"), "ar");
			strictEqual(Rtl.getIso639P1LocaleCode("ar_US-US"), "ar");
			strictEqual(Rtl.getIso639P1LocaleCode("ph_BLAH-BLAH_BLAH-"), "ph");
		});

		test("getIso639P1LocaleCode should return empty string when passed empty string", () => {
			strictEqual(Rtl.getIso639P1LocaleCode(""), "");
		});

		test("getIso639P1LocaleCode should return empty string when passed undefined", () => {
			strictEqual(Rtl.getIso639P1LocaleCode(undefined), "");
		});

		test("getIso639P1LocaleCode should return empty string when passed null", () => {
			/* tslint:disable:no-null-keyword */
			strictEqual(Rtl.getIso639P1LocaleCode(null), "");
			/* tslint:enable:no-null-keyword */
		});
	}
}

(new RtlTests()).runTests();
