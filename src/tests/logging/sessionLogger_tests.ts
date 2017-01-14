import * as sinon from "sinon";

import * as Log from "../../scripts/logging/log";
import {Context} from "../../scripts/logging/context";
import {SessionLogger, SessionLoggerOptions} from "../../scripts/logging/sessionLogger";

import {TestModule} from "../testModule";

class MockAlwaysTrueContext implements Context {
	requirementsAreMet(requirements: { [key: string]: string | number | boolean }): boolean { return true; }
}

class MockAlwaysFalseContext implements Context {
	requirementsAreMet(requirements: { [key: string]: string | number | boolean }): boolean { return false; }
}

let requiredContext = Log.Context.Custom.AppInfoId;
class MockOneRequirementContext implements Context {
	requirementsAreMet(requirements: { [key: string]: string | number | boolean }): boolean {
		return !!requirements[Log.Context.toString(requiredContext)];
	}
}

class MockSessionLogger extends SessionLogger {
	constructor(options?: SessionLoggerOptions) {
		super(options);
	}
	public getUserSessionId(): string { return "abc"; }
	protected handleClickEvent(clickId: string): void {}
	protected handleEvent(event: Log.Event.BaseEvent): void {}
	protected handleEventPure(event: Log.Event.BaseEvent): void {}
	protected handleSessionStart(): void {}
	protected handleSessionEnd(endTrigger: Log.Session.EndTrigger): void {}
	protected handleFailure(label: Log.Failure.Label, failureType: Log.Failure.Type, failureInfo?: OneNoteApi.GenericError, id?: string): void {}
	protected handleUserFunnel(label: Log.Funnel.Label): void {}
	protected handleTrace(label: Log.Trace.Label, level: Log.Trace.Level, message?: string): void {}
	protected handleSetUserSessionId(sessionId?: string): string { return "usid"; }
	protected handleSetContext(key: Log.Context.Custom, value: string | number | boolean): void {}
}

export class SessionLoggerTests extends TestModule {
	private mockAlwaysTrueContext: Context;
	private mockAlwaysFalseContext: Context;
	private mockOneReqContext: Context;

	private alwaysTrueReqCheckSpy: sinon.SinonSpy;
	private alwaysFalseReqCheckSpy: sinon.SinonSpy;
	private oneReqCheckSpy: sinon.SinonSpy;

	protected module() {
		return "sessionLogger";
	}

	protected beforeEach() {
		this.mockAlwaysTrueContext = new MockAlwaysTrueContext();
		this.mockAlwaysFalseContext = new MockAlwaysFalseContext();
		this.mockOneReqContext = new MockOneRequirementContext();

		this.alwaysTrueReqCheckSpy = sinon.spy(this.mockAlwaysTrueContext.requirementsAreMet);
		this.mockAlwaysTrueContext.requirementsAreMet = this.alwaysTrueReqCheckSpy;
		this.alwaysFalseReqCheckSpy = sinon.spy(this.mockAlwaysFalseContext.requirementsAreMet);
		this.mockAlwaysFalseContext.requirementsAreMet = this.alwaysFalseReqCheckSpy;
		this.oneReqCheckSpy = sinon.spy(this.mockOneReqContext.requirementsAreMet);
		this.mockOneReqContext.requirementsAreMet = this.oneReqCheckSpy;
	}

