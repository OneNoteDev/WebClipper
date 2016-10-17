import {AugmentationModel} from "../../../scripts/contentCapture/augmentationHelper";

import {ModeButtonSelector} from "../../../scripts/clipperUI/components/modeButtonSelector";

import {ClipMode} from "../../../scripts/clipperUI/clipMode";
import {Status} from "../../../scripts/clipperUI/status";

import {SmartValue} from "../../../scripts/communicator/smartValue";

import {InvokeMode} from "../../../scripts/extensions/invokeOptions";

import {ClientType} from "../../../scripts/clientType";

import {HelperFunctions} from "../../helperFunctions";

// These are not available in constants.ts as we currently dynamically generate them
// at runtime
export module TestConstants {
	export module Classes {
		export var icon = "icon";
		export var label = "label";
		export var modeButton = "modeButton";
		export var selected = "selected";
	}

	export module Ids {
		export var pdfButton = "pdfButton";
		export var fullPageButton = "fullPageButton";
		export var regionButton = "regionButton";
		export var augmentationButton = "augmentationButton";
		export var selectionButton = "selectionButton";
		export var bookmarkButton = "bookmarkButton";
	}
}

declare function require(name: string);
let stringsJson = require("../../../strings.json");

let defaultComponent;
QUnit.module("modeButtonSelector", {
	beforeEach: () => {
		defaultComponent =
			<ModeButtonSelector clipperState={ HelperFunctions.getMockClipperState() } />;
	}
});

test("The region clipping button should not appear when enableRegionClipping is injected as false", () => {
	let startingState = HelperFunctions.getMockClipperState();
	startingState.injectOptions.enableRegionClipping = false;
	HelperFunctions.mountToFixture(
		<ModeButtonSelector clipperState={ startingState } />);

	let modeButtonSelector = HelperFunctions.getFixture().firstElementChild;
	let buttonElements = modeButtonSelector.getElementsByClassName(TestConstants.Classes.modeButton);

	strictEqual(buttonElements.length, 3, "There should only be three mode buttons");
	strictEqual(buttonElements[0].id, TestConstants.Ids.fullPageButton, "The first button should be the full page button");
	strictEqual(buttonElements[1].id, TestConstants.Ids.augmentationButton, "The second button should be the augmentation button");
	strictEqual(buttonElements[2].id, TestConstants.Ids.bookmarkButton, "The third button should be the bookmark button");
});

test("The region clipping button should appear when enableRegionClipping is injected as true", () => {
	HelperFunctions.mountToFixture(defaultComponent);

	let modeButtonSelector = HelperFunctions.getFixture().firstElementChild;
	let buttonElements = modeButtonSelector.getElementsByClassName(TestConstants.Classes.modeButton);

	strictEqual(buttonElements.length, 4, "There should be four mode buttons");
	strictEqual(buttonElements[0].id, TestConstants.Ids.fullPageButton, "The first button should be the full page button");
	strictEqual(buttonElements[1].id, TestConstants.Ids.regionButton, "The second button should be the region button");
	strictEqual(buttonElements[2].id, TestConstants.Ids.augmentationButton, "The third button should be the augmentation button");
	strictEqual(buttonElements[3].id, TestConstants.Ids.bookmarkButton, "The fourth button should be the bookmark button");
});

test("The region clipping button should appear when enableRegionClipping is injected as false, but invokeMode is set to image selection", () => {
	let startingState = HelperFunctions.getMockClipperState();
	startingState.injectOptions.enableRegionClipping = false;
	startingState.invokeOptions.invokeMode = InvokeMode.ContextImage;
	HelperFunctions.mountToFixture(
		<ModeButtonSelector clipperState={ startingState } />);

	let modeButtonSelector = HelperFunctions.getFixture().firstElementChild;
	let buttonElements = modeButtonSelector.getElementsByClassName(TestConstants.Classes.modeButton);

	strictEqual(buttonElements.length, 4, "There should be four mode buttons");
	strictEqual(buttonElements[0].id, TestConstants.Ids.fullPageButton, "The first button should be the full page button");
	strictEqual(buttonElements[1].id, TestConstants.Ids.regionButton, "The second button should be the region button");
	strictEqual(buttonElements[2].id, TestConstants.Ids.augmentationButton, "The third button should be the augmentation button");
	strictEqual(buttonElements[3].id, TestConstants.Ids.bookmarkButton, "The fourth button should be the bookmark button");
});

