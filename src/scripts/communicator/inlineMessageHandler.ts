import {MessageHandler} from "./messageHandler";

export class InlineMessageHandler extends MessageHandler {
	private otherSide: InlineMessageHandler;
	constructor(otherSide?: InlineMessageHandler) {
		super();
		this.setOtherSide(otherSide);
	}

	protected initMessageHandler(): void { }

	public inlineMessage(data: string) {
		this.onMessageReceived(data);
	}

	public setOtherSide(otherSide: InlineMessageHandler) {
		this.otherSide = otherSide;
	}

	public sendMessage(data: string): void {
		if (this.otherSide) {
			this.otherSide.inlineMessage(data);
		}
	}

	public tearDown() { }
}
