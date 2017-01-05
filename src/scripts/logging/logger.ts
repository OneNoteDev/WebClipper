import * as Log from "./log";

export abstract class Logger {
	public abstract logEvent(event: Log.Event.BaseEvent): void;
	public abstract logFailure(label: Log.Failure.Label, failureType: Log.Failure.Type, failureInfo?: OneNoteApi.GenericError, id?: string): void;
	public abstract logUserFunnel(label: Log.Funnel.Label): void;
	public abstract logSessionStart(): void;
	public abstract logSessionEnd(endTrigger: Log.Session.EndTrigger): void;
	public abstract logTrace(label: Log.Trace.Label, level: Log.Trace.Level, message?: string): void;
	public abstract pushToStream(label: Log.Event.Label, value: any): void;
	public abstract logClickEvent(clickId: string): void;
	public abstract setContextProperty(key: Log.Custom, value: string): void;

	public logJsonParseUnexpected(value: any): void {
		this.logFailure(Log.Failure.Label.JsonParse, Log.Failure.Type.Unexpected, undefined /* failureInfo */, value);
	}
}