test("The region button should be labeled 'Region' in non-Edge browsers", () => {
	let startingState = HelperFunctions.getMockClipperState();
	startingState.clientInfo.clipperType = ClientType.ChromeExtension;
	HelperFunctions.mountToFixture(
		<ModeButtonSelector clipperState={ startingState } />);

	let modeButtonSelector = HelperFunctions.getFixture().firstElementChild;
	let buttonElements = modeButtonSelector.getElementsByClassName(TestConstants.Classes.modeButton);
	let regionButton = buttonElements[1];
	let label = regionButton.getElementsByClassName(TestConstants.Classes.label)[0] as Node;
	strictEqual(label.textContent, stringsJson["WebClipper.ClipType.Region.Button"]);
});

test("The region button should be labeled 'Region' in non-Edge browsers and an image was selected", () => {
	let startingState = HelperFunctions.getMockClipperState();
	startingState.clientInfo.clipperType = ClientType.FirefoxExtension;
	startingState.invokeOptions = {
		invokeMode: InvokeMode.ContextImage,
		invokeDataForMode: "dummy-img"
	};
	HelperFunctions.mountToFixture(
		<ModeButtonSelector clipperState={ startingState } />);

	let modeButtonSelector = HelperFunctions.getFixture().firstElementChild;
	let buttonElements = modeButtonSelector.getElementsByClassName(TestConstants.Classes.modeButton);
	let regionButton = buttonElements[1];
	let label = regionButton.getElementsByClassName(TestConstants.Classes.label)[0] as Node;
	strictEqual(label.textContent, stringsJson["WebClipper.ClipType.Region.Button"]);
});

test("The region button should be labeled 'Image' in Edge and an image was selected", () => {
	let startingState = HelperFunctions.getMockClipperState();
	startingState.clientInfo.clipperType = ClientType.EdgeExtension;
	startingState.invokeOptions = {
		invokeMode: InvokeMode.ContextImage,
		invokeDataForMode: "dummy-img"
	};
	HelperFunctions.mountToFixture(
		<ModeButtonSelector clipperState={ startingState } />);

	let modeButtonSelector = HelperFunctions.getFixture().firstElementChild;
	let buttonElements = modeButtonSelector.getElementsByClassName(TestConstants.Classes.modeButton);
	let imageButton = buttonElements[1];
	let label = imageButton.getElementsByClassName(TestConstants.Classes.label)[0] as Node;
	strictEqual(label.textContent, stringsJson["WebClipper.ClipType.Image.Button"]);
});

test("The selection button should appear when invokeMode is set to selection", () => {
	let startingState = HelperFunctions.getMockClipperState();
	startingState.invokeOptions.invokeMode = InvokeMode.ContextTextSelection;
	HelperFunctions.mountToFixture(
		<ModeButtonSelector clipperState={ startingState } />);

	let modeButtonSelector = HelperFunctions.getFixture().firstElementChild;
	let buttonElements = modeButtonSelector.getElementsByClassName(TestConstants.Classes.modeButton);

	strictEqual(buttonElements.length, 5, "There should be five mode buttons");
	strictEqual(buttonElements[0].id, TestConstants.Ids.fullPageButton, "The first button should be the full page button");
	strictEqual(buttonElements[1].id, TestConstants.Ids.regionButton, "The second button should be the region button");
	strictEqual(buttonElements[2].id, TestConstants.Ids.augmentationButton, "The third button should be the augmentation button");
	strictEqual(buttonElements[3].id, TestConstants.Ids.selectionButton, "The fourth button should be the selection button");
	strictEqual(buttonElements[4].id, TestConstants.Ids.bookmarkButton, "The fifth button should be the bookmark button");
});

