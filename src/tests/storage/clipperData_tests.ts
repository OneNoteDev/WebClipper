import {TimeStampedData} from "../../scripts/http/cachedHttp";

import {ClipperData} from "../../scripts/storage/clipperData";
import {ClipperStorageKeys} from "../../scripts/storage/clipperStorageKeys";

import {MockStorage} from "./mockStorage";

let mockStorage: MockStorage;

QUnit.module("clipperData", {
	beforeEach: () => {
		mockStorage = new MockStorage();
	}
});

test("getFreshValue should not store anything if it's retrieving notebooks and no userInformation is in storage", (assert: QUnitAssert) => {
	let done = assert.async();

	let key = ClipperStorageKeys.cachedNotebooks;
	let parsedResponse = {};
	let expectedTimeStampedData = {
		parsedResponse: JSON.stringify(parsedResponse),
		request: undefined
	};
	let getRemoteValue = () => {
		return Promise.resolve(expectedTimeStampedData);
	};

	let clipperData = new ClipperData(mockStorage);
	clipperData.getFreshValue(key, getRemoteValue, 0).then((timeStampedData) => {
		strictEqual(mockStorage.getValue(key), undefined,
			"Notebooks should not be cached if userInformation does not exist in storage");
	}, (error) => {
		ok(false, "reject should not be called");
	}).then(() => {
		done();
	});
});

test("getFreshValue should store notebooks if it's retrieving notebooks and userInformation is in storage", (assert: QUnitAssert) => {
	let done = assert.async();

	let key = ClipperStorageKeys.cachedNotebooks;
	let parsedResponse = {};
	let expectedTimeStampedData = {
		parsedResponse: JSON.stringify(parsedResponse),
		request: undefined
	};
	let getRemoteValue = () => {
		return Promise.resolve(expectedTimeStampedData);
	};

	mockStorage.setValue(ClipperStorageKeys.userInformation, "{ name: Leeeeeroy }");

	let clipperData = new ClipperData(mockStorage);
	clipperData.getFreshValue(key, getRemoteValue, 0).then((timeStampedData) => {
		let actualStored: TimeStampedData = JSON.parse(mockStorage.getValue(key));
		deepEqual(actualStored.data, {},
			"Notebooks should be cached if userInformation exists in storage");
	}, (error) => {
		ok(false, "reject should not be called");
	}).then(() => {
		done();
	});
});

test("getFreshValue should not store anything if it's setting notebooks and no userInformation is in storage", () => {
	let key = ClipperStorageKeys.cachedNotebooks;
	let expectedTimeStampedData = JSON.stringify({
		parsedResponse: "{ notebooks: {} }",
		request: undefined
	});

	let clipperData = new ClipperData(mockStorage);
	clipperData.setValue(key, expectedTimeStampedData);
	strictEqual(mockStorage.getValue(key), undefined,
		"Notebooks should not be stored if userInformation does not exist in storage");
});

test("getFreshValue should store notebooks if it's setting notebooks and userInformation is in storage", () => {
	let key = ClipperStorageKeys.cachedNotebooks;
	let expectedTimeStampedData = JSON.stringify({
		parsedResponse: "{ notebooks: {} }",
		request: undefined
	});

	mockStorage.setValue(ClipperStorageKeys.userInformation, "{ name: Leeeeeroy }");

	let clipperData = new ClipperData(mockStorage);
	clipperData.setValue(key, expectedTimeStampedData);
	strictEqual(mockStorage.getValue(key), expectedTimeStampedData,
		"Notebooks should be stored if userInformation exists in storage");
});

test("getFreshValue should not store anything if it's setting current section and no userInformation is in storage", () => {
	let key = ClipperStorageKeys.currentSelectedSection;
	let expectedTimeStampedData = JSON.stringify({
		parsedResponse: "{ section: {} }",
		request: undefined
	});

	let clipperData = new ClipperData(mockStorage);
	clipperData.setValue(key, expectedTimeStampedData);
	strictEqual(mockStorage.getValue(key), undefined,
		"Current section should not be stored if userInformation does not exist in storage");
});

test("getFreshValue should store notebooks if it's setting current section and userInformation is in storage", () => {
	let key = ClipperStorageKeys.currentSelectedSection;
	let expectedTimeStampedData = JSON.stringify({
		parsedResponse: "{ section: {} }",
		request: undefined
	});

	mockStorage.setValue(ClipperStorageKeys.userInformation, "{ name: Leeeeeroy }");

	let clipperData = new ClipperData(mockStorage);
	clipperData.setValue(key, expectedTimeStampedData);
	strictEqual(mockStorage.getValue(key), expectedTimeStampedData,
		"Current section should be stored if userInformation exists in storage");
});
