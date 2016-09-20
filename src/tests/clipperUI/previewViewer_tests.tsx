/// <reference path="../../../typings/main/ambient/qunit/qunit.d.ts" />
/// <reference path="../../../node_modules/onenoteapi/target/oneNoteApi.d.ts" />

import {AugmentationPreview} from "../../scripts/clipperUI/components/previewViewer/augmentationPreview";

import {AugmentationModel} from "../../scripts/contentCapture/augmentationHelper";
import {PdfScreenshotResult} from "../../scripts/contentCapture/pdfScreenshotHelper";

import {ClipperState} from "../../scripts/clipperUI/clipperState";
import {ClipMode} from "../../scripts/clipperUI/clipMode";
import {PreviewViewer} from "../../scripts/clipperUI/previewViewer";
import {Status} from "../../scripts/clipperUI/status";

import {SmartValue} from "../../scripts/communicator/smartValue";

import {Constants} from "../../scripts/constants";

import {HelperFunctions} from "../helperFunctions";

declare function require(name: string);
let stringsJson = require("../../strings.json");

function getMockFullPageModeState(): ClipperState {
	let state = HelperFunctions.getMockClipperState() as ClipperState;
	state.currentMode.set(ClipMode.FullPage);
	state.fullPageResult = {
		data: {
			ImageEncoding: "jpeg",
			ImageFormat: "base64",
			Images: ["abc", "def"]
		},
		status: Status.Succeeded
	};
	return state;
}

function getMockRegionModeState(): ClipperState {
	let state = HelperFunctions.getMockClipperState() as ClipperState;
	state.currentMode.set(ClipMode.Region);
	state.regionResult = {
		data: ["data:image/png;base64,123", "data:image/png;base64,456", "data:image/png;base64,789", "data:image/png;base64,0"],
		status: Status.Succeeded
	};
	return state;
}

function getMockAugmentationModeState(): ClipperState {
	let state = HelperFunctions.getMockClipperState() as ClipperState;
	state.currentMode.set(ClipMode.Augmentation);
	state.augmentationResult = {
		data: {
				ContentInHtml: "Jello World content in all its jelly goodness.",
				ContentModel: AugmentationModel.Product,
				ContentObjects: [],
				PageMetadata: {
					AutoPageTags: "Product",
					AutoPageTagsCodes: "Product"
				}
			},
		status: Status.Succeeded
	};
	return state;
}

QUnit.module("previewViewerFullPageMode", {});

test("The full page header should be displayed in Full Page mode", () => {
	let mockClipperState = getMockFullPageModeState();
	let defaultComponent = <PreviewViewer clipperState={mockClipperState} />;
	HelperFunctions.mountToFixture(defaultComponent);

	ok(!document.getElementById(Constants.Ids.addRegionControl), "The region control should not exist");

	ok(!document.getElementById(Constants.Ids.highlightControl), "The highlight control should not exist");
	ok(!document.getElementById(Constants.Ids.serifControl), "The font family control should not exist");
	ok(!document.getElementById(Constants.Ids.decrementFontSize), "The decrement font size button should not exist");
	ok(!document.getElementById(Constants.Ids.incrementFontSize), "The increment font size button should not exist");
});

test("The editable title of the page should be displayed in the preview title in Full Page mode", () => {
	let mockClipperState = getMockFullPageModeState();
	let defaultComponent = <PreviewViewer clipperState={mockClipperState} />;
	HelperFunctions.mountToFixture(defaultComponent);

	let previewHeaderInput = document.getElementById(Constants.Ids.previewHeaderInput) as HTMLTextAreaElement;
	strictEqual(previewHeaderInput.value, mockClipperState.previewGlobalInfo.previewTitleText,
		"The title of the page should be displayed in the preview title");
	ok(!previewHeaderInput.readOnly);
});

test("When the call to the full page screenshot fetch has not started, the preview should indicate that it is loading in Full Page mode", () => {
	let clipperState = getMockFullPageModeState();
	clipperState.currentMode.set(ClipMode.FullPage);
	clipperState.fullPageResult = {
		data: undefined,
		status: Status.NotStarted
	};
	HelperFunctions.mountToFixture(<PreviewViewer clipperState={clipperState} />);

	let previewHeaderInput = document.getElementById(Constants.Ids.previewHeaderInput) as HTMLTextAreaElement;
	strictEqual(previewHeaderInput.value, stringsJson["WebClipper.Preview.LoadingMessage"],
		"The preview title should display a loading message");
	ok(previewHeaderInput.readOnly);

	let previewBody = document.getElementById(Constants.Ids.previewBody);
	strictEqual(previewBody.getElementsByClassName(Constants.Classes.spinner).length, 1,
		"The spinner should be present in the preview body");
});

