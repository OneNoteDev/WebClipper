import {Constants} from "../../../scripts/constants";

import {ClipMode} from "../../../scripts/clipperUI/clipMode";
import {ClipperState} from "../../../scripts/clipperUI/clipperState";
import {Status} from "../../../scripts/clipperUI/status";

import {OptionsPanel, OptionsPanelProp} from "../../../scripts/clipperUI/panels/optionsPanel";

import {AugmentationModel} from "../../../scripts/contentCapture/augmentationHelper";

import {HelperFunctions} from "../../helperFunctions";

import {MockPdfDocument, MockPdfValues} from "../../contentCapture/mockPdfDocument";

let mockOptionsPanelProps: OptionsPanelProp;
let onStartClipCalled: boolean;
QUnit.module("optionsPanel", {
	beforeEach: () => {
		let mockState = HelperFunctions.getMockClipperState();
		mockOptionsPanelProps = {
			onStartClip: () => { onStartClipCalled = true; },
			onPopupToggle: (shouldNowBeOpen: boolean) => { },
			clipperState: mockState
		};

		onStartClipCalled = false;
	}
});

function assertClipButtonAvailability(isAvailable: boolean) {
	let clipButton = document.getElementById(Constants.Ids.clipButton);
	ok(clipButton, "The clip button should be present");

	let clipButtonContainer = document.getElementById(Constants.Ids.clipButtonContainer);
	ok(clipButtonContainer, "The clip button container should always be present");
	strictEqual(!clipButtonContainer.classList.contains("disabled"), isAvailable,
		"The clip button container should indicate that the button is active if it is available");

	HelperFunctions.simulateAction(() => {
		clipButton.click();
	});

	strictEqual(onStartClipCalled, isAvailable, "The onStartClip callback should be called only if it's available");
}

test("If the current mode is full page and its call to the API has succeeded, the clip button should be active and clickable", () => {
	mockOptionsPanelProps.clipperState.currentMode.set(ClipMode.FullPage);
	mockOptionsPanelProps.clipperState.fullPageResult.status = Status.Succeeded;
	HelperFunctions.mountToFixture(<OptionsPanel onStartClip={mockOptionsPanelProps.onStartClip}
		onPopupToggle={mockOptionsPanelProps.onPopupToggle} clipperState={mockOptionsPanelProps.clipperState} />);

	assertClipButtonAvailability(true);
});

test("If the current mode is full page and its call to the API is in progress, the clip button should not be active or clickable", () => {
	mockOptionsPanelProps.clipperState.currentMode.set(ClipMode.FullPage);
	mockOptionsPanelProps.clipperState.fullPageResult.status = Status.InProgress;
	HelperFunctions.mountToFixture(<OptionsPanel onStartClip={mockOptionsPanelProps.onStartClip}
		onPopupToggle={mockOptionsPanelProps.onPopupToggle} clipperState={mockOptionsPanelProps.clipperState} />);

	assertClipButtonAvailability(false);
});

test("If the current mode is full page and its call to the API failed, the clip button should not be active or clickable", () => {
	mockOptionsPanelProps.clipperState.currentMode.set(ClipMode.FullPage);
	mockOptionsPanelProps.clipperState.fullPageResult.status = Status.Failed;
	HelperFunctions.mountToFixture(<OptionsPanel onStartClip={mockOptionsPanelProps.onStartClip}
		onPopupToggle={mockOptionsPanelProps.onPopupToggle} clipperState={mockOptionsPanelProps.clipperState} />);

	assertClipButtonAvailability(false);
});

test("If the current mode is region and there are regions selected, the clip button should be active and clickable", () => {
	mockOptionsPanelProps.clipperState.currentMode.set(ClipMode.Region);
	mockOptionsPanelProps.clipperState.regionResult.status = Status.Succeeded;
	mockOptionsPanelProps.clipperState.regionResult.data = ["src1", "src2"];
	HelperFunctions.mountToFixture(<OptionsPanel onStartClip={mockOptionsPanelProps.onStartClip}
		onPopupToggle={mockOptionsPanelProps.onPopupToggle} clipperState={mockOptionsPanelProps.clipperState} />);

	assertClipButtonAvailability(true);
});

