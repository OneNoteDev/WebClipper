import {StringUtils} from "../scripts/stringUtils";

import {TestModule} from "./testModule";

export class StringUtilsTests extends TestModule {
	protected module() {
		return "stringUtils";
	}

	protected tests() {
		test("A blank or undefined page range should return undefined", () => {
			/* tslint:disable */
			ok(!StringUtils.parsePageRange(undefined), "parsePageRange(undefined) was not undefined");
			ok(!StringUtils.parsePageRange(null), "parsePageRange(null) was not undefined");
			/* tslint:enable */
		});

		test("An empty string should return an empty array", () => {
			let ret = StringUtils.parsePageRange("");
			deepEqual(ret, []);

			let retTwo = StringUtils.parsePageRange("           	 	");
			deepEqual(ret, []);
		});

		test("A single digit should return a single digit array", () => {
			let ret = StringUtils.parsePageRange("1");
			deepEqual(ret, [1], "A page range of '1' should return [1]");
		});

		test("A comma separated list of digits should return those digits as an array", () => {
			let ret = StringUtils.parsePageRange("1,3,5,7");
			deepEqual(ret, [1, 3, 5, 7], "A page range of '1,3,5,7' should return [1,3,5,7]");
		});

		test("A range ending in a comma should still be legal", () => {
			let ret = StringUtils.parsePageRange("1,3,5,7,");
			deepEqual(ret, [1, 3, 5, 7], "A page range of '1,3,5,7,' should return [1,3,5,7]");
		});

		test("A range ending in multiple commas should still be legal", () => {
			let ret = StringUtils.parsePageRange("1,3,5,7,,,");
			deepEqual(ret, [1, 3, 5, 7], "A page range of '1,3,5,7,,,' should return [1,3,5,7]");
		});

		test("A range that has whitespace between commas should still be legal", () => {
			let ret = StringUtils.parsePageRange("1,, , 3");
			deepEqual(ret, [1, 3], "A page range of '1,, , 3' should return [1, 3]");
		});

		test("A range with a hyphen in it should return a range including that interval and both endpoints", () => {
			let ret = StringUtils.parsePageRange("1-5");
			deepEqual(ret, [1, 2, 3, 4, 5], "A page range of '1-5' should return [1,2,3,4,5]");
		});

		test("A range with overlapping numbers should return an array with only one of each digit", () => {
			let ret = StringUtils.parsePageRange("1-3,2-4,1,2,3");
			deepEqual(ret, [1, 2, 3, 4], "A range of '1-3,2-4,1,2,3' should return [1,2,3,4]");
		});

		test("parsePageRange should ignore whitespace on the ends of the string and whitespace in between the digits/ranges", () => {
			let ret = StringUtils.parsePageRange("   1 - 5   ,  5  , 8 ");
			deepEqual(ret, [1, 2, 3, 4, 5, 8]);
		});

		test("A range with negative inputs should return undefined", () => {
			let ret = StringUtils.parsePageRange("-5--2,-1,0,2");
			ok(!ret);
		});

		test("A range with non-numeric inputs should return undefined", () => {
			let ret = StringUtils.parsePageRange("1,a-b,7,d,e,f");
			ok(!ret);
		});

		test("A range that has numbers out of order, such as 1,5-3 should return undefined", () => {
			let ret = StringUtils.parsePageRange("5-3");
			ok(!ret);
		});

		test("Ranges that have 0 anywhere in them should be invalid", () => {
			ok(!StringUtils.parsePageRange("0"));
			ok(!StringUtils.parsePageRange("0-5"));
			ok(!StringUtils.parsePageRange("5-0"));
			ok(!StringUtils.parsePageRange("1,3,4,0"));
		});

		test("Validate the range when max range is provide", () => {
			ok(StringUtils.parsePageRange("1-5", 10), "Given range is within the max bounds of 10.");
			ok(StringUtils.parsePageRange("1,3,5,6,8", 9), "Given range is within the max range of 9");

			ok(!StringUtils.parsePageRange("1-13", 10), "Given range is outside of the max bounds of 10.");
			ok(!StringUtils.parsePageRange("1,3,5,6,8", 2), "Given range is outside the max bounds of 2");
		});

		test("getBatchedPageTitle should return a title of the form [nameOfDocument]: Page [i + 1]", () => {
			strictEqual(StringUtils.getBatchedPageTitle("", -3), ": Page -2");
			strictEqual(StringUtils.getBatchedPageTitle("document", 0), "document: Page 1");
		});
	}
}

(new StringUtilsTests()).runTests();
