import * as Log from "./log";
import {ConsoleLoggerPure} from "./consoleLoggerPure";
import {ConsoleOutput} from "./consoleOutput";
import {LoggerDecorator, LoggerDecoratorOptions} from "./loggerDecorator";

export class ConsoleLoggerDecorator extends LoggerDecorator {
	private pureConsoleLogger: ConsoleLoggerPure;

	constructor(consoleOutput: ConsoleOutput, options?: LoggerDecoratorOptions) {
		super(options);

		this.pureConsoleLogger = new ConsoleLoggerPure(consoleOutput);
	}

	protected outputEvent(event: Log.Event.BaseEvent): void {
		this.pureConsoleLogger.logEvent(event);
	}

	protected outputFailure(label: Log.Failure.Label, failureType: Log.Failure.Type, failureInfo?: OneNoteApi.GenericError, id?: string): void {
		this.pureConsoleLogger.logFailure(label, failureType, failureInfo, id);
	}

	protected outputUserFunnel(label: Log.Funnel.Label): void {
		this.pureConsoleLogger.logUserFunnel(label);
	}

	protected outputSessionStart(): void {
		this.pureConsoleLogger.logSessionStart();
	}

	protected outputSessionEnd(endTrigger: Log.Session.EndTrigger): void {
		this.pureConsoleLogger.logSessionEnd(endTrigger);
	}

	protected outputTrace(label: Log.Trace.Label, level: Log.Trace.Level, message?: string): void {
		this.pureConsoleLogger.logTrace(label, level, message);
	}

	protected outputClickEvent(clickId: string): void {
		this.pureConsoleLogger.logClickEvent(clickId);
	}

	protected outputSetContext(key: Log.Custom, value: string): void {
		this.pureConsoleLogger.setContextProperty(key, value);
	}
}
