import {Communicator, CommDataPackage} from "./communicator";
import {MessageHandler} from "./messageHandler";

/**
 * Links two communicators together and after initialization, passes all communication from either to the other
 * The general logic to do this is as follows:
 *     Initialize with handler1
 *     After an initial response from handler1, start queueing messages from handler1, and start initializing with handler2
 *     After an initial response from handler2, flush any queued messages, and pass-through the rest of the communications from either
 *  Note: The channel specified should be the same as the channel the other sides are using
 */
export class CommunicatorPassthrough {
	constructor(messageHandler1: MessageHandler, messageHandler2: MessageHandler, channel?: string, errorHandler?: (e: Error) => void) {
		let comm1 = new Communicator(messageHandler1, channel);
		comm1.setErrorHandler(errorHandler);
		comm1.onInitialized = () => {
			// Queue up any messages passed until we can initialize with the other side
			let queuedMessages: CommDataPackage[] = [];
			comm1.handleDataPackage = (dataPackage: CommDataPackage) => {
				queuedMessages.push(dataPackage);
			};

			let comm2 = new Communicator(messageHandler2, channel);
			comm2.setErrorHandler(errorHandler);
			comm2.onInitialized = () => {
				comm1.onInitialized = undefined;
				comm2.onInitialized = undefined;

				// flush any queued up messages
				for (let dataPackage of queuedMessages) {
					comm2.postMessage(dataPackage);
				}

				// Have each side simply pass packages to the other side untouched
				comm1.handleDataPackage = (dataPackage: CommDataPackage) => {
					comm2.postMessage(dataPackage);
				};
				comm2.handleDataPackage = (dataPackage: CommDataPackage) => {
					comm1.postMessage(dataPackage);
				};
			};
		};
	}
}