test("When the call to the full page screenshot fetch is in progress, the preview should indicate that it is loading in Full Page mode", () => {
	let clipperState = getMockFullPageModeState();
	clipperState.currentMode.set(ClipMode.FullPage);
	clipperState.fullPageResult = {
		data: undefined,
		status: Status.InProgress
	};
	HelperFunctions.mountToFixture(<PreviewViewer clipperState={clipperState} />);

	let previewHeaderInput = document.getElementById(Constants.Ids.previewHeaderInput) as HTMLTextAreaElement;
	strictEqual(previewHeaderInput.value, stringsJson["WebClipper.Preview.LoadingMessage"],
		"The preview title should display a loading message");
	ok(previewHeaderInput.readOnly);

	let previewBody = document.getElementById(Constants.Ids.previewBody);
	strictEqual(previewBody.getElementsByClassName(Constants.Classes.spinner).length, 1,
		"The spinner should be present in the preview body");
});

test("When the call to the full patch screenshot fetch successfully completes, but no data is returned, the preview should indicate no content was found in Full Page mode", () => {
	let clipperState = getMockFullPageModeState();
	clipperState.currentMode.set(ClipMode.FullPage);
	clipperState.fullPageResult = {
		data: undefined,
		status: Status.Succeeded
	};
	HelperFunctions.mountToFixture(<PreviewViewer clipperState={clipperState} />);

	let previewHeaderInput = document.getElementById(Constants.Ids.previewHeaderInput) as HTMLTextAreaElement;
	strictEqual(previewHeaderInput.value, stringsJson["WebClipper.Preview.NoContentFound"],
		"The preview title should display a message indicating no content was found");
	ok(previewHeaderInput.readOnly);

	strictEqual(document.getElementById(Constants.Ids.previewBody).innerText, "",
		"The preview body should be empty");
});

test("There should be one image rendered for every data url in state in Full Page mode", () => {
	let mockClipperState = getMockFullPageModeState();
	let defaultComponent = <PreviewViewer clipperState={mockClipperState} />;
	HelperFunctions.mountToFixture(defaultComponent);

	let previewBody = document.getElementById(Constants.Ids.previewBody);
	let images = previewBody.getElementsByTagName("IMG");

	let imageDataInState = mockClipperState.fullPageResult.data;
	strictEqual(images.length, imageDataInState.Images.length);

	for (let i = 0; i < images.length; i++) {
		let image = images[i] as HTMLImageElement;
		strictEqual(image.src, "data:image/" + imageDataInState.ImageFormat + ";" + imageDataInState.ImageEncoding + "," + imageDataInState.Images[i]);
	}
});

test("When the full page screenshot response is a failure, the preview should display an error message in Full Page mode", () => {
	let expectedMessage = "An error message.";

	let clipperState = HelperFunctions.getMockClipperState();
	clipperState.currentMode.set(ClipMode.FullPage);
	clipperState.fullPageResult = {
		data: {
			failureMessage: expectedMessage
		},
		status: Status.Failed
	};
	HelperFunctions.mountToFixture(<PreviewViewer clipperState={clipperState} />);

	let previewHeaderInput = document.getElementById(Constants.Ids.previewHeaderInput) as HTMLTextAreaElement;
	strictEqual(previewHeaderInput.value, expectedMessage,
		"The title of the page should be displayed in the preview title");
	ok(previewHeaderInput.readOnly);
});

test("When the pdf screenshot response is a failure, the preview should display an error message in Full Page mode", () => {
	let expectedMessage = "An error message.";

	let clipperState = HelperFunctions.getMockClipperState();
	clipperState.pageInfo.contentType = OneNoteApi.ContentType.EnhancedUrl;
	clipperState.currentMode.set(ClipMode.FullPage);
	clipperState.pdfResult = {
		data: new SmartValue<PdfScreenshotResult>({ failureMessage: expectedMessage }),
		status: Status.Failed
	};
	HelperFunctions.mountToFixture(<PreviewViewer clipperState={clipperState} />);

	let previewHeaderInput = document.getElementById(Constants.Ids.previewHeaderInput) as HTMLTextAreaElement;
	strictEqual(previewHeaderInput.value, expectedMessage,
		"The title of the page should be displayed in the preview title");
	ok(previewHeaderInput.readOnly);
});

QUnit.module("previewViewerRegionMode", {});