test("The selection button should appear when invokeMode is set to selection, and the region button should not appear when its disabled", () => {
	let startingState = HelperFunctions.getMockClipperState();
	startingState.injectOptions.enableRegionClipping = false;
	startingState.invokeOptions.invokeMode = InvokeMode.ContextTextSelection;
	HelperFunctions.mountToFixture(
		<ModeButtonSelector clipperState={ startingState } />);

	let modeButtonSelector = HelperFunctions.getFixture().firstElementChild;
	let buttonElements = modeButtonSelector.getElementsByClassName(TestConstants.Classes.modeButton);

	strictEqual(buttonElements.length, 4, "There should be four mode buttons");
	strictEqual(buttonElements[0].id, TestConstants.Ids.fullPageButton, "The first button should be the full page button");
	strictEqual(buttonElements[1].id, TestConstants.Ids.augmentationButton, "The second button should be the augmentation button");
	strictEqual(buttonElements[2].id, TestConstants.Ids.selectionButton, "The third button should be the selection button");
	strictEqual(buttonElements[3].id, TestConstants.Ids.bookmarkButton, "The fourth button should be the bookmark button");
});

test("The tabbing should flow in element order, assuming they are all available, and each tab index should not be less than 1", () => {
	let startingState = HelperFunctions.getMockClipperState();
	startingState.invokeOptions.invokeMode = InvokeMode.ContextTextSelection;
	HelperFunctions.mountToFixture(
		<ModeButtonSelector clipperState={ startingState } />);

	let modeButtonSelector = HelperFunctions.getFixture().firstElementChild;
	let buttonElements = modeButtonSelector.getElementsByClassName(TestConstants.Classes.modeButton);

	for (let i = 1; i < buttonElements.length; i++) {
		ok((buttonElements[i] as HTMLElement).tabIndex > (buttonElements[i - 1] as HTMLElement).tabIndex,
			"Elements tab indexes should be in ascending order");
	}

	for (let i = 0; i < buttonElements.length; i++) {
		ok((buttonElements[0] as HTMLElement).tabIndex > 0);
	}
});

test("The full page button should have the 'selected' class styling applied to it by default", () => {
	HelperFunctions.mountToFixture(defaultComponent);

	let modeButtonSelector = HelperFunctions.getFixture().firstElementChild;
	let buttonElements = modeButtonSelector.getElementsByClassName(TestConstants.Classes.modeButton);
	let fullPageButton = buttonElements[0];
	let regionButton = buttonElements[1];
	let augmentationButton = buttonElements[2];

	ok(fullPageButton.classList.contains(TestConstants.Classes.selected), "The fullpage button is selected");
	ok(!regionButton.classList.contains(TestConstants.Classes.selected), "The region button is not selected");
	ok(!augmentationButton.classList.contains(TestConstants.Classes.selected), "The augmentation button is not selected");
});

test("Other modes' buttons should have the 'selected' class styling applied to it if it's initially set as the starting mode", () => {
	let startingState = HelperFunctions.getMockClipperState();
	startingState.currentMode = new SmartValue<ClipMode>(ClipMode.Region);
	HelperFunctions.mountToFixture(
		<ModeButtonSelector clipperState={ startingState } />);

	let modeButtonSelector = HelperFunctions.getFixture().firstElementChild;
	let buttonElements = modeButtonSelector.getElementsByClassName(TestConstants.Classes.modeButton);
	let fullPageButton = buttonElements[0];
	let regionButton = buttonElements[1];
	let augmentationButton = buttonElements[2];

	ok(!fullPageButton.classList.contains(TestConstants.Classes.selected), "The fullpage button is not selected");
	ok(regionButton.classList.contains(TestConstants.Classes.selected), "The region button is selected");
	ok(!augmentationButton.classList.contains(TestConstants.Classes.selected), "The augmentation button is not selected");
});

