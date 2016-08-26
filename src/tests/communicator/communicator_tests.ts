/// <reference path="../../../typings/main/ambient/qunit/qunit.d.ts" />

import {Communicator, CommDataPackage} from "../../scripts/communicator/communicator";
import {SmartValue} from "../../scripts/communicator/smartValue";
import {MockMessageHandler} from "./mockMessageHandler";

QUnit.module("communicator", {});

module TestConstants {
	export var channel = "mockChannel";
	export var sampleFunction = "sampleFunction";
	export var sampleSmartValue = "sampleSmartValue";
}

function getMockCommunicators() {
	let mock1 = new MockMessageHandler();
	let mock2 = new MockMessageHandler(mock1);
	mock1.setOtherSide(mock2);

	return {
		alpha: new Communicator(mock1, TestConstants.channel),
		beta: new Communicator(mock2, TestConstants.channel)
	};
}

test("Calling a remote function with a data package should send it across to the other side untampered", () => {
	let comm = getMockCommunicators();

	comm.alpha.registerFunction(TestConstants.sampleFunction, (data) => {
		strictEqual(data, "sample data", "Ensure remote function calls pass along data params");
	});

	comm.beta.callRemoteFunction(TestConstants.sampleFunction, { param: "sample data" });
});

test("callRemoteFunction should call the callback with the resolved data if it is specified", (assert: QUnitAssert) => {
	let done = assert.async();
	let comm = getMockCommunicators();

	comm.alpha.registerFunction(TestConstants.sampleFunction, () => {
		return Promise.resolve("returned data");
	});

	comm.beta.callRemoteFunction(TestConstants.sampleFunction, { param: "initial data", callback: (data) => {
		strictEqual(data, "returned data", "Ensure remote function calls pass along data params");
		done();
	}});
});

test("If callRemoteFunction is called before the other side's function has been registered, it should be called when it is", (assert: QUnitAssert) => {
	let done = assert.async();
	let comm = getMockCommunicators();

	comm.beta.callRemoteFunction(TestConstants.sampleFunction, { param: "initial data", callback: (data) => {
		strictEqual(data, "returned data", "Ensure remote function calls pass along data params");
		done();
	}});

	comm.alpha.registerFunction(TestConstants.sampleFunction, () => {
		return Promise.resolve("returned data");
	});
});

test("Test passing smart values across the communicator and updating them", (assert: QUnitAssert) => {
	let done = assert.async();
	let comm = getMockCommunicators();

	let alphaValue = new SmartValue<string>("initial alpha");
	let betaValue = new SmartValue<string>("initial beta");

	let count = 0;
	comm.alpha.subscribeAcrossCommunicator(alphaValue, TestConstants.sampleSmartValue, (data: string) => {
		count++;
		if (count === 1) {
			strictEqual(data, "initial beta");
		} else if (count === 2) {
			strictEqual(data, "updated value");
			done();
		}
	});

	comm.beta.broadcastAcrossCommunicator(betaValue, TestConstants.sampleSmartValue);
	betaValue.set("updated value");
});

