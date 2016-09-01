import {StorageGateStrategy} from "./storageGateStrategy";
import {ClipperStorageKeys} from "./clipperStorageKeys";

import {Storage} from "./storage";

export class ClipperStorageGateStrategy implements StorageGateStrategy {
	private keysThatRequireUserInfo = [
		ClipperStorageKeys.cachedNotebooks,
		ClipperStorageKeys.currentSelectedSection,
	];

	private storage: Storage;

	constructor(storage: Storage) {
		this.storage = storage;
	}

	public shouldSet(key: string, value: string, callback: (shouldSet: boolean) => void): void {
		if (this.keysThatRequireUserInfo.indexOf(key) > -1) {
			this.storage.getValue(ClipperStorageKeys.userInformation, (userInformation) => {
				if (userInformation) {
					callback(true);
				} else {
					callback(false);
				}
			});
		} else {
			callback(true);
		}
	}
}
