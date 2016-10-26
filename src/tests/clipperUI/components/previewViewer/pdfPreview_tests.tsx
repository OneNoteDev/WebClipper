/// <reference path="../../../../../node_modules/onenoteapi/target/oneNoteApi.d.ts" />

import {Constants} from "../../../../scripts/constants";

import {ClipperState} from "../../../../scripts/clipperUI/clipperState";
import {ClipMode} from "../../../../scripts/clipperUI/clipMode";
import {Status} from "../../../../scripts/clipperUI/status";

import {SmartValue} from "../../../../scripts/communicator/smartValue";

import {PdfScreenshotResult} from "../../../../scripts/contentCapture/pdfScreenshotHelper";

import {PdfPreview} from "../../../../scripts/clipperUI/components/previewViewer/pdfPreview";

import { HelperFunctions } from "../../../helperFunctions";
import { pdfDataUrls } from "./pdfDataUrls";

declare function require(name: string);
let stringsJson = require("../../../../strings.json");

function getMockPdfModeState(): ClipperState {
	let state = HelperFunctions.getMockClipperState() as ClipperState;
	state.currentMode.set(ClipMode.Pdf);
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

test("When the call to get and process the PDF successfully completes, but no data is returned, the preview should indicate no content was found in PDF mode", () => {
	let clipperState = getMockPdfModeState();
	clipperState.currentMode.set(ClipMode.Pdf);
	clipperState.pdfResult = {
		data: new SmartValue<PdfScreenshotResult>(),
		status: Status.Succeeded
	};
	HelperFunctions.mountToFixture(<PdfPreview clipperState={clipperState} />);

	let previewHeaderInput = document.getElementById(Constants.Ids.previewHeaderInput) as HTMLTextAreaElement;
	strictEqual(previewHeaderInput.value, stringsJson["WebClipper.Preview.NoContentFound"],
		"The preview title should display a message indicating no content was found");
	ok(previewHeaderInput.readOnly);

	strictEqual(document.getElementById(Constants.Ids.previewBody).innerText, "",
		"The preview body should be empty");
});

test("When 'All Pages' is checked in the page range control, every dataUrl should be rendered and not grayed out into the preview body", () => {
	let clipperState = getMockPdfModeState();
	clipperState.currentMode.set(ClipMode.Pdf);
	clipperState.pdfPreviewInfo = {
		allPages: true,
		selectedPageRange: "1,3",
		shouldAttachPdf: false
	};
	HelperFunctions.mountToFixture(<PdfPreview clipperState={clipperState} />);

	let images = document.getElementsByClassName(Constants.Classes.pdfPreviewImage);
	strictEqual(images.length, pdfDataUrls.length, "The number of rendered images should match the number of elements in the array of dataUrls given as a prop");

	pdfDataUrls.forEach((dataUrl, index) => {
		let image = images[index] as HTMLImageElement;
		strictEqual(image.src, dataUrl, "The images should be rendered in the same order of the dataUrls passed in");
	});

	let unselectedImages = document.getElementsByClassName(Constants.Classes.unselected);
	strictEqual(unselectedImages.length, 0, "There should be no unselected images");
});

test("When 'Page Range' is checked in the page range control, but the range is empty, make sure all images are rendered with the unselected class", () => {
	let clipperState = getMockPdfModeState();
	clipperState.pdfPreviewInfo = {
		allPages: false,
		selectedPageRange: "",
		shouldAttachPdf: false
	};
	HelperFunctions.mountToFixture(<PdfPreview clipperState={clipperState} />);

	let images = document.getElementsByClassName(Constants.Classes.pdfPreviewImage);
	strictEqual(images.length, pdfDataUrls.length, "The number of rendered images should still be the length of pdfDataUrls, even when the range specified is zero");

	let unselectedImages = document.getElementsByClassName(Constants.Classes.unselected);
	strictEqual(unselectedImages.length, pdfDataUrls.length, "The number of unselected images should be the length of pdfDataUrls, if the page range specified is empty");
});

test("When 'Page Range' is checked in the page range control, only the pages specified in the page range should be rendered, with the rest being unselected", () => {
	let clipperState = getMockPdfModeState();
	clipperState.pdfPreviewInfo = {
		allPages: false,
		selectedPageRange: "1,3",
		shouldAttachPdf: false
	};
	HelperFunctions.mountToFixture(<PdfPreview clipperState={clipperState} />);

	let images = document.getElementsByClassName(Constants.Classes.pdfPreviewImage);
	strictEqual(images.length, pdfDataUrls.length, "The number of rendered images should match the number of elements in pagesToShow of pdfPreviewInfo");

	let expectedSelectedIndexes = [0, 2];
	for (let i = 0; i < images.length; ++i) {
		let image = images[i] as HTMLImageElement;
		if (expectedSelectedIndexes.indexOf(i) === -1) {
			ok(image.classList.contains(Constants.Classes.unselected), "Images that should be grayed out should have unselected in their classList");
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
	HelperFunctions.mountToFixture(<PdfPreview clipperState={clipperState} />);

	let selectionQueryForNotGrayedOutImages = "." + Constants.Classes.pdfPreviewImage + ":not(." + Constants.Classes.unselected + ")";
	let images = document.querySelectorAll(selectionQueryForNotGrayedOutImages);
	strictEqual(images.length, 0, "All pages should be grayed out");
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
