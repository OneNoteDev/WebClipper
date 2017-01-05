import * as Log from "./log";
import {SessionLogger} from "./sessionLogger";

/**
 * A session logger that no-ops on every call.
 */
export class StubSessionLogger extends SessionLogger {
	constructor() {
		super();
	}

	protected handleSetUserSessionId(sessionId?: string): string { return undefined; }

	public logEvent(event: Log.Event.BaseEvent): void {}

	public logFailure(label: Log.Failure.Label, failureType: Log.Failure.Type, failureInfo?: OneNoteApi.GenericError, id?: string): void {}

	public logUserFunnel(label: Log.Funnel.Label): void {}

	public logSessionStart(): void {}

	public logSessionEnd(endTrigger: Log.Session.EndTrigger): void {}

	public logTrace(label: Log.Trace.Label, level: Log.Trace.Level, message?: string): void {}

	public pushToStream(label: Log.Event.Label, value: any): void {}

	public logClickEvent(clickId: string): void {}

	public setContextProperty(key: Log.Custom, value: string): void {}

	protected handleClickEvent(clickId: string): void {}

	protected handleEvent(event: Log.Event.BaseEvent): void {}

	protected handleEventPure(event: Log.Event.BaseEvent): void {}

	protected handleSessionStart(): void {}

	protected handleSessionEnd(endTrigger: Log.Session.EndTrigger): void {}

	protected handleFailure(label: Log.Failure.Label, failureType: Log.Failure.Type, failureInfo?: OneNoteApi.GenericError, id?: string): void {}

	protected handleUserFunnel(label: Log.Funnel.Label): void {}

	protected handleTrace(label: Log.Trace.Label, level: Log.Trace.Level, message?: string): void {}

	protected handleSetContext(key: Log.Custom, value: string | number | boolean): void {}
}
