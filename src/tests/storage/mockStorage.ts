import {ResponsePackage} from "../../scripts/responsePackage";

import {Storage} from "../../scripts/storage/storage";

export class MockStorage implements Storage {
	public static existingKey = "exist";
	public static nonLocalData = { myKey: "nonLocal" };
	public static localData = { myKey: "local" };
	public static fetchNonLocalData: () => Promise<ResponsePackage<string>> = () => {
		return new Promise<ResponsePackage<string>>((resolve, reject) => {
			resolve({ parsedResponse: JSON.stringify(MockStorage.nonLocalData), response: undefined });
		});
	};

	private storedValues: { [key: string]: string } = { };

	constructor() {
		// We set lastUpdated this way so that our tests are consistent
		let existingValue = { data: MockStorage.localData, lastUpdated: Date.now() - 1 };
		this.setValue(MockStorage.existingKey, JSON.stringify(existingValue));
	}

	public getValue(key: string): Promise<string> {
		return Promise.resolve(this.storedValues[key]);
	}

	public getValues(keys: string[]): Promise<{}> {
		let values = {};
		for (let i = 0; i < keys.length; i++) {
			values[keys[i]] = this.storedValues[keys[i]];
		}
		return Promise.resolve(values);
	}

	public setValue(key: string, value: string): void {
		this.storedValues[key] = value;
	}

	public removeKey(key): boolean {
		this.storedValues[key] = undefined;
		return true;
	}
}
