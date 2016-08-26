/// <reference path="../../../typings/main/ambient/qunit/qunit.d.ts" />

import {SmartValue} from "../../scripts/communicator/smartValue";

QUnit.module("smartValue", {});

test("Test that SmartValue subscriptions are triggered with the appropriate values", () => {
	let smartValue = new SmartValue<string>("originalValue");

	let counter = 0;
	smartValue.subscribe((newValue) => {
		counter++;

		if (counter === 1) {
			strictEqual(newValue, "originalValue", "Subscribers should be called immediately after being created with the existing value");
			strictEqual(smartValue.get(), "originalValue", "Subscribers should be called immediately after being created, and the get method should return the existing value");
		} else if (counter === 2) {
			strictEqual(newValue, "setTwice", "When a new value is set, the subscriber should be called with the new value as a parameter");
			strictEqual(smartValue.get(), "setTwice", "When a new value is set, the subscriber should be called, and the get method should return the new value");
		} else if (counter === 3) {
			if (newValue === "setTwice") {
				ok(false, "If the value is set to the exact same value as it already was, we shouldn't notify the subscribers");
			} else {
				strictEqual(newValue, "finalValue", "When a new value is set, the subscriber should be called with the new value as a parameter");
				strictEqual(smartValue.get(), "finalValue", "When a new value is set, the subscriber should be called, and the get method should return the new value");
			}
		} else {
			ok(false, "The subscribed method was called more times than expected!");
		}
	});

	smartValue.set("setTwice");
	smartValue.set("setTwice");
	smartValue.set("finalValue");

	strictEqual(smartValue.get(), "finalValue", "The get method should return the updated value");
});

test("Test SmartValue.Subscribe for multiple smart values", () => {
	let smartValue1 = new SmartValue<string>("initialValue1");
	let smartValue2 = new SmartValue<string>("initialValue2");

	let counter = 0;
	SmartValue.subscribe([smartValue1, smartValue2], (newValue1, newValue2) => {
		counter++;

		if (counter === 1) {
			strictEqual(newValue1, "initialValue1", "Check the initialValues");
			strictEqual(newValue2, "initialValue2", "Check the initialValues");
		} else if (counter === 2) {
			strictEqual(newValue1, "initialValue1", "We expect this to fire twice");
			strictEqual(newValue2, "initialValue2", "We expect this to fire twice");
		} else if (counter === 3) {
			strictEqual(newValue1, "updatedValue1", "Value should be updated");
			strictEqual(newValue2, "initialValue2", "Value should be the original");
		} else if (counter === 4) {
			strictEqual(newValue1, "updatedValue1", "Value should be updated");
			strictEqual(newValue2, "updatedValue2", "Value should be updated");
		} else if (counter === 5) {
			ok(false, "The subscribed method was called more times than expected!");
		}
	});

	smartValue1.set("updatedValue1");
	smartValue2.set("updatedValue2");
});

test("If specified, a given subscription callback should only be called n number of times",
() => {
	let smartValue = new SmartValue<string>("");

	let a = 0;
	let aFunc = () => {
		a++;
	};

	let b = 0;
	let bFunc = () => {
		b++;
	};

	let c = 0;
	let cFunc = () => {
		c++;
	};

	let d = 0;
	let dFunc = () => {
		d++;
	};

	let e = 0;
	let eFunc = () => {
		e++;
	};

	smartValue.subscribe(aFunc, { times: -1, callOnSubscribe: false });
	smartValue.subscribe(bFunc, { times: 0, callOnSubscribe: false });
	smartValue.subscribe(cFunc, { times: 2, callOnSubscribe: false });
	smartValue.subscribe(dFunc, { times: 3, callOnSubscribe: false });
	smartValue.subscribe(eFunc, { times: 5, callOnSubscribe: false });

	for (let i = 0; i < 3; i++) {
		smartValue.set(smartValue.get() + "!");
	}

	strictEqual(a, 0, "Given times is set to n < 0, the callback should not be called at all");
	strictEqual(b, 0, "Given times is set to n = 0, the callback should not be called at all");
	strictEqual(c, 2, "Given times is set to 0 < n < set-calls, the callback should be called n times");
	strictEqual(d, 3, "Given times is set to n = set-calls, the callback should be called n times");
	strictEqual(e, 3, "Given times is set to n > set-calls, the callback should be called set-calls times");
});

