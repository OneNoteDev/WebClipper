/// <reference path="../../../../../node_modules/onenoteapi/target/oneNoteApi.d.ts" />

import {Constants} from "../../../../scripts/constants";

import {ClipperState} from "../../../../scripts/clipperUI/clipperState";
import {ClipMode} from "../../../../scripts/clipperUI/clipMode";
import {Status} from "../../../../scripts/clipperUI/status";

import {SmartValue} from "../../../../scripts/communicator/smartValue";

import {PdfScreenshotResult} from "../../../../scripts/contentCapture/pdfScreenshotHelper";

import {PdfPreview} from "../../../../scripts/clipperUI/components/previewViewer/pdfPreview";

import {MockPdfDocument, MockPdfValues} from "../../../contentCapture/mockPdfDocument";
import {HelperFunctions} from "../../../helperFunctions";

// The 3 data urls that are loaded into the mock pdf document
import {pdfDataUrls} from "./pdfDataUrls";

declare function require(name: string);
let stringsJson = require("../../../../strings.json");

function getMockPdfModeState(): ClipperState {
	let state = HelperFunctions.getMockClipperState() as ClipperState;
	state.currentMode.set(ClipMode.Pdf);
	state.pdfResult.data.set({
		pdf: new MockPdfDocument(),
		viewportDimensions: MockPdfValues.dimensions,
		byteLength: MockPdfValues.byteLength
	});
	state.pdfResult.status = Status.Succeeded;

	state.pdfPreviewInfo = {
		allPages: true,
		selectedPageRange: "",
		shouldAttachPdf: false,
	};
	return state;
}

QUnit.module("pdfPreview", {});

test("The PDF page header should be displayed in PDF mode", () => {
	let mockClipperState = getMockPdfModeState();
	let defaultComponent = <PdfPreview clipperState={mockClipperState} />;
	HelperFunctions.mountToFixture(defaultComponent);

	let idsThatShouldNotExist = [Constants.Ids.addRegionControl, Constants.Ids.highlightControl,
		Constants.Ids.serifControl, Constants.Ids.decrementFontSize, Constants.Ids.incrementFontSize];

	idsThatShouldNotExist.forEach((id) => {
		ok(!document.getElementById(id), id + " should not exist in the PdfPreviewHeader, but it does");
	});

	let idsThatShouldExist = [Constants.Ids.pageRangeControl, Constants.Ids.attachmentCheckboxControl];
	idsThatShouldExist.forEach((id) => {
		ok(document.getElementById(id), id + " should exist in the PdfPreviewHeader, but it doesn't");
	});
});

test("The editable title of the page should be displayed in the preview title in PDF mode", () => {
	let mockClipperState = getMockPdfModeState();
	let defaultComponent = <PdfPreview clipperState={mockClipperState} />;
	HelperFunctions.mountToFixture(defaultComponent);

	let previewHeaderInput = document.getElementById(Constants.Ids.previewHeaderInput) as HTMLTextAreaElement;
	strictEqual(previewHeaderInput.value, mockClipperState.previewGlobalInfo.previewTitleText,
		"The title of the page should be displayed in the preview title");
	ok(!previewHeaderInput.readOnly);
});

test("When the call to get the PDF has not started, the preview should indicate that it is loading in PDF Mode", () => {
	let clipperState = getMockPdfModeState();
	clipperState.currentMode.set(ClipMode.Pdf);
	clipperState.pdfResult = {
		data: new SmartValue<PdfScreenshotResult>(),
		status: Status.NotStarted
	};
	HelperFunctions.mountToFixture(<PdfPreview clipperState={clipperState} />);

	let previewHeaderInput = document.getElementById(Constants.Ids.previewHeaderInput) as HTMLTextAreaElement;
	strictEqual(previewHeaderInput.value, stringsJson["WebClipper.Preview.LoadingMessage"],
		"The preview title should display a loading message");
	ok(previewHeaderInput.readOnly);

	let previewBody = document.getElementById(Constants.Ids.previewBody);
	strictEqual(previewBody.getElementsByClassName(Constants.Classes.spinner).length, 1,
		"The spinner should be present in the preview body");
});

