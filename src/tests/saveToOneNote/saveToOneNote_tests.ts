import * as sinon from "sinon";

import {MockPdfDocument} from "../contentCapture/mockPdfDocument";

import {Constants} from "../../scripts/constants";

import {Clipper} from "../../scripts/clipperUI/frontEndGlobals";

import {StubSessionLogger} from "../../scripts/logging/stubSessionLogger";

import {SaveToOneNote} from "../../scripts/saveToOneNote/saveToOneNote";
import {OneNoteSaveablePage} from "../../scripts/saveToOneNote/oneNoteSaveablePage";
import {OneNoteSaveablePdf} from "../../scripts/saveToOneNote/oneNoteSaveablePdf";

import {ClipperStorageKeys} from "../../scripts/storage/clipperStorageKeys";

import {AsyncUtils} from "../asyncUtils";
import {TestModule} from "../testModule";

export class SaveToOneNoteTests extends TestModule {
	private server: Sinon.SinonFakeServer;
	private saveToOneNote: SaveToOneNote;

	protected module() {
		return "saveToOneNote";
	}

	protected beforeEach() {
		AsyncUtils.mockSetTimeout();
		this.server = sinon.fakeServer.create();
		this.server.respondImmediately = true;

		this.saveToOneNote = new SaveToOneNote("userToken");
	}

	protected afterEach() {
		AsyncUtils.restoreSetTimeout();
		this.server.restore();
	}