test("Robustly test two Communicators coming online at different times and registering/calling methods", () => {
	let mock1 = new MockMessageHandler();
	let mock2 = new MockMessageHandler(mock1);
	mock1.setOtherSide(mock2);

	// Test initial connection from one side
	mock1.onMockMessageHook = (dataFrom2: string) => {
		ok(false, "We shouldn't get anything yet since the other side hasn't connected yet");
	};
	mock2.onMockMessageHook = (dataFrom1: string) => {
		let result: CommDataPackage = JSON.parse(dataFrom1);
		strictEqual(result.functionKey, Communicator.initializationKey, "Should be initializing");
		strictEqual(result.channel, "mockChannel", "Check the channel");
	};
	let comm1 = new Communicator(mock1, "mockChannel");

	// Test the initial connection registering a function before the other side is connected
	mock1.onMockMessageHook = (dataFrom2: string) => {
		ok(false, "We shouldn't get anything yet since the other side hasn't connected yet");
	};
	mock2.onMockMessageHook = (dataFrom1: string) => {
		ok(true, "It doesn't matter if we get anything yet");
	};
	comm1.registerFunction("functionName1", undefined);

	// Test calling a function before the other side is connected
	mock1.onMockMessageHook = (dataFrom2: string) => {
		ok(false, "We shouldn't get anything yet since the other side hasn't connected yet");
	};
	mock2.onMockMessageHook = (dataFrom1: string) => {
		ok(true, "It doesn't matter if we get anything yet");
	};
	comm1.callRemoteFunction("functionName2", { param: "data2" });

	// Test initial connection from the second side
	mock1.onMockMessageHook = (dataFrom2: string) => {
		let result: CommDataPackage = JSON.parse(dataFrom2);
		strictEqual(result.functionKey, Communicator.initializationKey, "Should be initializing");
		strictEqual(result.channel, "mockChannel", "Check the channel");
	};
	let counter = 0;
	mock2.onMockMessageHook = (dataFrom1: string) => {
		counter++;
		let result: CommDataPackage = JSON.parse(dataFrom1);
		if (counter === 1) {
			strictEqual(result.functionKey, Communicator.acknowledgeKey, "Expecting the other side to acknoweledge the initialization");
		} else if (counter === 2) {
			strictEqual(result.functionKey, Communicator.registrationKey, "Expecting the other side to register their function now");
			strictEqual(result.data, "functionName1", "Check the function name");
		} else {
			ok(false, "Not expecting anything else");
		}
	};
	let comm2 = new Communicator(mock2, "mockChannel");

	// Test calling the remote function
	mock1.onMockMessageHook = (dataFrom2: string) => {
		let result: CommDataPackage = JSON.parse(dataFrom2);
		strictEqual(result.functionKey, "functionName1", "Check function name");
		strictEqual(result.data, "data1", "Check we got the data");
	};
	mock2.onMockMessageHook = (dataFrom1: string) => {
		ok(false, "We don't expect any reposnse");
	};
	comm2.callRemoteFunction("functionName1", { param: "data1" });

	// Test finally registering the second method, and ensure the queued up call trickles through
	mock1.onMockMessageHook = (dataFrom2: string) => {
		let result: CommDataPackage = JSON.parse(dataFrom2);
		strictEqual(result.functionKey, Communicator.registrationKey, "Expecting the other side to register their function now");
		strictEqual(result.data, "functionName2", "Check the function name");
	};
	mock2.onMockMessageHook = (dataFrom1: string) => {
		let result: CommDataPackage = JSON.parse(dataFrom1);
		strictEqual(result.functionKey, "functionName2", "Check function name");
		strictEqual(result.data, "data2", "Check we got the data");
		ok(!result.callbackKey, "No callbackKey was sent, so there shouldn't be one");
	};
	comm2.registerFunction("functionName2", undefined);
});

test("Test parseMessage with malformed data", () => {
	let mockHandler = new MockMessageHandler();
	let communicator = new Communicator(mockHandler, "myId");

	// Test sending malformed data to see if anything breaks
	communicator.parseMessage(undefined);
	communicator.parseMessage("");
	communicator.parseMessage("The quick brown fox...");
	communicator.parseMessage("{}");
	communicator.parseMessage("}^&0980@#$%^.,<>{))(}{");
	communicator.parseMessage(JSON.stringify({ foo: "bar" }));
	ok(true, "No exceptions thrown for malformed data");
});

test("Calling a remote function through a bad connection should throw an error and allow it to bubble", () => {
	let mock1 = new MockMessageHandler();
	let mock2 = new MockMessageHandler(mock1);
	mock1.setOtherSide(mock2);
	let alpha = new Communicator(mock1, TestConstants.channel);
	let beta = new Communicator(mock2, TestConstants.channel);

	alpha.registerFunction(TestConstants.sampleFunction, (data) => {
		ok(false, "The registered function should not be called");
	});

	mock2.isCorrupt = true;
	throws(() => {
		beta.callRemoteFunction(TestConstants.sampleFunction, { param: "sample data" });
	}, Error(MockMessageHandler.corruptError));
});

test("Calling a remote function through a bad connection should call the error handler with the error object if it is set", () => {
	let mock1 = new MockMessageHandler();
	let mock2 = new MockMessageHandler(mock1);
	mock1.setOtherSide(mock2);
	let alpha = new Communicator(mock1, TestConstants.channel);
	let beta = new Communicator(mock2, TestConstants.channel);
	beta.setErrorHandler((e: Error) => {
		strictEqual(e.message, MockMessageHandler.corruptError);
	});

	alpha.registerFunction(TestConstants.sampleFunction, (data) => {
		ok(false, "The registered function should not be called");
	});

	mock2.isCorrupt = true;
	beta.callRemoteFunction(TestConstants.sampleFunction, { param: "sample data" });
});
