import {Communicator} from "../communicator/communicator";
import {IFrameMessageHandler} from "../communicator/iframeMessageHandler";
import {MessageHandler} from "../communicator/messageHandler";

import {FrameInjectOptions} from "./injectOptions";
import {InjectBase} from "./injectBase";

export abstract class FrameInjectBase<T extends FrameInjectOptions> extends InjectBase<T> {
	protected frame: HTMLIFrameElement;
	protected uiCommunicator: Communicator;

	constructor(options: T) {
		super(options);
		try {
			this.initFrameInDom();

			this.initializeUiCommunicator();
			this.initializePassthroughCommunicator(this.getExtMessageHandlerThunk());

			this.checkForNoOps();
		} catch (e) {
			this.handleConstructorError(e);
			throw e;
		}
	}

	/**
	 * Detects no-ops and performs handling logic if one is detected
	 */
	protected abstract checkForNoOps();

	/**
	 * Creates the frame object with all necessary styling and attributes
	 */
	protected abstract createFrame();

	/**
	 * Initializes the passthrough communicator used to enable the iframe scripts and extension scripts to communicate
	 */
	protected abstract initializePassthroughCommunicator(extMessageHandlerThunk: () => MessageHandler);

	/**
	 * Initializes the communicator used with the scripts inside the injected iframe
	 */
	protected abstract initializeUiCommunicator();

	public getFrame(): HTMLIFrameElement {
		return this.frame;
	}

	protected closeFrame() {
		if (this.frame) {
			this.frame.parentNode.removeChild(this.frame);
			this.frame = undefined;
		}
	}

	/**
	 * Generates the extension message handler thunk for the inline extension
	 */
	protected generateInlineExtThunk(): () => MessageHandler {
		if (!this.frame) {
			this.initFrameInDom();
		}
		return () => { return new IFrameMessageHandler(() => this.frame.contentWindow); };
	}

	/**
	 * Instantiates the frame object, styles/sets attributes accordingly, then adds it to the DOM
	 */
	protected initFrameInDom() {
		// The frame will already be initialized in the case of the bookmarklet as it gets generated in order
		// to set up the ext communicator
		if (!this.frame) {
			this.createFrame();

			// Attach ourselves below the body where it is safer against the page and programmatic styling
			document.documentElement.appendChild(this.frame);
		}
	}
}
