import { WebExtension } from "../extensions/webExtensionBase/webExtension";
import {Storage} from "./storage";

export class LocalStorage implements Storage {
	public getValue(key: string): string {
		try {
			WebExtension.browser.storage.local.get([key], ({ result }) => {
				if (!result) {
					// Somehow we stored an invalid value. Destroy it!
					this.removeKey(key);
				}
				return result;
			});
		}
		catch (e) {
			return undefined;
		}
	}

	public getValues(keys: string[]): {} {
		let values = {};
		if (WebExtension.browser.storage.local && keys) {
			for (let i = 0; i < keys.length; i++) {
				WebExtension.browser.storage.local.get([keys[i]], ({ result }) => {
					if (!result) {
						// Somehow we stored an invalid value. Destroy it!
						this.removeKey(keys[i]);
					} else {
						values[keys[i]] = result;
					}
					return values;
				});
			}
		}
		else {
			return undefined;
		}
	}

	public setValue(key: string, value: string): void {
		if (WebExtension.browser.storage.local) {
			if (!value) {
				WebExtension.browser.storage.local.remove(key);
			} else {
				WebExtension.browser.storage.local.set({ key: value });
			}
		}
	}

	public removeKey(key: string): boolean {
		if (WebExtension.browser.storage.local) {
			WebExtension.browser.storage.local.remove(key);
		}

		return true;
	}
}
