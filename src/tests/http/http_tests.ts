/// <reference path="../../../typings/main/ambient/sinon/sinon.d.ts" />

import {Http} from "../../scripts/http/http";

let xhr: Sinon.SinonFakeXMLHttpRequest;
let server: Sinon.SinonFakeServer;

QUnit.module("http", {
	beforeEach: () => {
		xhr = sinon.useFakeXMLHttpRequest();
		let requests = this.requests = [];
		xhr.onCreate = req => {
			requests.push(req);
		};

		server = sinon.fakeServer.create();
	},
	afterEach: () => {
		xhr.restore();
		server.restore();
	}
});

test("When get is called with valid parameters and the server returns 200, the responseText should be returned in the package", (assert: QUnitAssert) => {
	let done = assert.async();

	let response = "Success!";
	server.respondWith([200, {}, response]);

	Http.get("https://not-exist.xyz/123/4567/abc.aspx").then((responsePackage) => {
		ok(responsePackage.request, "The request object in the package must be non-undefined");
		strictEqual(responsePackage.parsedResponse, response,
			"The response text should be returned as part of the package");
	}, (error) => {
		ok(false, "reject should not be called");
	}).then(() => {
		done();
	});
	server.respond();
});

test("When get is called with an undefined url, an Error should be thrown", () => {
	throws(() => {
		Http.get(undefined);
	}, Error("url must be a non-empty string, but was: undefined"));
});

test("When get is called with an empty url, an Error should be thrown", () => {
	throws(() => {
		Http.get("");
	}, Error("url must be a non-empty string, but was: "));
});

test("When get is called with valid parameters and the server returns 4XX, the promise should be rejected with the request error object", (assert: QUnitAssert) => {
	let done = assert.async();

	let responseJson = {
		error: "Unexpected response status",
		statusCode: 404,
		responseHeaders: {}
	};

	let expected = {
		error: responseJson.error,
		statusCode: responseJson.statusCode,
		responseHeaders: responseJson.responseHeaders,
		response: JSON.stringify(responseJson),
		timeout: 30000
	};

	server.respondWith([expected.statusCode, expected.responseHeaders, expected.response]);

	Http.get("https://not-exist.xyz/123/4567/abc.aspx").then((responsePackage) => {
		ok(false, "resolve should not be called");
	}, (error) => {
		deepEqual(error, expected, "The error object should be rejected");
	}).then(() => {
		done();
	});
	server.respond();
});

test("When get is called with valid parameters and the server returns 5XX, the promise should be rejected with the request error object", (assert: QUnitAssert) => {
	let done = assert.async();

	let responseJson = {
		error: "Unexpected response status",
		statusCode: 500,
		responseHeaders: {}
	};

	let expected = {
		error: responseJson.error,
		statusCode: responseJson.statusCode,
		responseHeaders: responseJson.responseHeaders,
		response: JSON.stringify(responseJson),
		timeout: 30000
	};

	server.respondWith([expected.statusCode, expected.responseHeaders, expected.response]);

	Http.get("https://not-exist.xyz/123/4567/abc.aspx").then((responsePackage) => {
		ok(false, "resolve should not be called");
	}, (error) => {
		deepEqual(error, expected, "The error object should be rejected");
	}).then(() => {
		done();
	});
	server.respond();
});
