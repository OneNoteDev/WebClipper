import * as Log from "../logging/log";
import {Logger} from "../logging/logger";
import {ExtensionWorkerBase} from "./extensionWorkerBase";

export class WorkerPassthroughLogger extends Logger {
	private workers: ExtensionWorkerBase<any, any>[];

	constructor(workers: ExtensionWorkerBase<any, any>[]) {
		super();
		this.workers = workers;
	}

	public logEvent(event: Log.Event.BaseEvent): void {
		for (let worker of this.workers) {
			worker.getLogger().then(sessionLogger => sessionLogger.logEvent(event));
		}
	}

	public pushToStream(label: Log.Event.Label, value: any): void {
		for (let worker of this.workers) {
			worker.getLogger().then(sessionLogger => sessionLogger.pushToStream(label, value));
		}
	}

	public logFailure(label: Log.Failure.Label, failureType: Log.Failure.Type, failureInfo?: OneNoteApi.GenericError, id?: string): void {
		for (let worker of this.workers) {
			worker.getLogger().then(sessionLogger => sessionLogger.logFailure(label, failureType, failureInfo, id));
		}
	}

	public logUserFunnel(label: Log.Funnel.Label): void {
		for (let worker of this.workers) {
			worker.getLogger().then(sessionLogger => sessionLogger.logUserFunnel(label));
		}
	}

	public logSessionStart(): void {
		for (let worker of this.workers) {
			worker.getLogger().then(sessionLogger => sessionLogger.logSessionStart());
		}
	}

	public logSessionEnd(endTrigger: Log.Session.EndTrigger): void {
		for (let worker of this.workers) {
			worker.getLogger().then(sessionLogger => sessionLogger.logSessionEnd(endTrigger));
		}
	}

	public logTrace(label: Log.Trace.Label, level: Log.Trace.Level, message?: string): void {
		for (let worker of this.workers) {
			worker.getLogger().then(sessionLogger => sessionLogger.logTrace(label, level, message));
		}
	}

	public logClickEvent(clickId: string): void {
		for (let worker of this.workers) {
			worker.getLogger().then(sessionLogger => sessionLogger.logClickEvent(clickId));
		}
	}

	public setContextProperty(key: Log.Context.Custom, value: string): void {
		for (let worker of this.workers) {
			worker.getLogger().then(sessionLogger => sessionLogger.setContextProperty(key, value));
		}
	}
}
