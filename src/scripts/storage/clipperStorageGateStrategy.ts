import {StorageGateStrategy} from "./storageGateStrategy";
import {ClipperStorageKeys} from "./clipperStorageKeys";

import {Storage} from "./storage";

export class ClipperStorageGateStrategy implements StorageGateStrategy {
	private keysThatRequireUserInfo = [
		ClipperStorageKeys.cachedNotebooks,
		ClipperStorageKeys.currentSelectedSection
	];

	private storage: Storage;

	constructor(storage: Storage) {
		this.storage = storage;
	}

	public async shouldSet(key: string, value: string): Promise<boolean> {
		// An undefined value is the same thing as removing a key, so we allow it regardless
		if (value && this.keysThatRequireUserInfo.indexOf(key) > -1) {
			let userInfo = await this.storage.getValue(ClipperStorageKeys.userInformation);
			return !!userInfo;
		}
		return true;
	}
}
