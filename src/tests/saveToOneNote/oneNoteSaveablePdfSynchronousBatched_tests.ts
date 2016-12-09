import {MockPdfDocument, MockPdfValues} from "../contentCapture/mockPdfDocument";

import {OneNoteSaveablePdfSynchronousBatched} from "../../scripts/saveToOneNote/oneNoteSaveablePdfSynchronousBatched";

import {TestModule} from "../testModule";

export class OneNoteSaveablePdfSynchronousBatchedTests extends TestModule {
	protected module() {
		return "oneNoteSaveablePdfSynchronousBatched";
	}

	protected tests() {
		test("When getting the page object, it should be the same object as the page passed into the ctor", (assert: QUnitAssert) => {
			let done = assert.async();

			let expectedPage = new OneNoteApi.OneNotePage();
			let saveable = new OneNoteSaveablePdfSynchronousBatched(expectedPage, new MockPdfDocument(), [1], "en-US", "sample.pdf");

			saveable.getPage().then((page) => {
				strictEqual(expectedPage, page);
				done();
			});
		});

		test("When constructed, getNumPages should return the length of pageIndices + 1 to account for the initial page passed in", () => {
			let expectedPage = new OneNoteApi.OneNotePage();
			let saveable = new OneNoteSaveablePdfSynchronousBatched(expectedPage, new MockPdfDocument(), [], "en-US", "sample.pdf");

			strictEqual(saveable.getNumPages(), 1);

			saveable = new OneNoteSaveablePdfSynchronousBatched(expectedPage, new MockPdfDocument(), [1], "en-US", "sample.pdf");
			strictEqual(saveable.getNumPages(), 2);

			saveable = new OneNoteSaveablePdfSynchronousBatched(expectedPage, new MockPdfDocument(), [3, 4, 5, 6], "en-US", "sample.pdf");
			strictEqual(saveable.getNumPages(), 5);
		});
	}
}

// TODO: extend MockPdfDocument to allow the dev to create pdf documents of arbitrary page length

(new OneNoteSaveablePdfSynchronousBatchedTests()).runTests();
