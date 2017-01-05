let theRealSetTimeout;
declare let setTimeout;

export class AsyncUtils {
	public static mockSetTimeout() {
		theRealSetTimeout = setTimeout;
		setTimeout = (func: (...args: any[]) => void, timeout: number) => {
			return theRealSetTimeout(func, 0);
		};
	}

	public static restoreSetTimeout() {
		setTimeout = theRealSetTimeout;
	}
}