test("If specified, a given subscription callback should not be called on subscribe, the opposite likewise", () => {
	let smartValue = new SmartValue<string>("");

	let a = 0;
	let aFunc = () => {
		a++;
	};

	let b = 0;
	let bFunc = () => {
		b++;
	};

	smartValue.subscribe(aFunc, { times: Infinity, callOnSubscribe: false });
	smartValue.subscribe(bFunc, { times: Infinity, callOnSubscribe: true });

	strictEqual(a, 0,
		"Given callOnSubscribe is false, the callback should not be called on subscribe");
	strictEqual(b, 1,
		"Given callOnSubscribe is true, the callback should be called on subscribe");

	smartValue.set(smartValue.get() + "!");

	strictEqual(a, 1,
		"Subsequent sets should call the callback as per normal");
	strictEqual(b, 2,
		"Subsequent sets should call the callback as per normal");
});

test("The initial call if callOnSubscribe is set to true should not use up one of the 'times' calls", () => {
	let smartValue = new SmartValue<string>("");

	let a = 0;
	let aFunc = () => {
		a++;
	};

	smartValue.subscribe(aFunc, { times: 1, callOnSubscribe: true });

	strictEqual(a, 1,
		"The subscribe should trigger a call");
	smartValue.set(smartValue.get() + "!");
	strictEqual(a, 2,
		"Even after the subscribe triggered a call when times is set to 1, a subsequent set will still use up a count");
	smartValue.set(smartValue.get() + "!");
	strictEqual(a, 2,
		"The count is now at 0, so the callback should not fire");
});

test("The callback should fire if callOnSubscribe is set to true despite times being set to 0", () => {
	let smartValue = new SmartValue<string>("");

	let a = 0;
	let aFunc = () => {
		a++;
	};

	smartValue.subscribe(aFunc, { times: 0, callOnSubscribe: true });

	strictEqual(a, 1,
		"The subscribe should trigger a call despite times being set to 0");
});

test("A function that was previously subscribed should no longer be called if it is unsubscribed", () => {
	let smartValue = new SmartValue<string>("");

	let a = 0;
	let aFunc = () => {
		a++;
	};

	smartValue.subscribe(aFunc, { times: Infinity, callOnSubscribe: false });
	smartValue.unsubscribe(aFunc);

	smartValue.set(smartValue.get() + "!");
	strictEqual(a, 0, "The unsubscribed function should not be called");
});

test("Only one function should be unsubscribed at a time even if there are multiple functions with the same references", () => {
	let smartValue = new SmartValue<string>("");

	let a = 0;
	let aFunc = () => {
		a++;
	};

	smartValue.subscribe(aFunc, { times: Infinity, callOnSubscribe: false });
	smartValue.subscribe(aFunc, { times: Infinity, callOnSubscribe: false });
	smartValue.unsubscribe(aFunc);

	smartValue.set(smartValue.get() + "!");
	strictEqual(a, 1, "Only one function should be unsubscribed");
});

test("If two identical (but not same reference) functions were added and the first was unsubscribed, it should not affect the second", () => {
	let smartValue = new SmartValue<string>("");

	let a = 0;
	let aFunc = () => {
		a++;
	};
	let bFunc = () => {
		a++;
	};

	smartValue.subscribe(aFunc, { times: Infinity, callOnSubscribe: false });
	smartValue.subscribe(bFunc, { times: Infinity, callOnSubscribe: false });
	smartValue.unsubscribe(aFunc);

	smartValue.set(smartValue.get() + "!");
	strictEqual(a, 1, "Only one function should be unsubscribed");
});

test("If the function that was unsubscribed wasn't present in the smart value, no functions should be unsubscribed", () => {
	let smartValue = new SmartValue<string>("");

	let a = 0;
	let aFunc = () => {
		a++;
	};
	let b = 0;
	let bFunc = () => {
		b++;
	};

	smartValue.subscribe(aFunc, { times: Infinity, callOnSubscribe: false });
	smartValue.unsubscribe(bFunc);

	smartValue.set(smartValue.get() + "!");
	strictEqual(a, 1, "No function should be unsubscribed");
});

test("If undefined is the parameter to unsubscribe, no functions should be unsubscribed", () => {
	let smartValue = new SmartValue<string>("");

	let a = 0;
	let aFunc = () => {
		a++;
	};

	smartValue.subscribe(aFunc, { times: Infinity, callOnSubscribe: false });
	smartValue.unsubscribe(undefined);

	smartValue.set(smartValue.get() + "!");
	strictEqual(a, 1, "No function should be unsubscribed");
});

test("Nothing should break if unsubscribe is called when there's no subscribed functions", () => {
	let smartValue = new SmartValue<string>("");

	let a = 0;
	let aFunc = () => {
		a++;
	};

	smartValue.unsubscribe(aFunc);
	smartValue.unsubscribe(undefined);
	ok(true);
});