test("Other modes' buttons should have the 'selected' class styling applied to it if they are clicked on", () => {
	let controllerInstance = HelperFunctions.mountToFixture(defaultComponent);

	let fullPageButton = document.getElementById(TestConstants.Ids.fullPageButton);
	let regionButton = document.getElementById(TestConstants.Ids.regionButton);
	let augmentationButton = document.getElementById(TestConstants.Ids.augmentationButton);

	HelperFunctions.simulateAction(() => {
		regionButton.click();
	});
	ok(!fullPageButton.classList.contains(TestConstants.Classes.selected), "The fullpage button is not selected");
	ok(regionButton.classList.contains(TestConstants.Classes.selected), "The region button is selected");
	ok(!augmentationButton.classList.contains(TestConstants.Classes.selected), "The augmentation button is not selected");

	HelperFunctions.simulateAction(() => {
		fullPageButton.click();
	});
	ok(fullPageButton.classList.contains(TestConstants.Classes.selected), "The fullpage button is selected");
	ok(!regionButton.classList.contains(TestConstants.Classes.selected), "The region button is not selected");
	ok(!augmentationButton.classList.contains(TestConstants.Classes.selected), "The augmentation button is not selected");

	HelperFunctions.simulateAction(() => {
		augmentationButton.click();
	});
	ok(!fullPageButton.classList.contains(TestConstants.Classes.selected), "The fullpage button is not selected");
	ok(!regionButton.classList.contains(TestConstants.Classes.selected), "The region button is not selected");
	ok(augmentationButton.classList.contains(TestConstants.Classes.selected), "The augmentation button is selected");
});

test("The 'selected' class styling should not go away if the user clicks away from a previously clicked mode button", () => {
	let controllerInstance = HelperFunctions.mountToFixture(defaultComponent);

	let fullPageButton = document.getElementById(TestConstants.Ids.fullPageButton);
	let regionButton = document.getElementById(TestConstants.Ids.regionButton);
	let augmentationButton = document.getElementById(TestConstants.Ids.augmentationButton);

	HelperFunctions.simulateAction(() => {
		regionButton.click();
		regionButton.blur();
	});
	ok(!fullPageButton.classList.contains(TestConstants.Classes.selected), "The fullpage button is not selected");
	ok(regionButton.classList.contains(TestConstants.Classes.selected), "The region button is selected");
	ok(!augmentationButton.classList.contains(TestConstants.Classes.selected), "The augmentation button is not selected");
});

test("The current mode state should be updated accordingly depending on the mode button that was pressed", () => {
	let controllerInstance = HelperFunctions.mountToFixture(defaultComponent);

	let fullPageButton = document.getElementById(TestConstants.Ids.fullPageButton);
	let regionButton = document.getElementById(TestConstants.Ids.regionButton);
	let augmentationButton = document.getElementById(TestConstants.Ids.augmentationButton);

	HelperFunctions.simulateAction(() => {
		regionButton.click();
	});
	strictEqual(controllerInstance.props.clipperState.currentMode.get(), ClipMode.Region,
		"State of current mode should be region after clicking on region mode button");

	HelperFunctions.simulateAction(() => {
		fullPageButton.click();
	});
	strictEqual(controllerInstance.props.clipperState.currentMode.get(), ClipMode.FullPage,
		"State of current mode should be full page after clicking on full page mode button");

	HelperFunctions.simulateAction(() => {
		augmentationButton.click();
	});
	strictEqual(controllerInstance.props.clipperState.currentMode.get(), ClipMode.Augmentation,
		"State of current mode should be augmentation after clicking on augmentation mode button");
});

test("The augmentation button should be labeled as 'Article' by default", () => {
	HelperFunctions.mountToFixture(defaultComponent);

	let modeButtonSelector = HelperFunctions.getFixture().firstElementChild;
	let buttonElements = modeButtonSelector.getElementsByClassName(TestConstants.Classes.modeButton);
	let augmentationButton = buttonElements[2];
	let label = augmentationButton.getElementsByClassName(TestConstants.Classes.label)[0] as Node;
	strictEqual(label.textContent, stringsJson["WebClipper.ClipType.Article.Button"]);
});

