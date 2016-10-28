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
}
