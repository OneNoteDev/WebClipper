import {ExtensionBase} from "../../scripts/extensions/extensionBase";

import {Version} from "../../scripts/versioning/version";

import {TestModule} from "../testModule";

export class ExtensionBaseTests extends TestModule {
	protected module() {
		return "extensionBase";
	}

	protected tests() {
		test("shouldCheckForMajorUpdates should return true if the last seen version is less than the current version", () => {
			ok(ExtensionBase.shouldCheckForMajorUpdates(new Version("3.0.9"), new Version("3.1.0")));
		});

		test("shouldCheckForMajorUpdates should return false if the last seen version is greater than the current version", () => {
			ok(!ExtensionBase.shouldCheckForMajorUpdates(new Version("3.1.1"), new Version("3.1.0")));
		});

		test("shouldCheckForMajorUpdates should return false if the last seen version is equal to the current version", () => {
			ok(!ExtensionBase.shouldCheckForMajorUpdates(new Version("4.1.10"), new Version("4.1.10")));
		});

		test("shouldCheckForMajorUpdates should return false if the current version is undefined", () => {
			ok(!ExtensionBase.shouldCheckForMajorUpdates(new Version("4.1.10"), undefined));
		});

		test("shouldCheckForMajorUpdates should return true if the last seen version is undefined", () => {
			ok(ExtensionBase.shouldCheckForMajorUpdates(undefined, new Version("4.1.10")));
		});

		test("shouldCheckForMajorUpdates should return false if both parameters are undefined", () => {
			ok(!ExtensionBase.shouldCheckForMajorUpdates(undefined, undefined));
		});
	}
}

(new ExtensionBaseTests()).runTests();