test("If the current mode is region and there are no regions selected, the clip button should not be active or clickable", () => {
	mockOptionsPanelProps.clipperState.currentMode.set(ClipMode.Region);
	mockOptionsPanelProps.clipperState.regionResult.status = Status.Succeeded;
	mockOptionsPanelProps.clipperState.regionResult.data = [];
	HelperFunctions.mountToFixture(<OptionsPanel onStartClip={mockOptionsPanelProps.onStartClip}
		onPopupToggle={mockOptionsPanelProps.onPopupToggle} clipperState={mockOptionsPanelProps.clipperState} />);

	assertClipButtonAvailability(false);
});

test("If the current mode is region and the status is NotStarted, the clip button should not be active or clickable", () => {
	mockOptionsPanelProps.clipperState.currentMode.set(ClipMode.Region);
	mockOptionsPanelProps.clipperState.regionResult.status = Status.NotStarted;
	mockOptionsPanelProps.clipperState.regionResult.data = [];
	HelperFunctions.mountToFixture(<OptionsPanel onStartClip={mockOptionsPanelProps.onStartClip}
		onPopupToggle={mockOptionsPanelProps.onPopupToggle} clipperState={mockOptionsPanelProps.clipperState} />);

	assertClipButtonAvailability(false);
});

test("If the current mode is region and the status is InProgress, the clip button should not be active or clickable", () => {
	mockOptionsPanelProps.clipperState.currentMode.set(ClipMode.Region);
	mockOptionsPanelProps.clipperState.regionResult.status = Status.InProgress;
	mockOptionsPanelProps.clipperState.regionResult.data = [];
	HelperFunctions.mountToFixture(<OptionsPanel onStartClip={mockOptionsPanelProps.onStartClip}
		onPopupToggle={mockOptionsPanelProps.onPopupToggle} clipperState={mockOptionsPanelProps.clipperState} />);

	assertClipButtonAvailability(false);
});

test("If the current mode is region and the status is InProgress and has images already stored, the clip button should not be active or clickable", () => {
	mockOptionsPanelProps.clipperState.currentMode.set(ClipMode.Region);
	mockOptionsPanelProps.clipperState.regionResult.status = Status.InProgress;
	mockOptionsPanelProps.clipperState.regionResult.data = ["src1", "src2"];
	HelperFunctions.mountToFixture(<OptionsPanel onStartClip={mockOptionsPanelProps.onStartClip}
		onPopupToggle={mockOptionsPanelProps.onPopupToggle} clipperState={mockOptionsPanelProps.clipperState} />);

	assertClipButtonAvailability(false);
});

test("If the current mode is selection and the status is succeeded and has a text stored in clipperState, the clip button should be active and clickable", () => {
	mockOptionsPanelProps.clipperState.currentMode.set(ClipMode.Selection);
	mockOptionsPanelProps.clipperState.selectionPreviewInfo.previewBodyHtml = "hello world";
	HelperFunctions.mountToFixture(<OptionsPanel onStartClip={mockOptionsPanelProps.onStartClip}
		onPopupToggle={mockOptionsPanelProps.onPopupToggle} clipperState={mockOptionsPanelProps.clipperState} />);

	assertClipButtonAvailability(true);
});

test("If the current mode is augmentation and the status is succeeded and has content stored in clipperState, the clip button should be active and clickable", () => {
	mockOptionsPanelProps.clipperState.currentMode.set(ClipMode.Augmentation);
	mockOptionsPanelProps.clipperState.augmentationResult.status = Status.Succeeded;
	mockOptionsPanelProps.clipperState.augmentationResult.data = {
		ContentInHtml: "hello article",
		ContentModel: AugmentationModel.Article
	};
	HelperFunctions.mountToFixture(<OptionsPanel onStartClip={mockOptionsPanelProps.onStartClip}
		onPopupToggle={mockOptionsPanelProps.onPopupToggle} clipperState={mockOptionsPanelProps.clipperState} />);

	assertClipButtonAvailability(true);
});

