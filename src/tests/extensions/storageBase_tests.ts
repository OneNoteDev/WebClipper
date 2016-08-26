/// <reference path="../../../typings/main/ambient/qunit/qunit.d.ts" />

import {ResponsePackage} from "../../scripts/responsePackage";

import {StorageBase, TimeStampedData} from "../../scripts/extensions/storageBase";

import * as Log from "../../scripts/logging/log";

import {MockLogger} from "../logging/mockLogger";

import {MockStorageBase} from "./mockStorageBase";

QUnit.module("storageBase", {});

test("getFreshValue should fetch and save non local data if the update interval is set to 0", (assert: QUnitAssert) => {
	let done = assert.async();
	let mock: StorageBase = new MockStorageBase();

	let storedValue = mock.getValue(MockStorageBase.existingKey);
	let storedValueAsJson = JSON.parse(storedValue);

	mock.getFreshValue(MockStorageBase.existingKey, MockStorageBase.fetchNonLocalData, 0).then((response) => {
		deepEqual(response.data, MockStorageBase.nonLocalData);
		let value = mock.getValue(MockStorageBase.existingKey);
		let valueAsJson = JSON.parse(value);
		deepEqual(valueAsJson.data, MockStorageBase.nonLocalData);
		ok(valueAsJson.lastUpdated > storedValueAsJson.lastUpdated);
		done();
	});
});

test("getFreshValue should fetch local data if the update interval is set to a value that is larger than Date.now() "
	+ "and the data's lastUpdated value. It should also not save over the data in storage.", (assert: QUnitAssert) => {
	let done = assert.async();
	let mock: StorageBase = new MockStorageBase();
	let storedValue = mock.getValue(MockStorageBase.existingKey);

	mock.getFreshValue(MockStorageBase.existingKey, MockStorageBase.fetchNonLocalData, 9999999999999999).then((response) => {
		deepEqual(response.data, MockStorageBase.localData);
		let value = mock.getValue(MockStorageBase.existingKey);
		strictEqual(value, storedValue);
		done();
	});
});

test("getFreshValue should fetch and save non local data if the data cannot be found in local storage", (assert: QUnitAssert) => {
	let done = assert.async();
	let mock: StorageBase = new MockStorageBase();

	mock.getFreshValue("notExist", MockStorageBase.fetchNonLocalData, 9999999999999999).then((response) => {
		deepEqual(response.data, MockStorageBase.nonLocalData);
		let value = mock.getValue("notExist");
		let valueAsJson = JSON.parse(value);
		deepEqual(valueAsJson.data, MockStorageBase.nonLocalData);
		done();
	});
});

test("getFreshValue should return undefined when key is an empty string", (assert: QUnitAssert) => {
	let done = assert.async();
	let mock: StorageBase = new MockStorageBase();

	mock.getFreshValue("", MockStorageBase.fetchNonLocalData, 500).then((response) => {
		strictEqual(response, undefined);
		done();
	});
});

test("getFreshValue should return undefined when key is null", (assert: QUnitAssert) => {
	/* tslint:disable:no-null-keyword */
	let done = assert.async();
	let mock: StorageBase = new MockStorageBase();

	mock.getFreshValue(null, MockStorageBase.fetchNonLocalData, 500).then((response) => {
		strictEqual(response, undefined);
		done();
	});
	/* tslint:enable:no-null-keyword */
});

test("getFreshValue should return undefined when key is undefined", (assert: QUnitAssert) => {
	let done = assert.async();
	let mock: StorageBase = new MockStorageBase();

	mock.getFreshValue(undefined, MockStorageBase.fetchNonLocalData, 500).then((response) => {
		strictEqual(response, undefined);
		done();
	});
});

test("getFreshValue should return undefined when fresh value fetcher function is null and updateInterval is set to 0", (assert: QUnitAssert) => {
	/* tslint:disable:no-null-keyword */
	let done = assert.async();
	let mock: StorageBase = new MockStorageBase();

	mock.getFreshValue(MockStorageBase.existingKey, null, 0).then((response) => {
		strictEqual(response, undefined);
		done();
	});
	/* tslint:enable:no-null-keyword */
});

test("getFreshValue should return the stored value when fresh value fetcher function is null and updateInterval is set to a large number", (assert: QUnitAssert) => {
	/* tslint:disable:no-null-keyword */
	let done = assert.async();
	let mock: StorageBase = new MockStorageBase();
	let storedValue = mock.getValue(MockStorageBase.existingKey);

	mock.getFreshValue(MockStorageBase.existingKey, null, 9999999999999999).then((response) => {
		deepEqual(response.data, MockStorageBase.localData);
		let value = mock.getValue(MockStorageBase.existingKey);
		strictEqual(value, storedValue);
		done();
	});
	/* tslint:enable:no-null-keyword */
});

