import {MessageHandler} from "../../communicator/messageHandler";
import {WebExtension} from "./webExtension";

type MessageSender = chrome.runtime.MessageSender;

export class WebExtensionBackgroundMessageHandler extends MessageHandler {
	private tabId: number;

	constructor(tabId: number) {
		super();
		this.tabId = tabId;

		this.initMessageHandler();
		WebExtension.browser.runtime.onMessage.addListener(this.messageHandler);
	}

	protected initMessageHandler() {
		this.messageHandler = (message: any, sender: MessageSender) => {
			if (sender.tab.id === this.tabId) {
				this.onMessageReceived(message);
			}
		};
	}

	public sendMessage(data: string) {
		WebExtension.browser.tabs.sendMessage(this.tabId, data);
	}

	public tearDown() {
		WebExtension.browser.runtime.onMessage.removeListener(this.messageHandler);
	}
}

export class WebExtensionContentMessageHandler extends MessageHandler {
	constructor() {
		super();

		this.initMessageHandler();
		WebExtension.browser.runtime.onMessage.addListener(this.messageHandler);
	}

	protected initMessageHandler() {
		this.messageHandler = (message: string) => {
			this.onMessageReceived(message);
		};
	}

	public sendMessage(data: string) {
		WebExtension.browser.runtime.sendMessage(data);
	}

	public tearDown() {
		WebExtension.browser.runtime.onMessage.removeListener(this.messageHandler);
	}
}
