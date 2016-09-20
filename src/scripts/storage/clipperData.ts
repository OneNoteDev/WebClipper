import {GetResponseAsync, TimeStampedData} from "../http/cachedHttp";
import {ClipperCachedHttp} from "../http/clipperCachedHttp";

import {Logger} from "../logging/logger";

import {ClipperStorageGateStrategy} from "./clipperStorageGateStrategy";
import {Storage} from "./storage";
import {StorageGateStrategy} from "./StorageGateStrategy";

/**
 * The data-access-like object that handles the fetching and caching of data
 * from Clipper-specific endpoints (TODO: a factory class that is responsible for
 * providing getRemoteValue objects?). Also provides a gating mechanism as a
 * sanity-check for what information gets stored locally.
 */
export class ClipperData implements Storage {
	private storage: Storage;
	private storageGateStrategy: StorageGateStrategy;
	private cachedHttp: ClipperCachedHttp;

	constructor(storage: Storage, logger?: Logger) {
		this.storage = storage;
		this.storageGateStrategy = new ClipperStorageGateStrategy(storage);
		// We pass 'this' as the Storage object as it handles all the sanity-check gating in the setValue
		this.cachedHttp = new ClipperCachedHttp(this, logger);
	}

	public setLogger(logger: Logger) {
		this.cachedHttp.setLogger(logger);
	}

	public getFreshValue(key: string, getRemoteValue: GetResponseAsync, updateInterval?: number): Promise<TimeStampedData> {
		return this.cachedHttp.getFreshValue(key, getRemoteValue, updateInterval);
	}

	public getValue(key: string): string {
		return this.storage.getValue(key);
	}

	public getValues(keys: string[]): {} {
		return this.storage.getValues(keys);
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