test("The augmentation button should be labeled according to the content model of the augmentation result", () => {
	let startingState = HelperFunctions.getMockClipperState();
	startingState.augmentationResult = {
		data: {
			ContentInHtml: "",
			ContentModel: AugmentationModel.Recipe,
			ContentObjects: [],
			PageMetadata: {
				AutoPageTags: "Recipe",
				AutoPageTagsCodes: "Recipe"
			}
		},
		status: Status.Succeeded
	};
	HelperFunctions.mountToFixture(
		<ModeButtonSelector clipperState={ startingState } />);

	let modeButtonSelector = HelperFunctions.getFixture().firstElementChild;
	let buttonElements = modeButtonSelector.getElementsByClassName(TestConstants.Classes.modeButton);
	let augmentationButton = buttonElements[2];
	let label = augmentationButton.getElementsByClassName(TestConstants.Classes.label)[0] as Node;
	strictEqual(label.textContent, stringsJson["WebClipper.ClipType.Recipe.Button"]);
});

test("The augmentation button should have its image set to the article icon by default", () => {
	HelperFunctions.mountToFixture(defaultComponent);

	let modeButtonSelector = HelperFunctions.getFixture().firstElementChild;
	let buttonElements = modeButtonSelector.getElementsByClassName(TestConstants.Classes.modeButton);
	let augmentationButton = buttonElements[2];
	let icon = augmentationButton.getElementsByClassName(TestConstants.Classes.icon)[0] as HTMLImageElement;
	strictEqual(HelperFunctions.getBaseFileName(icon.src).toLowerCase(), "article");
});

test("The augmentation button should have its image set according to the content model of the augmentation result", () => {
	let startingState = HelperFunctions.getMockClipperState();
	startingState.augmentationResult = {
		data: {
			ContentInHtml: "",
			ContentModel: AugmentationModel.Product,
			ContentObjects: [],
			PageMetadata: {
				AutoPageTags: "Product",
				AutoPageTagsCodes: "Product"
			}
		},
		status: Status.Succeeded
	};
	HelperFunctions.mountToFixture(
		<ModeButtonSelector clipperState={ startingState } />);

	let modeButtonSelector = HelperFunctions.getFixture().firstElementChild;
	let buttonElements = modeButtonSelector.getElementsByClassName(TestConstants.Classes.modeButton);
	let augmentationButton = buttonElements[2];
	let icon = augmentationButton.getElementsByClassName(TestConstants.Classes.icon)[0] as HTMLImageElement;
	strictEqual(HelperFunctions.getBaseFileName(icon.src).toLowerCase(), "product");
});

test("In PDF Mode, only the PDF, Region, and Bookmark Mode Buttons should be rendered, and in that order", () => {
	let startingState = HelperFunctions.getMockClipperState();
	startingState.currentMode.set(ClipMode.Pdf);
	startingState.pageInfo.contentType = OneNoteApi.ContentType.EnhancedUrl;

	HelperFunctions.mountToFixture(
		<ModeButtonSelector clipperState={ startingState } />);

	let modeButtonSelector = HelperFunctions.getFixture().firstElementChild;
	let buttonElements = modeButtonSelector.getElementsByClassName(TestConstants.Classes.modeButton);

	strictEqual(buttonElements.length, 3, "Only 3 buttons should be rendered in PDF mode: PDF, Region, and bookmark");

	strictEqual(buttonElements[0].id, TestConstants.Ids.pdfButton, "The first button should be the pdf button");
	strictEqual(buttonElements[1].id, TestConstants.Ids.regionButton, "The second button should be the region button");
	strictEqual(buttonElements[2].id, TestConstants.Ids.bookmarkButton, "The third button should be the bookmark button");
});
