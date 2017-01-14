import * as sinon from "sinon";

import {Constants} from "../../scripts/constants";

import {Communicator} from "../../scripts/communicator/communicator";

import * as Log from "../../scripts/logging/log";
import {CommunicatorLoggerPure} from "../../scripts/logging/communicatorLoggerPure";

import {TestModule} from "../testModule";

export class CommunicatorLoggerPureTests extends TestModule {
	private stubCommunicator: Communicator;
	private communicatorLoggerPure: CommunicatorLoggerPure;

	protected module() {
		return "communicatorLoggerPure";
	}

	protected beforeEach() {
		this.stubCommunicator = sinon.createStubInstance(Communicator) as any;
		this.communicatorLoggerPure = new CommunicatorLoggerPure(this.stubCommunicator);
	}

	protected tests() {
		test("logEvent should call callRemoteFunction on the communicator", () => {
			let event = new Log.Event.BaseEvent(0);
			this.communicatorLoggerPure.logEvent(event);

			let callRemoteFunctionSpy = <sinon.SinonSpy>this.stubCommunicator.callRemoteFunction;
			ok(callRemoteFunctionSpy.calledOnce, "callRemoteFunction was called once");
			ok(callRemoteFunctionSpy.calledWith(Constants.FunctionKeys.telemetry),
				"callRemoteFunction should be called with the telemetry function key");
		});

		test("logFailure should call callRemoteFunction on the communicator", () => {
			this.communicatorLoggerPure.logFailure(0, 0);

			let callRemoteFunctionSpy = <sinon.SinonSpy>this.stubCommunicator.callRemoteFunction;
			ok(callRemoteFunctionSpy.calledOnce, "callRemoteFunction was called once");
			ok(callRemoteFunctionSpy.calledWith(Constants.FunctionKeys.telemetry),
				"callRemoteFunction should be called with the telemetry function key");
		});

		test("logUserFunnel should call callRemoteFunction on the communicator", () => {
			this.communicatorLoggerPure.logUserFunnel(0);

			let callRemoteFunctionSpy = <sinon.SinonSpy>this.stubCommunicator.callRemoteFunction;
			ok(callRemoteFunctionSpy.calledOnce, "callRemoteFunction was called once");
			ok(callRemoteFunctionSpy.calledWith(Constants.FunctionKeys.telemetry),
				"callRemoteFunction should be called with the telemetry function key");
		});

		test("logSession should call callRemoteFunction on the communicator", () => {
			this.communicatorLoggerPure.logSessionStart();

			let callRemoteFunctionSpy = <sinon.SinonSpy>this.stubCommunicator.callRemoteFunction;
			ok(callRemoteFunctionSpy.calledOnce, "callRemoteFunction was called once");
			ok(callRemoteFunctionSpy.calledWith(Constants.FunctionKeys.telemetry),
				"callRemoteFunction should be called with the telemetry function key");
		});

		test("logTrace should call callRemoteFunction on the communicator", () => {
			this.communicatorLoggerPure.logTrace(0, 0);

			let callRemoteFunctionSpy = <sinon.SinonSpy>this.stubCommunicator.callRemoteFunction;
			ok(callRemoteFunctionSpy.calledOnce, "callRemoteFunction was called once");
			ok(callRemoteFunctionSpy.calledWith(Constants.FunctionKeys.telemetry),
				"callRemoteFunction should be called with the telemetry function key");
		});

		test("pushToStream should call callRemoteFunction on the communicator", () => {
			this.communicatorLoggerPure.pushToStream(0, "x");

			let callRemoteFunctionSpy = <sinon.SinonSpy>this.stubCommunicator.callRemoteFunction;
			ok(callRemoteFunctionSpy.calledOnce, "callRemoteFunction was called once");
			ok(callRemoteFunctionSpy.calledWith(Constants.FunctionKeys.telemetry),
				"callRemoteFunction should be called with the telemetry function key");
		});

		test("logClickEvent should call callRemoteFunction on the communicator", () => {
			this.communicatorLoggerPure.logClickEvent("abc");

			let callRemoteFunctionSpy = <sinon.SinonSpy>this.stubCommunicator.callRemoteFunction;
			ok(callRemoteFunctionSpy.calledOnce, "callRemoteFunction was called once");
			ok(callRemoteFunctionSpy.calledWith(Constants.FunctionKeys.telemetry),
				"callRemoteFunction should be called with the telemetry function key");
		});

		test("setContextProperty should call callRemoteFunction on the communicator", () => {
			this.communicatorLoggerPure.setContextProperty("xyz", "abc");

			let callRemoteFunctionSpy = <sinon.SinonSpy>this.stubCommunicator.callRemoteFunction;
			ok(callRemoteFunctionSpy.calledOnce, "callRemoteFunction was called once");
			ok(callRemoteFunctionSpy.calledWith(Constants.FunctionKeys.telemetry),
				"callRemoteFunction should be called with the telemetry function key");
		});
	}
}

(new CommunicatorLoggerPureTests()).runTests();
