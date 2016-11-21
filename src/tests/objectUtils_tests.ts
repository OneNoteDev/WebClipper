import {ObjectUtils} from "../scripts/objectUtils";

import {TestModule} from "./testModule";

export class ObjectUtilsTests extends TestModule {
	protected module() {
		return "objectUtils";
	}

	protected tests() {
		test("isNumeric should return false when the value is a string", () => {
			let value = "string";
			ok(!ObjectUtils.isNumeric(value), "isNumeric should return false");
		});

		test("isNumeric should return false when the value is a string numeral", () => {
			let value = "5";
			ok(!ObjectUtils.isNumeric(value), "isNumeric should return false");
		});

		test("isNumeric should return false when the value is an empty object", () => {
			let value = {};
			ok(!ObjectUtils.isNumeric(value), "isNumeric should return false");
		});

		test("isNumeric should return false when the value is a undefined", () => {
			ok(!ObjectUtils.isNumeric(undefined), "isNumeric should return false");
		});

		test("isNumeric should return false when the value is a NaN", () => {
			let value = NaN;
			ok(!ObjectUtils.isNumeric(value), "isNumeric should return false");
		});

		test("isNumeric should return false when the value is a null", () => {
			/* tslint:disable:no-null-keyword */
			let value = null;
			/* tslint:enable:no-null-keyword */
			ok(!ObjectUtils.isNumeric(value), "isNumeric should return false");
		});

		test("isNumeric should return false when the value is a string", () => {
			let value = "";
			ok(!ObjectUtils.isNumeric(value), "isNumeric should return false");
		});

		test("isNumeric should return true when the value is a number", () => {
			let value = 5;
			ok(ObjectUtils.isNumeric(value), "isNumeric should return true");
		});

		test("isNumeric should return true when the value is a negative number", () => {
			let value = -5;
			ok(ObjectUtils.isNumeric(value), "isNumeric should return true");
		});

		test("isNumeric should return true when the value is a decimal number", () => {
			let value = 4.12345;
			ok(ObjectUtils.isNumeric(value), "isNumeric should return true");
		});

		test("isNumeric should return true when the value is a Infinity", () => {
			let value = Infinity;
			ok(ObjectUtils.isNumeric(value), "isNumeric should return true");
		});
	}
}

(new ObjectUtilsTests()).runTests();