test("The tab order flow from the header to the preview title is correct in Region mode, and each tab index should not be less than 1", () => {
	let mockClipperState = getMockRegionModeState();
	let defaultComponent = <PreviewViewer clipperState={mockClipperState} />;
	HelperFunctions.mountToFixture(defaultComponent);

	let elementsInExpectedTabOrder = [
		{ name: Constants.Ids.addRegionControl, elem: document.getElementById(Constants.Ids.addRegionControl) },
		{ name: Constants.Ids.previewHeaderInput, elem: document.getElementById(Constants.Ids.previewHeaderInput) },
	];

	for (let i = 1; i < elementsInExpectedTabOrder.length; i++) {
		ok(elementsInExpectedTabOrder[i].elem.tabIndex > elementsInExpectedTabOrder[i - 1].elem.tabIndex,
			"Element " + elementsInExpectedTabOrder[i].name + " should have a greater tabIndex than element " + elementsInExpectedTabOrder[i - 1].name);
	}

	for (let i = 0; i < elementsInExpectedTabOrder.length; i++) {
		ok(elementsInExpectedTabOrder[i].elem.tabIndex > 0);
	}
});

test("The tab order flow from the preview title through the region delete buttons is correct in Region mode, and each tab index should not be less than 1", () => {
	let mockClipperState = getMockRegionModeState();
	let defaultComponent = <PreviewViewer clipperState={mockClipperState} />;
	HelperFunctions.mountToFixture(defaultComponent);

	let elementsInExpectedTabOrder = [
		{ name: Constants.Ids.previewHeaderInput, elem: document.getElementById(Constants.Ids.previewHeaderInput) },
	];

	let removeButtons = document.getElementsByClassName(Constants.Classes.regionSelectionRemoveButton);
	for (let i = 0; i < removeButtons.length; i++) {
		elementsInExpectedTabOrder.push({ name: Constants.Classes.regionSelectionRemoveButton + i, elem: removeButtons[i] as HTMLElement });
	}

	// Check the flow from the title to the first button
	ok(elementsInExpectedTabOrder[1].elem.tabIndex > elementsInExpectedTabOrder[0].elem.tabIndex,
			"Element " + elementsInExpectedTabOrder[1].name + " should have a greater or equal tabIndex than element " + elementsInExpectedTabOrder[0].name);

	for (let i = 2 /* Check buttons */; i < elementsInExpectedTabOrder.length; i++) {
		// Note the '>='
		ok(elementsInExpectedTabOrder[i].elem.tabIndex >= elementsInExpectedTabOrder[i - 1].elem.tabIndex,
			"Element " + elementsInExpectedTabOrder[i].name + " should have a greater or equal tabIndex than element " + elementsInExpectedTabOrder[i - 1].name);
	}

	for (let i = 0; i < elementsInExpectedTabOrder.length; i++) {
		ok(elementsInExpectedTabOrder[i].elem.tabIndex > 0);
	}
});

test("The region header and all related controls should be displayed in Region mode", () => {
	let mockClipperState = getMockRegionModeState();
	let defaultComponent = <PreviewViewer clipperState={mockClipperState} />;
	HelperFunctions.mountToFixture(defaultComponent);

	ok(document.getElementById(Constants.Ids.addRegionControl), "The region control should exist");

	ok(!document.getElementById(Constants.Ids.highlightControl), "The highlight control should not exist");
	ok(!document.getElementById(Constants.Ids.serifControl), "The font family control should not exist");
	ok(!document.getElementById(Constants.Ids.decrementFontSize), "The decrement font size button should not exist");
	ok(!document.getElementById(Constants.Ids.incrementFontSize), "The increment font size button should not exist");
});

test("The editable title of the page should be displayed in the preview title in Region mode", () => {
	let mockClipperState = getMockRegionModeState();
	let defaultComponent = <PreviewViewer clipperState={mockClipperState} />;
	HelperFunctions.mountToFixture(defaultComponent);

	let previewHeaderInput = document.getElementById(Constants.Ids.previewHeaderInput) as HTMLTextAreaElement;
	strictEqual(previewHeaderInput.value, mockClipperState.previewGlobalInfo.previewTitleText,
		"The title of the page should be displayed in the preview title");
	ok(!previewHeaderInput.readOnly);
});