test("When the call to the PDF is in progress, the preview should indicate that it is loading in PDF mode", () => {
	let clipperState = getMockPdfModeState();
	clipperState.currentMode.set(ClipMode.Pdf);
	clipperState.pdfResult = {
		data: new SmartValue<PdfScreenshotResult>(),
		status: Status.InProgress
	};
	HelperFunctions.mountToFixture(<PdfPreview clipperState={clipperState} />);

	let previewHeaderInput = document.getElementById(Constants.Ids.previewHeaderInput) as HTMLTextAreaElement;
	strictEqual(previewHeaderInput.value, stringsJson["WebClipper.Preview.LoadingMessage"],
		"The preview title should display a loading message");
	ok(previewHeaderInput.readOnly);

	let previewBody = document.getElementById(Constants.Ids.previewBody);
	strictEqual(previewBody.getElementsByClassName(Constants.Classes.spinner).length, 1,
		"The spinner should be present in the preview body");
});

test("When no data urls are present in state, a canvas should be rendered for every page, but the image should not be rendered", () => {
	let clipperState = getMockPdfModeState();
	let pdfPreview = HelperFunctions.mountToFixture(<PdfPreview clipperState={clipperState} />);
	HelperFunctions.simulateAction(() => {
		pdfPreview.state.renderedPageIndexes = {};
	});

	let imagesCanvases = document.getElementsByClassName(Constants.Classes.pdfPreviewImageCanvas);
	strictEqual(imagesCanvases.length, pdfDataUrls.length, "There should be a canvas for every page in the pdf");

	let images = document.getElementsByClassName(Constants.Classes.pdfPreviewImage);
	strictEqual(images.length, 0, "There should no pdf images rendered");
});

test("When data urls are present in state, a canvas should be rendered for every page, as well as images", () => {
	let clipperState = getMockPdfModeState();
	let pdfPreview = HelperFunctions.mountToFixture(<PdfPreview clipperState={clipperState} />);
	HelperFunctions.simulateAction(() => {
		pdfPreview.state.renderedPageIndexes = MockPdfValues.pageDataUrlsMap;
	});

	let imagesCanvases = document.getElementsByClassName(Constants.Classes.pdfPreviewImageCanvas);
	strictEqual(imagesCanvases.length, pdfDataUrls.length, "There should be a canvas for every page in the pdf");

	let images = document.getElementsByClassName(Constants.Classes.pdfPreviewImage);
	strictEqual(images.length, pdfDataUrls.length, "There should be an img for every page in the pdf");
});

test("When a subset of data urls are present in state, a canvas should be rendered for every page, and every image for each page in the subset", () => {
	let clipperState = getMockPdfModeState();
	let pdfPreview = HelperFunctions.mountToFixture(<PdfPreview clipperState={clipperState} />);
	HelperFunctions.simulateAction(() => {
		pdfPreview.state.renderedPageIndexes = { "0": MockPdfValues.pageDataUrls[0] };
	});

	let imagesCanvases = document.getElementsByClassName(Constants.Classes.pdfPreviewImageCanvas);
	strictEqual(imagesCanvases.length, pdfDataUrls.length, "There should be a canvas for every page in the pdf");

	let images = document.getElementsByClassName(Constants.Classes.pdfPreviewImage);
	strictEqual(images.length, 1, "There should be an img for every data url present");
});

test("When 'All Pages' is checked in the page range control, all pages should not be grayed out", () => {
	let clipperState = getMockPdfModeState();
	clipperState.currentMode.set(ClipMode.Pdf);
	clipperState.pdfPreviewInfo = {
		allPages: true,
		selectedPageRange: "1,3",
		shouldAttachPdf: false
	};
	let pdfPreview = HelperFunctions.mountToFixture(<PdfPreview clipperState={clipperState} />);
	HelperFunctions.simulateAction(() => {
		pdfPreview.state.renderedPageIndexes = MockPdfValues.pageDataUrlsMap;
	});

	let unselectedImages = document.getElementsByClassName(Constants.Classes.unselected);
	strictEqual(unselectedImages.length, 0, "There should be no unselected images");
});

test("When 'Page Range' is checked in the page range control, but the range is empty, all pages should be grayed out", () => {
	let clipperState = getMockPdfModeState();
	clipperState.pdfPreviewInfo = {
		allPages: false,
		selectedPageRange: "",
		shouldAttachPdf: false
	};
	let pdfPreview = HelperFunctions.mountToFixture(<PdfPreview clipperState={clipperState} />);
	HelperFunctions.simulateAction(() => {
		pdfPreview.state.renderedPageIndexes = MockPdfValues.pageDataUrlsMap;
	});

	let unselectedImages = document.getElementsByClassName(Constants.Classes.unselected);
	strictEqual(unselectedImages.length, pdfDataUrls.length, "The number of unselected images should be the length of pdfDataUrls, if the page range specified is empty");
});

