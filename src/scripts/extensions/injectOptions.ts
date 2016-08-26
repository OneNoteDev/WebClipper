import {MessageHandler} from "../communicator/messageHandler";

export interface FrameInjectOptions extends InjectOptions {
	frameUrl: string;
}

export interface InjectOptions {
	extMessageHandlerThunk?: () => MessageHandler;
}
