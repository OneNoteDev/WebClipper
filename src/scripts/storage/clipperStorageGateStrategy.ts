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

	public shouldSet(key: string, value: string): boolean {
		if (this.keysThatRequireUserInfo.indexOf(key) > -1) {
			let userInfo = this.storage.getValue(ClipperStorageKeys.userInformation);
			return !!userInfo;
		}
		return true;
	}
}