test("There should be one image rendered for every data url in state in Region mode", () => {
	let mockClipperState = getMockRegionModeState();
	let defaultComponent = <PreviewViewer clipperState={mockClipperState} />;
	HelperFunctions.mountToFixture(defaultComponent);

	let previewBody = document.getElementById(Constants.Ids.previewBody);
	let selections = previewBody.getElementsByClassName(Constants.Classes.regionSelection);

	strictEqual(selections.length, mockClipperState.regionResult.data.length);

	for (let i = 0; i < selections.length; i++) {
		let selection = selections[i];
		let imagesRenderedInSelection = selection.getElementsByClassName(Constants.Classes.regionSelectionImage);
		strictEqual(imagesRenderedInSelection.length, 1);
		strictEqual((imagesRenderedInSelection[0] as HTMLImageElement).src, mockClipperState.regionResult.data[i],
			"The image should render the data url in state");
	}
});

test("When multiple images are rendered, clicking a middle image's remove button should remove it and only it in Region mode", () => {
	let mockClipperState = getMockRegionModeState();
	let defaultComponent = <PreviewViewer clipperState={mockClipperState} />;
	HelperFunctions.mountToFixture(defaultComponent);

	let previewBody = document.getElementById(Constants.Ids.previewBody);
	let selections = previewBody.getElementsByClassName(Constants.Classes.regionSelection);

	let indexToRemove = 1;

	// This does not represent a user action, but is done to make testing easier
	mockClipperState.regionResult.data.splice(indexToRemove, 1);

	let removeButton = selections[indexToRemove].getElementsByClassName(Constants.Classes.regionSelectionRemoveButton)[0] as HTMLAnchorElement;
	HelperFunctions.simulateAction(() => {
		removeButton.click();
	});

	strictEqual(selections.length, mockClipperState.regionResult.data.length);
	for (let i = 0; i < selections.length; i++) {
		let selection = selections[i];
		let imagesRenderedInSelection = selection.getElementsByClassName(Constants.Classes.regionSelectionImage);
		strictEqual(imagesRenderedInSelection.length, 1);
		strictEqual((imagesRenderedInSelection[0] as HTMLImageElement).src, mockClipperState.regionResult.data[i],
			"The image should render the data url in state");
	}
});

test("When multiple images are rendered, clicking the first image's remove button should remove it and only it in Region mode", () => {
	let mockClipperState = getMockRegionModeState();
	let defaultComponent = <PreviewViewer clipperState={mockClipperState} />;
	HelperFunctions.mountToFixture(defaultComponent);

	let previewBody = document.getElementById(Constants.Ids.previewBody);
	let selections = previewBody.getElementsByClassName(Constants.Classes.regionSelection);

	let indexToRemove = 0;

	// This does not represent a user action, but is done to make testing easier
	mockClipperState.regionResult.data.splice(indexToRemove, 1);

	let removeButton = selections[indexToRemove].getElementsByClassName(Constants.Classes.regionSelectionRemoveButton)[0] as HTMLAnchorElement;
	HelperFunctions.simulateAction(() => {
		removeButton.click();
	});

	strictEqual(selections.length, mockClipperState.regionResult.data.length);
	for (let i = 0; i < selections.length; i++) {
		let selection = selections[i];
		let imagesRenderedInSelection = selection.getElementsByClassName(Constants.Classes.regionSelectionImage);
		strictEqual(imagesRenderedInSelection.length, 1);
		strictEqual((imagesRenderedInSelection[0] as HTMLImageElement).src, mockClipperState.regionResult.data[i],
			"The image should render the data url in state");
	}
});

test("When multiple images are rendered, clicking the last image's remove button should remove it and only it in Region mode", () => {
	let mockClipperState = getMockRegionModeState();
	let defaultComponent = <PreviewViewer clipperState={mockClipperState} />;
	HelperFunctions.mountToFixture(defaultComponent);

	let previewBody = document.getElementById(Constants.Ids.previewBody);
	let selections = previewBody.getElementsByClassName(Constants.Classes.regionSelection);

	let indexToRemove = mockClipperState.regionResult.data.length - 1;

	// This does not represent a user action, but is done to make testing easier
	mockClipperState.regionResult.data.splice(indexToRemove, 1);

	let removeButton = selections[indexToRemove].getElementsByClassName(Constants.Classes.regionSelectionRemoveButton)[0] as HTMLAnchorElement;
	HelperFunctions.simulateAction(() => {
		removeButton.click();
	});

	strictEqual(selections.length, mockClipperState.regionResult.data.length);
	for (let i = 0; i < selections.length; i++) {
		let selection = selections[i];
		let imagesRenderedInSelection = selection.getElementsByClassName(Constants.Classes.regionSelectionImage);
		strictEqual(imagesRenderedInSelection.length, 1);
		strictEqual((imagesRenderedInSelection[0] as HTMLImageElement).src, mockClipperState.regionResult.data[i],
			"The image should render the data url in state");
	}
});

