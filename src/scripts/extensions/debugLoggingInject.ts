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
				failureInfo: { error: JSON.stringify({ error: e.toString(), url: window.location.href }) },
				failureId: "PageNavInject",
				stackTrace: Log.Failure.getStackTrace(e)
			}
		});
	}
}
