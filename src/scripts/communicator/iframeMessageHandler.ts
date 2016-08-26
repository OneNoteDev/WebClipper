import {MessageHandler} from "./messageHandler";
import * as Log from "../logging/log";

// Communication manager class for handling message passing between windows
export class IFrameMessageHandler extends MessageHandler {
	private getOtherWindow: () => Window;

	constructor(getOtherWindow: () => Window) {
		super();

		this.getOtherWindow = getOtherWindow;

		this.initMessageHandler();
		window.addEventListener("message", this.messageHandler);
	}

	protected initMessageHandler() {
		this.messageHandler = (event: MessageEvent) => {
			this.onMessageReceived(event.data);

			// Since the message was correctly handled, we don't want any pre-established handlers getting called
			if (event.stopPropagation) {
				event.stopPropagation();
			} else {
				event.cancelBubble = true;
			}
		};
	}

	public sendMessage(dataString: string) {
		let otherWindow = this.getOtherWindow();
		otherWindow.postMessage(dataString, "*");
	}

	public tearDown() {
		window.removeEventListener("message", this.messageHandler);
	}
}
