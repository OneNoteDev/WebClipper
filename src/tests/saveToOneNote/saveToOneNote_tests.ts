import * as sinon from "sinon";

let xhr: Sinon.SinonFakeXMLHttpRequest;
let server: Sinon.SinonFakeServer;

QUnit.module("saveToOneNote-sinon", {
	beforeEach: () => {
		xhr = sinon.useFakeXMLHttpRequest();
		server = sinon.fakeServer.create();
		server.respondImmediately = true;
	},
	afterEach: () => {
		xhr.restore();
		server.restore();
	}
});

test("hello world", (assert: QUnitAssert) => {
	let done = assert.async();
	ok(true);
	done();
});
