import {Storage} from "./storage";

export class LocalStorage implements Storage {
	public getValue(key: string, callback: (value: string) => void): void {
		let result: string;
		if (window.localStorage) {
			result = window.localStorage.getItem(key);
			if (!result) {
				// Somehow we stored an invalid value. Destroy it!
				this.removeKey(key);
			}
		}
		callback(result);
	}

	public setValue(key: string, value: string, callback?: (value: string) => void): void {
		if (window.localStorage) {
			if (!value) {
				window.localStorage.removeItem(key);
			} else {
				window.localStorage.setItem(key, value);
			}
		}

		if (callback) {
			callback(value);
		}
	}

	public removeKey(key: string, callback?: (successful: boolean) => void): void {
		if (window.localStorage) {
			window.localStorage.removeItem(key);
		}

		if (callback) {
			callback(true);
		}
	}
}
