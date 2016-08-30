/// <reference path="../logging/logManager.d.ts" />

import {SmartValue} from "../communicator/smartValue";
import {Communicator} from "../communicator/communicator";
import {Logger} from "../logging/logger";
import {Constants} from "../constants";

import {RemoteStorage} from "../storage/remoteStorage";
import {Storage} from "../storage/storage";

export module Clipper {
	export let injectCommunicator: Communicator;
	export let extensionCommunicator: Communicator;
	export let logger: Logger;
	export let sessionId: SmartValue<string> = new SmartValue<string>();

	// TODO make Clipper a class or something else?
	export let storage: Storage;

	export function getUserSessionId(): string {
		return this.sessionId.get();
	}

	export module Storage {
		export function getValue(key: string, callback: (value: string) => void): void {
			// TODO this could be made much safer if this was a class
			if (!Clipper.storage) {
				Clipper.storage = new RemoteStorage(Clipper.extensionCommunicator);
			}
			Clipper.storage.getValue(key, callback);
		}

		export function setValue(key: string, value: string): void {
			if (!Clipper.storage) {
				Clipper.storage = new RemoteStorage(Clipper.extensionCommunicator);
			}
			Clipper.storage.setValue(key, value, undefined);
		}
	}
}
