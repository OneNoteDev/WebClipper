import {Storage} from "./storage";

export class LocalStorage implements Storage {
	public getValue(key: string): string {
		let result: string;
		if (window.localStorage) {
			result = window.localStorage.getItem(key);
			if (!result) {
				// Somehow we stored an invalid value. Destroy it!
				this.removeKey(key);
			}
		}
		return result;
	}

	public setValue(key: string, value: string): void {
		if (window.localStorage) {
			if (!value) {
				window.localStorage.removeItem(key);
			} else {
				window.localStorage.setItem(key, value);
			}
		}
	}

	public removeKey(key: string): boolean {
		if (window.localStorage) {
			window.localStorage.removeItem(key);
		}

		return true;
	}
}
