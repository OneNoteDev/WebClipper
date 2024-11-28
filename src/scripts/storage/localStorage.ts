import {sendToOffscreenDocument} from "../communicator/offscreenCommunicator";
import {OffscreenMessageTypes} from "../communicator/offscreenMessageTypes";
import {Storage} from "./storage";

export class LocalStorage implements Storage {
	public async getValue(key: string): Promise<string> {
		return new Promise<string>(resolve => {
			sendToOffscreenDocument(OffscreenMessageTypes.getFromLocalStorage, {
				key: key,
			}).then((result) => {
				if (!result) {
					// Somehow we stored an invalid value. Destroy it!
					this.removeKey(key);
				}
				resolve(result);
			});
		});
	}

	public async getValues(keys: string[]): Promise<{}> {
		let values = {};
		return new Promise<{}>(async resolve => {
			if (keys) {
				for (let i = 0; i < keys.length; i++) {
					let result = await sendToOffscreenDocument(OffscreenMessageTypes.getFromLocalStorage, {
						key: keys[i],
					});
					if (!result) {
						// Somehow we stored an invalid value. Destroy it!
						this.removeKey(keys[i]);
					} else {
						values[keys[i]] = result;
					}
				}
			}
			resolve(values);
		});
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
