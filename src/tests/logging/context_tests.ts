import {Context, NoRequirements, ProductionRequirements} from "../../scripts/logging/context";

let prod: Context;
let noReq: Context;

let requiredProps = ["a", "b", "c"];

QUnit.module("context", {
	beforeEach: () => {
		prod = new ProductionRequirements(requiredProps);
		noReq = new NoRequirements();
	}
});

test("NoRequirements should always return true regardless of what is put in", () => {
	ok(noReq.requirementsAreMet(undefined), "No requirements returned false, which should never happen");
});

test("ProductionRequirements should return false for an empty or undefined argument", () => {
	strictEqual(prod.requirementsAreMet(undefined), false, "ProdRequirements incorrectly returned true for an undefined object");
	strictEqual(prod.requirementsAreMet({}), false, "ProdRequirements incorrectly returned true for an empty object");
});

test("ProductionRequirements should return false for a subset of properties that don't meet the full property set", () => {
	let partiallyFilledProps = {
		a: "bar",
		b: "baz"
	} as { [key: string]: string | number | boolean };
	strictEqual(prod.requirementsAreMet(partiallyFilledProps), false, "requirementsAreMet incorrectly returned true when the contextProps passed in did not match those injected at construction");
});

test("ProductionRequirements should return true for properties that meet exactly the requirements", () => {
	let fullyFilledProps = {
		a: "bar",
		b: "baz",
		c: "foo"
	} as { [key: string]: string | number | boolean };
	strictEqual(prod.requirementsAreMet(fullyFilledProps), true, "requirementsAreMet incorrectly returned false when the contextProps passed in matched the requirements injected at construction");
});

test("ProductionRequirements should return true for props that exceed the props injected at constructin", () => {
	let excessProps = {
		a: "a",
		b: "b",
		c: "c",
		d: "d"
	} as { [key: string]: string | number | boolean };
	strictEqual(prod.requirementsAreMet(excessProps), true, "requirementsAreMet incorrectly returned false when the contextProps passed in exceeded the requirements injected at construction");
});
