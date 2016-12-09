import {MockPdfDocument, MockPdfValues} from "../contentCapture/mockPdfDocument";

import {ClipMode} from "../../scripts/clipperUI/clipMode";
import {Status} from "../../scripts/clipperUI/status";

import {OneNoteSaveableFactory} from "../../scripts/saveToOneNote/oneNoteSaveableFactory";

import {MockProps} from "../mockProps";
import {TestModule} from "../testModule";

/**
 * For now, we have tests that simulate passing in valid clipperStates into the factory. We don't validate
 * the output, but we at least make sure we don't throw any exceptions or any funny business.
 */
export class OneNoteSaveableFactoryTests extends TestModule {
	protected module() {
		return "oneNoteSaveableFactoryTests";
	}

	protected tests() {
		test("Creating a saveable full page from clipperState should resolve", (assert: QUnitAssert) => {
			let clipperState = MockProps.getMockClipperState();

			clipperState.currentMode.set(ClipMode.FullPage);
			clipperState.fullPageResult.data.Images = ["data:image/png;base64,iVBORw0KGgo"];
			clipperState.fullPageResult.status = Status.Succeeded;

			let factory = new OneNoteSaveableFactory(clipperState);
			this.assertFactoryDoesNotReject(factory, assert);
		});

		test("Creating a saveable augmented content from clipperState should resolve", (assert: QUnitAssert) => {
			let clipperState = MockProps.getMockClipperState();

			clipperState.currentMode.set(ClipMode.Augmentation);
			clipperState.augmentationResult.data.ContentModel = 1;
			clipperState.augmentationResult.data.ContentInHtml = "<p>hello world</p>";
			clipperState.augmentationResult.status = Status.Succeeded;

			let factory = new OneNoteSaveableFactory(clipperState);
			this.assertFactoryDoesNotReject(factory, assert);
		});

		test("Creating a saveable pdf from clipperState should resolve if the user selected all pages", (assert: QUnitAssert) => {
			let clipperState = MockProps.getMockClipperState();

			clipperState.currentMode.set(ClipMode.Pdf);
			clipperState.pdfResult.data.set({
				pdf: new MockPdfDocument(),
				viewportDimensions: MockPdfValues.dimensions,
				byteLength: MockPdfValues.byteLength
			});
			clipperState.pdfResult.status = Status.Succeeded;

			clipperState.pdfPreviewInfo.allPages = true;
			clipperState.pdfPreviewInfo.isLocalFileAndNotAllowed = false;
			clipperState.pdfPreviewInfo.selectedPageRange = "";
			clipperState.pdfPreviewInfo.shouldAttachPdf = false;
			clipperState.pdfPreviewInfo.shouldDistributePages = false;

			let factory = new OneNoteSaveableFactory(clipperState);
			this.assertFactoryDoesNotReject(factory, assert);
		});

		test("Creating a saveable pdf from clipperState should resolve if the user selected a page range", (assert: QUnitAssert) => {
			let clipperState = MockProps.getMockClipperState();

			clipperState.currentMode.set(ClipMode.Pdf);
			clipperState.pdfResult.data.set({
				pdf: new MockPdfDocument(),
				viewportDimensions: MockPdfValues.dimensions,
				byteLength: MockPdfValues.byteLength
			});
			clipperState.pdfResult.status = Status.Succeeded;

			clipperState.pdfPreviewInfo.allPages = false;
			clipperState.pdfPreviewInfo.isLocalFileAndNotAllowed = false;
			clipperState.pdfPreviewInfo.selectedPageRange = "1-3";
			clipperState.pdfPreviewInfo.shouldAttachPdf = false;
			clipperState.pdfPreviewInfo.shouldDistributePages = false;

			let factory = new OneNoteSaveableFactory(clipperState);
			this.assertFactoryDoesNotReject(factory, assert);
		});

		test("Creating a saveable pdf from clipperState should resolve if the user attaches the pdf", (assert: QUnitAssert) => {
			let clipperState = MockProps.getMockClipperState();

			clipperState.currentMode.set(ClipMode.Pdf);
			clipperState.pdfResult.data.set({
				pdf: new MockPdfDocument(),
				viewportDimensions: MockPdfValues.dimensions,
				byteLength: MockPdfValues.byteLength
			});
			clipperState.pdfResult.status = Status.Succeeded;

			clipperState.pdfPreviewInfo.allPages = true;
			clipperState.pdfPreviewInfo.isLocalFileAndNotAllowed = false;
			clipperState.pdfPreviewInfo.selectedPageRange = "";
			clipperState.pdfPreviewInfo.shouldAttachPdf = true;
			clipperState.pdfPreviewInfo.shouldDistributePages = false;

			let factory = new OneNoteSaveableFactory(clipperState);
			this.assertFactoryDoesNotReject(factory, assert);
		});

		test("Creating a saveable pdf from clipperState should resolve if the user attaches one note per page", (assert: QUnitAssert) => {
			let clipperState = MockProps.getMockClipperState();

			clipperState.currentMode.set(ClipMode.Pdf);
			clipperState.pdfResult.data.set({
				pdf: new MockPdfDocument(),
				viewportDimensions: MockPdfValues.dimensions,
				byteLength: MockPdfValues.byteLength
			});
			clipperState.pdfResult.status = Status.Succeeded;

			clipperState.pdfPreviewInfo.allPages = true;
			clipperState.pdfPreviewInfo.isLocalFileAndNotAllowed = false;
			clipperState.pdfPreviewInfo.selectedPageRange = "";
			clipperState.pdfPreviewInfo.shouldAttachPdf = true;
			clipperState.pdfPreviewInfo.shouldDistributePages = true;

			let factory = new OneNoteSaveableFactory(clipperState);
			this.assertFactoryDoesNotReject(factory, assert);
		});

		test("Creating a saveable region clip from clipperState should resolve", (assert: QUnitAssert) => {
			let clipperState = MockProps.getMockClipperState();

			clipperState.currentMode.set(ClipMode.Region);
			clipperState.regionResult.data = ["data:image/png;base64,iVBORw0KGgo"];
			clipperState.regionResult.status = Status.Succeeded;

			let factory = new OneNoteSaveableFactory(clipperState);
			this.assertFactoryDoesNotReject(factory, assert);
		});

		test("Creating a saveable region clip from clipperState should resolve if there's more than 1 region", (assert: QUnitAssert) => {
			let clipperState = MockProps.getMockClipperState();

			clipperState.currentMode.set(ClipMode.Region);
			clipperState.regionResult.data = ["data:image/png;base64,iVBORw0KGgo", "data:image/png;base64,iVBORw0KGgo"];
			clipperState.regionResult.status = Status.Succeeded;

			let factory = new OneNoteSaveableFactory(clipperState);
			this.assertFactoryDoesNotReject(factory, assert);
		});

		test("Creating a saveable bookmark from clipperState should resolve", (assert: QUnitAssert) => {
			let clipperState = MockProps.getMockClipperState();

			clipperState.currentMode.set(ClipMode.Bookmark);
			clipperState.bookmarkResult.data = {
				description: "desc",
				thumbnailSrc: "data:image/png;base64,iVBORw0KGgo",
				title: "title",
				url: "url",
			};
			clipperState.bookmarkPreviewInfo = { previewBodyHtml: "<p>stuff</p>" };
			clipperState.bookmarkResult.status = Status.Succeeded;

			let factory = new OneNoteSaveableFactory(clipperState);
			this.assertFactoryDoesNotReject(factory, assert);
		});

		test("Creating a saveable selection clip from clipperState should resolve", (assert: QUnitAssert) => {
			let clipperState = MockProps.getMockClipperState();

			clipperState.currentMode.set(ClipMode.Selection);
			clipperState.selectionPreviewInfo = ["<h1>header</h1>"];

			let factory = new OneNoteSaveableFactory(clipperState);
			this.assertFactoryDoesNotReject(factory, assert);
		});
	}

	private assertFactoryDoesNotReject(factory: OneNoteSaveableFactory, assert: QUnitAssert) {
		let done = assert.async();

		factory.getSaveable().then((saveable) => {
			ok(!!saveable, "getSaveable should not resolve with an undefined object");
		}).catch(() => {
			ok(false, "getSaveable should not throw an exception or reject");
		}).then(() => {
			done();
		});
	}
}

(new OneNoteSaveableFactoryTests()).runTests();
