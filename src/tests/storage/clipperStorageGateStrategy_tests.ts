import {ClipperStorageGateStrategy} from "../../scripts/storage/clipperStorageGateStrategy";
import {ClipperStorageKeys} from "../../scripts/storage/clipperStorageKeys";
import {StorageGateStrategy} from "../../scripts/storage/storageGateStrategy";

import {TestModule} from "../testModule";

import {MockStorage} from "./mockStorage";

export class ClipperStorageGateStrategyTests extends TestModule {
	private mockStorage: MockStorage;
	private strategy: StorageGateStrategy;

	protected module() {
		return "clipperStorageGateStrategy";
	}

	protected beforeEach() {
		this.mockStorage = new MockStorage();
		this.strategy = new ClipperStorageGateStrategy(this.mockStorage);
	}

	protected tests() {
		test("shouldSet to return true if notebooks is to be set and userInformation exists in storage", () => {
			this.mockStorage.setValue(ClipperStorageKeys.userInformation, "{}");

			ok(this.strategy.shouldSet(ClipperStorageKeys.cachedNotebooks, "{}"),
				"Setting of cached notebooks should be allowed if userInformation exists");
		});

		test("shouldSet to return false if notebooks is to be set and userInformation does not exist in storage", () => {
			ok(!this.strategy.shouldSet(ClipperStorageKeys.cachedNotebooks, "{}"),
				"Setting of cached notebooks should not be allowed if userInformation does not exist");
		});

		test("shouldSet to return true if undefined or empty string notebooks is to be set and userInformation does not exist in storage", () => {
			ok(this.strategy.shouldSet(ClipperStorageKeys.cachedNotebooks, undefined),
				"Setting of cached notebooks should not be allowed if value is undefined");
				ok(this.strategy.shouldSet(ClipperStorageKeys.cachedNotebooks, ""),
				"Setting of cached notebooks should not be allowed if value is empty string");
		});

		test("shouldSet to return true if current section is to be set and userInformation exists in storage", () => {
			this.mockStorage.setValue(ClipperStorageKeys.userInformation, "{}");

			ok(this.strategy.shouldSet(ClipperStorageKeys.currentSelectedSection, "{}"),
				"Setting of cached current section should be allowed if userInformation does not exist");
		});

		test("shouldSet to return false if current section is to be set and userInformation does not exist in storage", () => {
			ok(!this.strategy.shouldSet(ClipperStorageKeys.currentSelectedSection, "{}"),
				"Setting of cached current section should not be allowed if userInformation does not exist");
		});

		test("shouldSet to return true if undefined or empty string current section is to be set and userInformation does not exist in storage", () => {
			ok(this.strategy.shouldSet(ClipperStorageKeys.cachedNotebooks, undefined),
				"Setting of cached current section should be allowed if value is undefined");
			ok(this.strategy.shouldSet(ClipperStorageKeys.cachedNotebooks, ""),
				"Setting of cached current section should be allowed if value is empty string");
		});

		test("shouldSet to return true for non-personal-items even if userInformation does not exist", () => {
			ok(this.strategy.shouldSet(ClipperStorageKeys.locStrings, "{}"),
				"Setting of non-personal information should always be allowed");
		});
	}
}

(new ClipperStorageGateStrategyTests()).runTests();
