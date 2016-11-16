import {Context, NoRequirements, ProductionRequirements} from "../../scripts/logging/context";

import {TestModule} from "../testModule";

export class ContextTests extends TestModule {
	private prod: Context;
	private noReq: Context;

	private requiredProps = ["a", "b", "c"];

	protected module() {
		return "";
	}

	protected beforeEach() {
		this.prod = new ProductionRequirements(this.requiredProps);
		this.noReq = new NoRequirements();
	}

	protected tests() {
		test("NoRequirements should always return true regardless of what is put in", () => {
			ok(this.noReq.requirementsAreMet(undefined), "No requirements returned false, which should never happen");
		});

		test("ProductionRequirements should return false for an empty or undefined argument", () => {
			strictEqual(this.prod.requirementsAreMet(undefined), false, "ProdRequirements incorrectly returned true for an undefined object");
			strictEqual(this.prod.requirementsAreMet({}), false, "ProdRequirements incorrectly returned true for an empty object");
		});

		test("ProductionRequirements should return false for a subset of properties that don't meet the full property set", () => {
			let partiallyFilledProps = {
				a: "bar",
				b: "baz"
			} as { [key: string]: string | number | boolean };
			strictEqual(this.prod.requirementsAreMet(partiallyFilledProps), false, "requirementsAreMet incorrectly returned true when the contextProps passed in did not match those injected at construction");
		});

		test("ProductionRequirements should return true for properties that meet exactly the requirements", () => {
			let fullyFilledProps = {
				a: "bar",
				b: "baz",
				c: "foo"
			} as { [key: string]: string | number | boolean };
			strictEqual(this.prod.requirementsAreMet(fullyFilledProps), true, "requirementsAreMet incorrectly returned false when the contextProps passed in matched the requirements injected at construction");
		});

		test("ProductionRequirements should return true for props that exceed the props injected at constructin", () => {
			let excessProps = {
				a: "a",
				b: "b",
				c: "c",
				d: "d"
			} as { [key: string]: string | number | boolean };
			strictEqual(this.prod.requirementsAreMet(excessProps), true, "requirementsAreMet incorrectly returned false when the contextProps passed in exceeded the requirements injected at construction");
		});
	}
}

(new ContextTests()).runTests();
