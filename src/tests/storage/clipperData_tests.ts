import {ClipperData} from "../../scripts/storage/clipperData";
import {ClipperStorageKeys} from "../../scripts/storage/clipperStorageKeys";

import {MockStorage} from "./mockStorage";

let mockStorage: MockStorage;

QUnit.module("clipperData", {
	beforeEach: () => {
		mockStorage = new MockStorage();
	}
});

test("getAndCacheFreshValue should not store anything if it's retrieving notebooks and no userInformation is in storage", (assert: QUnitAssert) => {
	let done = assert.async();

	let key = ClipperStorageKeys.cachedNotebooks;
	let getRemoteValue = () => {
		return Promise.resolve({
			parsedResponse: "{ notebooks: {} }",
			request: undefined
		});
	};

	let clipperData = new ClipperData(mockStorage);
	clipperData.getAndCacheFreshValue(key, getRemoteValue, 0).then((timeStampedData) => {
		strictEqual(mockStorage.getValue(key), undefined,
			"Notebooks should not be cached if userInformation does not exist in storage");
	}, (error) => {
		ok(false, "reject should not be called");
	}).then(() => {
		done();
	});
});

test("getAndCacheFreshValue should store notebooks if it's retrieving notebooks and userInformation is in storage", (assert: QUnitAssert) => {
	let done = assert.async();

	let key = ClipperStorageKeys.cachedNotebooks;
	let expectedTimeStampedData = {
		parsedResponse: "{ notebooks: {} }",
		request: undefined
	};
	let getRemoteValue = () => {
		return Promise.resolve(expectedTimeStampedData);
	};

	mockStorage.setValue(ClipperStorageKeys.userInformation, "{ name: Leeroy Jenkins }");

	let clipperData = new ClipperData(mockStorage);
	clipperData.getAndCacheFreshValue(key, getRemoteValue, 0).then((timeStampedData) => {
		strictEqual(mockStorage.getValue(key), JSON.stringify(expectedTimeStampedData),
			"Notebooks should be cached if userInformation exists in storage");
	}, (error) => {
		ok(false, "reject should not be called");
	}).then(() => {
		done();
	});
});

test("getAndCacheFreshValue should not store anything if it's setting notebooks and no userInformation is in storage", () => {
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

test("getAndCacheFreshValue should store notebooks if it's setting notebooks and userInformation is in storage", () => {
	let key = ClipperStorageKeys.cachedNotebooks;
	let expectedTimeStampedData = JSON.stringify({
		parsedResponse: "{ notebooks: {} }",
		request: undefined
	});

	mockStorage.setValue(ClipperStorageKeys.userInformation, "{ name: Leeroy Jenkins }");

	let clipperData = new ClipperData(mockStorage);
	clipperData.setValue(key, expectedTimeStampedData);
	strictEqual(mockStorage.getValue(key), expectedTimeStampedData,
		"Notebooks should be stored if userInformation exists in storage");
});

test("getAndCacheFreshValue should not store anything if it's setting current section and no userInformation is in storage", () => {
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

test("getAndCacheFreshValue should store notebooks if it's setting current section and userInformation is in storage", () => {
	let key = ClipperStorageKeys.currentSelectedSection;
	let expectedTimeStampedData = JSON.stringify({
		parsedResponse: "{ section: {} }",
		request: undefined
	});

	mockStorage.setValue(ClipperStorageKeys.userInformation, "{ name: Leeroy Jenkins }");

	let clipperData = new ClipperData(mockStorage);
	clipperData.setValue(key, expectedTimeStampedData);
	strictEqual(mockStorage.getValue(key), expectedTimeStampedData,
		"Current section should be stored if userInformation exists in storage");
});
