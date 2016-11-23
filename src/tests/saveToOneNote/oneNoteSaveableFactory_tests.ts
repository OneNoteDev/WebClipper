import {MockPdfDocument, MockPdfValues} from "../contentCapture/mockPdfDocument";

import {OneNoteSaveableFactory} from "../../scripts/saveToOneNote/oneNoteSaveableFactory";

import {TestModule} from "../testModule";

export class OneNoteSaveableFactoryTests extends TestModule {
	protected module() {
		return "oneNoteSaveableFactoryTests";
	}

	protected tests() {
		test("This test should fail", (assert: QUnitAssert) => {
			let done = assert.async();
			ok(true);
			done();
		});
	}
}

(new OneNoteSaveableFactoryTests()).runTests();
