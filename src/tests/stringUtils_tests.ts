import {OperationResult} from "../scripts/operationResult";
import {StringUtils} from "../scripts/stringUtils";

import {Localization} from "../scripts/localization/localization";

import {TestModule} from "./testModule";

export class StringUtilsTests extends TestModule {
	protected module() {
		return "stringUtils";
	}

	protected tests() {
		test("A blank or undefined page range should return undefined", () => {
			/* tslint:disable */
			strictEqual(StringUtils.parsePageRange(undefined).status, OperationResult.Failed, "parsePageRange(undefined) did not return Status.Failed");
			strictEqual(StringUtils.parsePageRange(undefined).result, "", "parsePageRange(undefined) was not undefined");
			strictEqual(StringUtils.parsePageRange(null).status, OperationResult.Failed, "parsePageRange(null) did not return Status.Failed");		
			strictEqual(StringUtils.parsePageRange(null).result, "", "parsePageRange(null) was not undefined");
			/* tslint:enable */
		});

		test("An empty string should return an empty string", () => {
			let ret = StringUtils.parsePageRange("");
			ok(ret.status === OperationResult.Failed);
			deepEqual(ret.result, "");

			let retTwo = StringUtils.parsePageRange("           	 	");
			ok(retTwo.status === OperationResult.Failed);
			deepEqual(retTwo.result, "");
		});

		test("A string of commas should return an empty string", () => {
			let ret = StringUtils.parsePageRange(",,,,,,");
			ok(ret.status === OperationResult.Failed);
			deepEqual(ret.result, ",,,,,,");

			let retTwo = StringUtils.parsePageRange(",, , ");
			ok(retTwo.status === OperationResult.Failed);
			// The result should be trimmed
			deepEqual(retTwo.result, ",, ,");
		});

		test("A single digit should return a single digit array", () => {
			let ret = StringUtils.parsePageRange("1");
			ok(ret.status === OperationResult.Succeeded);
			deepEqual(ret.result, [1], "A page range of '1' should return [1]");
		});

		test("A comma separated list of digits should return those digits as an array", () => {
			let ret = StringUtils.parsePageRange("1,3,5,7");
			ok(ret.status === OperationResult.Succeeded);
			deepEqual(ret.result, [1, 3, 5, 7], "A page range of '1,3,5,7' should return [1,3,5,7]");
		});

		test("A range ending in a comma should still be legal", () => {
			let ret = StringUtils.parsePageRange("1,3,5,7,");
			ok(ret.status === OperationResult.Succeeded);
			deepEqual(ret.result, [1, 3, 5, 7], "A page range of '1,3,5,7,' should return [1,3,5,7]");
		});

		test("A range ending in multiple commas should still be legal", () => {
			let ret = StringUtils.parsePageRange("1,3,5,7,,,");
			ok(ret.status === OperationResult.Succeeded);
			deepEqual(ret.result, [1, 3, 5, 7], "A page range of '1,3,5,7,,,' should return [1,3,5,7]");
		});

		test("A range that has whitespace between commas should still be legal", () => {
			let ret = StringUtils.parsePageRange("1,, , 3");
			ok(ret.status === OperationResult.Succeeded);
			deepEqual(ret.result, [1, 3], "A page range of '1,, , 3' should return [1, 3]");
		});

		test("A range with a hyphen in it should return a range including that interval and both endpoints", () => {
			let ret = StringUtils.parsePageRange("1-5");
			ok(ret.status === OperationResult.Succeeded);
			deepEqual(ret.result, [1, 2, 3, 4, 5], "A page range of '1-5' should return [1,2,3,4,5]");
		});

		test("A range with overlapping numbers should return an array with only one of each digit", () => {
			let ret = StringUtils.parsePageRange("1-3,2-4,1,2,3");
			ok(ret.status === OperationResult.Succeeded);
			deepEqual(ret.result, [1, 2, 3, 4], "A range of '1-3,2-4,1,2,3' should return [1,2,3,4]");
		});

		test("parsePageRange should ignore whitespace on the ends of the string and whitespace in between the digits/ranges", () => {
			let ret = StringUtils.parsePageRange("   1 - 5   ,  5  , 8 ");
			ok(ret.status === OperationResult.Succeeded);
			deepEqual(ret.result, [1, 2, 3, 4, 5, 8]);
		});

		test("A range with negative inputs should return the part with the invalid string", () => {
			let ret = StringUtils.parsePageRange("-5--2,-1,0,2");
			ok(ret.status === OperationResult.Failed);
			strictEqual(ret.result, "-5--2");
		});

		test("A range with non-numeric inputs should return the part with the invalid string", () => {
			let ret = StringUtils.parsePageRange("1,a-b,7,d,e,f");
			ok(ret.status === OperationResult.Failed);
			strictEqual(ret.result, "a-b");
		});

		test("A range that has numbers out of order, such as 1,5-3 should return the part with the invalid string", () => {
			let ret = StringUtils.parsePageRange("5-3");
			ok(ret.status === OperationResult.Failed);
			strictEqual(ret.result, "5-3");
		});

		test("A range that exceeds a range of 2^32 should return the part with the invalid string", () => {
			let ret = StringUtils.parsePageRange("1-4294967295");
			ok(ret.status === OperationResult.Failed);
			strictEqual(ret.result, "1-4294967295");
		});

		test("A number that far exceeds a range of 2^32 should return the number as a string", () => {
			let ret = StringUtils.parsePageRange("999999999999999999999999999999", 5);
			ok(ret.status === OperationResult.Failed);
			strictEqual(ret.result, "999999999999999999999999999999");
		});

		test("A range that far exceeds a range of 2^32 should return the part with the invalid string", () => {
			let ret = StringUtils.parsePageRange("1-999999999999999999999999999999");
			ok(ret.status === OperationResult.Failed);
			strictEqual(ret.result, "1-999999999999999999999999999999");
		});

		test("Ranges that have 0 anywhere in them should be invalid", () => {
			const one = StringUtils.parsePageRange("0");
			ok(one.status === OperationResult.Failed);
			strictEqual(one.result, "0");

			const two = StringUtils.parsePageRange("0-5");
			ok(two.status === OperationResult.Failed);
			strictEqual(two.result, "0-5");

			const three = StringUtils.parsePageRange("0-5");
			ok(three.status === OperationResult.Failed);
			strictEqual(three.result, "0-5");

			const four = StringUtils.parsePageRange("1,3,4,0");
			ok(four.status === OperationResult.Failed);
			strictEqual(four.result, "0");
		});

		test("Validate the range when max range is provided", () => {
			deepEqual(StringUtils.parsePageRange("1-5", 10).result, [1, 2, 3, 4, 5], "Given range is within the max bounds of 10.");
			deepEqual(StringUtils.parsePageRange("1,3,5,6,8", 9).result, [1, 3, 5, 6, 8], "Given range is within the max range of 9");

			const one = StringUtils.parsePageRange("1-13", 10);
			strictEqual(one.result, "1-13", "Given range is outside of the max bounds of 10.");

			const two = StringUtils.parsePageRange("1,3,5,6,8", 2);
			strictEqual(two.result, "3", "Given range is outside the max bounds of 2");
		});

		test("getBatchedPageTitle should return a title of the form [nameOfDocument]: Page [i + 1]", () => {
			strictEqual(StringUtils.getBatchedPageTitle("", -3), ": Page -2");
			strictEqual(StringUtils.getBatchedPageTitle("document", 0), "document: Page 1");
		});
	}
}

(new StringUtilsTests()).runTests();
