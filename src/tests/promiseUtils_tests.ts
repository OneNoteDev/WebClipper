import {PromiseUtils, RetryOptions} from "../scripts/promiseUtils";

import {HelperFunctions} from "./helperFunctions";
import {TestModule} from "./testModule";

export class PromiseUtilsTests extends TestModule {
	private expectedResolve = "succeeded";
	private expectedReject = "failed";
	private callCount: number;

	protected module() {
		return "promiseUtils";
	}

	protected beforeEach() {
		this.callCount = 0;
		HelperFunctions.mockSetTimeout();
	}

	protected afterEach() {
		HelperFunctions.restoreSetTimeout();
	}

	protected tests() {
		test("execWithRetry should call the function once if the first attempt succeeds, and there are more than enough retries", (assert: QUnitAssert) => {
			let done = assert.async();
			PromiseUtils.execWithRetry(this.fnGenerator(1)).then((retVal) => {
				strictEqual(retVal, this.expectedResolve, "execWithRetry should resolve with the same value the function's promise resolves with");
				strictEqual(this.callCount, 1, "execWithRetry should call the function once");
			}).catch(() => {
				ok(false, "execWithRetry should not reject");
			}).then(() => {
				done();
			});
		});

		test("execWithRetry should call the function twice if the first attempt fails, but the second succeeds, and there are more than enough retries", (assert: QUnitAssert) => {
			let done = assert.async();
			PromiseUtils.execWithRetry(this.fnGenerator(2)).then((retVal) => {
				strictEqual(retVal, this.expectedResolve, "execWithRetry should resolve with the same value the function's promise resolves with");
				strictEqual(this.callCount, 2, "execWithRetry should call the function twice");
			}).catch(() => {
				ok(false, "execWithRetry should not reject");
			}).then(() => {
				done();
			});
		});

		test("With the default options, execWithRetry should reject if all attempts fail and there are not enough retries, and the callback should be called 4 times in total", (assert: QUnitAssert) => {
			let done = assert.async();
			PromiseUtils.execWithRetry(this.fnGenerator(Infinity)).then((retVal) => {
				ok(false, "execWithRetry should not resolve");
			}).catch((retVal) => {
				strictEqual(retVal, this.expectedReject, "execWithRetry should reject with the same value the function's promise rejects with");
				strictEqual(this.callCount, 4, "execWithRetry should call the function 4 times (1 first attempt, then 3 retries)");
			}).then(() => {
				done();
			});
		});

		test("execWithRetry should call the function once if the first attempt succeeds, and there are 0 retries", (assert: QUnitAssert) => {
			let done = assert.async();
			let retryOptions: RetryOptions = { retryCount: 0, retryWaitTimeInMs: 0 };

			PromiseUtils.execWithRetry(this.fnGenerator(1), retryOptions).then((retVal) => {
				strictEqual(retVal, this.expectedResolve, "execWithRetry should resolve with the same value the function's promise resolves with");
				strictEqual(this.callCount, 1, "execWithRetry should call the function once");
			}).catch(() => {
				ok(false, "execWithRetry should not reject");
			}).then(() => {
				done();
			});
		});

		test("execWithRetry should call the function once then reject if the first attempt fails, and there are 0 retries", (assert: QUnitAssert) => {
			let done = assert.async();
			let retryOptions: RetryOptions = { retryCount: 0, retryWaitTimeInMs: 0 };

			PromiseUtils.execWithRetry(this.fnGenerator(Infinity), retryOptions).then((retVal) => {
				ok(false, "execWithRetry should not resolve");
			}).catch((retVal) => {
				strictEqual(retVal, this.expectedReject, "execWithRetry should reject with the same value the function's promise rejects with");
				strictEqual(this.callCount, 1, "execWithRetry should call the function once");
			}).then(() => {
				done();
			});
		});

		test("execWithRetry should call the function n times if only the nth attempt succeeds, and there are n-1 retries", (assert: QUnitAssert) => {
			let done = assert.async();
			let retryOptions: RetryOptions = { retryCount: 49, retryWaitTimeInMs: 0 };

			PromiseUtils.execWithRetry(this.fnGenerator(50), retryOptions).then((retVal) => {
				strictEqual(retVal, this.expectedResolve, "execWithRetry should resolve with the same value the function's promise resolves with");
				strictEqual(this.callCount, 50, "execWithRetry should call the function 50 times");
			}).catch(() => {
				ok(false, "execWithRetry should not reject");
			}).then(() => {
				done();
			});
		});
	}

	private fnGenerator(callsUntilSucceed: number): () => Promise<string> {
		return (() => {
			this.callCount++;
			if (this.callCount === callsUntilSucceed) {
				return Promise.resolve(this.expectedResolve);
			}
			return Promise.reject(this.expectedReject);
		}).bind(this);
	}
}

(new PromiseUtilsTests()).runTests();
