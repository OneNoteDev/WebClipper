import {MessageHandler} from "./messageHandler";
import {SmartValue} from "./smartValue";
import {Utils} from "../utils";

export interface CommDataPackage {
	data?: Object;
	functionKey: string;
	channel?: string;
	callbackKey?: string;
}

export interface RemoteFunctionOptions {
	param?: Object;
	callback?: (data: Object) => void | Promise<any>;
}

/**
 * Communication interface for handling message passing between two scripts (separate windows, extensions, etc...)
 */
export class Communicator {
	public static initializationKey: string = "INITIALIZATION-K3Y";
	public static acknowledgeKey: string = "ACKNOWLEDGE-K3Y";
	public static registrationKey: string = "REGISTER-FUNCTION-K3Y";
	public static setValuePrefix = "SETVALUE-";
	private static callbackPostfix = "-CALLBACK";

	private otherSideKeys: { [key: string]: boolean } = {};
	private queuedCalls: { [key: string]: CommDataPackage[] } = {};
	private messageHandler: MessageHandler;

	private functionMap: { [key: string]: (data: any) => void | Promise<any> };

	// The name key in these objects allow the SV to be mapped to functions that are subscribed to it
	private svFunctions: { [name: string]: ((newValue: any) => void)[] };
	private trackedSmartValues: { [name: string]: SmartValue<any> };

	private channel: string;
	protected communicatorErrorHandler: (e: Error) => void;

	// We do not want to override the callback if we call a remote function more than once, so each
	// time we register a callback, we need to add this and increment it accordingly.
	private callbackIdPostfix: number = 0;

	constructor(messageHandler: MessageHandler, channel: string) {
		this.functionMap = {};
		this.svFunctions = {};
		this.trackedSmartValues = {};
		this.channel = channel;
		this.messageHandler = messageHandler;

		this.messageHandler.onMessageReceived = this.parseMessage.bind(this);
		this.sendInitializationMessage();
	}

	public getMessageHandler() {
		return this.messageHandler;
	}

	/*
	 * Event handler for when the other side has responded
	 */
	public onInitialized() {
	}

	/**
	 * Does any cleanup work needed
	 */
	public tearDown() {
		// Unsubscribe to SVs
		for (let svKey in this.trackedSmartValues) {
			if (this.trackedSmartValues.hasOwnProperty(svKey)) {
				if (this.svFunctions[svKey]) {
					for (let i = 0; i < this.svFunctions[svKey].length; i++) {
						this.trackedSmartValues[svKey].unsubscribe(this.svFunctions[svKey][i]);
					}
				}
			}
		}
		this.messageHandler.tearDown();
	}

	/**
	 * Sets the error handler for when trying to communicate throws an error
	 */
	public setErrorHandler(errorHandler?: (e: Error) => void): void {
		this.communicatorErrorHandler = errorHandler;
	}

	/**
	 * Parses the message and determines what action to take
	 */
	public parseMessage(dataString: string) {
		let dataPackage: CommDataPackage;
		try {
			dataPackage = JSON.parse(dataString);
		} catch (error) {
			// Ignore messages that aren't in the expected format
			return;
		}

		// If it came from myself, ignore it :)
		if (!dataPackage) {
			return;
		}

		// If we specified a channel, then check it, if we didn't, then we ignore anything with one
		if ((this.channel && (!dataPackage.channel || dataPackage.channel !== this.channel)) ||
			(!this.channel && dataPackage.channel)) {
			return;
		}

		try {
			this.handleDataPackage(dataPackage);
		} catch (e) {
			if (this.communicatorErrorHandler) {
				this.communicatorErrorHandler(e);
			} else {
				throw e;
			}
		}
	}

