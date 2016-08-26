/// <reference path="../../../../typings/main/ambient/qunit/qunit.d.ts" />

import {AugmentationModel} from "../../../scripts/contentCapture/augmentationHelper";

import {ModeButtonSelector} from "../../../scripts/clipperUI/components/modeButtonSelector";

import {ClipMode} from "../../../scripts/clipperUI/clipMode";
import {Status} from "../../../scripts/clipperUI/status";

import {SmartValue} from "../../../scripts/communicator/smartValue";

import {InvokeMode} from "../../../scripts/extensions/invokeOptions";

import {HelperFunctions} from "../../helperFunctions";

export module TestConstants {
	export module Classes {
		export var icon = "icon";
		export var label = "label";
		export var modeButton = "modeButton";
		export var selected = "selected";
	}

	export module Ids {
		export var fullPageButton = "fullPageButton";
		export var regionButton = "regionButton";
		export var augmentationButton = "augmentationButton";
		export var selectionButton = "selectionButton";
		export var bookmarkButton = "bookmarkButton";
	}
}

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

test("The selection button should appear when invokeMode is set to selection", () => {
	let startingState = HelperFunctions.getMockClipperState();
	startingState.invokeOptions.invokeMode = InvokeMode.ContextTextSelection;
	HelperFunctions.mountToFixture(
		<ModeButtonSelector clipperState={ startingState } />);

	let modeButtonSelector = HelperFunctions.getFixture().firstElementChild;
	let buttonElements = modeButtonSelector.getElementsByClassName(TestConstants.Classes.modeButton);

	strictEqual(buttonElements.length, 5, "There should be four mode buttons");
	strictEqual(buttonElements[0].id, TestConstants.Ids.fullPageButton, "The first button should be the full page button");
	strictEqual(buttonElements[1].id, TestConstants.Ids.regionButton, "The second button should be the region button");
	strictEqual(buttonElements[2].id, TestConstants.Ids.augmentationButton, "The third button should be the augmentation button");
	strictEqual(buttonElements[3].id, TestConstants.Ids.selectionButton, "The fourth button should be the bookmark button");
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

test("The tabbing should flow from full page to region to augmentation buttons", () => {
	HelperFunctions.mountToFixture(defaultComponent);

	let modeButtonSelector = HelperFunctions.getFixture().firstElementChild;
	let buttonElements = modeButtonSelector.getElementsByClassName(TestConstants.Classes.modeButton);
	let fullPageButton = buttonElements[0] as HTMLElement;
	let regionButton = buttonElements[1] as HTMLElement;
	let augmentationButton = buttonElements[2] as HTMLElement;

	ok(fullPageButton.tabIndex < regionButton.tabIndex,
		"The region button's tab index should be greater than the full page button's");
	ok(regionButton.tabIndex < augmentationButton.tabIndex,
		"The augmentation button's tab index should be greater than the region button's");
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
	strictEqual(label.textContent, "Article");
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
	strictEqual(label.textContent, "Recipe");
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
