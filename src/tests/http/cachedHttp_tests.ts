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

test("getFreshValue where the value in storage is still fresh should not return or retrieve the value from the specified remote call", (assert: QUnitAssert) => {
	let done = assert.async();

	let expected = "expected";
	let timeOfStorage = Date.now();
	let valueInStorage = {
		data: expected,
		lastUpdated: timeOfStorage
	};

	let key = "k";
	mockStorage.setValue(key, JSON.stringify(valueInStorage));
	let cachedHttp = new CachedHttp(mockStorage);

	let getRemoteValue = () => {
		return Promise.resolve({
			parsedResponse: JSON.stringify("notexpected"),
			request: undefined // We don't care about the request in the test
		} as ResponsePackage<string>);
	};

	cachedHttp.getFreshValue(key, getRemoteValue, 9999999999).then((timeStampedData) => {
		strictEqual(timeStampedData.data, expected, "The storage item should be returned");
		strictEqual(timeStampedData.lastUpdated, timeOfStorage, "The returned item should have its lastUpdated value be preserved");

		let newStoredValue = JSON.parse(mockStorage.getValue(key)) as TimeStampedData;
		strictEqual(newStoredValue.data, expected, "The storage item should be preserved");
		strictEqual(newStoredValue.lastUpdated, timeOfStorage, "The storage item's lastUpdated should be preserved");
	}, (error) => {
		ok(false, "reject should not be called");
	}).then(() => {
		done();
	});
});

test("Given that lastUpdated is a small non-0 value, getFreshValue where the value in storage is too old should return the value from the specified remote call", (assert: QUnitAssert) => {
	let done = assert.async();

	let timeOfStorage = Date.now() - 9999999999;
	let valueInStorage = {
		data: "notexpected",
		lastUpdated: timeOfStorage
	};

	let key = "k";
	mockStorage.setValue(key, JSON.stringify(valueInStorage));
	let cachedHttp = new CachedHttp(mockStorage);

	let expected = "expected";
	let getRemoteValue = () => {
		return Promise.resolve({
			parsedResponse: JSON.stringify(expected),
			request: undefined // We don't care about the request in the test
		} as ResponsePackage<string>);
	};

	cachedHttp.getFreshValue(key, getRemoteValue, 9999999999).then((timeStampedData) => {
		strictEqual(timeStampedData.data, expected, "The remote item should be returned");
		ok(timeStampedData.lastUpdated > timeOfStorage, "The returned item's lastUpdated should be greater than that of the stale value's one");

		let newStoredValue = JSON.parse(mockStorage.getValue(key)) as TimeStampedData;
		strictEqual(newStoredValue.data, expected, "The storage item should be updated to the remote value");
		ok(newStoredValue.lastUpdated > timeOfStorage, "The storage item's lastUpdated should be updated to be greater than the old value");
	}, (error) => {
		ok(false, "reject should not be called");
	}).then(() => {
		done();
	});
});

test("getFreshValue with a forced remote call should set the timestamped value in storage when it is retrieved from the remote", (assert: QUnitAssert) => {
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

	cachedHttp.getFreshValue(key, getRemoteValue, 0).then((timeStampedData) => {
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

test("getFreshValue with a forced remote call should not set anything in storage if the remote function rejected", (assert: QUnitAssert) => {
	let done = assert.async();

	let cachedHttp = new CachedHttp(mockStorage);

	let key = "k";
	let expectedError = { err: "err" };
	let getRemoteValue = () => {
		return Promise.reject(expectedError);
	};

	cachedHttp.getFreshValue(key, getRemoteValue, 0).then((timeStampedData) => {
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

test("When getFreshValue is called with an undefined key, an Error should be thrown", () => {
	let cachedHttp = new CachedHttp(mockStorage);

	let getRemoteValue = () => {
		return Promise.reject({});
	};

	throws(() => {
		cachedHttp.getFreshValue(undefined, getRemoteValue, 100);
	}, Error("key must be a non-empty string, but was: undefined"));
});

test("When getFreshValue is called with an empty key, an Error should be thrown", () => {
	let cachedHttp = new CachedHttp(mockStorage);

	let getRemoteValue = () => {
		return Promise.reject({});
	};

	throws(() => {
		cachedHttp.getFreshValue("", getRemoteValue, 100);
	}, Error("key must be a non-empty string, but was: "));
});

test("When getFreshValue is called with an getRemoteValue key, an Error should be thrown", () => {
	let cachedHttp = new CachedHttp(mockStorage);

	throws(() => {
		cachedHttp.getFreshValue("k", undefined, 100);
	}, Error("getRemoteValue must be non-undefined"));
});