	protected tests() {
		test("logEvent should call handleEvent if the context requirements are met", () => {
			let mockSessionLogger: SessionLogger = new MockSessionLogger({
				contextStrategy: this.mockAlwaysTrueContext
			});

			let handleEventSpy = sinon.spy((<any>mockSessionLogger).handleEvent);
			(<any>mockSessionLogger).handleEvent = handleEventSpy;

			let baseEvent = new Log.Event.BaseEvent(0);
			mockSessionLogger.logEvent(baseEvent);

			ok(this.alwaysTrueReqCheckSpy.calledOnce, "The context requirements should be checked");
			ok(handleEventSpy.calledOnce, "handleEvent should be called once");
			ok(handleEventSpy.calledWith(baseEvent), "handleEvent should be passed the same event object");
		});

		test("logEvent should not call handleEvent if the event parameter is undefined", () => {
			let mockSessionLogger: SessionLogger = new MockSessionLogger({
				contextStrategy: this.mockAlwaysTrueContext
			});

			let handleEventSpy = sinon.spy((<any>mockSessionLogger).handleEvent);
			(<any>mockSessionLogger).handleEvent = handleEventSpy;

			let logFailureSpy = sinon.spy(mockSessionLogger.logFailure);
			mockSessionLogger.logFailure = logFailureSpy;

			mockSessionLogger.logEvent(undefined);

			ok(handleEventSpy.notCalled, "handleEvent should not be called");
			ok(logFailureSpy.calledOnce, "logFailure should be called once");
			ok(logFailureSpy.calledWith(Log.Failure.Label.InvalidArgument, Log.Failure.Type.Unexpected),
				"logFailure should be called with InvalidArgument and Unexpected parameters");
		});

		test("logEvent should not call handleEvent if context requirements are not met", () => {
			let mockSessionLogger: SessionLogger = new MockSessionLogger({
				contextStrategy: this.mockAlwaysFalseContext
			});

			let handleEventSpy = sinon.spy((<any>mockSessionLogger).handleEvent);
			(<any>mockSessionLogger).handleEvent = handleEventSpy;

			let baseEvent = new Log.Event.BaseEvent(0);
			mockSessionLogger.logEvent(baseEvent);

			ok(this.alwaysFalseReqCheckSpy.calledOnce, "The context requirements should be checked");
			ok(handleEventSpy.notCalled, "handleEvent should not be called");
		});

		test("logFailure should call handleFailure if the context requirements are met", () => {
			let mockSessionLogger: SessionLogger = new MockSessionLogger({
				contextStrategy: this.mockAlwaysTrueContext
			});

			let handleFailureSpy = sinon.spy((<any>mockSessionLogger).handleFailure);
			mockSessionLogger.logFailure = handleFailureSpy;

			let failureInfo = { error: "err" };
			let id = "xyz";
			mockSessionLogger.logFailure(0, 0, failureInfo, id);

			ok(handleFailureSpy.calledOnce, "logFailure should be called once");
			ok(handleFailureSpy.calledWith(0, 0, failureInfo, id),
				"logFailure should be called with the piped parameters");
		});

		test("logFailure should call logFailure again as an invalid method use if label is undefined", () => {
			let mockSessionLogger: SessionLogger = new MockSessionLogger({
				contextStrategy: this.mockAlwaysTrueContext
			});

			let logFailureSpy = sinon.spy(mockSessionLogger.logFailure);
			mockSessionLogger.logFailure = logFailureSpy;

			mockSessionLogger.logFailure(undefined, 0, { error: "err" }, "xyz");

			ok(logFailureSpy.calledTwice, "logFailure should be called twice (the second time is for the args failure)");
			ok(logFailureSpy.calledWith(Log.Failure.Label.InvalidArgument, Log.Failure.Type.Unexpected),
				"logFailure should be called with InvalidArgument and Unexpected parameters");
		});

		test("logFailure should call logFailure again as an invalid method use if failureType is undefined", () => {
			let mockSessionLogger: SessionLogger = new MockSessionLogger({
				contextStrategy: this.mockAlwaysTrueContext
			});

			let logFailureSpy = sinon.spy(mockSessionLogger.logFailure);
			mockSessionLogger.logFailure = logFailureSpy;

			mockSessionLogger.logFailure(0, undefined, { error: "err" }, "xyz");

			ok(logFailureSpy.calledTwice, "logFailure should be called once (the second time is for the args failure)");
			ok(logFailureSpy.calledWith(Log.Failure.Label.InvalidArgument, Log.Failure.Type.Unexpected),
				"logFailure should be called with InvalidArgument and Unexpected parameters");
		});

		test("logFailure should not call handleFailure if context requirements are not met", () => {
			let mockSessionLogger: SessionLogger = new MockSessionLogger({
				contextStrategy: this.mockAlwaysFalseContext
			});

			let handleFailureSpy = sinon.spy((<any>mockSessionLogger).handleFailure);
			(<any>mockSessionLogger).handleFailure = handleFailureSpy;

			mockSessionLogger.logFailure(0, 0, { error: "err" }, "xyz");

			ok(this.alwaysFalseReqCheckSpy.calledOnce, "The context requirements should be checked");
			ok(handleFailureSpy.notCalled, "handleFailure should not be called");
		});

		test("logUserFunnel should call handleUserFunnel if the context requirements are met", () => {
			let mockSessionLogger: SessionLogger = new MockSessionLogger({
				contextStrategy: this.mockAlwaysTrueContext
			});

			let handleUserFunnelSpy = sinon.spy((<any>mockSessionLogger).handleUserFunnel);
			(<any>mockSessionLogger).handleUserFunnel = handleUserFunnelSpy;

			mockSessionLogger.logUserFunnel(0);

			ok(this.alwaysTrueReqCheckSpy.calledOnce, "The context requirements should be checked");
			ok(handleUserFunnelSpy.calledOnce, "handleUserFunnel should be called once");
			ok(handleUserFunnelSpy.calledWith(0), "handleUserFunnel should be passed the same label");
		});

		test("logUserFunnel should not call handleUserFunnel if the label parameter is undefined", () => {
			let mockSessionLogger: SessionLogger = new MockSessionLogger({
				contextStrategy: this.mockAlwaysTrueContext
			});

			let handleUserFunnelSpy = sinon.spy((<any>mockSessionLogger).handleUserFunnel);
			(<any>mockSessionLogger).handleUserFunnel = handleUserFunnelSpy;

			let logFailureSpy = sinon.spy(mockSessionLogger.logFailure);
			mockSessionLogger.logFailure = logFailureSpy;

			mockSessionLogger.logUserFunnel(undefined);

			ok(handleUserFunnelSpy.notCalled, "handleUserFunnel should not be called");
			ok(logFailureSpy.calledOnce, "logFailure should be called once");
			ok(logFailureSpy.calledWith(Log.Failure.Label.InvalidArgument, Log.Failure.Type.Unexpected),
				"logFailure should be called with InvalidArgument and Unexpected parameters");
		});

		test("logUserFunnel should not call handleUserFunnel if context requirements are not met", () => {
			let mockSessionLogger: SessionLogger = new MockSessionLogger({
				contextStrategy: this.mockAlwaysFalseContext
			});

			let handleUserFunnelSpy = sinon.spy((<any>mockSessionLogger).handleUserFunnel);
			(<any>mockSessionLogger).handleUserFunnel = handleUserFunnelSpy;

			mockSessionLogger.logUserFunnel(0);

			ok(this.alwaysFalseReqCheckSpy.calledOnce, "The context requirements should be checked");
			ok(handleUserFunnelSpy.notCalled, "handleUserFunnel should not be called");
		});

		test("logSession should call executeSessionStart and handleSetUserSessionId if the context requirements are met", () => {
			let mockSessionLogger: SessionLogger = new MockSessionLogger({
				contextStrategy: this.mockAlwaysTrueContext
			});

			let executeSessionStartSpy = sinon.spy((<any>mockSessionLogger).executeSessionStart);
			(<any>mockSessionLogger).executeSessionStart = executeSessionStartSpy;

			let handleSetUserSessionIdSpy = sinon.spy((<any>mockSessionLogger).handleSetUserSessionId);
			(<any>mockSessionLogger).handleSetUserSessionId = handleSetUserSessionIdSpy;

			mockSessionLogger.logSessionStart();

			ok(this.alwaysTrueReqCheckSpy.calledOnce, "The context requirements should be checked");
			ok(executeSessionStartSpy.calledOnce, "executeSessionStart should be called once");
			ok(handleSetUserSessionIdSpy.calledOnce, "handleSetUserSessionId should be called once");
		});

		test("logSession should called logFailure if the same session state is set twice in a row", () => {
			let mockSessionLogger: SessionLogger = new MockSessionLogger({
				contextStrategy: this.mockAlwaysTrueContext
			});

			let logFailureSpy = sinon.spy(mockSessionLogger.logFailure);
			mockSessionLogger.logFailure = logFailureSpy;

			mockSessionLogger.logSessionStart();
			mockSessionLogger.logSessionStart();

			ok(logFailureSpy.calledOnce, "logFailure should be called once");
			ok(logFailureSpy.calledWith(Log.Failure.Label.SessionAlreadySet, Log.Failure.Type.Unexpected),
				"logFailure should be called with session already set information");
		});

		test("logSession should called logFailure if the first it's called, it's called with Ended (as we assume it's Ended to begin with)", () => {
			let mockSessionLogger: SessionLogger = new MockSessionLogger({
				contextStrategy: this.mockAlwaysTrueContext
			});

			let handleSessionSpy = sinon.spy((<any>mockSessionLogger).handleSession);
			(<any>mockSessionLogger).handleSession = handleSessionSpy;

			let logFailureSpy = sinon.spy(mockSessionLogger.logFailure);
			mockSessionLogger.logFailure = logFailureSpy;

			mockSessionLogger.logSessionEnd(0);

			ok(logFailureSpy.calledOnce, "logFailure should be called once");
			ok(logFailureSpy.calledWith(Log.Failure.Label.SessionAlreadySet, Log.Failure.Type.Unexpected),
				"logFailure should be called with session already set information");
			ok(handleSessionSpy.notCalled, "handleSession should not be called");
		});

		test("logSession End should log each stream as an event without checking all the usual logEvent requirements (i.e., call the pure version of the function)", () => {
			let mockSessionLogger: SessionLogger = new MockSessionLogger({
				contextStrategy: this.mockAlwaysTrueContext
			});

			let handleEventPureSpy = sinon.spy((<any>mockSessionLogger).handleEventPure);
			(<any>mockSessionLogger).handleEventPure = handleEventPureSpy;

			mockSessionLogger.logSessionStart();
			mockSessionLogger.pushToStream(0, "a");
			mockSessionLogger.pushToStream(1, "b");
			mockSessionLogger.logSessionEnd(0);

			ok(handleEventPureSpy.calledTwice, "handleEventPure should be called once for every stream");
		});

		test("logSession Start should clear the streams", () => {
			let mockSessionLogger: SessionLogger = new MockSessionLogger({
				contextStrategy: this.mockAlwaysTrueContext
			});

			let handleEventPureSpy = sinon.spy((<any>mockSessionLogger).handleEventPure);
			(<any>mockSessionLogger).handleEventPure = handleEventPureSpy;

			mockSessionLogger.logSessionStart();
			mockSessionLogger.pushToStream(0, "a");
			mockSessionLogger.pushToStream(1, "b");
			mockSessionLogger.logSessionEnd(0);

			ok(handleEventPureSpy.calledTwice, "handleEventPure should be called once for every stream");

			mockSessionLogger.logSessionStart();
			mockSessionLogger.logSessionEnd(0);
			ok(handleEventPureSpy.calledTwice, "handleEventPure should not be called additional times");
		});

		test("logSession should not call handleSession if context requirements are not met", () => {
			let mockSessionLogger: SessionLogger = new MockSessionLogger({
				contextStrategy: this.mockAlwaysFalseContext
			});

			let handleSessionSpy = sinon.spy((<any>mockSessionLogger).handleSession);
			(<any>mockSessionLogger).handleSession = handleSessionSpy;

			mockSessionLogger.logSessionStart();

			ok(this.alwaysFalseReqCheckSpy.calledOnce, "The context requirements should be checked");
			ok(handleSessionSpy.notCalled, "handleSession should not be called");
		});

		test("logTrace should call handleTrace if the context requirements are met", () => {
			let mockSessionLogger: SessionLogger = new MockSessionLogger({
				contextStrategy: this.mockAlwaysTrueContext
			});

			let handleTraceSpy = sinon.spy((<any>mockSessionLogger).handleTrace);
			(<any>mockSessionLogger).handleTrace = handleTraceSpy;

			mockSessionLogger.logTrace(0, 0, "hi");

			ok(this.alwaysTrueReqCheckSpy.calledOnce, "The context requirements should be checked");
			ok(handleTraceSpy.calledOnce, "handleTrace should be called once");
			ok(handleTraceSpy.calledWith(0, 0, "hi"), "handleTrace should be passed the same event object");
		});

		test("logTrace should not call handleTrace if the label parameter is undefined", () => {
			let mockSessionLogger: SessionLogger = new MockSessionLogger({
				contextStrategy: this.mockAlwaysTrueContext
			});

			let handleTraceSpy = sinon.spy((<any>mockSessionLogger).handleTrace);
			(<any>mockSessionLogger).handleTrace = handleTraceSpy;

			let logFailureSpy = sinon.spy(mockSessionLogger.logFailure);
			mockSessionLogger.logFailure = logFailureSpy;

			mockSessionLogger.logTrace(undefined, 0, "hi");

			ok(handleTraceSpy.notCalled, "handleTrace should not be called");
			ok(logFailureSpy.calledOnce, "logFailure should be called once");
			ok(logFailureSpy.calledWith(Log.Failure.Label.InvalidArgument, Log.Failure.Type.Unexpected),
				"logFailure should be called with InvalidArgument and Unexpected parameters");
		});

		test("logTrace should not call handleTrace if the level parameter is undefined", () => {
			let mockSessionLogger: SessionLogger = new MockSessionLogger({
				contextStrategy: this.mockAlwaysTrueContext
			});

			let handleTraceSpy = sinon.spy((<any>mockSessionLogger).handleTrace);
			(<any>mockSessionLogger).handleTrace = handleTraceSpy;

			let logFailureSpy = sinon.spy(mockSessionLogger.logFailure);
			mockSessionLogger.logFailure = logFailureSpy;

			mockSessionLogger.logTrace(0, undefined, "hi");

			ok(handleTraceSpy.notCalled, "handleTrace should not be called");
			ok(logFailureSpy.calledOnce, "logFailure should be called once");
			ok(logFailureSpy.calledWith(Log.Failure.Label.InvalidArgument, Log.Failure.Type.Unexpected),
				"logFailure should be called with InvalidArgument and Unexpected parameters");
		});

		test("logTrace should not call handleTrace if context requirements are not met", () => {
			let mockSessionLogger: SessionLogger = new MockSessionLogger({
				contextStrategy: this.mockAlwaysFalseContext
			});

			let handleTraceSpy = sinon.spy((<any>mockSessionLogger).handleTrace);
			(<any>mockSessionLogger).handleTrace = handleTraceSpy;

			mockSessionLogger.logTrace(0, 0);

			ok(this.alwaysFalseReqCheckSpy.calledOnce, "The context requirements should be checked");
			ok(handleTraceSpy.notCalled, "handleTrace should not be called");
		});

		test("pushToStream should call logFailure if the label is undefined", () => {
			let mockSessionLogger: SessionLogger = new MockSessionLogger({
				contextStrategy: this.mockAlwaysTrueContext
			});

			let logFailureSpy = sinon.spy(mockSessionLogger.logFailure);
			mockSessionLogger.logFailure = logFailureSpy;

			mockSessionLogger.pushToStream(undefined, "item");

			ok(logFailureSpy.calledOnce, "logFailure should be called once");
			ok(logFailureSpy.calledWith(Log.Failure.Label.InvalidArgument, Log.Failure.Type.Unexpected),
				"logFailure should be called with InvalidArgument and Unexpected parameters");
		});

		test("pushToStream should not call logFailure if the value is undefined", () => {
			let mockSessionLogger: SessionLogger = new MockSessionLogger({
				contextStrategy: this.mockAlwaysTrueContext
			});

			let logFailureSpy = sinon.spy(mockSessionLogger.logFailure);
			mockSessionLogger.logFailure = logFailureSpy;

			mockSessionLogger.pushToStream(0, undefined);

			ok(logFailureSpy.notCalled, "logFailure should be called once");
		});

		test("logClickEvent should call handleClickEvent and pushToStream if the context requirements are met", () => {
			let mockSessionLogger: SessionLogger = new MockSessionLogger({
				contextStrategy: this.mockAlwaysTrueContext
			});

			let handleClickEventSpy = sinon.spy((<any>mockSessionLogger).handleClickEvent);
			(<any>mockSessionLogger).handleClickEvent = handleClickEventSpy;

			let pushToStreamSpy = sinon.spy((<any>mockSessionLogger).pushToStream);
			(<any>mockSessionLogger).pushToStream = pushToStreamSpy;

			mockSessionLogger.logClickEvent("buttonA");

			ok(handleClickEventSpy.calledOnce, "handleClickEvent should be called once");
			ok(handleClickEventSpy.calledWith("buttonA"),
				"handleClickEvent should be called with the clickId parameter");
			ok(pushToStreamSpy.calledOnce, "pushToStreamSpy should be called once");
			ok(pushToStreamSpy.calledWith(Log.Event.Label.Click, "buttonA"),
				"pushToStreamSpy should be called with the click event and the clickId parameter");
		});

		test("logClickEvent should call logFailure if the clickId is undefined", () => {
			let mockSessionLogger: SessionLogger = new MockSessionLogger({
				contextStrategy: this.mockAlwaysTrueContext
			});

			let logFailureSpy = sinon.spy(mockSessionLogger.logFailure);
			mockSessionLogger.logFailure = logFailureSpy;

			let handleClickEventSpy = sinon.spy((<any>mockSessionLogger).handleClickEvent);
			(<any>mockSessionLogger).handleClickEvent = handleClickEventSpy;

			let pushToStreamSpy = sinon.spy((<any>mockSessionLogger).pushToStream);
			(<any>mockSessionLogger).pushToStream = pushToStreamSpy;

			mockSessionLogger.logClickEvent(undefined);

			ok(handleClickEventSpy.notCalled, "handleClickEvent should not be called");
			ok(pushToStreamSpy.notCalled, "pushToStream should not be called");
			ok(logFailureSpy.calledOnce, "logFailure should be called once");
			ok(logFailureSpy.calledWith(Log.Failure.Label.InvalidArgument, Log.Failure.Type.Unexpected),
				"logFailure should be called with InvalidArgument and Unexpected parameters");
		});

		test("logClickEvent should not call handleClickEvent and pushToStream if the context requirements are not met", () => {
			let mockSessionLogger: SessionLogger = new MockSessionLogger({
				contextStrategy: this.mockAlwaysFalseContext
			});

			let handleClickEventSpy = sinon.spy((<any>mockSessionLogger).handleClickEvent);
			(<any>mockSessionLogger).handleClickEvent = handleClickEventSpy;

			let pushToStreamSpy = sinon.spy((<any>mockSessionLogger).pushToStream);
			(<any>mockSessionLogger).pushToStream = pushToStreamSpy;

			mockSessionLogger.logClickEvent("buttonA");

			ok(this.alwaysFalseReqCheckSpy.calledOnce, "The context requirements should be checked");
			ok(handleClickEventSpy.notCalled, "handleClickEvent should not be called");
			ok(pushToStreamSpy.notCalled, "pushToStream should not be called");
		});

		test("setContextProperty ensures that previous queued events are finally logged after the required context properties are met", () => {
			let mockSessionLogger: SessionLogger = new MockSessionLogger({
				contextStrategy: this.mockOneReqContext
			});

			let eventA = new Log.Event.BaseEvent(0);
			let eventB = new Log.Event.BaseEvent(1);
			mockSessionLogger.logEvent(eventA);
			mockSessionLogger.logEvent(eventB);

			let handleEventSpy = sinon.spy((<any>mockSessionLogger).handleEvent);
			(<any>mockSessionLogger).handleEvent = handleEventSpy;

			ok(handleEventSpy.notCalled, "handleEvent should not be called yet");

			mockSessionLogger.setContextProperty(requiredContext, "value");

			let expectedContextCheckReqs = {};
			expectedContextCheckReqs[Log.Context.toString(requiredContext)] = "value";
			ok(this.oneReqCheckSpy.calledWith(expectedContextCheckReqs));

			ok(handleEventSpy.calledTwice, "The two events should be dequeued");
			ok(handleEventSpy.calledWith(eventA), "The first event should be used as a parameter");
			ok(handleEventSpy.calledWith(eventB), "The second event should be used as a parameter");
		});

		test("hasUserInteracted should return false if no click events were logged and true otherwise", () => {
			let mockSessionLogger: SessionLogger = new MockSessionLogger({
				contextStrategy: this.mockAlwaysTrueContext
			});

			ok(!mockSessionLogger.hasUserInteracted(), "hasUserInteracted should be false");

			mockSessionLogger.logClickEvent("buttonA");
			ok(mockSessionLogger.hasUserInteracted(), "hasUserInteracted should be true");

			mockSessionLogger.logClickEvent("buttonB");
			ok(mockSessionLogger.hasUserInteracted(), "hasUserInteracted should still be true");
		});

		test("hasUserInteracted should return false after a session ended has been logged", () => {
			let mockSessionLogger: SessionLogger = new MockSessionLogger({
				contextStrategy: this.mockAlwaysTrueContext
			});

			ok(!mockSessionLogger.hasUserInteracted(), "hasUserInteracted should be false");

			mockSessionLogger.logClickEvent("buttonA");
			ok(mockSessionLogger.hasUserInteracted(), "hasUserInteracted should be true");

			// We call Started here as we can't end a session that's already ended
			mockSessionLogger.logSessionStart();
			mockSessionLogger.logSessionEnd(0);
			ok(!mockSessionLogger.hasUserInteracted(), "hasUserInteracted should be false after the session end");

			mockSessionLogger.logClickEvent("buttonA");
			ok(mockSessionLogger.hasUserInteracted(), "hasUserInteracted should be true");
		});
	}
}

(new SessionLoggerTests()).runTests();
