import {Constants} from "../constants";

import {Communicator} from "../communicator/communicator";
import {MessageHandler} from "../communicator/messageHandler";

import * as Log from "../logging/log";
import {ConsoleLoggerPure} from "../logging/consoleLoggerPure";
import {Logger} from "../logging/logger";
import {WebConsole} from "../logging/webConsole";

import {InjectBase} from "./injectBase";
import {InjectOptions} from "./injectOptions";

export class DebugLoggingInject extends InjectBase<InjectOptions> {
	private debugLogger: Logger;

	public static main(options: InjectOptions) {
		// Rather than using a static field (i.e., traditional singleton pattern), we have to attach
		// the singleton to the window object because each time we inject a new inject script, they are
		// sandboxed from each other, so having a static field will not work.
		let theWindow = <any>window;
		if (!theWindow.debugLoggingInjectObject) {
			theWindow.debugLoggingInjectObject = new DebugLoggingInject(options);
		}
	}

	constructor(options: InjectOptions) {
		super(options);
	}

	protected generateInlineExtThunk(): () => MessageHandler {
		// For the inline extension, the thunk to the iframe window must be passed through main
		// as this inject script has no concept of an iframe to take care of
		return this.options.extMessageHandlerThunk;
	}

	protected init() {
		this.debugLogger = new ConsoleLoggerPure(new WebConsole());
	}

	protected initializeExtCommunicator(extMessageHandlerThunk: () => MessageHandler) {
		this.extCommunicator = new Communicator(extMessageHandlerThunk(), Constants.CommunicationChannels.debugLoggingInjectedAndExtension);
		this.extCommunicator.registerFunction(Constants.FunctionKeys.telemetry, (data: Log.LogDataPackage) => {
			Log.parseAndLogDataPackage(data, this.debugLogger);
		});
	}

	protected initializeEventListeners() {
		// Notify the background when we're unloading
		window.onbeforeunload = (event) => {
			this.extCommunicator.callRemoteFunction(Constants.FunctionKeys.unloadHandler);
		};
	}

	protected handleConstructorError(e: Error) {
		Log.ErrorUtils.sendFailureLogRequest({
			label: Log.Failure.Label.UnhandledExceptionThrown,
			properties: {
				failureType: Log.Failure.Type.Unexpected,
				failureInfo: { error: e.toString() },
				failureId: "PageNavInject",
				stackTrace: Log.Failure.getStackTrace(e)
			}
		});
	}
}