test("If the current mode is augmentation and the status is succeeded and has content stored in clipperState as a recipe, the clip button should be active and clickable", () => {
	mockOptionsPanelProps.clipperState.currentMode.set(ClipMode.Augmentation);
	mockOptionsPanelProps.clipperState.augmentationResult.status = Status.Succeeded;
	mockOptionsPanelProps.clipperState.augmentationResult.data = {
		ContentInHtml: "hello article",
		ContentModel: AugmentationModel.Recipe
	};
	HelperFunctions.mountToFixture(<OptionsPanel onStartClip={mockOptionsPanelProps.onStartClip}
		onPopupToggle={mockOptionsPanelProps.onPopupToggle} clipperState={mockOptionsPanelProps.clipperState} />);

	assertClipButtonAvailability(true);
});

test("If the current mode is augmentation and the status is succeeded but no content was found, the clip button should not be active or clickable", () => {
	mockOptionsPanelProps.clipperState.currentMode.set(ClipMode.Augmentation);
	mockOptionsPanelProps.clipperState.augmentationResult.status = Status.Succeeded;
	mockOptionsPanelProps.clipperState.augmentationResult.data = {
		ContentInHtml: "",
		ContentModel: AugmentationModel.None
	};
	HelperFunctions.mountToFixture(<OptionsPanel onStartClip={mockOptionsPanelProps.onStartClip}
		onPopupToggle={mockOptionsPanelProps.onPopupToggle} clipperState={mockOptionsPanelProps.clipperState} />);

	assertClipButtonAvailability(false);
});

test("If the current mode is augmentation and the status is succeeded but no content was found, and ContentInHtml is undefined, the clip button should not be active or clickable", () => {
	mockOptionsPanelProps.clipperState.currentMode.set(ClipMode.Augmentation);
	mockOptionsPanelProps.clipperState.augmentationResult.status = Status.Succeeded;
	mockOptionsPanelProps.clipperState.augmentationResult.data = {
		ContentInHtml: undefined,
		ContentModel: AugmentationModel.None
	};
	HelperFunctions.mountToFixture(<OptionsPanel onStartClip={mockOptionsPanelProps.onStartClip}
		onPopupToggle={mockOptionsPanelProps.onPopupToggle} clipperState={mockOptionsPanelProps.clipperState} />);

	assertClipButtonAvailability(false);
});

test("If the current mode is augmentation and the status is in progress, the clip button should not be active or clickable", () => {
	mockOptionsPanelProps.clipperState.currentMode.set(ClipMode.Augmentation);
	mockOptionsPanelProps.clipperState.augmentationResult.status = Status.InProgress;
	HelperFunctions.mountToFixture(<OptionsPanel onStartClip={mockOptionsPanelProps.onStartClip}
		onPopupToggle={mockOptionsPanelProps.onPopupToggle} clipperState={mockOptionsPanelProps.clipperState} />);

	assertClipButtonAvailability(false);
});

test("If the current mode is augmentation and the status indicates failure, the clip button should not be active or clickable", () => {
	mockOptionsPanelProps.clipperState.currentMode.set(ClipMode.Augmentation);
	mockOptionsPanelProps.clipperState.augmentationResult.status = Status.Failed;
	HelperFunctions.mountToFixture(<OptionsPanel onStartClip={mockOptionsPanelProps.onStartClip}
		onPopupToggle={mockOptionsPanelProps.onPopupToggle} clipperState={mockOptionsPanelProps.clipperState} />);

	assertClipButtonAvailability(false);
});

test("If the current mode is bookmark and the status indicates success, the clip button should should be active and clickable", () => {
	mockOptionsPanelProps.clipperState.currentMode.set(ClipMode.Bookmark);
	mockOptionsPanelProps.clipperState.bookmarkResult.status = Status.Succeeded;
	mockOptionsPanelProps.clipperState.bookmarkResult.data = {
		title: "title",
		url: "mywebsite.website.com.website",
	};
	HelperFunctions.mountToFixture(<OptionsPanel onStartClip={mockOptionsPanelProps.onStartClip}
		onPopupToggle={mockOptionsPanelProps.onPopupToggle} clipperState={mockOptionsPanelProps.clipperState} />);

	assertClipButtonAvailability(true);
});

