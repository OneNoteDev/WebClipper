import {sendToOffscreenDocument} from "../communicator/offscreenCommunicator";
import {OffscreenMessageTypes} from "../communicator/offscreenMessageTypes";
import {Storage} from "./storage";

export class LocalStorage implements Storage {
	public async getValue(key: string): Promise<string> {
		const result = await sendToOffscreenDocument(OffscreenMessageTypes.getFromLocalStorage, {
			key: key,
		});
		if (!result) {
			// Somehow we stored an invalid value. Destroy it!
			this.removeKey(key);
		}
		return result;
	}

	public async getValues(keys: string[]): Promise<{}> {
		let values = {};
		let results = [];
		if (keys) {
			for (let i = 0; i < keys.length; i++) {
				results[i] = sendToOffscreenDocument(OffscreenMessageTypes.getFromLocalStorage, {
					key: keys[i],
				});
			}
			let vals = await Promise.all(results);
			for (let i = 0; i < keys.length; i++) {
				if (!vals[i]) {
					// Somehow we stored an invalid value. Destroy it!
					this.removeKey(keys[i]);
				} else {
					values[keys[i]] = vals[i];
				}
			}
		}
		return values;
	}

	public setValue(key: string, value: string): void {
		if (!value) {
			this.removeKey(key);
		} else {
			sendToOffscreenDocument(OffscreenMessageTypes.setToLocalStorage, {
				key: key,
				value: value,
			});
		}
	}

	public removeKey(key: string): boolean {
		sendToOffscreenDocument(OffscreenMessageTypes.removeFromLocalStorage, {
			key: key,
		});

		return true;
	}
}