QUnit.module("previewViewerAugmentationMode", {});

let sansSerifFontFamily = stringsJson["WebClipper.FontFamily.Preview.SansSerifDefault"];
let sansSerifDefaultFontSize = stringsJson["WebClipper.FontSize.Preview.SansSerifDefault"];

let serifFontFamily = stringsJson["WebClipper.FontFamily.Preview.SerifDefault"];
let fontSizeStep = Constants.Settings.fontSizeStep;

test("The tab order flow from the header to the preview title is correct in Augmentation mode", () => {
	let mockClipperState = getMockAugmentationModeState();
	let defaultComponent = <PreviewViewer clipperState={mockClipperState} />;
	HelperFunctions.mountToFixture(defaultComponent);

	let elementsInExpectedTabOrder = [
		{ name: Constants.Ids.highlightButton, elem: document.getElementById(Constants.Ids.highlightButton) },
		{ name: Constants.Ids.sansSerif, elem: document.getElementById(Constants.Ids.sansSerif) },
		{ name: Constants.Ids.serif, elem: document.getElementById(Constants.Ids.serif) },
		{ name: Constants.Ids.decrementFontSize, elem: document.getElementById(Constants.Ids.decrementFontSize) },
		{ name: Constants.Ids.incrementFontSize, elem: document.getElementById(Constants.Ids.incrementFontSize) },
		{ name: Constants.Ids.previewHeaderInput, elem: document.getElementById(Constants.Ids.previewHeaderInput) },
	];

	for (let i = 1; i < elementsInExpectedTabOrder.length; i++) {
		ok(elementsInExpectedTabOrder[i].elem.tabIndex > elementsInExpectedTabOrder[i - 1].elem.tabIndex,
			"Element " + elementsInExpectedTabOrder[i].name + " should have a greater tabIndex than element " + elementsInExpectedTabOrder[i - 1].name);
	}
});

test("The augmentation header and all related controls should be displayed in Augmentation mode", () => {
	let mockClipperState = getMockAugmentationModeState();
	let defaultComponent = <PreviewViewer clipperState={mockClipperState} />;
	HelperFunctions.mountToFixture(defaultComponent);

	ok(!document.getElementById(Constants.Ids.addRegionControl), "The region control should not exist");

	ok(document.getElementById(Constants.Ids.highlightControl), "The highlight control should exist");
	ok(document.getElementById(Constants.Ids.serifControl), "The font family control should exist");
	ok(document.getElementById(Constants.Ids.decrementFontSize), "The font size control should exist");
	ok(document.getElementById(Constants.Ids.incrementFontSize), "The font size control should exist");
});

test("The editable title of the page should be displayed in the preview title in Augmentation mode", () => {
	let mockClipperState = getMockAugmentationModeState();
	let defaultComponent = <PreviewViewer clipperState={mockClipperState} />;
	HelperFunctions.mountToFixture(defaultComponent);

	let previewHeaderInput = document.getElementById(Constants.Ids.previewHeaderInput) as HTMLTextAreaElement;
	strictEqual(previewHeaderInput.value, mockClipperState.previewGlobalInfo.previewTitleText,
		"The title of the page should be displayed in the preview title");
	ok(!previewHeaderInput.readOnly);
});

test("The augmented content of the page should be displayed in preview body in Augmentation Mode", () => {
	let mockClipperState = getMockAugmentationModeState();
	let defaultComponent = <PreviewViewer clipperState={mockClipperState} />;
	HelperFunctions.mountToFixture(defaultComponent);

	strictEqual(document.getElementById(Constants.Ids.previewBody).innerText,
		mockClipperState.augmentationPreviewInfo.previewBodyHtml,
		"The editable augmentation result content is displayed in the preview body");
});

test("When the augmentation successfully completes, but no data is returned, the preview should indicate no content was found in Augmentation mode", () => {
	let clipperState = HelperFunctions.getMockClipperState();
	clipperState.currentMode.set(ClipMode.Augmentation);
	clipperState.augmentationResult = {
		data: undefined,
		status: Status.Succeeded
	};
	HelperFunctions.mountToFixture(<PreviewViewer clipperState={clipperState} />);

	let previewHeaderInput = document.getElementById(Constants.Ids.previewHeaderInput) as HTMLTextAreaElement;
	strictEqual(previewHeaderInput.value, stringsJson["WebClipper.Preview.NoContentFound"],
		"The preview title should display a message indicating no content was found");
	ok(previewHeaderInput.readOnly);

	strictEqual(document.getElementById(Constants.Ids.previewBody).innerText, "",
		"The preview body should be empty");
});

