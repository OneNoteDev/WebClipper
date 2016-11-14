import {ObjectUtils} from "../scripts/objectUtils";

QUnit.module("objectUtils", {});

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

test("createUpdatedObject should return a new object that adds the attributes of the second object to the first", () => {
	let first = { a: "a", b: "b" };
	let second = { c: "c", d: "d" };
	deepEqual(ObjectUtils.createUpdatedObject(first, second), { a: "a", b: "b", c: "c", d: "d" });
	deepEqual(first, { a: "a", b: "b" }, "The function should be pure");
	deepEqual(second, { c: "c", d: "d" }, "The function should be pure");
});

test("createUpdatedObject should update the first object if it contains an attribute that the second object contains", () => {
	let first = { a: "a", b: "b" };
	let second = { b: "new" };
	deepEqual(ObjectUtils.createUpdatedObject(first, second), { a: "a", b: "new" });
	deepEqual(first, { a: "a", b: "b" }, "The function should be pure");
	deepEqual(second, { b: "new" }, "The function should be pure");
});

test("createUpdatedObject should return a copy of the second object if the first is undefined", () => {
	let second = { a: "a" };
	deepEqual(ObjectUtils.createUpdatedObject(undefined, second), { a: "a" });
});

test("createUpdatedObject should return a copy of the second object if the first is empty", () => {
	let second = { a: "a" };
	deepEqual(ObjectUtils.createUpdatedObject({}, second), { a: "a" });
});

test("createUpdatedObject should return a copy of the first object if the second is undefined", () => {
	let first = { a: "a" };
	deepEqual(ObjectUtils.createUpdatedObject(first, undefined), { a: "a" });
});

test("createUpdatedObject should return a copy of the first object if the second is empty", () => {
	let first = { a: "a" };
	deepEqual(ObjectUtils.createUpdatedObject(first, {}), { a: "a" });
});

test("createUpdatedObject should return the empty object if both parameters are undefined or empty", () => {
	deepEqual(ObjectUtils.createUpdatedObject({}, {}), {});
	deepEqual(ObjectUtils.createUpdatedObject(undefined, undefined), {});
});
