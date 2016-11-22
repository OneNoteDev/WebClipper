let theRealSetTimeout;
declare let setTimeout;

export module AsyncUtils {
	export function mockSetTimeout() {
		theRealSetTimeout = setTimeout;
		setTimeout = (func: (...args: any[]) => void, timeout: number) => {
			return theRealSetTimeout(func, 0);
		};
	}

	export function restoreSetTimeout() {
		setTimeout = theRealSetTimeout;
	}
}
