import {MockPdfDocument, MockPdfValues} from "../contentCapture/mockPdfDocument";

import {OneNoteSaveablePdf} from "../../scripts/saveToOneNote/oneNoteSaveablePdf";

import {TestModule} from "../testModule";

export class OneNoteSaveablePdfTests extends TestModule {
	protected module() {
		return "oneNoteSaveablePdf";
	}

	protected tests() {
		test("When getting the page object, it should be the same object as the page passed into the ctor", (assert: QUnitAssert) => {
			let done = assert.async();

			let expectedPage = new OneNoteApi.OneNotePage();
			let saveable = new OneNoteSaveablePdf(expectedPage, new MockPdfDocument(), [0]);

			saveable.getPage().then((page) => {
				strictEqual(expectedPage, page);
				done();
			});
		});
	}
}

// TODO: extend MockPdfDocument to allow the dev to create pdf documents of arbitrary page length

(new OneNoteSaveablePdfTests()).runTests();
