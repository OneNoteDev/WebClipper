import {Communicator} from "../communicator/communicator";
import {MessageHandler} from "../communicator/messageHandler";

import {InjectOptions} from "./injectOptions";

export abstract class InjectBase<T extends InjectOptions> {
    protected options: T;
    protected extCommunicator: Communicator;

    constructor(options: T) {
        try {
            this.options = options;

            this.init();

            this.initializeExtCommunicator(this.getExtMessageHandlerThunk());

            this.initializeEventListeners();
        } catch (e) {
            this.handleConstructorError(e);
            throw e;
        }
    }

    protected getExtMessageHandlerThunk(): () => MessageHandler {
        // If not specified, assume this is an inline environment
        return this.options.extMessageHandlerThunk ?
            this.options.extMessageHandlerThunk :
            this.generateInlineExtThunk();
    }

    /**
     * Generates the extension message handler thunk for the inline extension
     */
    protected abstract generateInlineExtThunk(): () => MessageHandler;

    /**
     * Performs any initialization that is needed at the beginning of the object's construction
     */
    protected abstract init();

    /**
     * Initializes the communicator used with the background extension
     */
    protected abstract initializeExtCommunicator(extMessageHandlerThunk: () => MessageHandler);

    /**
     * Initializes event listeners on the front end
     */
    protected abstract initializeEventListeners();

    /**
     * Handler used for when an error is thrown in the constructor
     */
    protected abstract handleConstructorError(e: Error);
}
