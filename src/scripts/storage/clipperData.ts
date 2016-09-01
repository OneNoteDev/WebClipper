import {GetResponseAsync, TimeStampedData} from "../http/cachedHttp";
import {ClipperCachedHttp} from "../http/clipperCachedHttp";

import {Logger} from "../logging/logger";

import {ClipperStorageGateStrategy} from "./clipperStorageGateStrategy";
import {Storage} from "./storage";
import {StorageGateStrategy} from "./StorageGateStrategy";

export class ClipperData implements Storage {
	private storage: Storage;
	private storageGateStrategy: StorageGateStrategy;
	private cachedHttp: ClipperCachedHttp;

	// TODO created a gated data store class?
	constructor(storage: Storage, logger?: Logger) {
		this.storage = storage;
		this.storageGateStrategy = new ClipperStorageGateStrategy(storage);
		// We pass 'this' as the Storage object as it handles all the sanity-check gating in the setValue
		this.cachedHttp = new ClipperCachedHttp(this, logger);
	}

	public setLogger(logger: Logger) {
		this.cachedHttp.setLogger(logger);
	}

	public getAndCacheFreshValue(key: string, getRemoteValue: GetResponseAsync, updateInterval?: number): Promise<TimeStampedData> {
		return this.cachedHttp.getAndCacheFreshValue(key, getRemoteValue, updateInterval);
	}

	public getValue(key: string): string {
		return this.storage.getValue(key);
	}

	public setValue(key: string, value: string): void {
		if (this.storageGateStrategy.shouldSet(key, value)) {
			this.storage.setValue(key, value);
		}
	}

	public removeKey(key: string): boolean {
		return this.storage.removeKey(key);
	}
}
