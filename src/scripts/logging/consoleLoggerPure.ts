import * as Log from "./log";
import {ConsoleOutput} from "./consoleOutput";
import {ConsoleLoggerShell} from "./consoleLoggerShell";
import {Logger} from "./Logger";
import {LogHelpers} from "./logHelpers";

export class ConsoleLoggerPure extends Logger {
	private consoleShell: ConsoleLoggerShell;

	constructor(consoleOutput: ConsoleOutput) {
		super();
		this.consoleShell = new ConsoleLoggerShell(consoleOutput);
	}

	public logEvent(event: Log.Event.BaseEvent): void {
		let logEvent: { [key: string]: string | number | boolean } = LogHelpers.createLogEventAsJson(event);
		this.consoleShell.logToConsole(logEvent);
	}

	public logFailure(label: Log.Failure.Label, failureType: Log.Failure.Type, failureInfo?: OneNoteApi.GenericError, id?: string): void {
		let failureEvent: { [key: string]: string } = LogHelpers.createFailureEventAsJson(label, failureType, failureInfo, id);
		this.consoleShell.logToConsole(failureEvent);
	}

	public logUserFunnel(label: Log.Funnel.Label): void {
		let funnelEvent: { [key: string]: string } = LogHelpers.createFunnelEventAsJson(label);
		this.consoleShell.logToConsole(funnelEvent);
	}

	public logSessionStart(): void {
		let sessionEvent: { [key: string]: string } = LogHelpers.createSessionStartEventAsJson();
		this.consoleShell.logToConsole(sessionEvent);
	}

	public logSessionEnd(endTrigger: Log.Session.EndTrigger): void {
		let sessionEvent: { [key: string]: string } = LogHelpers.createSessionEndEventAsJson(endTrigger);
		this.consoleShell.logToConsole(sessionEvent);
	}

	public logTrace(label: Log.Trace.Label, level: Log.Trace.Level, message?: string): void {
		let traceEvent: { [key: string]: string } = LogHelpers.createTraceEventAsJson(label, level, message);
		this.consoleShell.logToConsole(traceEvent);
	}

	public pushToStream(label: Log.Event.Label, value: any): void {
		// Deliberately no-op to reduce console noise
	}

	public logClickEvent(clickId: string): void {
		let clickEvent: { [key: string]: string } = LogHelpers.createClickEventAsJson(clickId);
		this.consoleShell.logToConsole(clickEvent);
	}

	public setContextProperty(key: Log.Custom, value: string): void {
		this.consoleShell.setContextProperty(Log.Context.toString(key), value);
	}
}
