import {Http} from "./http";

import {ObjectUtils} from "../objectUtils";
import {PromiseUtils, RetryOptions} from "../promiseUtils";

/**
 * Helper class which extends the Http class in order to allow automatic retries.
 */
export class HttpWithRetries extends Http {
	public static get(url: string, headers?: any, timeout = Http.defaultTimeout, expectedCodes = [200], retryOptions?: RetryOptions): Promise<Response> {
		let func = () => {
			return super.createAndSendRequest("GET", url, headers, expectedCodes, timeout);
		};

		return PromiseUtils.execWithRetry(func, retryOptions);
	}

	public static post(url: string, data: any, headers?: any, expectedCodes = [200], timeout = Http.defaultTimeout, retryOptions?: RetryOptions): Promise<Response> {
		if (ObjectUtils.isNullOrUndefined(data)) {
			throw new Error("data must be a non-undefined object, but was: " + data);
		}

		let func = () => {
			return super.createAndSendRequest("POST", url, headers, expectedCodes, timeout, data);
		};

		return PromiseUtils.execWithRetry(func, retryOptions);
	}
}
