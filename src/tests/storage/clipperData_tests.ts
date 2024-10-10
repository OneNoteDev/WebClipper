import {TimeStampedData} from "../../scripts/http/cachedHttp";

import {ClipperData} from "../../scripts/storage/clipperData";
import {ClipperStorageKeys} from "../../scripts/storage/clipperStorageKeys";

import {TestModule} from "../testModule";

import {MockStorage} from "./mockStorage";

export class ClipperDataTests extends TestModule {
	private mockStorage: MockStorage;

	protected module() {
		return "clipperData";
	}

	protected beforeEach() {
		this.mockStorage = new MockStorage();
	}

	protected tests() {
		test("getFreshValue should not store anything if it's retrieving notebooks and no userInformation is in storage", (assert: QUnitAssert) => {
			let done = assert.async();

			let key = ClipperStorageKeys.cachedNotebooks;
			let parsedResponse = {};
			let expectedTimeStampedData = {
				parsedResponse: JSON.stringify(parsedResponse),
				response: undefined
			};
			let getRemoteValue = () => {
				return Promise.resolve(expectedTimeStampedData);
			};

			let clipperData = new ClipperData(this.mockStorage);
			clipperData.getFreshValue(key, getRemoteValue, 0).then((timeStampedData) => {
				strictEqual(this.mockStorage.getValue(key), undefined,
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
				response: undefined
			};
			let getRemoteValue = () => {
				return Promise.resolve(expectedTimeStampedData);
			};

			this.mockStorage.setValue(ClipperStorageKeys.userInformation, "{ name: Leeeeeroy }");

			let clipperData = new ClipperData(this.mockStorage);
			clipperData.getFreshValue(key, getRemoteValue, 0).then((timeStampedData) => {
				let actualStored: TimeStampedData = JSON.parse(this.mockStorage.getValue(key));
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
				response: undefined
			});

			let clipperData = new ClipperData(this.mockStorage);
			clipperData.setValue(key, expectedTimeStampedData);
			strictEqual(this.mockStorage.getValue(key), undefined,
				"Notebooks should not be stored if userInformation does not exist in storage");
		});

		test("getFreshValue should store notebooks if it's setting notebooks and userInformation is in storage", () => {
			let key = ClipperStorageKeys.cachedNotebooks;
			let expectedTimeStampedData = JSON.stringify({
				parsedResponse: "{ notebooks: {} }",
				response: undefined
			});

			this.mockStorage.setValue(ClipperStorageKeys.userInformation, "{ name: Leeeeeroy }");

			let clipperData = new ClipperData(this.mockStorage);
			clipperData.setValue(key, expectedTimeStampedData);
			strictEqual(this.mockStorage.getValue(key), expectedTimeStampedData,
				"Notebooks should be stored if userInformation exists in storage");
		});

		test("getFreshValue should not store anything if it's setting current section and no userInformation is in storage", () => {
			let key = ClipperStorageKeys.currentSelectedSection;
			let expectedTimeStampedData = JSON.stringify({
				parsedResponse: "{ section: {} }",
				response: undefined
			});

			let clipperData = new ClipperData(this.mockStorage);
			clipperData.setValue(key, expectedTimeStampedData);
			strictEqual(this.mockStorage.getValue(key), undefined,
				"Current section should not be stored if userInformation does not exist in storage");
		});

		test("getFreshValue should store notebooks if it's setting current section and userInformation is in storage", () => {
			let key = ClipperStorageKeys.currentSelectedSection;
			let expectedTimeStampedData = JSON.stringify({
				parsedResponse: "{ section: {} }",
				response: undefined
			});

			this.mockStorage.setValue(ClipperStorageKeys.userInformation, "{ name: Leeeeeroy }");

			let clipperData = new ClipperData(this.mockStorage);
			clipperData.setValue(key, expectedTimeStampedData);
			strictEqual(this.mockStorage.getValue(key), expectedTimeStampedData,
				"Current section should be stored if userInformation exists in storage");
		});
	}
}

(new ClipperDataTests()).runTests();
