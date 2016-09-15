/// <reference path="../logging/logManager.d.ts" />

import {SmartValue} from "../communicator/smartValue";
import {Communicator} from "../communicator/communicator";
import {Logger} from "../logging/logger";
import {Constants} from "../constants";

import {RemoteStorage} from "../storage/remoteStorage";
import {StorageAsync} from "../storage/storageAsync";

export class Clipper {
	private static injectCommunicator: Communicator;
	private static extensionCommunicator: Communicator;

	private static storage: StorageAsync;

	// Public for convenience?
	public static logger: Logger;
	public static sessionId: SmartValue<string> = new SmartValue<string>();

	public static getUserSessionId(): string {
		return Clipper.sessionId.get();
	}

	public static getInjectCommunicator(): Communicator {
		return Clipper.injectCommunicator;
	}

	public static setInjectCommunicator(injectCommunicator: Communicator) {
		Clipper.injectCommunicator = injectCommunicator;
	}

	public static getExtensionCommunicator(): Communicator {
		return Clipper.extensionCommunicator;
	}

	public static setExtensionCommunicator(extensionCommunicator: Communicator) {
		Clipper.extensionCommunicator = extensionCommunicator;
		Clipper.setUpRemoteStorage(extensionCommunicator);
	}

	public static getStoredValue(key: string, callback: (value: string) => void): void {
		if (!Clipper.storage) {
			throw new Error("The remote storage needs to be set up with the extension communicator first");
		}
		Clipper.storage.getValue(key, callback);
	}

	public static storeValue(key: string, value: string): void {
		if (!Clipper.storage) {
			throw new Error("The remote storage needs to be set up with the extension communicator first");
		}
		Clipper.storage.setValue(key, value, undefined);
	}

	private static setUpRemoteStorage(extensionCommunicator: Communicator) {
		Clipper.storage = new RemoteStorage(Clipper.getExtensionCommunicator());
	}
}
