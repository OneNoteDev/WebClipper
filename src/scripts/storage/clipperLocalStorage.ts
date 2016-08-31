import {Storage} from "./storage";

/**
 * Responsible for gating setting to storage depending on the clipper's state
 */
export class ClipperStorage implements Storage {
	private storage: Storage;

	constructor(storage: Storage) {
		this.storage = storage;
	}

	public getValue(key: string, callback: (value: string) => void): void {
		this.storage.getValue(key, callback);
	}

	public setValue(key: string, value: string, callback?: (value: string) => void): void {

	}

	public removeKey(key: string, callback?: (successful: boolean) => void): void {
		this.storage.removeKey(key, callback);
	}
}
