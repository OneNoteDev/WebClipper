import {MessageHandler} from "../../scripts/communicator/messageHandler";

export class MockMessageHandler extends MessageHandler {
	public static corruptError = "MessageHandler is corrupt!";

	public isCorrupt = false;
	private otherSide: MockMessageHandler;

	constructor(otherSide?: MockMessageHandler) {
		super();
		this.setOtherSide(otherSide);
	}

	public mockMessage(data: string) {
		this.onMockMessageHook(data);
		this.onMessageReceived(data);
	}

	public onMockMessageHook(data: string) { }

	public setOtherSide(otherSide: MockMessageHandler) {
		this.otherSide = otherSide;
	}

	protected initMessageHandler() { }

	public sendMessage(data: string): void {
		if (this.isCorrupt) {
			throw new Error(MockMessageHandler.corruptError);
		} else if (this.otherSide) {
			this.otherSide.mockMessage(data);
		}
	}

	public tearDown() { }
}