test("When the call to augmentation has not started, the preview should indicate that it is loading in Augmentation mode", () => {
	let clipperState = HelperFunctions.getMockClipperState();
	clipperState.currentMode.set(ClipMode.Augmentation);
	clipperState.augmentationResult = {
		data: undefined,
		status: Status.NotStarted
	};
	HelperFunctions.mountToFixture(<PreviewViewer clipperState={clipperState} />);

	let previewHeaderInput = document.getElementById(Constants.Ids.previewHeaderInput) as HTMLTextAreaElement;
	strictEqual(previewHeaderInput.value, stringsJson["WebClipper.Preview.LoadingMessage"],
		"The preview title should display a loading message");
	ok(previewHeaderInput.readOnly);

	let previewBody = document.getElementById(Constants.Ids.previewBody);
	strictEqual(previewBody.getElementsByClassName(Constants.Classes.spinner).length, 1,
		"The spinner should be present in the preview body");
});

test("When augmentation is in progress, the preview should indicate that it is loading in Augmentation mode", () => {
	let clipperState = HelperFunctions.getMockClipperState();
	clipperState.currentMode.set(ClipMode.Augmentation);
	clipperState.augmentationResult = {
		data: undefined,
		status: Status.InProgress
	};
	HelperFunctions.mountToFixture(<PreviewViewer clipperState={clipperState} />);

	let previewHeaderInput = document.getElementById(Constants.Ids.previewHeaderInput) as HTMLTextAreaElement;
	strictEqual(previewHeaderInput.value, stringsJson["WebClipper.Preview.LoadingMessage"],
		"The preview title should display a loading message");
	ok(previewHeaderInput.readOnly);

	let previewBody = document.getElementById(Constants.Ids.previewBody);
	strictEqual(previewBody.getElementsByClassName(Constants.Classes.spinner).length, 1,
		"The spinner should be present in the preview body");
});

test("When the call to augmentation has not started, the preview should indicate that it is loading, even when data is defined in Augmentation mode", () => {
	let clipperState = HelperFunctions.getMockClipperState();
	clipperState.currentMode.set(ClipMode.Augmentation);
	clipperState.augmentationResult = {
		data: undefined,
		status: Status.NotStarted
	};
	HelperFunctions.mountToFixture(<PreviewViewer clipperState={clipperState} />);

	let previewHeaderInput = document.getElementById(Constants.Ids.previewHeaderInput) as HTMLTextAreaElement;
	strictEqual(previewHeaderInput.value, stringsJson["WebClipper.Preview.LoadingMessage"],
		"The preview title should display a loading message");
	ok(previewHeaderInput.readOnly);

	let previewBody = document.getElementById(Constants.Ids.previewBody);
	strictEqual(previewBody.getElementsByClassName(Constants.Classes.spinner).length, 1,
		"The spinner should be present in the preview body");
});

test("When augmentation is in progress, the preview should indicate that it is loading, even when data is defined in Augmentation mode", () => {
	let clipperState = HelperFunctions.getMockClipperState();
	clipperState.currentMode.set(ClipMode.Augmentation);
	clipperState.augmentationResult = {
		data: undefined,
		status: Status.InProgress
	};
	HelperFunctions.mountToFixture(<PreviewViewer clipperState={clipperState} />);

	let previewHeaderInput = document.getElementById(Constants.Ids.previewHeaderInput) as HTMLTextAreaElement;
	strictEqual(previewHeaderInput.value, stringsJson["WebClipper.Preview.LoadingMessage"],
		"The preview title should display a loading message");
	ok(previewHeaderInput.readOnly);

	let previewBody = document.getElementById(Constants.Ids.previewBody);
	strictEqual(previewBody.getElementsByClassName(Constants.Classes.spinner).length, 1,
		"The spinner should be present in the preview body");
});

test("When the augmentation response is a failure, the preview should display an error message in Augmentation mode", () => {
	let expectedMessage = "An error message.";

	let clipperState = HelperFunctions.getMockClipperState();
	clipperState.currentMode.set(ClipMode.Augmentation);
	clipperState.augmentationResult = {
		data: {
			failureMessage: expectedMessage
		},
		status: Status.Failed
	};
	HelperFunctions.mountToFixture(<PreviewViewer clipperState={clipperState} />);

	let previewHeaderInput = document.getElementById(Constants.Ids.previewHeaderInput) as HTMLTextAreaElement;
	strictEqual(previewHeaderInput.value, expectedMessage,
		"The title of the page should be displayed in the preview title");
	ok(previewHeaderInput.readOnly);
});

