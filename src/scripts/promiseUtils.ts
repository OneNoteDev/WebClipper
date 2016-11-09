
/**
 * Retry options
 */
export interface RetryOptions {
	/** Number of times to retry */
	retryCount?: number;
	/** Minimum wait between retries (in millieseconds) */
	minTimeout?: number;
	/** Maximum wait between retries (in millieseconds) */
	maxTimeout?: number;
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
	export function execWithRetry<T>(func: () => Promise<T>, retryOptions: RetryOptions = { retryCount: 2, minTimeout: 500, maxTimeout: 3000}): Promise<T> {
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
					}, Math.round(Math.random() * (retryOptions.maxTimeout - retryOptions.minTimeout)) + retryOptions.minTimeout);
				});
			} else {
				return Promise.reject(error1);
			}
		});
	}
}
