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
		export function getValue(key: string, callback: (value: string) => void): void {
			Clipper.extensionCommunicator.callRemoteFunction(Constants.FunctionKeys.getStorageValue, { param: key, callback: (value: string) => {
				callback(value);
			}});
		}

		export function setValue(key: string, value: string): void {
			Clipper.extensionCommunicator.callRemoteFunction(Constants.FunctionKeys.setStorageValue, { param: { key: key, value: value }});
		}
	}
}
