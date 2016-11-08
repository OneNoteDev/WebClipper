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

	export function execWithRetry<T>(func: () => Promise<T>, retryCount: number): Promise<T> {
		return func().catch((error1) => {
			if (retryCount > 0) {
				return new Promise<T>((resolve, reject) => {
					setTimeout(() => {
						execWithRetry(func, retryCount - 1).then((response) => {
							resolve(response);
						}).catch((error2) => {
							reject(error2);
						});
					}, 0 /* TODO */);
				});
			} else {
				return Promise.reject(error1);
			}
		});
	}
}
