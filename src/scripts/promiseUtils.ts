
/**
 * Retry options
 */
export interface RetryOptions {
	/** Number of times to retry */
	retryCount?: number;
	/** Wait between retries (in milliseconds) */
	retryWaitTime?: number;
}

export module PromiseUtils {
	/**
	 * Returns a promise that simply resolves after the specified time period
	 */
	export function wait(millieseconds: number): Promise<{}> {
		return new Promise((resolve) => {
			setTimeout(() => {
				resolve();
			}, millieseconds);
		});
	}

	/**
	 * Executes the given function and retries on failure.
	 */
	export function execWithRetry<T>(func: () => Promise<T>, retryOptions: RetryOptions = { retryCount: 2, retryWaitTime: 3000}): Promise<T> {
		return func().catch((error1) => {
			if (retryOptions.retryCount > 0) {
				return new Promise<T>((resolve, reject) => {
					setTimeout(() => {
						retryOptions.retryCount--;
						execWithRetry(func, retryOptions).then((response) => {
							resolve(response);
						}).catch((error2) => {
							reject(error2);
						});
					}, retryOptions.retryWaitTime);
				});
			} else {
				return Promise.reject(error1);
			}
		});
	}
}
