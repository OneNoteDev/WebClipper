import {GetResponseAsync, TimeStampedData} from "../http/cachedHttp";
import {ClipperCachedHttp} from "../http/clipperCachedHttp";

import {Logger} from "../logging/logger";

import {Storage} from "./storage";
import {StorageGateStrategy} from "./StorageGateStrategy";

export class ClipperData implements Storage {
	private storage: Storage;
	private storageGateStrategy: StorageGateStrategy;
	private cachedHttp: ClipperCachedHttp;

	constructor(storage: Storage, storageGateStrategy: StorageGateStrategy, logger: Logger) {
		this.storage = storage;
		this.storageGateStrategy = storageGateStrategy;
		// We pass 'this' as the Storage object as it handles all the sanity-check gating in the setValue
		this.cachedHttp = new ClipperCachedHttp(this, logger);
	}

	public setLogger(logger: Logger) {
		this.cachedHttp.setLogger(logger);
	}

	public getAndCacheFreshValue(key: string, getRemoteValue: GetResponseAsync, updateInterval?: number): Promise<TimeStampedData> {
		return this.cachedHttp.getAndCacheFreshValue(key, getRemoteValue, updateInterval);
	}

	public getValue(key: string, callback: (value: string) => void): void {
		this.storage.getValue(key, callback);
	}

	public setValue(key: string, value: string, callback?: (value: string) => void): void {
		this.storageGateStrategy.shouldSet(key, value, (shouldSet) => {
			if (shouldSet) {
				this.storage.setValue(key, value, callback);
			} else {
				callback(value);
			}
		});
	}

	public removeKey(key: string, callback?: (successful: boolean) => void): void {
		this.storage.removeKey(key, callback);
	}
}
