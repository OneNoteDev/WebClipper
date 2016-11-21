import {MockPdfDocument, MockPdfValues} from "../contentCapture/mockPdfDocument";

import {OneNoteSaveablePage} from "../../scripts/saveToOneNote/oneNoteSaveablePage";

import {TestModule} from "../testModule";

export class OneNoteSaveablePageTests extends TestModule {
	protected module() {
		return "oneNoteSaveablePage";
	}

	protected tests() {
		test("When getting the page object, it should be the same object as the page passed into the ctor", (assert: QUnitAssert) => {
			let done = assert.async();

			let expectedPage = new OneNoteApi.OneNotePage();
			let saveable = new OneNoteSaveablePage(expectedPage);

			saveable.getPage().then((page) => {
				strictEqual(expectedPage, page);
				done();
			});
		});

		test("getNumPatches should always return 0", () => {
			let saveable = new OneNoteSaveablePage(new OneNoteApi.OneNotePage());
			strictEqual(saveable.getNumPatches(), 0, "There are 0 patches to apply");
		});

		test("getPatch should always return undefined", (assert: QUnitAssert) => {
			let done = assert.async();

			let saveable = new OneNoteSaveablePage(new OneNoteApi.OneNotePage());
			saveable.getPatch(0).then((page) => {
				strictEqual(page, undefined);
				done();
			});
		});
	}
}

(new OneNoteSaveablePageTests()).runTests();