test("The default font-size and font-family should be the same as those specified in strings.json in Augmentation mode", () => {
	let mockClipperState = getMockAugmentationModeState();
	let defaultComponent = <PreviewViewer clipperState={mockClipperState} />;
	HelperFunctions.mountToFixture(defaultComponent);

	let previewBody = document.getElementById(Constants.Ids.previewBody);
	strictEqual(previewBody.style.fontSize, sansSerifDefaultFontSize);
	strictEqual(previewBody.style.fontFamily, sansSerifFontFamily);
});

test("On clicking Serif, the fontFamily should be changed to the fontFamily specified in strings.json, and then back upon clicking Sans-Serif in Augmentation mode", () => {
	let mockClipperState = getMockAugmentationModeState();
	let defaultComponent = <PreviewViewer clipperState={mockClipperState} />;
	HelperFunctions.mountToFixture(defaultComponent);

	let serifButton = document.getElementById(Constants.Ids.serif);
	let sansSerifButton = document.getElementById(Constants.Ids.sansSerif);

	HelperFunctions.simulateAction(() => {
		serifButton.click();
	});

	let previewBody = document.getElementById(Constants.Ids.previewBody);
	strictEqual(serifFontFamily, previewBody.style.fontFamily);

	HelperFunctions.simulateAction(() => {
		sansSerifButton.click();
	});

	strictEqual(sansSerifFontFamily, previewBody.style.fontFamily);
});

test("Clicking on the same fontFamily button multiple times should only set that fontFamily once in Augmentation mode", () => {
	let mockClipperState = getMockAugmentationModeState();
	let defaultComponent = <PreviewViewer clipperState={mockClipperState} />;
	HelperFunctions.mountToFixture(defaultComponent);

	let serifButton = document.getElementById(Constants.Ids.serif);

	HelperFunctions.simulateAction(() => {
		serifButton.click();
	});

	let previewBody = document.getElementById(Constants.Ids.previewBody);
	strictEqual(serifFontFamily, previewBody.style.fontFamily);

	HelperFunctions.simulateAction(() => {
		serifButton.click();
	});

	strictEqual(serifFontFamily, previewBody.style.fontFamily);
});

test("The default fontSize should be the sansSerif default fontSize, and should increment by two and decrement by two for each click on up and down respectively in Augmentation mode", () => {
	let mockClipperState = getMockAugmentationModeState();
	let defaultComponent = <PreviewViewer clipperState={mockClipperState} />;
	HelperFunctions.mountToFixture(defaultComponent);

	let increaseFontSizeButton = document.getElementById(Constants.Ids.incrementFontSize);
	let decreaseFontSizeButton = document.getElementById(Constants.Ids.decrementFontSize);

	let defaultFontSize = parseInt(sansSerifDefaultFontSize, 10);
	let largerFontSize = defaultFontSize + 2 * fontSizeStep;
	let smallerFontSize = defaultFontSize - fontSizeStep;

	let previewBody = document.getElementById(Constants.Ids.previewBody);
	strictEqual(parseInt(previewBody.style.fontSize, 10), parseInt(sansSerifDefaultFontSize, 10));

	HelperFunctions.simulateAction(() => {
		decreaseFontSizeButton.click();
	});

	strictEqual(parseInt(previewBody.style.fontSize, 10), smallerFontSize);

	HelperFunctions.simulateAction(() => {
		increaseFontSizeButton.click();
		increaseFontSizeButton.click();
		increaseFontSizeButton.click();
	});

	strictEqual(parseInt(previewBody.style.fontSize, 10), largerFontSize);
});

test("If the user tries to increase beyond the maximum fontSize for either Serif or SansSerif, it should cap at the max font size defined in strongs.json in Augmentation mode", () => {
	let maximumFontSize = Constants.Settings.maximumFontSize;
	let numClicks = (maximumFontSize - parseInt(sansSerifDefaultFontSize, 10)) / fontSizeStep;

	let mockClipperState = getMockAugmentationModeState();
	let defaultComponent = <PreviewViewer clipperState={mockClipperState} />;
	HelperFunctions.mountToFixture(defaultComponent);

	let increaseFontSizeButton = document.getElementById(Constants.Ids.incrementFontSize);
	let previewBody = document.getElementById(Constants.Ids.previewBody);

	HelperFunctions.simulateAction(() => {
		for (let i = 0; i < (numClicks + 5); i++) {
			increaseFontSizeButton.click();
		}
	});

	strictEqual(parseInt(previewBody.style.fontSize, 10), maximumFontSize);
});

