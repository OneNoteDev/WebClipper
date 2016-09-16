import {Constants} from "../constants";

import {Communicator} from "../communicator/communicator";

import {StorageAsync} from "./storageAsync";

export class RemoteStorage implements StorageAsync {
	private extensionCommunicator: Communicator;

	constructor(extCommunicator: Communicator) {
		this.extensionCommunicator = extCommunicator;
	}

	public getValue(key: string, callback: (value: string) => void): void {
		this.extensionCommunicator.callRemoteFunction(Constants.FunctionKeys.getStorageValue, { param: key, callback: (value: string) => {
			callback(value);
		}});
	}

	public getValues(keys: string[], callback: (values: {}) => void): void {
		this.extensionCommunicator.callRemoteFunction(Constants.FunctionKeys.getMultipleStorageValues, { param: keys, callback: (values: {}) => {
			callback(values);
		}});
	}

	public setValue(key: string, value: string, callback?: (value: string) => void): void {
		this.extensionCommunicator.callRemoteFunction(Constants.FunctionKeys.setStorageValue, {
			param: { key: key, value: value }, callback: (retVal: string) => {
				if (callback) {
					callback(retVal);
				}
		}});
	}
}