test("When 'Page Range' is checked in the page range control, pages outside that range should be grayed out", () => {
	let clipperState = getMockPdfModeState();
	clipperState.pdfPreviewInfo = {
		allPages: false,
		selectedPageRange: "1,3",
		shouldAttachPdf: false
	};
	let pdfPreview = HelperFunctions.mountToFixture(<PdfPreview clipperState={clipperState} />);
	HelperFunctions.simulateAction(() => {
		pdfPreview.state.renderedPageIndexes = MockPdfValues.pageDataUrlsMap;
	});
	let imagesCanvases = document.getElementsByClassName(Constants.Classes.pdfPreviewImageCanvas);

	let expectedSelectedIndexes = [0, 2];
	for (let i = 0; i < imagesCanvases.length; ++i) {
		let imageCanvas = imagesCanvases[i] as HTMLImageElement;
		if (expectedSelectedIndexes.indexOf(i) === -1) {
			ok(imageCanvas.classList.contains(Constants.Classes.unselected), "Images in the range should be grayed out");
		} else {
			ok(!imageCanvas.classList.contains(Constants.Classes.unselected), "Images not in the range should not be grayed out");
		}
	}
});

test("When 'Page Range' is checked in the page control, but there is a negative page range specified, we should treat this as an invalid selection and unselect all the pages", () => {
	let clipperState = getMockPdfModeState();
	clipperState.pdfPreviewInfo = {
		allPages: false,
		selectedPageRange: "-1,2",
		shouldAttachPdf: false
	};
	let pdfPreview = HelperFunctions.mountToFixture(<PdfPreview clipperState={clipperState} />);
	HelperFunctions.simulateAction(() => {
		pdfPreview.state.renderedPageIndexes = MockPdfValues.pageDataUrlsMap;
	});

	let selectionQueryForNotGrayedOutImages = "." + Constants.Classes.pdfPreviewImageCanvas + ":not(." + Constants.Classes.unselected + ")";
	let selectedImageCanvases = document.querySelectorAll(selectionQueryForNotGrayedOutImages);
	strictEqual(selectedImageCanvases.length, 0, "All pages should be grayed out");
});

test("When the attachment checkbox is checked, the preview body should show an attachment", () => {
	let clipperState = getMockPdfModeState();
	clipperState.pdfPreviewInfo = {
		allPages: true,
		selectedPageRange: "",
		shouldAttachPdf: true,
	};
	HelperFunctions.mountToFixture(<PdfPreview clipperState={clipperState} />);

	strictEqual(document.getElementsByClassName(Constants.Classes.attachmentOverlay).length, 1, "The attachment overlay should be present in the content body");
});

test("When the attachment checkbox isn't checked, there should be no attachment", () => {
	let clipperState = getMockPdfModeState();
	clipperState.pdfPreviewInfo = {
		allPages: true,
		selectedPageRange: "",
		shouldAttachPdf: false,
	};
	HelperFunctions.mountToFixture(<PdfPreview clipperState={clipperState} />);

	strictEqual(document.getElementsByClassName(Constants.Classes.attachmentOverlay).length, 0, "The attachment overlay should NOT be present in the content body");
});

test("When the pdf screenshot response is a failure, the preview should display an error message in PDF mode", () => {
	let expectedMessage = "An error message.";
	let clipperState = HelperFunctions.getMockClipperState();
	clipperState.pageInfo.contentType = OneNoteApi.ContentType.EnhancedUrl;
	clipperState.currentMode.set(ClipMode.Pdf);
	clipperState.pdfResult = {
		data: new SmartValue<PdfScreenshotResult>({ failureMessage: expectedMessage }),
		status: Status.Failed
	};
	HelperFunctions.mountToFixture(<PdfPreview clipperState={clipperState} />);

	let previewHeaderInput = document.getElementById(Constants.Ids.previewHeaderInput) as HTMLTextAreaElement;
	strictEqual(previewHeaderInput.value, expectedMessage,
		"The title of the page should be displayed in the preview title");
	ok(previewHeaderInput.readOnly);
});
