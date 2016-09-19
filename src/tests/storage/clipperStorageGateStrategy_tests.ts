import {ClipperStorageGateStrategy} from "../../scripts/storage/clipperStorageGateStrategy";
import {ClipperStorageKeys} from "../../scripts/storage/clipperStorageKeys";
import {StorageGateStrategy} from "../../scripts/storage/storageGateStrategy";

import {MockStorage} from "./mockStorage";

let mockStorage: MockStorage;
let strategy: StorageGateStrategy;

QUnit.module("clipperStorageGateStrategy", {
	beforeEach: () => {
		mockStorage = new MockStorage();
		strategy = new ClipperStorageGateStrategy(mockStorage);
	}
});

test("shouldSet to return true if notebooks is to be set and userInformation exists in storage", () => {
	mockStorage.setValue(ClipperStorageKeys.userInformation, "{}");

	ok(strategy.shouldSet(ClipperStorageKeys.cachedNotebooks, "{}"),
		"Setting of cached notebooks should be allowed if userInformation exists");
});

test("shouldSet to return false if notebooks is to be set and userInformation does not exist in storage", () => {
	ok(!strategy.shouldSet(ClipperStorageKeys.cachedNotebooks, "{}"),
		"Setting of cached notebooks should not be allowed if userInformation does not exist");
});

test("shouldSet to return true if undefined or empty string notebooks is to be set and userInformation does not exist in storage", () => {
	ok(strategy.shouldSet(ClipperStorageKeys.cachedNotebooks, undefined),
		"Setting of cached notebooks should not be allowed if value is undefined");
		ok(strategy.shouldSet(ClipperStorageKeys.cachedNotebooks, ""),
		"Setting of cached notebooks should not be allowed if value is empty string");
});

test("shouldSet to return true if current section is to be set and userInformation exists in storage", () => {
	mockStorage.setValue(ClipperStorageKeys.userInformation, "{}");

	ok(strategy.shouldSet(ClipperStorageKeys.currentSelectedSection, "{}"),
		"Setting of cached current section should be allowed if userInformation does not exist");
});

test("shouldSet to return false if current section is to be set and userInformation does not exist in storage", () => {
	ok(!strategy.shouldSet(ClipperStorageKeys.currentSelectedSection, "{}"),
		"Setting of cached current section should not be allowed if userInformation does not exist");
});

test("shouldSet to return true if undefined or empty string current section is to be set and userInformation does not exist in storage", () => {
	ok(strategy.shouldSet(ClipperStorageKeys.cachedNotebooks, undefined),
		"Setting of cached current section should be allowed if value is undefined");
	ok(strategy.shouldSet(ClipperStorageKeys.cachedNotebooks, ""),
		"Setting of cached current section should be allowed if value is empty string");
});

test("shouldSet to return true for non-personal-items even if userInformation does not exist", () => {
	ok(strategy.shouldSet(ClipperStorageKeys.locStrings, "{}"),
		"Setting of non-personal information should always be allowed");
});
