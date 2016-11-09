import * as sinon from "sinon";

import {Http} from "../../scripts/http/http";

let xhr: Sinon.SinonFakeXMLHttpRequest;
let server: Sinon.SinonFakeServer;

QUnit.module("http-sinon", {
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

test("When get is called with valid parameters and the server returns 200, the request should be returned in the resolve", (assert: QUnitAssert) => {
	let done = assert.async();

	let response = "Success!";
	server.respondWith([200, {}, response]);

	Http.get("https://not-exist.xyz/123/4567/abc.aspx").then((request) => {
		ok(request, "The request object in the package must be non-undefined");
	}, (error) => {
		ok(false, "reject should not be called");
	}).then(() => {
		done();
	});
});

test("When get is called with valid parameters and the server returns 204 when the caller specified that its a valid response code, the request should be returned in the resolve", (assert: QUnitAssert) => {
	let done = assert.async();

	let response = "Success!";
	server.respondWith([204, {}, response]);

	Http.get("https://not-exist.xyz/123/4567/abc.aspx", {}, 30000, [200, 204]).then((request) => {
		ok(request, "The request object in the package must be non-undefined");
	}, (error) => {
		ok(false, "reject should not be called");
	}).then(() => {
		done();
	});
});

test("When get is called with valid parameters and the server returns non-200 2XX, the promise should be rejected with the request error object", (assert: QUnitAssert) => {
	let done = assert.async();

	let responseJson = {
		error: "Unexpected response status",
		statusCode: 204,
		responseHeaders: {}
	};

	let expected = {
		error: responseJson.error,
		statusCode: responseJson.statusCode,
		responseHeaders: responseJson.responseHeaders,
		response: JSON.stringify(responseJson)
		// timeout property is not expected for everything 200 <= code < 300
	};

	server.respondWith([expected.statusCode, expected.responseHeaders, expected.response]);

	Http.get("https://not-exist.xyz/123/4567/abc.aspx").then((responsePackage) => {
		ok(false, "resolve should not be called");
	}, (error) => {
		deepEqual(error, expected, "The error object should be rejected");
	}).then(() => {
		done();
	});
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
});

test("When post is called with valid parameters and the server returns 200, the request should be returned in the resolve", (assert: QUnitAssert) => {
	let done = assert.async();

	let response = "Success!";
	server.respondWith([200, {}, response]);

	Http.post("https://not-exist.xyz/123/4567/abc.aspx", "DATA", {}).then((request) => {
		ok(request, "The request object in the package must be non-undefined");
	}, (error) => {
		ok(false, "reject should not be called");
	}).then(() => {
		done();
	});
});

test("When post is called with data as an empty string and the server returns 200, the request should be returned in the resolve", (assert: QUnitAssert) => {
	let done = assert.async();

	let response = "Success!";
	server.respondWith([200, {}, response]);

	Http.post("https://not-exist.xyz/123/4567/abc.aspx", "", {}).then((request) => {
		ok(request, "The request object in the package must be non-undefined");
	}, (error) => {
		ok(false, "reject should not be called");
	}).then(() => {
		done();
	});
});

test("When post is called with valid parameters and the server returns 204 when the caller specified that its a valid response code, the request should be returned in the resolve", (assert: QUnitAssert) => {
	let done = assert.async();

	let response = "Success!";
	server.respondWith([204, {}, response]);

	Http.post("https://not-exist.xyz/123/4567/abc.aspx", "DATA", {}, [200, 204]).then((request) => {
		ok(request, "The request object in the package must be non-undefined");
	}, (error) => {
		ok(false, "reject should not be called");
	}).then(() => {
		done();
	});
});

test("When post is called with valid parameters and the server returns non-200 2XX, the promise should be rejected with the request error object", (assert: QUnitAssert) => {
	let done = assert.async();

	let responseJson = {
		error: "Unexpected response status",
		statusCode: 204,
		responseHeaders: {}
	};

	let expected = {
		error: responseJson.error,
		statusCode: responseJson.statusCode,
		responseHeaders: responseJson.responseHeaders,
		response: JSON.stringify(responseJson)
		// timeout property is not expected for everything 200 <= code < 300
	};

	server.respondWith([expected.statusCode, expected.responseHeaders, expected.response]);

	Http.post("https://not-exist.xyz/123/4567/abc.aspx", "DATA", {}).then((responsePackage) => {
		ok(false, "resolve should not be called");
	}, (error) => {
		deepEqual(error, expected, "The error object should be rejected");
	}).then(() => {
		done();
	});
});

test("When post is called with an undefined url, an Error should be thrown", () => {
	throws(() => {
		Http.post(undefined, "DATA");
	}, Error("url must be a non-empty string, but was: undefined"));
});

test("When post is called with an empty url, an Error should be thrown", () => {
	throws(() => {
		Http.post("", "DATA");
	}, Error("url must be a non-empty string, but was: "));
});

test("When post is called with an undefined data, an Error should be thrown", () => {
	throws(() => {
		Http.post("https://not-exist.xyz/123/4567/abc.aspx", undefined);
	}, Error("data must be a non-undefined object, but was: undefined"));
});

test("When post is called with valid parameters and the server returns 4XX, the promise should be rejected with the request error object", (assert: QUnitAssert) => {
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

	Http.post("https://not-exist.xyz/123/4567/abc.aspx", "DATA").then((responsePackage) => {
		ok(false, "resolve should not be called");
	}, (error) => {
		deepEqual(error, expected, "The error object should be rejected");
	}).then(() => {
		done();
	});
});

test("When post is called with valid parameters and the server returns 5XX, the promise should be rejected with the request error object", (assert: QUnitAssert) => {
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

	Http.post("https://not-exist.xyz/123/4567/abc.aspx", "DATA").then((responsePackage) => {
		ok(false, "resolve should not be called");
	}, (error) => {
		deepEqual(error, expected, "The error object should be rejected");
	}).then(() => {
		done();
	});
});
