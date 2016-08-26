import * as Log from "../../scripts/logging/log";
import {Logger} from "../../scripts/logging/logger";

export class MockLogger extends Logger {
	public logEvent(event: Log.Event.BaseEvent): void {}
	public logFailure(label: Log.Failure.Label, failureType: Log.Failure.Type, failureInfo?: OneNoteApi.GenericError, id?: string): void {}
	public logUserFunnel(label: Log.Funnel.Label): void {}
	public logSessionStart(): void {}
	public logSessionEnd(endTrigger: Log.Session.EndTrigger): void {}
	public logTrace(label: Log.Trace.Label, level: Log.Trace.Level, message?: string): void {}
	public pushToStream(label: Log.Event.Label, value: any): void {}
	public logClickEvent(clickId: string): void {}
	public setContextProperty(key: Log.Context.Custom, value: string): void {}
}
