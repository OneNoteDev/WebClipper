import {ResponsePackage} from "../../scripts/responsePackage";

import {StorageBase, TimeStampedData} from "../../scripts/extensions/storageBase";

import {StubSessionLogger} from "../../scripts/logging/stubSessionLogger";

export class MockStorageBase extends StorageBase {
	public static existingKey = "exist";
	public static nonLocalData = { myKey: "nonLocal" };
	public static localData = { myKey: "local" };
	public static fetchNonLocalData: () => Promise<ResponsePackage<string>> = () => {
		return new Promise<ResponsePackage<string>>((resolve, reject) => {
			resolve({ parsedResponse: JSON.stringify(MockStorageBase.nonLocalData), request: undefined });
		});
	};

	private storedValues: { [key: string]: string } = { };

	constructor() {
		super(new StubSessionLogger());
		// We set lastUpdated this way so that our tests are consistent
		let existingValue: TimeStampedData = { data: MockStorageBase.localData, lastUpdated: Date.now() - 1 };
		this.setValue(MockStorageBase.existingKey, JSON.stringify(existingValue));
	}

	public getValue(key: string): string {
		return this.storedValues[key];
	}

	public setValue(key: string, value: string): void {
		this.storedValues[key] = value;
	}
}
