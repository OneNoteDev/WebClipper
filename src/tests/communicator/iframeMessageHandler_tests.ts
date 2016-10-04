import {IFrameMessageHandler} from "../../scripts/communicator/iframeMessageHandler";

QUnit.module("iframeMessageHandler", {});

test("Test that we can send and receive a message", (assert: QUnitAssert) => {
	let done = assert.async();

	// Note: this is currently posting and recieving to itself
	let handler = new IFrameMessageHandler(() => window);
	let counter = 0;
	handler.onMessageReceived = (data) => {
		counter++;
		if (counter === 1) {
			strictEqual(data, "hi there");
		} else if (counter === 2) {
			strictEqual(data, "hope you are well");
			done();
		} else {
			ok(false, "onMessageReceived was called more times than expected");
		}
	};
	handler.sendMessage("hi there");
	handler.sendMessage("hope you are well");
});

// TODO: figure out a way to test passing between different windows/iframes