	protected tests() {
		test("When saving a 'just a page', save() should resolve with the parsed response and request in a responsePackage if the API call succeeds", (assert: QUnitAssert) => {
			let done = assert.async();

			let saveLocation = "sectionId";

			let responseJson = {
				key: "value"
			};
			this.server.respondWith(
				"POST", "https://www.onenote.com/api/v1.0/me/notes/sections/" + saveLocation + "/pages",
				[200, { "Content-Type": "application/json" },
				JSON.stringify(responseJson)
			]);

			this.saveToOneNote.save({ page: this.getMockSaveablePage(), saveLocation: saveLocation }).then((responsePackage) => {
				deepEqual(responsePackage.parsedResponse, responseJson, "The parsedResponse field should be the response in json form");
				ok(responsePackage.request, "The request field should be defined");
			}, (error) => {
				ok(false, "reject should not be called");
			}).then(() => {
				done();
			});
		});

		test("When saving a 'just a page', save() should resolve with the parsed response and request in a responsePackage if the API call succeeds and no saveLocation is specified", (assert: QUnitAssert) => {
			let done = assert.async();

			let responseJson = {
				key: "value"
			};
			this.server.respondWith(
				"POST", "https://www.onenote.com/api/v1.0/me/notes/pages",
				[200, { "Content-Type": "application/json" },
				JSON.stringify(responseJson)
			]);

			this.saveToOneNote.save({ page: this.getMockSaveablePage() }).then((responsePackage) => {
				deepEqual(responsePackage.parsedResponse, responseJson, "The parsedResponse field should be the response in json form");
				ok(responsePackage.request, "The request field should be defined");
			}, (error) => {
				ok(false, "reject should not be called");
			}).then(() => {
				done();
			});
		});

		test("When saving a 'just a page', but the this.server returns an unexpected response code, reject should be called with the error object", (assert: QUnitAssert) => {
			let done = assert.async();

			let responseJson = {
				key: "value"
			};
			this.server.respondWith(
				"POST", "https://www.onenote.com/api/v1.0/me/notes/pages",
				[404, { "Content-Type": "application/json" },
				JSON.stringify(responseJson)
			]);

			this.saveToOneNote.save({ page: this.getMockSaveablePage() }).then((responsePackage) => {
				ok(false, "resolve should not be called");
			}, (error) => {
				deepEqual(error,
					{ error: "Unexpected response status", statusCode: 404, responseHeaders: { "Content-Type": "application/json" }, response: JSON.stringify(responseJson), timeout: 30000 },
					"The error object should be returned in the reject");
			}).then(() => {
				done();
			});
		});

		// From this point, we now test cases where we hit multiple endpoints. For this to work, we need to declare the fakeServer
		// responses before the this.saveToOneNote call otherwise the fakeServer will respond with 404

		test("When saving a pdf, save() should resolve with the parsed response and request in a responsePackage assuming the patch permissions call succeeds", (assert: QUnitAssert) => {
			let done = assert.async();

			let saveLocation = "mySection";

			let pageId = "abc";
			let createPageJson = {
				id: pageId
			};

			// Request patch permissions
			this.server.respondWith(
				"GET", "https://www.onenote.com/api/v1.0/me/notes/sections/" + saveLocation + "/pages?top=1",
				[200, { "Content-Type": "application/json" },
				JSON.stringify({ getPages: "getPages" })
			]);

			// Create initial page
			this.server.respondWith(
				"POST", "https://www.onenote.com/api/v1.0/me/notes/sections/" + saveLocation + "/pages",
				[200, { "Content-Type": "application/json" },
				JSON.stringify(createPageJson)
			]);

			// Check that page exists before patching
			this.server.respondWith(
				"GET", "https://www.onenote.com/api/v1.0/me/notes/pages/" + pageId + "/content",
				[200, { "Content-Type": "application/json" },
				JSON.stringify({ getPage: "getPage" })
			]);

			// Patch to the page
			this.server.respondWith(
				"PATCH", "https://www.onenote.com/api/v1.0/me/notes/pages/" + pageId + "/content",
				[200, { "Content-Type": "application/json" },
				JSON.stringify({ updatePage: "updatePage" })
			]);

			this.saveToOneNote.save({ page: this.getMockSaveablePdf([0, 1]), saveLocation: saveLocation }).then((responsePackage) => {
				deepEqual(responsePackage.parsedResponse, createPageJson, "The parsedResponse field should be the create page response in json form");
				ok(responsePackage.request, "The request field should be defined");
			}, (error) => {
				ok(false, "reject should not be called");
			}).then(() => {
				done();
			});
		});

		test("When saving a pdf to the default location, save() should resolve with the parsed response and request in a responsePackage assuming the patch permissions call succeeds", (assert: QUnitAssert) => {
			let done = assert.async();

			let pageId = "abc";
			let createPageJson = {
				id: pageId
			};

			// Request patch permissions
			this.server.respondWith(
				"GET", "https://www.onenote.com/api/v1.0/me/notes/pages?top=1",
				[200, { "Content-Type": "application/json" },
				JSON.stringify({ getPages: "getPages" })
			]);

			// Create initial page
			this.server.respondWith(
				"POST", "https://www.onenote.com/api/v1.0/me/notes/pages",
				[200, { "Content-Type": "application/json" },
				JSON.stringify(createPageJson)
			]);

			// Check that page exists before patching
			this.server.respondWith(
				"GET", "https://www.onenote.com/api/v1.0/me/notes/pages/" + pageId + "/content",
				[200, { "Content-Type": "application/json" },
				JSON.stringify({ getPage: "getPage" })
			]);

			// Patch to the page
			this.server.respondWith(
				"PATCH", "https://www.onenote.com/api/v1.0/me/notes/pages/" + pageId + "/content",
				[200, { "Content-Type": "application/json" },
				JSON.stringify({ updatePage: "updatePage" })
			]);

			this.saveToOneNote.save({ page: this.getMockSaveablePdf([0, 1]) }).then((responsePackage) => {
				deepEqual(responsePackage.parsedResponse, createPageJson, "The parsedResponse field should be the create page response in json form");
				ok(responsePackage.request, "The request field should be defined");
			}, (error) => {
				ok(false, "reject should not be called");
			}).then(() => {
				done();
			});
		});

		test("When saving a pdf, save() should resolve with the parsed response and request in a responsePackage assuming the patch permission validity has been cached in localStorage", (assert: QUnitAssert) => {
			let done = assert.async();

			Clipper.storeValue(ClipperStorageKeys.hasPatchPermissions, "true");

			let pageId = "abc";
			let createPageJson = {
				id: pageId
			};

			// Create initial page
			this.server.respondWith(
				"POST", "https://www.onenote.com/api/v1.0/me/notes/pages",
				[200, { "Content-Type": "application/json" },
				JSON.stringify(createPageJson)
			]);

			// Check that page exists before patching
			this.server.respondWith(
				"GET", "https://www.onenote.com/api/v1.0/me/notes/pages/" + pageId + "/content",
				[200, { "Content-Type": "application/json" },
				JSON.stringify({ getPage: "getPage" })
			]);

			// Update page with pdf pages
			this.server.respondWith(
				"PATCH", "https://www.onenote.com/api/v1.0/me/notes/pages/" + pageId + "/content",
				[200, { "Content-Type": "application/json" },
				JSON.stringify({ updatePage: "updatePage" })
			]);

			this.saveToOneNote.save({ page: this.getMockSaveablePdf([0, 1]) }).then((responsePackage) => {
				deepEqual(responsePackage.parsedResponse, createPageJson, "The parsedResponse field should be the create page response in json form");
				ok(responsePackage.request, "The request field should be defined");
			}, (error) => {
				ok(false, "reject should not be called");
			}).then(() => {
				done();
			});
		});

		test("When saving a pdf and a PATCH permission check is needed, but that check returns an unexpected response code, reject should be called with the error object", (assert: QUnitAssert) => {
			let done = assert.async();

			let responseJson = {
				getPages: "getPages"
			};

			// Request patch permissions
			this.server.respondWith(
				"GET", "https://www.onenote.com/api/v1.0/me/notes/pages?top=1",
				[404, { "Content-Type": "application/json" },
				JSON.stringify(responseJson)
			]);

			this.saveToOneNote.save({ page: this.getMockSaveablePdf([0, 1]) }).then((responsePackage) => {
				ok(false, "resolve should not be called");
			}, (error) => {
				deepEqual(error,
					{ error: "Unexpected response status", statusCode: 404, responseHeaders: { "Content-Type": "application/json" }, response: JSON.stringify(responseJson), timeout: 30000 },
					"The error object should be returned in the reject");
			}).then(() => {
				done();
			});
		});

		test("When saving a pdf, if the page creation fails, reject should be called with the error object", (assert: QUnitAssert) => {
			let done = assert.async();

			Clipper.storeValue(ClipperStorageKeys.hasPatchPermissions, "true");

			let responseJson = {
				getPages: "getPages"
			};

			// Create initial page
			this.server.respondWith(
				"POST", "https://www.onenote.com/api/v1.0/me/notes/pages",
				[404, { "Content-Type": "application/json" },
				JSON.stringify(responseJson)
			]);

			this.saveToOneNote.save({ page: this.getMockSaveablePdf([0, 1]) }).then((responsePackage) => {
				ok(false, "resolve should not be called");
			}, (error) => {
				deepEqual(error,
					{ error: "Unexpected response status", statusCode: 404, responseHeaders: { "Content-Type": "application/json" }, response: JSON.stringify(responseJson), timeout: 30000 },
					"The error object should be returned in the reject");
			}).then(() => {
				done();
			});
		});

		test("When saving a pdf, if the check for page existance fails, reject should be called with the error object", (assert: QUnitAssert) => {
			let done = assert.async();

			Clipper.storeValue(ClipperStorageKeys.hasPatchPermissions, "true");

			let pageId = "abc";
			let createPageJson = {
				id: pageId
			};

			let responseJson = {
				getPages: "getPages"
			};

			// Create initial page
			this.server.respondWith(
				"POST", "https://www.onenote.com/api/v1.0/me/notes/pages",
				[200, { "Content-Type": "application/json" },
				JSON.stringify(createPageJson)
			]);

			// Check that page exists before patching
			this.server.respondWith(
				"GET", "https://www.onenote.com/api/v1.0/me/notes/pages/" + pageId + "/content",
				[404, { "Content-Type": "application/json" },
				JSON.stringify(responseJson)
			]);

			this.saveToOneNote.save({ page: this.getMockSaveablePdf([0, 1]) }).then((responsePackage) => {
				ok(false, "resolve should not be called");
			}, (error) => {
				deepEqual(error,
					{ error: "Unexpected response status", statusCode: 404, responseHeaders: { "Content-Type": "application/json" }, response: JSON.stringify(responseJson), timeout: 30000 },
					"The error object should be returned in the reject");
			}).then(() => {
				done();
			});
		});

		test("When saving a pdf, if the PATCH call fails, reject should be called with the error object", (assert: QUnitAssert) => {
			let done = assert.async();

			Clipper.storeValue(ClipperStorageKeys.hasPatchPermissions, "true");

			let pageId = "abc";
			let createPageJson = {
				id: pageId
			};

			let responseJson = {
				getPages: "getPages"
			};

			// Create initial page
			this.server.respondWith(
				"POST", "https://www.onenote.com/api/v1.0/me/notes/pages",
				[200, { "Content-Type": "application/json" },
				JSON.stringify(createPageJson)
			]);

			// Check that page exists before patching
			this.server.respondWith(
				"GET", "https://www.onenote.com/api/v1.0/me/notes/pages/" + pageId + "/content",
				[200, { "Content-Type": "application/json" },
				JSON.stringify({ getPage: "getPage" })
			]);

			// Update page with pdf pages
			this.server.respondWith(
				"PATCH", "https://www.onenote.com/api/v1.0/me/notes/pages/" + pageId + "/content",
				[404, { "Content-Type": "application/json" },
				JSON.stringify(responseJson)
			]);

			this.saveToOneNote.save({ page: this.getMockSaveablePdf([0, 1]) }).then((responsePackage) => {
				ok(false, "resolve should not be called");
			}, (error) => {
				deepEqual(error,
					{ error: "Unexpected response status", statusCode: 404, responseHeaders: { "Content-Type": "application/json" }, response: JSON.stringify(responseJson), timeout: 30000 },
					"The error object should be returned in the reject");
			}).then(() => {
				done();
			});
		});

		test("When saving a pdf and a save location is specified, if the PATCH call fails, reject should be called with the error object", (assert: QUnitAssert) => {
			let done = assert.async();

			Clipper.storeValue(ClipperStorageKeys.hasPatchPermissions, "true");

			let saveLocation = "sectionId";

			let pageId = "abc";
			let createPageJson = {
				id: pageId
			};

			let responseJson = {
				getPages: "getPages"
			};

			// Create initial page
			this.server.respondWith(
				"POST", "https://www.onenote.com/api/v1.0/me/notes/sections/" + saveLocation + "/pages",
				[200, { "Content-Type": "application/json" },
				JSON.stringify(createPageJson)
			]);

			// Check that page exists before patching
			this.server.respondWith(
				"GET", "https://www.onenote.com/api/v1.0/me/notes/pages/" + pageId + "/content",
				[200, { "Content-Type": "application/json" },
				JSON.stringify({ getPage: "getPage" })
			]);

			// Update page with pdf pages
			this.server.respondWith(
				"PATCH", "https://www.onenote.com/api/v1.0/me/notes/pages/" + pageId + "/content",
				[404, { "Content-Type": "application/json" },
				JSON.stringify(responseJson)
			]);

			this.saveToOneNote.save({ page: this.getMockSaveablePdf([0, 1]), saveLocation: saveLocation }).then((responsePackage) => {
				ok(false, "resolve should not be called");
			}, (error) => {
				deepEqual(error,
					{ error: "Unexpected response status", statusCode: 404, responseHeaders: { "Content-Type": "application/json" }, response: JSON.stringify(responseJson), timeout: 30000 },
					"The error object should be returned in the reject");
			}).then(() => {
				done();
			});
		});
	}

	private getMockSaveablePage(): OneNoteSaveablePage {
		let page = new OneNoteApi.OneNotePage();
		return new OneNoteSaveablePage(page);
	}

	private getMockSaveablePdf(pageIndexes?: number[]): OneNoteSaveablePdf {
		let page = new OneNoteApi.OneNotePage();
		let mockPdf = new MockPdfDocument();
		return new OneNoteSaveablePdf(page, mockPdf, pageIndexes);
	}
}

(new SaveToOneNoteTests()).runTests();
