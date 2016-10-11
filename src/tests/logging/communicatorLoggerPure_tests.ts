import * as sinon from "sinon";

import {Constants} from "../../scripts/constants";

import {Communicator} from "../../scripts/communicator/communicator";

import * as Log from "../../scripts/logging/log";
import {CommunicatorLoggerPure} from "../../scripts/logging/communicatorLoggerPure";

let stubCommunicator: Communicator;
let communicatorLoggerPure: CommunicatorLoggerPure;

QUnit.module("communicatorLoggerPure", {
	beforeEach: () => {
		stubCommunicator = sinon.createStubInstance(Communicator) as any;
		communicatorLoggerPure = new CommunicatorLoggerPure(stubCommunicator);
	}
});

test("logEvent should call callRemoteFunction on the communicator", () => {
	let event = new Log.Event.BaseEvent(0);
	communicatorLoggerPure.logEvent(event);

	let callRemoteFunctionSpy = <Sinon.SinonSpy>stubCommunicator.callRemoteFunction;
	ok(callRemoteFunctionSpy.calledOnce, "callRemoteFunction was called once");
	ok(callRemoteFunctionSpy.calledWith(Constants.FunctionKeys.telemetry),
		"callRemoteFunction should be called with the telemetry function key");
});

test("logFailure should call callRemoteFunction on the communicator", () => {
	communicatorLoggerPure.logFailure(0, 0);

	let callRemoteFunctionSpy = <Sinon.SinonSpy>stubCommunicator.callRemoteFunction;
	ok(callRemoteFunctionSpy.calledOnce, "callRemoteFunction was called once");
	ok(callRemoteFunctionSpy.calledWith(Constants.FunctionKeys.telemetry),
		"callRemoteFunction should be called with the telemetry function key");
});

test("logUserFunnel should call callRemoteFunction on the communicator", () => {
	communicatorLoggerPure.logUserFunnel(0);

	let callRemoteFunctionSpy = <Sinon.SinonSpy>stubCommunicator.callRemoteFunction;
	ok(callRemoteFunctionSpy.calledOnce, "callRemoteFunction was called once");
	ok(callRemoteFunctionSpy.calledWith(Constants.FunctionKeys.telemetry),
		"callRemoteFunction should be called with the telemetry function key");
});

test("logSession should call callRemoteFunction on the communicator", () => {
	communicatorLoggerPure.logSessionStart();

	let callRemoteFunctionSpy = <Sinon.SinonSpy>stubCommunicator.callRemoteFunction;
	ok(callRemoteFunctionSpy.calledOnce, "callRemoteFunction was called once");
	ok(callRemoteFunctionSpy.calledWith(Constants.FunctionKeys.telemetry),
		"callRemoteFunction should be called with the telemetry function key");
});

test("logTrace should call callRemoteFunction on the communicator", () => {
	communicatorLoggerPure.logTrace(0, 0);

	let callRemoteFunctionSpy = <Sinon.SinonSpy>stubCommunicator.callRemoteFunction;
	ok(callRemoteFunctionSpy.calledOnce, "callRemoteFunction was called once");
	ok(callRemoteFunctionSpy.calledWith(Constants.FunctionKeys.telemetry),
		"callRemoteFunction should be called with the telemetry function key");
});

test("pushToStream should call callRemoteFunction on the communicator", () => {
	communicatorLoggerPure.pushToStream(0, "x");

	let callRemoteFunctionSpy = <Sinon.SinonSpy>stubCommunicator.callRemoteFunction;
	ok(callRemoteFunctionSpy.calledOnce, "callRemoteFunction was called once");
	ok(callRemoteFunctionSpy.calledWith(Constants.FunctionKeys.telemetry),
		"callRemoteFunction should be called with the telemetry function key");
});

test("logClickEvent should call callRemoteFunction on the communicator", () => {
	communicatorLoggerPure.logClickEvent("abc");

	let callRemoteFunctionSpy = <Sinon.SinonSpy>stubCommunicator.callRemoteFunction;
	ok(callRemoteFunctionSpy.calledOnce, "callRemoteFunction was called once");
	ok(callRemoteFunctionSpy.calledWith(Constants.FunctionKeys.telemetry),
		"callRemoteFunction should be called with the telemetry function key");
});

test("setContextProperty should call callRemoteFunction on the communicator", () => {
	communicatorLoggerPure.setContextProperty("xyz", "abc");

	let callRemoteFunctionSpy = <Sinon.SinonSpy>stubCommunicator.callRemoteFunction;
	ok(callRemoteFunctionSpy.calledOnce, "callRemoteFunction was called once");
	ok(callRemoteFunctionSpy.calledWith(Constants.FunctionKeys.telemetry),
		"callRemoteFunction should be called with the telemetry function key");
});
