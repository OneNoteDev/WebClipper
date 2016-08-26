import {MessageHandler} from "../../communicator/messageHandler";

declare var safari;

export class SafariBackgroundMessageHandler extends MessageHandler {
	private tabHandle;

	constructor(tabHandle) {
		super();
		this.tabHandle = tabHandle;

		this.initMessageHandler();
		this.tabHandle.addEventListener("message", this.messageHandler);
	}

	protected initMessageHandler() {
		this.messageHandler = (event) => {
			this.onMessageReceived(event.message);
		};
	}

	public sendMessage(data: string) {
		this.tabHandle.page.dispatchMessage("message", data);
	}

	public tearDown() {
		this.tabHandle.removeEventListener("message", this.messageHandler);
	}
}

export class SafariContentMessageHandler extends MessageHandler {
	constructor() {
		super();

		this.initMessageHandler();
		safari.self.addEventListener("message", this.messageHandler);
	}

	protected initMessageHandler() {
		this.messageHandler = (event) => {
			this.onMessageReceived(event.message);
		};
	}

	public sendMessage(data: string) {
		safari.self.tab.dispatchMessage("message", data);
	}

	public tearDown() {
		safari.self.removeEventListener("message", this.messageHandler);
	}
}
