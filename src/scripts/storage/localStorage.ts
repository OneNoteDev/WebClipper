import {Storage} from "./storage";

export class LocalStorage implements Storage {
	public async getValue(key: string): Promise<string> {
		let result: string;
		result = window.localStorage.getItem(key);
		if (!result) {
			// Somehow we stored an invalid value. Destroy it!
			this.removeKey(key);
		}
		return result;
	}

	public async getValues(keys: string[]): Promise<{}> {
		let values = {};
		if (keys) {
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
		if (!value) {
			this.removeKey(key);
		} else {
			window.localStorage.setItem(key, value);
		}
	}

	public removeKey(key: string): boolean {
		window.localStorage.removeItem(key);
		return true;
	}
}