test("getFreshValue should return undefined when fresh value fetcher function is undefined and updateInterval is set to 0", (assert: QUnitAssert) => {
	let done = assert.async();
	let mock: StorageBase = new MockStorageBase();

	mock.getFreshValue(MockStorageBase.existingKey, undefined, 0).then((response) => {
		strictEqual(response, undefined);
		done();
	});
});

test("getFreshValue should return the stored value when fresh value fetcher function is undefined and updateInterval is set to a large number", (assert: QUnitAssert) => {
	let done = assert.async();
	let mock: StorageBase = new MockStorageBase();
	let storedValue = mock.getValue(MockStorageBase.existingKey);

	mock.getFreshValue(MockStorageBase.existingKey, undefined, 9999999999999999).then((response) => {
		deepEqual(response.data, MockStorageBase.localData);
		let value = mock.getValue(MockStorageBase.existingKey);
		strictEqual(value, storedValue);
		done();
	});
});

test("getFreshValue should call fetchNonLocalData when update interval is set to < 0", (assert: QUnitAssert) => {
	let done = assert.async();
	let mock: StorageBase = new MockStorageBase();
	let storedValue = mock.getValue(MockStorageBase.existingKey);
	let storedValueAsJson = JSON.parse(storedValue);

	mock.getFreshValue(MockStorageBase.existingKey, MockStorageBase.fetchNonLocalData, -1).then((response) => {
		deepEqual(response.data, MockStorageBase.nonLocalData);
		let value = mock.getValue(MockStorageBase.existingKey);
		let valueAsJson = JSON.parse(value);
		deepEqual(valueAsJson.data, MockStorageBase.nonLocalData);
		ok(valueAsJson.lastUpdated > storedValueAsJson.lastUpdated);
		done();
	});
});

test("downloadNewData should throw an error when url is an empty string", () => {
	throws(() => {
		let mock: StorageBase = new MockStorageBase();
		mock.httpGet("", []);
	}, Error("url must be a non-empty string, but was: "));
});

test("downloadNewData should throw an error when url is null", () => {
	/* tslint:disable:no-null-keyword */
	throws(() => {
		let mock: StorageBase = new MockStorageBase();
		mock.httpGet(null, []);
	}, Error("url must be a non-empty string, but was: null"));
	/* tslint:enable:no-null-keyword */
});

test("downloadNewData should throw an error when url is undefined", () => {
	throws(() => {
		let mock: StorageBase = new MockStorageBase();
		mock.httpGet(undefined, []);
	}, Error("url must be a non-empty string, but was: undefined"));
});

test("setTimeStampedValue should return undefined when key is an empty string", () => {
	let mock: StorageBase = new MockStorageBase();
	strictEqual(mock.setTimeStampedValue("", "value"), undefined);
});

test("setTimeStampedValue should return undefined when key is null", () => {
	/* tslint:disable:no-null-keyword */
	let mock: StorageBase = new MockStorageBase();
	strictEqual(mock.setTimeStampedValue(null, "value"), undefined);
	/* tslint:enable:no-null-keyword */
});

test("setTimeStampedValue should return undefined when key is undefined", () => {
	let mock: StorageBase = new MockStorageBase();
	strictEqual(mock.setTimeStampedValue(undefined, "value"), undefined);
});

test("setTimeStampedValue should returned the time stamped value in the general case", () => {
	let mock: StorageBase = new MockStorageBase();
	let actual = mock.setTimeStampedValue("key", "{}");
	deepEqual(actual.data, {},
		"Returned data should be the same data that was set");
	ok(typeof actual.lastUpdated === "number",
		"A number representing the date of storage should be set");
});

test("setTimeStampedValue should return undefined if the value is null/undefined/unjsonifiable", () => {
	/* tslint:disable:no-null-keyword */
	let mock: StorageBase = new MockStorageBase();
	strictEqual(mock.setTimeStampedValue("key", null), undefined,
		"Returned value should be undefined");
	strictEqual(mock.setTimeStampedValue("key", undefined), undefined,
		"Returned value should be undefined");
	strictEqual(mock.setTimeStampedValue("key", ""), undefined,
		"Returned value should be undefined");
	strictEqual(mock.setTimeStampedValue("key", "{{}"), undefined,
		"Returned value should be undefined");
	/* tslint:enable:no-null-keyword */
});

let stubLogger: MockLogger;

QUnit.module("storageBase-sinon", {
	beforeEach: () => {
		stubLogger = sinon.createStubInstance(MockLogger) as any;
	}
});

test("When getFreshValue is called with an undefined key, a failure should be logged", () => {
	let storageBase = new StorageBase(stubLogger);

	storageBase.getFreshValue(undefined, MockStorageBase.fetchNonLocalData);

	let logFailureSpy = stubLogger.logFailure as Sinon.SinonSpy;
	ok(logFailureSpy.calledOnce, "logFailure should be called");
	ok(logFailureSpy.calledWith(Log.Failure.Label.InvalidArgument, Log.Failure.Type.Unexpected),
		"logFailure should be called as an unexpected failure caused by an invalid argument");
});

