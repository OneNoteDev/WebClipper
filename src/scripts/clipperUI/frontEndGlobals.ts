/// <reference path="../logging/logManager.d.ts" />

import {SmartValue} from "../communicator/smartValue";
import {Communicator} from "../communicator/communicator";
import {Logger} from "../logging/logger";
import {Constants} from "../constants";

export module Clipper {
	export let injectCommunicator: Communicator;
	export let extensionCommunicator: Communicator;
	export let logger: Logger;
	export let sessionId: SmartValue<string> = new SmartValue<string>();

	export function getUserSessionId(): string {
		return this.sessionId.get();
	}

	export module Storage {
		let storageCache: { [key: string]: string } = {};

		// TODO type parameter to Constants.StorageKeys
		export function preCacheValues(storageKeys: string[]): void {
			for (let key of storageKeys) {
				Clipper.Storage.getValue(key, () => { }, true);
			}
		}

		export function getCachedValue(key: string): string {
			return storageCache[key];
		}

		export function getValue(key: string, callback: (value: string) => void, cacheValue?: boolean): void {
			Clipper.extensionCommunicator.callRemoteFunction(Constants.FunctionKeys.getStorageValue, { param: key, callback: (value: string) => {
				if (cacheValue) {
					storageCache[key] = value;
				}
				callback(value);
			}});
		}

		export function setValue(key: string, value: string): void {
			if (key in storageCache) {
				storageCache[key] = value;
			}
			Clipper.extensionCommunicator.callRemoteFunction(Constants.FunctionKeys.setStorageValue, { param: { key: key, value: value }});
		}
	}
}
