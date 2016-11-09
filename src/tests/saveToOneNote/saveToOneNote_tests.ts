import * as sinon from "sinon";

import {MockPdfDocument} from "../contentCapture/mockPdfDocument";

import {SaveToOneNote} from "../../scripts/saveToOneNote/saveToOneNote";
import {OneNoteSaveablePage} from "../../scripts/saveToOneNote/oneNoteSaveablePage";
import {OneNoteSaveablePdf} from "../../scripts/saveToOneNote/oneNoteSaveablePdf";

function getMockSaveablePage(): OneNoteSaveablePage {
	let page = new OneNoteApi.OneNotePage();
	return new OneNoteSaveablePage(page);
}

function getMockSaveablePdf(pageIndexes?: number[]): OneNoteSaveablePdf {
	let page = new OneNoteApi.OneNotePage();
	let mockPdf = new MockPdfDocument();
	return new OneNoteSaveablePdf(page, mockPdf, pageIndexes);
}

let xhr: Sinon.SinonFakeXMLHttpRequest;
let server: Sinon.SinonFakeServer;
let saveToOneNote: SaveToOneNote;

QUnit.module("saveToOneNote-sinon", {
	beforeEach: () => {
		xhr = sinon.useFakeXMLHttpRequest();
		server = sinon.fakeServer.create();
		server.respondImmediately = true;
		saveToOneNote = new SaveToOneNote("userToken");
	},
	afterEach: () => {
		xhr.restore();
		server.restore();
	}
});

test("hello world", (assert: QUnitAssert) => {
	let done = assert.async();
	ok(true);
	done();
});

// Some saveToOneNote save() calls make multiple, different calls to the API
QUnit.module("saveToOneNote-sinon-multiResponse", {
	beforeEach: () => {
		xhr = sinon.useFakeXMLHttpRequest();
		server = sinon.fakeServer.create();
	},
	afterEach: () => {
		xhr.restore();
		server.restore();
	}
});
