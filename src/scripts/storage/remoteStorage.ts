import {Constants} from "../constants";

import {Communicator} from "../communicator/communicator";

import {StorageAsync} from "./storageAsync";

export class RemoteStorage implements StorageAsync {
	private extensionCommunicator: Communicator;
	private storageCache: { [key: string]: string } = {};

	constructor(extCommunicator: Communicator) {
		this.extensionCommunicator = extCommunicator;
	}

	public getCachedValue(key: string): string {
		return this.storageCache[key];
	}

	public getValue(key: string, callback: (value: string) => void, cacheValue?: boolean): void {
		this.extensionCommunicator.callRemoteFunction(Constants.FunctionKeys.getStorageValue, {
			param: key, callback: (value: string) => {
			if (cacheValue) {
				this.storageCache[key] = value;
			}
			callback(value);
		}});
	}

	public getValues(keys: string[], callback: (values: {}) => void, cacheValue?: boolean): void {
		this.extensionCommunicator.callRemoteFunction(Constants.FunctionKeys.getMultipleStorageValues, { param: keys, callback: (values: {}) => {
			if (cacheValue) {
				for (let v in values) {
					if (values.hasOwnProperty(v)) {
						this.storageCache[v] = values[v];
					}
				}
			}
			callback(values);
		}});
	}

	public setValue(key: string, value: string, callback ?: (value: string) => void): void {
		if (key in this.storageCache) {
			this.storageCache[key] = value;
		}

		this.extensionCommunicator.callRemoteFunction(Constants.FunctionKeys.setStorageValue, {
			param: { key: key, value: value }, callback: (retVal: string) => {
				if (callback) {
					callback(retVal);
				}
		}});
	}
}