	/**
	 * Determines the correct way to handle the given data package.
	 */
	public handleDataPackage(dataPackage: CommDataPackage) {
		if (dataPackage.functionKey === Communicator.initializationKey) {
			// The other side is coming online; acknowledge, and tell it about our existing functions
			this.sendAcknowledgementMessage();
			for (let functionName in this.functionMap) {
				if (this.functionMap.hasOwnProperty(functionName)) {
					this.postMessage({ data: functionName, functionKey: Communicator.registrationKey });
				}
			}
			// Both sides are online now (we were first)
			this.onInitialized();
		} else if (dataPackage.functionKey === Communicator.acknowledgeKey) {
			// Both sides are online now (we were second)
			this.onInitialized();
		} else if (dataPackage.functionKey === Communicator.registrationKey) {
			// The other side is registering a function with us.
			let newKey: string = dataPackage.data.toString();
			if (!this.otherSideKeys[newKey]) {
				this.otherSideKeys[newKey] = true;
			}

			if (this.isSmartValueSubscription(newKey)) {
				// Make sure we immediately pass the latest value we have
				let smartValueName = newKey.substr(Communicator.setValuePrefix.length);
				let smartValue = this.trackedSmartValues[smartValueName];
				if (smartValue) {
					this.updateRemoteSmartValue(smartValueName, smartValue.get());
				}
			} else if (this.queuedCalls[newKey]) {
				// Pass any calls to that function that we had saved up
				let calls = this.queuedCalls[newKey];
				for (let i = 0; i < calls.length; i++) {
					this.postMessage(calls[i]);
				}

				delete this.queuedCalls[newKey];
			}
		} else {
			// Handle a normal function call from the other side
			let func = this.functionMap[dataPackage.functionKey];
			if (func) {
				let promiseResult = func(dataPackage.data) as Promise<any>;
				if (promiseResult && promiseResult.then && dataPackage.callbackKey) {
					promiseResult.then((result) => {
						this.callRemoteFunction(dataPackage.callbackKey, { param: result });
					}, (error) => {
						this.callRemoteFunction(dataPackage.callbackKey, { param: error });
					});
				}
			}
		}
	}

	/**
	 * Registers a function name that can be called from the remote
	 */
	public registerFunction(name: string, func: (data: Object) => void | Promise<any>) {
		if (!name) {
			throw new Error("param 'name' is invalid");
		}

		this.functionMap[name] = func;
		this.postMessage({ data: name, functionKey: Communicator.registrationKey });
	}

	/**
	 * Triggers the call of a remote function that was registered with the given name
	 */
	public callRemoteFunction(name: string, options?: RemoteFunctionOptions) {
		if (!name) {
			throw new Error("param 'name' is invalid");
		}

		let paramData = options ? options.param : undefined;
		let callbackKey: string = undefined;
		if (options && options.callback) {
			callbackKey = name + Communicator.callbackPostfix + "-" + this.callbackIdPostfix++;
			this.registerFunction(callbackKey, options.callback);
		}

		let dataPackage: CommDataPackage = { data: paramData, functionKey: name };
		if (callbackKey) {
			dataPackage.callbackKey = callbackKey;
		}

		if (this.otherSideKeys[name]) {
			this.postMessage(dataPackage);
		} else if (!this.isSmartValueSubscription(name)) {
			// If it is a regular function call, queue it up to send when the other side comes online. SmartValues will happen automatically
			this.queuedCalls[name] = this.queuedCalls[name] || [];
			this.queuedCalls[name].push(dataPackage);
		}
	}

	/**
	 * Subscribes to all changes for the SmartValue from the remote's version
	 */
	public subscribeAcrossCommunicator(sv: SmartValue<any>, name: string, subscribeCallback?: (newValue: any) => void): void {
		if (subscribeCallback) {
			sv.subscribe(subscribeCallback, { callOnSubscribe: false });
		}

		this.registerFunction(Communicator.setValuePrefix + name, val => {
			sv.set(val);
		});
	}

	/**
	 * Broadcast all changes for the SmartValue to the remote's version
	 */
	public broadcastAcrossCommunicator(sv: SmartValue<any>, name: string): void {
		let callback = (val: any) => {
			this.updateRemoteSmartValue(name, val);
		};
		if (!this.svFunctions[name]) {
			this.svFunctions[name] = [];
		}
		this.svFunctions[name].push(callback);
		this.trackedSmartValues[name] = sv;

		sv.subscribe(callback);
	}

	private updateRemoteSmartValue(smartValueName: string, value: any) {
		this.callRemoteFunction(Communicator.setValuePrefix + smartValueName, { param: value });
	}

	/**
	 * Sends a message to the other side to let them know we are connected for the firstTime
	 */
	private sendInitializationMessage() {
		this.postMessage({ functionKey: Communicator.initializationKey });
	}

	/**
	 * Sends a message to the other side to let them know we saw their initialization message
	 */
	private sendAcknowledgementMessage() {
		this.postMessage({ functionKey: Communicator.acknowledgeKey });
	}

	private isSmartValueSubscription(functionKey: string) {
		return functionKey.substr(0, Communicator.setValuePrefix.length) === Communicator.setValuePrefix;
	}

	/**
	 * Update the dataPackage with the channel, and send it as a JSON string to the MessageHandler
	 */
	public postMessage(dataPackage: CommDataPackage) {
		// If we specified a channel, then we always send that with the message
		if (this.channel) {
			dataPackage.channel = this.channel;
		}

		try {
			this.messageHandler.sendMessage(JSON.stringify(dataPackage));
		} catch (e) {
			if (this.communicatorErrorHandler) {
				this.communicatorErrorHandler(e);
			} else {
				throw e;
			}
		}
	}
}
