import * as sinon from "sinon";

import * as Log from "../../scripts/logging/log";
import {LoggerDecorator} from "../../scripts/logging/loggerDecorator";

QUnit.module("loggerDecorator", {});

class MockLoggerDecorator extends LoggerDecorator {
	protected outputClickEvent(clickId: string): void {}
	protected outputEvent(event: Log.Event.BaseEvent): void {}
	protected outputSessionStart(): void {}
	protected outputSessionEnd(endTrigger: Log.Session.EndTrigger): void {}
	protected outputFailure(label: Log.Failure.Label, failureType: Log.Failure.Type, failureInfo?: OneNoteApi.GenericError, id?: string): void {}
	protected outputUserFunnel(label: Log.Funnel.Label): void {}
	protected outputTrace(label: Log.Trace.Label, level: Log.Trace.Level, message?: string): void {}
	protected outputSetContext(key: Log.Context.Custom, value: string | number | boolean): void {}
}

test("handleClickEvent should call the child's implementation while logging the click event on the parent", () => {
	let inner: LoggerDecorator = new MockLoggerDecorator();
	let outer: LoggerDecorator = new MockLoggerDecorator({ component: inner });

	let executeClickEventSpy = sinon.spy((<any>inner).executeClickEvent);
	(<any>inner).executeClickEvent = executeClickEventSpy;

	outer.logClickEvent("abc");

	ok(executeClickEventSpy.calledOnce, "inner's logClickEvent should be called once");
	ok(executeClickEventSpy.calledWith("abc"), "inner's logClickEvent should be called with the same parameter(s)");
});

test("handleEvent should call the child's implementation while logging the event on the parent", () => {
	let inner: LoggerDecorator = new MockLoggerDecorator();
	let outer: LoggerDecorator = new MockLoggerDecorator({ component: inner });

	let logEventSpy = sinon.spy(inner.logEvent);
	inner.logEvent = logEventSpy;

	let event = new Log.Event.BaseEvent(0);
	outer.logEvent(event);

	ok(logEventSpy.calledOnce, "inner's logEvent should be called once");
	ok(logEventSpy.calledWith(event), "inner's logEvent should be called with the same parameter(s)");
});

test("handleSession should call the child's executeSessionStart implementation while logging the session on the parent", () => {
	let inner: LoggerDecorator = new MockLoggerDecorator();
	let outer: LoggerDecorator = new MockLoggerDecorator({ component: inner });

	let executeSessionStartSpy = sinon.spy((<any>inner).executeSessionStart);
	(<any>inner).executeSessionStart = executeSessionStartSpy;

	outer.logSessionStart();

	ok(executeSessionStartSpy.calledOnce, "inner's executeSessionStartSpy should be called once");
});

test("handleFailure should call the child's implementation while logging the session on the parent", () => {
	let inner: LoggerDecorator = new MockLoggerDecorator();
	let outer: LoggerDecorator = new MockLoggerDecorator({ component: inner });

	let logFailureSpy = sinon.spy(inner.logFailure);
	inner.logFailure = logFailureSpy;

	outer.logFailure(0, 0);

	ok(logFailureSpy.calledOnce, "inner's logFailure should be called once");
	ok(logFailureSpy.calledWith(0, 0), "inner's logFailure should be called with the same parameter(s)");
});

test("handleUserFunnel should call the child's implementation while logging the session on the parent", () => {
	let inner: LoggerDecorator = new MockLoggerDecorator();
	let outer: LoggerDecorator = new MockLoggerDecorator({ component: inner });

	let logUserFunnelSpy = sinon.spy(inner.logUserFunnel);
	inner.logUserFunnel = logUserFunnelSpy;

	outer.logUserFunnel(0);

	ok(logUserFunnelSpy.calledOnce, "inner's logUserFunnel should be called once");
	ok(logUserFunnelSpy.calledWith(0), "inner's logUserFunnel should be called with the same parameter(s)");
});

test("handleTrace should call the child's implementation while logging the session on the parent", () => {
	let inner: LoggerDecorator = new MockLoggerDecorator();
	let outer: LoggerDecorator = new MockLoggerDecorator({ component: inner });

	let logTraceSpy = sinon.spy(inner.logTrace);
	inner.logTrace = logTraceSpy;

	outer.logTrace(0, 0);

	ok(logTraceSpy.calledOnce, "inner's logTrace should be called once");
	ok(logTraceSpy.calledWith(0, 0), "inner's logTrace should be called with the same parameter(s)");
});

test("handleSetContext should call the child's implementation while logging the session on the parent", () => {
	let inner: LoggerDecorator = new MockLoggerDecorator();
	let outer: LoggerDecorator = new MockLoggerDecorator({ component: inner });

	let setContextPropertySpy = sinon.spy(inner.setContextProperty);
	inner.setContextProperty = setContextPropertySpy;

	outer.setContextProperty(0, "x");

	ok(setContextPropertySpy.calledOnce, "inner's setContextProperty should be called once");
	ok(setContextPropertySpy.calledWith(0, "x"), "inner's setContextProperty should be called with the same parameter(s)");
});
