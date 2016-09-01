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
