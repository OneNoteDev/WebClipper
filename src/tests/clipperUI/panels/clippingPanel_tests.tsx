import {Constants} from "../../../scripts/constants";

import {ClipMode} from "../../../scripts/clipperUI/clipMode";
import {ClipperState} from "../../../scripts/clipperUI/clipperState";
import {Status} from "../../../scripts/clipperUI/status";

import {ClippingPanel} from "../../../scripts/clipperUI/panels/clippingPanel";

import {AugmentationModel} from "../../../scripts/contentCapture/augmentationHelper";

import {HelperFunctions} from "../../helperFunctions";

declare function require(name: string);
let stringsJson = require("../../../strings.json");

let mockClipperState: ClipperState;
QUnit.module("clippingPanel", {
	beforeEach: () => {
		mockClipperState = HelperFunctions.getMockClipperState();
		mockClipperState.augmentationResult = {
			data: {},
			status: Status.Succeeded
		};
	}
});

test("If the clipmode is full page, the clipping panel should indicate so", () => {
	mockClipperState.currentMode.set(ClipMode.FullPage);
	HelperFunctions.mountToFixture(<ClippingPanel clipperState={mockClipperState}/>);

	strictEqual(document.getElementById(Constants.Ids.clipperApiProgressContainer).innerText,
		stringsJson["WebClipper.ClipType.ScreenShot.ProgressLabel"]);
});

test("If the clipmode is region, the clipping panel should indicate so", () => {
	mockClipperState.currentMode.set(ClipMode.Region);
	HelperFunctions.mountToFixture(<ClippingPanel clipperState={mockClipperState}/>);

	strictEqual(document.getElementById(Constants.Ids.clipperApiProgressContainer).innerText,
		stringsJson["WebClipper.ClipType.Region.ProgressLabel"]);
});

test("If the clipmode is article, the clipping panel should indicate so", () => {
	mockClipperState.currentMode.set(ClipMode.Augmentation);
	mockClipperState.augmentationResult.data.ContentModel = AugmentationModel.Article;
	HelperFunctions.mountToFixture(<ClippingPanel clipperState={mockClipperState}/>);

	strictEqual(document.getElementById(Constants.Ids.clipperApiProgressContainer).innerText,
		stringsJson["WebClipper.ClipType.Article.ProgressLabel"]);
});

test("If the clipmode is recipe, the clipping panel should indicate so", () => {
	mockClipperState.currentMode.set(ClipMode.Augmentation);
	mockClipperState.augmentationResult.data.ContentModel = AugmentationModel.Recipe;
	HelperFunctions.mountToFixture(<ClippingPanel clipperState={mockClipperState}/>);

	strictEqual(document.getElementById(Constants.Ids.clipperApiProgressContainer).innerText,
		stringsJson["WebClipper.ClipType.Recipe.ProgressLabel"]);
});

test("If the clipmode is product, the clipping panel should indicate so", () => {
	mockClipperState.currentMode.set(ClipMode.Augmentation);
	mockClipperState.augmentationResult.data.ContentModel = AugmentationModel.Product;
	HelperFunctions.mountToFixture(<ClippingPanel clipperState={mockClipperState}/>);

	strictEqual(document.getElementById(Constants.Ids.clipperApiProgressContainer).innerText,
		stringsJson["WebClipper.ClipType.Product.ProgressLabel"]);
});

test("If the clipmode is full page and there were augmentation results, the clipping panel should indicate full page", () => {
	mockClipperState.currentMode.set(ClipMode.FullPage);
	mockClipperState.augmentationResult.data.ContentModel = AugmentationModel.Product;
	HelperFunctions.mountToFixture(<ClippingPanel clipperState={mockClipperState}/>);

	strictEqual(document.getElementById(Constants.Ids.clipperApiProgressContainer).innerText,
		stringsJson["WebClipper.ClipType.ScreenShot.ProgressLabel"]);
});

test("If the clipmode is some 'new' augmentation mode but we don't have a string to support it, the clipping panel should fall back to full page text", () => {
	mockClipperState.currentMode.set(ClipMode.Augmentation);
	mockClipperState.augmentationResult.data.ContentModel = AugmentationModel.BizCard;
	HelperFunctions.mountToFixture(<ClippingPanel clipperState={mockClipperState}/>);

	strictEqual(document.getElementById(Constants.Ids.clipperApiProgressContainer).innerText,
		stringsJson["WebClipper.ClipType.ScreenShot.ProgressLabel"]);
});
