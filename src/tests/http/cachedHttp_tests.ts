import {ResponsePackage} from "../../scripts/responsePackage";

import {CachedHttp, TimeStampedData} from "../../scripts/http/cachedHttp";

import {MockStorage} from "../storage/mockStorage";

let mockStorage: MockStorage;

QUnit.module("cachedHttp", {
	beforeEach: () => {
		mockStorage = new MockStorage();
	}
});

test("valueHasExpired should return true if the timestamped data is older than the expiry time", () => {
	let expiry = 500;
	let value = {
		data: {},
		lastUpdated: Date.now() - (expiry + 1)
	};

	ok(CachedHttp.valueHasExpired(value, expiry),
		"A timestamped value with a lastUpdated value older than the expiry should return true");
});

test("valueHasExpired should return false if the timestamped data is not older than the expiry time", () => {
	let expiry = 999999999999;
	let value = {
		data: {},
		lastUpdated: Date.now()
	};

	ok(!CachedHttp.valueHasExpired(value, expiry),
		"A timestamped value with a lastUpdated value newer than the expiry should return false");
});

test("valueHasExpired should return true if value is undefined", () => {
	let expiry = 999999999999;
	ok(CachedHttp.valueHasExpired(undefined, expiry),
		"A timestamped value with an undefined value should return true");
});

test("valueHasExpired should return true if value is undefined", () => {
	let expiry = 999999999999;
	let value = {
		data: {},
		lastUpdated: undefined
	};

	ok(CachedHttp.valueHasExpired(value, expiry),
		"A timestamped value with an undefined value should return true");
});

test("getAndCacheRemoteValue should set the timestamped value in storage when it is retrieved from the remote", (assert: QUnitAssert) => {
	let done = assert.async();

	let cachedHttp = new CachedHttp(mockStorage);

	// A JSON-parseable response is expected from the remote source
	let response = JSON.stringify("ASDF!");

	let key = "k";
	let getRemoteValue = () => {
		return Promise.resolve({
			parsedResponse: response,
			request: undefined // We don't care about the request in the test
		} as ResponsePackage<string>);
	};

	cachedHttp.getAndCacheRemoteValue(key, getRemoteValue).then((timeStampedData) => {
		ok(timeStampedData.lastUpdated > 0);
		strictEqual(timeStampedData.data, JSON.parse(response),
			"The parsed response text should be returned as part of the time stamped data");
		let timeStampedValueInStorage: TimeStampedData = JSON.parse(mockStorage.getValue(key));
		deepEqual(timeStampedValueInStorage, timeStampedData,
			"The latest time stamped data should be cached in the storage object");
	}, (error) => {
		ok(false, "reject should not be called");
	}).then(() => {
		done();
	});
});

test("getAndCacheRemoteValue should not set anything in storage if the remote function rejected", (assert: QUnitAssert) => {
	let done = assert.async();

	let cachedHttp = new CachedHttp(mockStorage);

	let key = "k";
	let expectedError = { err: "err" };
	let getRemoteValue = () => {
		return Promise.reject(expectedError);
	};

	cachedHttp.getAndCacheRemoteValue(key, getRemoteValue).then((timeStampedData) => {
		ok(false, "resolve should not be called");
	}, (actualError) => {
		deepEqual(actualError, expectedError,
			"The reject object should be bubbled to getAndCacheRemoteValue's reject");
		strictEqual(mockStorage.getValue(key), undefined,
			"Nothing should be stored in storage for the given key");
	}).then(() => {
		done();
	});
});

test("When getAndCacheRemoteValue is called with an undefined key, an Error should be thrown", () => {
	let cachedHttp = new CachedHttp(mockStorage);

	let getRemoteValue = () => {
		return Promise.reject({});
	};

	throws(() => {
		cachedHttp.getAndCacheRemoteValue(undefined, getRemoteValue);
	}, Error("key must be a non-empty string, but was: undefined"));
});

test("When getAndCacheRemoteValue is called with an empty key, an Error should be thrown", () => {
	let cachedHttp = new CachedHttp(mockStorage);

	let getRemoteValue = () => {
		return Promise.reject({});
	};

	throws(() => {
		cachedHttp.getAndCacheRemoteValue("", getRemoteValue);
	}, Error("key must be a non-empty string, but was: "));
});

test("When getAndCacheRemoteValue is called with an getRemoteValue key, an Error should be thrown", () => {
	let cachedHttp = new CachedHttp(mockStorage);

	throws(() => {
		cachedHttp.getAndCacheRemoteValue("k", undefined);
	}, Error("getRemoteValue must be non-undefined"));
});