test("When getFreshValue is called with an empty key, a failure should be logged", () => {
	let storageBase = new StorageBase(stubLogger);

	storageBase.getFreshValue("", MockStorageBase.fetchNonLocalData);

	let logFailureSpy = stubLogger.logFailure as Sinon.SinonSpy;
	ok(logFailureSpy.calledOnce, "logFailure should be called");
	ok(logFailureSpy.calledWith(Log.Failure.Label.InvalidArgument, Log.Failure.Type.Unexpected),
		"logFailure should be called as an unexpected failure caused by an invalid argument");
});

test("When getFreshValue is called with an undefined fetchNonLocalData parameter, a failure should be logged", () => {
	let storageBase = new StorageBase(stubLogger);

	storageBase.getFreshValue("k", undefined);

	let logFailureSpy = stubLogger.logFailure as Sinon.SinonSpy;
	ok(logFailureSpy.calledOnce, "logFailure should be called");
	ok(logFailureSpy.calledWith(Log.Failure.Label.InvalidArgument, Log.Failure.Type.Unexpected),
		"logFailure should be called as an unexpected failure caused by an invalid argument");
});

test("When getFreshValue is called with an updateInterval of less than 0, a failure should be logged", () => {
	let storageBase = new StorageBase(stubLogger);

	storageBase.getFreshValue("k", MockStorageBase.fetchNonLocalData, -1);

	let logFailureSpy = stubLogger.logFailure as Sinon.SinonSpy;
	ok(logFailureSpy.calledOnce, "logFailure should be called");
	ok(logFailureSpy.calledWith(Log.Failure.Label.InvalidArgument, Log.Failure.Type.Unexpected),
		"logFailure should be called as an unexpected failure caused by an invalid argument");
});

test("When httpGet is called with an undefined url, an Error should be thrown", () => {
	let mockStorageBase = new MockStorageBase();

	throws(() => {
		mockStorageBase.httpGet(undefined);
	}, Error("url must be a non-empty string, but was: undefined"));
});

test("When httpGet is called with an empty url, an Error should be thrown", () => {
	let mockStorageBase = new MockStorageBase();

	throws(() => {
		mockStorageBase.httpGet("");
	}, Error("url must be a non-empty string, but was: "));
});

test("When httpGet is called with an undefined url, a failure should be logged", () => {
	let storageBase = new StorageBase(stubLogger);

	try {
		storageBase.httpGet(undefined);
		ok(false, "An error should have been thrown");
	} catch (e) {
		let logFailureSpy = stubLogger.logFailure as Sinon.SinonSpy;
		ok(logFailureSpy.calledOnce, "logFailure should be called");
		ok(logFailureSpy.calledWith(Log.Failure.Label.InvalidArgument, Log.Failure.Type.Unexpected),
		"logFailure should be called as an unexpected failure caused by an invalid argument");
	}
});

test("When httpGet is called with an empty url, a failure should be logged", () => {
	let storageBase = new StorageBase(stubLogger);

	try {
		storageBase.httpGet("");
		ok(false, "An error should have been thrown");
	} catch (e) {
		let logFailureSpy = stubLogger.logFailure as Sinon.SinonSpy;
		ok(logFailureSpy.calledOnce, "logFailure should be called");
		ok(logFailureSpy.calledWith(Log.Failure.Label.InvalidArgument, Log.Failure.Type.Unexpected),
		"logFailure should be called as an unexpected failure caused by an invalid argument");
	}
});

test("When setTimeStampedValue is called with an undefined key, a failure should be logged", () => {
	let storageBase = new StorageBase(stubLogger);

	storageBase.setTimeStampedValue(undefined, "val");

	let logFailureSpy = stubLogger.logFailure as Sinon.SinonSpy;
	ok(logFailureSpy.calledOnce, "logFailure should be called");
	ok(logFailureSpy.calledWith(Log.Failure.Label.InvalidArgument, Log.Failure.Type.Unexpected),
		"logFailure should be called as an unexpected failure caused by an invalid argument");
});

test("When setTimeStampedValue is called with an empty key, a failure should be logged", () => {
	let storageBase = new StorageBase(stubLogger);

	storageBase.setTimeStampedValue("", "val");

	let logFailureSpy = stubLogger.logFailure as Sinon.SinonSpy;
	ok(logFailureSpy.calledOnce, "logFailure should be called");
	ok(logFailureSpy.calledWith(Log.Failure.Label.InvalidArgument, Log.Failure.Type.Unexpected),
		"logFailure should be called as an unexpected failure caused by an invalid argument");
});
