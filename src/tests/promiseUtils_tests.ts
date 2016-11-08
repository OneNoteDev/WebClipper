import {PromiseUtils} from "../scripts/promiseUtils";

import * as sinon from "sinon";

let expectedResolve = "succeeded";
let expectedReject = "failed";
let callCount: number;
let clock: sinon.SinonFakeTimers;

function fnGenerator(callsUntilSucceed: number): () => Promise<string> {
	return () => {
		callCount++;
		if (callCount === callsUntilSucceed) {
			return Promise.resolve(expectedResolve);
		}
		return Promise.reject(expectedReject);
	};
}

QUnit.module("promiseUtils", {
	beforeEach: () => {
		callCount = 0;
		// clock = sinon.useFakeTimers();
	},
	afterEach: () => {
		// clock.restore();
	}
});

test("execWithRetry should call the function once if the first attempt succeeds, and there are more than enough retries", (assert: QUnitAssert) => {
	let done = assert.async();
	PromiseUtils.execWithRetry(fnGenerator(1), 3).then((retVal) => {
		strictEqual(retVal, expectedResolve, "execWithRetry should resolve with the same value the function's promise resolves with");
		strictEqual(callCount, 1, "execWithRetry should call the function once");
	}).catch(() => {
		ok(false, "execWithRetry should not reject");
	}).then(() => {
		done();
	});
});

test("execWithRetry should call the function twice if the first attempt fails, but the second succeeds, and there are more than enough retries", (assert: QUnitAssert) => {
	let done = assert.async();
	PromiseUtils.execWithRetry(fnGenerator(2), 3).then((retVal) => {
		strictEqual(retVal, expectedResolve, "execWithRetry should resolve with the same value the function's promise resolves with");
		strictEqual(callCount, 2, "execWithRetry should call the function twice");
	}).catch(() => {
		ok(false, "execWithRetry should not reject");
	}).then(() => {
		done();
	});
});

test("execWithRetry should reject if all attempts fail and there are not enough retries", (assert: QUnitAssert) => {
	let done = assert.async();
	PromiseUtils.execWithRetry(fnGenerator(Infinity), 3).then((retVal) => {
		ok(false, "execWithRetry should not resolve");
	}).catch((retVal) => {
		strictEqual(retVal, expectedReject, "execWithRetry should reject with the same value the function's promise rejects with");
		strictEqual(callCount, 4, "execWithRetry should call the function 4 times (1 first attempt, then 3 retries)");
	}).then(() => {
		done();
	});
});

test("execWithRetry should call the function once if the first attempt succeeds, and there are 0 retries", (assert: QUnitAssert) => {
	let done = assert.async();
	PromiseUtils.execWithRetry(fnGenerator(1), 0).then((retVal) => {
		strictEqual(retVal, expectedResolve, "execWithRetry should resolve with the same value the function's promise resolves with");
		strictEqual(callCount, 1, "execWithRetry should call the function once");
	}).catch(() => {
		ok(false, "execWithRetry should not reject");
	}).then(() => {
		done();
	});
});

test("execWithRetry should call the function once then reject if the first attempt fails, and there are 0 retries", (assert: QUnitAssert) => {
	let done = assert.async();
	PromiseUtils.execWithRetry(fnGenerator(Infinity), 0).then((retVal) => {
		ok(false, "execWithRetry should not resolve");
	}).catch((retVal) => {
		strictEqual(retVal, expectedReject, "execWithRetry should reject with the same value the function's promise rejects with");
		strictEqual(callCount, 1, "execWithRetry should call the function once");
	}).then(() => {
		done();
	});
});

test("execWithRetry should call the function n times if only the nth attempt succeeds, and there are n-1 retries", (assert: QUnitAssert) => {
	let done = assert.async();
	PromiseUtils.execWithRetry(fnGenerator(50), 49).then((retVal) => {
		strictEqual(retVal, expectedResolve, "execWithRetry should resolve with the same value the function's promise resolves with");
		strictEqual(callCount, 50, "execWithRetry should call the function 500 times");
	}).catch(() => {
		ok(false, "execWithRetry should not reject");
	}).then(() => {
		done();
	});
});

// TODO use fakeTimers to test the setTimeout
