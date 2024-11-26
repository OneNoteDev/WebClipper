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

	public async getValues(keys: string[]): Promise<{}> {
		let values = {};
		if (keys) {
			await chrome.storage.local.get(keys, (data) => {
				for (let i = 0; i < keys.length; i++) {
					if (!data[keys[i]]) {
						// Somehow we stored an invalid value. Destroy it!
						this.removeKey(keys[i]);
					} else {
						values[keys[i]] = data[keys[i]];
					}
				}
			});
		}
		return values;
	}

	public setValue(key: string, value: string): void {
		if (!value) {
			this.removeKey(key);
		} else {
			chrome.storage.local.set({ [key]: value });
		}
	}

	public removeKey(key: string): boolean {
		chrome.storage.local.remove(key);
		return true;
	}
}
