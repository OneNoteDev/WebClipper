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

	public getValues(keys: string[]): {} {
		let values = {};
		if (window.localStorage && keys) {
			for (let i = 0; i < keys.length; i++) {
				let result = window.localStorage.getItem(keys[i]);
				if (!result) {
					// Somehow we stored an invalid value. Destroy it!
					this.removeKey(keys[i]);
				} else {
					values[keys[i]] = result;
				}
			}
		}
		return values;
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
