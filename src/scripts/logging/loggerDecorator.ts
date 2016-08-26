import {SmartValue} from "../communicator/smartValue";

import {Utils} from "../utils";

import * as Log from "./log";
import {Context} from "./context";
import {SessionLogger, SessionLoggerOptions} from "./sessionLogger";

export interface LoggerDecoratorOptions extends SessionLoggerOptions {
	component?: LoggerDecorator;
}

export abstract class LoggerDecorator extends SessionLogger {
	private component: LoggerDecorator;

	constructor(options?: LoggerDecoratorOptions) {
		let strategy = options && options.contextStrategy ? options.contextStrategy : undefined;
		let sessionId = options && options.sessionId ? options.sessionId : undefined;
		super({
			contextStrategy: strategy,
			sessionId: sessionId
		});

		this.component = options ? options.component : undefined;
	}

	protected abstract outputClickEvent(clickId: string): void;
	protected abstract outputEvent(event: Log.Event.BaseEvent): void;
	protected abstract outputSessionStart(): void;
	protected abstract outputSessionEnd(endTrigger: Log.Session.EndTrigger): void;
	protected abstract outputFailure(label: Log.Failure.Label, failureType: Log.Failure.Type, failureInfo?: OneNoteApi.GenericError, id?: string): void;
	protected abstract outputUserFunnel(label: Log.Funnel.Label): void;
	protected abstract outputTrace(label: Log.Trace.Label, level: Log.Trace.Level, message?: string): void;
	protected abstract outputSetContext(key: Log.Context.Custom, value: string | number | boolean): void;

	// @Overrides SessionLogger
	protected generateSessionId(): string {
		return undefined;
	}

	protected handleSetUserSessionId(parentSessionId?: string): string {
		let sessionId: string;

		let existingId = this.sessionId.get();
		let generatedId = this.generateSessionId();

		if (existingId) {
			// Have we already initialized a sessionId?
			sessionId = existingId;
		} else if (parentSessionId) {
			// Is my parent telling me to set a sessionId?
			sessionId = parentSessionId;
		} else if (generatedId) {
			// Do I know how to generate a sessionId?
			sessionId = generatedId;
		}

		if (this.component && sessionId) {
			this.component.handleSetUserSessionId(sessionId);
		} else if (this.component && !sessionId) {
			sessionId = this.component.handleSetUserSessionId();
		} else if (!this.component && !sessionId) {
			// In the case where the session has Ended, we default to there being no session id as it wouldn't
			// make sense having one
			sessionId = this.currentSessionState === Log.Session.State.Started ?
				"cccccccc-" + Utils.generateGuid().substring(9) :
				undefined;
		}

		this.sessionId.set(sessionId);
		this.setContextPropertyPure(Log.Context.Custom.SessionId, sessionId);
		this.outputSetContext(Log.Context.Custom.SessionId, sessionId);

		return sessionId;
	}

	protected handleClickEvent(clickId: string): void {
		this.outputClickEvent(clickId);
		if (this.component) {
			this.component.executeClickEvent(clickId);
		}
	}

	protected handleEvent(event: Log.Event.BaseEvent): void {
		this.handleEventPure(event);
		if (this.component) {
			this.component.logEvent(event);
		}
	}

	protected handleEventPure(event: Log.Event.BaseEvent): void {
		this.outputEvent(event);
	}

	protected handleSessionStart(): void {
		this.outputSessionStart();
		if (this.component) {
			this.component.executeSessionStart();
		}
	}

	protected handleSessionEnd(endTrigger: Log.Session.EndTrigger): void {
		this.outputSessionEnd(endTrigger);
		if (this.component) {
			this.component.executeSessionEnd(endTrigger);
		}
	}

	protected handleFailure(label: Log.Failure.Label, failureType: Log.Failure.Type, failureInfo?: OneNoteApi.GenericError, id?: string): void {
		this.outputFailure(label, failureType, failureInfo, id);
		if (this.component) {
			this.component.logFailure(label, failureType, failureInfo, id);
		}
	}

	protected handleUserFunnel(label: Log.Funnel.Label): void {
		this.outputUserFunnel(label);
		if (this.component) {
			this.component.logUserFunnel(label);
		}
	}

	protected handleTrace(label: Log.Trace.Label, level: Log.Trace.Level, message?: string): void {
		this.outputTrace(label, level, message);
		if (this.component) {
			this.component.logTrace(label, level, message);
		}
	}

	protected handleSetContext(key: Log.Context.Custom, value: string | number | boolean): void {
		this.outputSetContext(key, value);
		if (this.component) {
			this.component.setContextProperty(key, value);
		}
	}
}