test("If the user tries to decrease beyond the minimum fontSize for either Serif or SansSerif, it should reset at the minimum font size in Augmentation mode", () => {
	let minimumFontSize = Constants.Settings.minimumFontSize;
	let numClicks = (parseInt(sansSerifDefaultFontSize, 10) - minimumFontSize) / fontSizeStep;

	let mockClipperState = getMockAugmentationModeState();
	let defaultComponent = <PreviewViewer clipperState={mockClipperState} />;
	HelperFunctions.mountToFixture(defaultComponent);

	let decreaseFontSizeButton = document.getElementById(Constants.Ids.decrementFontSize);
	let previewBody = document.getElementById(Constants.Ids.previewBody);

	HelperFunctions.simulateAction(() => {
		for (let i = 0; i < (numClicks + 5); i++) {
			decreaseFontSizeButton.click();
		}
	});

	strictEqual(parseInt(previewBody.style.fontSize, 10), minimumFontSize);
});

test("If the user clicks the highlight button, the internal state should show that 'Highlighting' is enabled in Augmentation mode", () => {
	let mockClipperState = getMockAugmentationModeState();
	let defaultComponent = <AugmentationPreview clipperState={mockClipperState} />;
	let augmentationPreview = HelperFunctions.mountToFixture(defaultComponent);

	let highlightButton = document.getElementById(Constants.Ids.highlightButton);

	HelperFunctions.simulateAction(() => {
		highlightButton.click();
	});

	ok(augmentationPreview.state.highlighterEnabled);
});

test("If the user is highlighting (i.e., highlighting mode is active), then the 'active' class should be applied to the highlightButton in Augmentation mode", () => {
	let mockClipperState = getMockAugmentationModeState();
	let defaultComponent = <PreviewViewer clipperState={mockClipperState} />;
	HelperFunctions.mountToFixture(defaultComponent);

	let highlightButton = document.getElementById(Constants.Ids.highlightButton);

	HelperFunctions.simulateAction(() => {
		highlightButton.click();
	});

	// We do this to manually trigger a config call
	HelperFunctions.simulateAction(() => {});
	notStrictEqual(highlightButton.className.indexOf("active"), -1, "The active class should be applied to the highlight button");
});

test("If the user is not highlighting (i.e., highlighting mode is active), then the 'active' class should not be applied to the highlightButton in Augmentation mode", () => {
	let mockClipperState = getMockAugmentationModeState();
	let defaultComponent = <PreviewViewer clipperState={mockClipperState} />;
	HelperFunctions.mountToFixture(defaultComponent);

	let highlightButton = document.getElementById(Constants.Ids.highlightButton);

	strictEqual(highlightButton.className.indexOf("active"), -1, "The active class should not be applied to the highlight button");
});

test("If the editable title feature is disabled, it should be readonly", () => {
	let mockClipperState = getMockAugmentationModeState();
	mockClipperState.injectOptions.enableEditableTitle = false;
	let defaultComponent = <PreviewViewer clipperState={mockClipperState} />;
	HelperFunctions.mountToFixture(defaultComponent);

	let previewHeaderInput = document.getElementById(Constants.Ids.previewHeaderInput) as HTMLTextAreaElement;
	strictEqual(previewHeaderInput.value, mockClipperState.previewGlobalInfo.previewTitleText,
		"The title of the page should be displayed in the preview title");
	ok(previewHeaderInput.readOnly);
});

test("If the add a note feature is enabled, the annotation input should be rendered", () => {
	let mockClipperStateProps = HelperFunctions.getMockClipperState();
	mockClipperStateProps.injectOptions.enableAddANote = true;

	let defaultComponent = <PreviewViewer clipperState={mockClipperStateProps} />;
	HelperFunctions.mountToFixture(defaultComponent);

	ok(document.getElementById(Constants.Ids.annotationContainer),
		"The annotation field should be present");
});

test("If the add a note feature is disable, the annotation input should not be rendered", () => {
	let mockClipperStateProps = HelperFunctions.getMockClipperState();
	mockClipperStateProps.injectOptions.enableAddANote = false;

	let defaultComponent = <PreviewViewer clipperState={mockClipperStateProps} />;
	HelperFunctions.mountToFixture(defaultComponent);

	ok(!document.getElementById(Constants.Ids.annotationContainer),
		"The annotation field should not be present");
});