test("If the current mode is bookmark and the status indicates failure, the clip button should not be active or clickable", () => {
	mockOptionsPanelProps.clipperState.currentMode.set(ClipMode.Bookmark);
	mockOptionsPanelProps.clipperState.bookmarkResult.status = Status.Failed;
	HelperFunctions.mountToFixture(<OptionsPanel onStartClip={mockOptionsPanelProps.onStartClip}
		onPopupToggle={mockOptionsPanelProps.onPopupToggle} clipperState={mockOptionsPanelProps.clipperState} />);

	assertClipButtonAvailability(false);
});

test("If the current mode is bookmark and the status indicates InProgress, the clip button should not be active or clickable", () => {
	mockOptionsPanelProps.clipperState.currentMode.set(ClipMode.Bookmark);
	mockOptionsPanelProps.clipperState.bookmarkResult.status = Status.InProgress;
	HelperFunctions.mountToFixture(<OptionsPanel onStartClip={mockOptionsPanelProps.onStartClip}
		onPopupToggle={mockOptionsPanelProps.onPopupToggle} clipperState={mockOptionsPanelProps.clipperState} />);

	assertClipButtonAvailability(false);
});

test("If the current mode is bookmark and the status indicates NotStarted, the clip button should not be active or clickable", () => {
	mockOptionsPanelProps.clipperState.currentMode.set(ClipMode.Bookmark);
	mockOptionsPanelProps.clipperState.bookmarkResult.status = Status.NotStarted;
	HelperFunctions.mountToFixture(<OptionsPanel onStartClip={mockOptionsPanelProps.onStartClip}
		onPopupToggle={mockOptionsPanelProps.onPopupToggle} clipperState={mockOptionsPanelProps.clipperState} />);

	assertClipButtonAvailability(false);
});

test("If the current mode is PDF and the status indicates Succeeded, and AllPages is selected, the clip button should be active and clickable", () => {
	mockOptionsPanelProps.clipperState.currentMode.set(ClipMode.Pdf);
	mockOptionsPanelProps.clipperState.pdfResult.status = Status.Succeeded;
	mockOptionsPanelProps.clipperState.pdfResult.data.set({
		pdf: new MockPdfDocument(),
		viewportDimensions: MockPdfValues.dimensions,
		byteLength: MockPdfValues.byteLength,
	});
	mockOptionsPanelProps.clipperState.pdfPreviewInfo = {
		allPages: true,
		isLocalFileAndNotAllowed: true,
		selectedPageRange: ""
	};
	HelperFunctions.mountToFixture(<OptionsPanel onStartClip={mockOptionsPanelProps.onStartClip}
		onPopupToggle={mockOptionsPanelProps.onPopupToggle} clipperState={mockOptionsPanelProps.clipperState} />);

	assertClipButtonAvailability(true);
});

test("If the current mode is PDF and the status indicates Succeeded, and AllPages is selected, even though a custom selection was made as well, the clip button should be active and clickable", () => {
	mockOptionsPanelProps.clipperState.currentMode.set(ClipMode.Pdf);
	mockOptionsPanelProps.clipperState.pdfResult.status = Status.Succeeded;
	mockOptionsPanelProps.clipperState.pdfResult.data.set({
		pdf: new MockPdfDocument(),
		viewportDimensions: MockPdfValues.dimensions,
		byteLength: MockPdfValues.byteLength,
	});
	mockOptionsPanelProps.clipperState.pdfPreviewInfo = {
		allPages: true,
		isLocalFileAndNotAllowed: true,
		selectedPageRange: "1--3invalid",
	};
	HelperFunctions.mountToFixture(<OptionsPanel onStartClip={mockOptionsPanelProps.onStartClip}
		onPopupToggle={mockOptionsPanelProps.onPopupToggle} clipperState={mockOptionsPanelProps.clipperState} />);

	assertClipButtonAvailability(true);
});

