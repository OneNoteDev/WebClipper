import {Constants} from "../constants";

import {Communicator} from "../communicator/communicator";

import * as Log from "./log";
import {CommunicatorLoggerPure} from "./communicatorLoggerPure";
import {LoggerDecorator} from "./loggerDecorator";

export class CommunicatorLoggerDecorator extends LoggerDecorator {
	private pureLogger: CommunicatorLoggerPure;

	constructor(communicator: Communicator, logger?: LoggerDecorator) {
		super({
			component: logger
		});

		this.pureLogger = new CommunicatorLoggerPure(communicator);
	}

	protected outputEvent(event: Log.Event.BaseEvent): void {
		this.pureLogger.logEvent(event);
	}

	protected outputFailure(label: Log.Failure.Label, failureType: Log.Failure.Type, failureInfo?: OneNoteApi.GenericError, id?: string): void {
		this.pureLogger.logFailure(label, failureType, failureInfo, id);
	}

	protected outputUserFunnel(label: Log.Funnel.Label): void {
		this.pureLogger.logUserFunnel(label);
	}

	protected outputSessionStart(): void {
		this.pureLogger.logSessionStart();
	}

	protected outputSessionEnd(endTrigger: Log.Session.EndTrigger): void {
		this.pureLogger.logSessionEnd(endTrigger);
	}

	protected outputTrace(label: Log.Trace.Label, level: Log.Trace.Level, message?: string): void {
		this.pureLogger.logTrace(label, level, message);
	}

	protected outputClickEvent(clickId: string): void {
		this.pureLogger.logClickEvent(clickId);
	}

	protected outputSetContext(key: Log.Custom, value: string): void {
		this.pureLogger.setContextProperty(key, value);
	}
}
