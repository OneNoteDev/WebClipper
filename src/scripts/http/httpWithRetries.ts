import {Http} from "./http";

import { Utils } from "../utils";
import { PromiseUtils } from "../promiseUtils";

/**
 * Helper class which extends the Http class in order to allow automatic retries.
 */
export class HttpWithRetries extends Http {
	public static get(url: string, headers?: any, timeout = Http.defaultTimeout, expectedCodes = [200], retryCount = 1): Promise<XMLHttpRequest> {
		return PromiseUtils.retry(super.createAndSendRequest("GET", url, headers, expectedCodes, timeout), 2);
	}

	public static post(url: string, data: any, headers?: any, expectedCodes = [200], timeout = Http.defaultTimeout, retryCount = 1): Promise<XMLHttpRequest> {
		if (Utils.isNullOrUndefined(data)) {
			throw new Error("data must be a non-undefined object, but was: " + data);
		}

		return PromiseUtils.retry(super.createAndSendRequest("POST", url, headers, expectedCodes, timeout, data), 2);
	}
}