test("If the current mode is PDF and the status indicates Succeeded, and a valid page selection is selected, the clip button should be active and clickable", () => {
	mockOptionsPanelProps.clipperState.currentMode.set(ClipMode.Pdf);
	mockOptionsPanelProps.clipperState.pdfResult.status = Status.Succeeded;
	mockOptionsPanelProps.clipperState.pdfResult.data.set({
		pdf: new MockPdfDocument(),
		viewportDimensions: MockPdfValues.dimensions,
		byteLength: MockPdfValues.byteLength,
	});
	mockOptionsPanelProps.clipperState.pdfPreviewInfo = {
		allPages: false,
		isLocalFileAndNotAllowed: true,
		selectedPageRange: "1-3",
	};
	HelperFunctions.mountToFixture(<OptionsPanel onStartClip={mockOptionsPanelProps.onStartClip}
		onPopupToggle={mockOptionsPanelProps.onPopupToggle} clipperState={mockOptionsPanelProps.clipperState} />);

	assertClipButtonAvailability(true);
});

test("If the current mode is PDF and the status indicates Succeeded, and an invalid page selection is selected, the clip button should not be active or clickable", () => {
	mockOptionsPanelProps.clipperState.currentMode.set(ClipMode.Pdf);
	mockOptionsPanelProps.clipperState.pdfResult.status = Status.Succeeded;
	mockOptionsPanelProps.clipperState.pdfResult.data.set({
		pdf: new MockPdfDocument(),
		viewportDimensions: MockPdfValues.dimensions,
		byteLength: MockPdfValues.byteLength,
	});
	mockOptionsPanelProps.clipperState.pdfPreviewInfo = {
		allPages: false,
		isLocalFileAndNotAllowed: true,
		selectedPageRange: "1-3,5,6-",
	};
	HelperFunctions.mountToFixture(<OptionsPanel onStartClip={mockOptionsPanelProps.onStartClip}
		onPopupToggle={mockOptionsPanelProps.onPopupToggle} clipperState={mockOptionsPanelProps.clipperState} />);

	assertClipButtonAvailability(false);
});

test("If the current mode is PDF and the status indicates Succeeded, and a syntactically correct but out-of-bounds selection is selected, the clip button should not be active or clickable", () => {
	mockOptionsPanelProps.clipperState.currentMode.set(ClipMode.Pdf);
	mockOptionsPanelProps.clipperState.pdfResult.status = Status.Succeeded;
	mockOptionsPanelProps.clipperState.pdfResult.data.set({
		pdf: new MockPdfDocument(),
		viewportDimensions: MockPdfValues.dimensions,
		byteLength: MockPdfValues.byteLength,
	});
	mockOptionsPanelProps.clipperState.pdfPreviewInfo = {
		allPages: false,
		isLocalFileAndNotAllowed: true,
		selectedPageRange: "4", // There are only 3 pages in the mock pdf
	};
	HelperFunctions.mountToFixture(<OptionsPanel onStartClip={mockOptionsPanelProps.onStartClip}
		onPopupToggle={mockOptionsPanelProps.onPopupToggle} clipperState={mockOptionsPanelProps.clipperState} />);

	assertClipButtonAvailability(false);
});

test("If the current mode is PDF and the status indicates Succeeded, and an empty page selection is selected, the clip button should not be active or clickable", () => {
	mockOptionsPanelProps.clipperState.currentMode.set(ClipMode.Pdf);
	mockOptionsPanelProps.clipperState.pdfResult.status = Status.Succeeded;
	mockOptionsPanelProps.clipperState.pdfResult.data.set({
		pdf: new MockPdfDocument(),
		viewportDimensions: MockPdfValues.dimensions,
		byteLength: MockPdfValues.byteLength,
	});
	mockOptionsPanelProps.clipperState.pdfPreviewInfo = {
		allPages: false,
		isLocalFileAndNotAllowed: true,
		selectedPageRange: "",
	};
	HelperFunctions.mountToFixture(<OptionsPanel onStartClip={mockOptionsPanelProps.onStartClip}
		onPopupToggle={mockOptionsPanelProps.onPopupToggle} clipperState={mockOptionsPanelProps.clipperState} />);

	assertClipButtonAvailability(false);
});

