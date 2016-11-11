import {HelperFunctions} from "./helperFunctions";

import {PromiseUtils, RetryOptions} from "../scripts/promiseUtils";

let expectedResolve = "succeeded";
let expectedReject = "failed";
let callCount: number;

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

		HelperFunctions.mockSetTimeout();
	},
	afterEach: () => {
		HelperFunctions.restoreSetTimeout();
	}
});

test("execWithRetry should call the function once if the first attempt succeeds, and there are more than enough retries", (assert: QUnitAssert) => {
	let done = assert.async();
	PromiseUtils.execWithRetry(fnGenerator(1)).then((retVal) => {
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
	PromiseUtils.execWithRetry(fnGenerator(2)).then((retVal) => {
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
	PromiseUtils.execWithRetry(fnGenerator(Infinity)).then((retVal) => {
		ok(false, "execWithRetry should not resolve");
	}).catch((retVal) => {
		strictEqual(retVal, expectedReject, "execWithRetry should reject with the same value the function's promise rejects with");
		strictEqual(callCount, 3, "execWithRetry should call the function 3 times (1 first attempt, then 2 retries)");
	}).then(() => {
		done();
	});
});

test("execWithRetry should call the function once if the first attempt succeeds, and there are 0 retries", (assert: QUnitAssert) => {
	let done = assert.async();
	let retryOptions: RetryOptions = { retryCount: 0, retryWaitTime: 0 };

	PromiseUtils.execWithRetry(fnGenerator(1), retryOptions).then((retVal) => {
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
	let retryOptions: RetryOptions = { retryCount: 0, retryWaitTime: 0 };

	PromiseUtils.execWithRetry(fnGenerator(Infinity), retryOptions).then((retVal) => {
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
	let retryOptions: RetryOptions = { retryCount: 49, retryWaitTime: 0 };

	PromiseUtils.execWithRetry(fnGenerator(50), retryOptions).then((retVal) => {
		strictEqual(retVal, expectedResolve, "execWithRetry should resolve with the same value the function's promise resolves with");
		strictEqual(callCount, 50, "execWithRetry should call the function 50 times");
	}).catch(() => {
		ok(false, "execWithRetry should not reject");
	}).then(() => {
		done();
	});
});
