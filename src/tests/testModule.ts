import {Settings} from "../scripts/settings";

import {Clipper} from "../scripts/clipperUI/frontEndGlobals";

import {Localization} from "../scripts/localization/localization";

export abstract class TestModule {
	protected abstract module(): string;
	protected abstract tests(): void;

	public runTests(): void {
		let beforeEach = this.beforeEach.bind(this);
		let resetFrontEndStorage = this.resetFrontEndStorage.bind(this);

		let afterEach = this.afterEach.bind(this);

		// We call the implemented beforeEach/afterEach after the common functionality
		// as it's a higher priority, and we don't want to override it
		QUnit.module(this.module(), {
			beforeEach: () => {
				resetFrontEndStorage();
				beforeEach();
			},
			afterEach: () => {
				// Unfortunately, we have some code that makes use of static, which
				// means that we might end up polluting other test modules if we don't
				// reset things. We declare these here so the developer doesn't have
				// to remember to do this in their modules.
				Settings.setSettingsJsonForTesting(undefined);
				Localization.setLocalizedStrings(undefined);

				afterEach();
			}
		});

		this.tests();
	}

	// Overridable
	protected beforeEach() { }
	protected afterEach() { }

	private resetFrontEndStorage() {
		let mockStorageRef = {};
		let mockStorageCacheRef = {};

		Clipper.getStoredValue = (key: string, callback: (value: string) => void, cacheValue?: boolean) => {
			if (cacheValue) {
				mockStorageCacheRef[key] = mockStorageRef[key];
			}
			callback(mockStorageRef[key]);
		};
		Clipper.storeValue = (key: string, value: string) => {
			if (key in mockStorageCacheRef) {
				mockStorageCacheRef[key] = value;
			}
			mockStorageRef[key] = value;
		};
		Clipper.preCacheStoredValues = (storageKeys: string[]) => {
			for (let key of storageKeys) {
				Clipper.getStoredValue(key, () => { }, true);
			}
		};
		Clipper.getCachedValue = (key: string) => {
			return mockStorageCacheRef[key];
		};
	}
}