test("If the current mode is PDF and the status indicates Succeeded, and an undefined page selection is selected, the clip button should not be active or clickable", () => {
	mockOptionsPanelProps.clipperState.currentMode.set(ClipMode.Pdf);
	mockOptionsPanelProps.clipperState.pdfResult.status = Status.Succeeded;
	mockOptionsPanelProps.clipperState.pdfResult.data.set({
		pdf: new MockPdfDocument(),
		viewportDimensions: MockPdfValues.dimensions,
		byteLength: MockPdfValues.byteLength,
	});
	mockOptionsPanelProps.clipperState.pdfPreviewInfo = {
		allPages: false,
		isLocalFileAndNotAllowed: true,
	};
	HelperFunctions.mountToFixture(<OptionsPanel onStartClip={mockOptionsPanelProps.onStartClip}
		onPopupToggle={mockOptionsPanelProps.onPopupToggle} clipperState={mockOptionsPanelProps.clipperState} />);

	assertClipButtonAvailability(false);
});

test("If the current mode is PDF and the status indicates Succeeded, but the file is local and it was not allowed, the clip button should not be active or clickable", () => {
	mockOptionsPanelProps.clipperState.currentMode.set(ClipMode.Pdf);
	mockOptionsPanelProps.clipperState.pdfResult.status = Status.Succeeded;
	mockOptionsPanelProps.clipperState.pdfResult.data.set({
		pdf: new MockPdfDocument(),
		viewportDimensions: MockPdfValues.dimensions,
		byteLength: MockPdfValues.byteLength,
	});
	mockOptionsPanelProps.clipperState.pdfPreviewInfo = {
		allPages: true,
		isLocalFileAndNotAllowed: false,
		selectedPageRange: "",
	};
	HelperFunctions.mountToFixture(<OptionsPanel onStartClip={mockOptionsPanelProps.onStartClip}
		onPopupToggle={mockOptionsPanelProps.onPopupToggle} clipperState={mockOptionsPanelProps.clipperState} />);

	assertClipButtonAvailability(false);
});

test("If the current mode is PDF and the status indicates InProgress, the clip button should not be active or clickable", () => {
	mockOptionsPanelProps.clipperState.currentMode.set(ClipMode.Pdf);
	mockOptionsPanelProps.clipperState.pdfResult.status = Status.InProgress;
	HelperFunctions.mountToFixture(<OptionsPanel onStartClip={mockOptionsPanelProps.onStartClip}
		onPopupToggle={mockOptionsPanelProps.onPopupToggle} clipperState={mockOptionsPanelProps.clipperState} />);

	assertClipButtonAvailability(false);
});

test("If the current mode is PDF and the status indicates NotStarted, the clip button should not be active or clickable", () => {
	mockOptionsPanelProps.clipperState.currentMode.set(ClipMode.Pdf);
	mockOptionsPanelProps.clipperState.pdfResult.status = Status.InProgress;
	HelperFunctions.mountToFixture(<OptionsPanel onStartClip={mockOptionsPanelProps.onStartClip}
		onPopupToggle={mockOptionsPanelProps.onPopupToggle} clipperState={mockOptionsPanelProps.clipperState} />);

	assertClipButtonAvailability(false);
});

test("If the current mode is PDF and the status indicates failure, the clip button should not be active or clickable", () => {
	mockOptionsPanelProps.clipperState.currentMode.set(ClipMode.Pdf);
	mockOptionsPanelProps.clipperState.pdfResult.status = Status.Failed;
	HelperFunctions.mountToFixture(<OptionsPanel onStartClip={mockOptionsPanelProps.onStartClip}
		onPopupToggle={mockOptionsPanelProps.onPopupToggle} clipperState={mockOptionsPanelProps.clipperState} />);

	assertClipButtonAvailability(false);
});
