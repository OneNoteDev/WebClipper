import {Constants} from "../../../scripts/constants";

import {ClipMode} from "../../../scripts/clipperUI/clipMode";
import {ClipperState} from "../../../scripts/clipperUI/clipperState";
import {Status} from "../../../scripts/clipperUI/status";

import {ClippingPanel} from "../../../scripts/clipperUI/panels/clippingPanel";

import {AugmentationModel} from "../../../scripts/contentCapture/augmentationHelper";

import {MithrilUtils} from "../../mithrilUtils";
import {MockProps} from "../../mockProps";
import {TestModule} from "../../testModule";

declare function require(name: string);

export class ClippingPanelTests extends TestModule {
	private stringsJson = require("../../../strings.json");

	private mockClipperState: ClipperState;

	protected module() {
		return "clippingPanel";
	}

	protected beforeEach() {
		this.mockClipperState = MockProps.getMockClipperState();
		this.mockClipperState.augmentationResult = {
			data: {},
			status: Status.Succeeded
		};
	}

	protected tests() {
		test("If the clipmode is full page, the clipping panel should indicate so", () => {
			this.mockClipperState.currentMode.set(ClipMode.FullPage);
			MithrilUtils.mountToFixture(<ClippingPanel clipperState={this.mockClipperState}/>);

			strictEqual(document.getElementById(Constants.Ids.clipperApiProgressContainer).innerText,
				this.stringsJson["WebClipper.ClipType.ScreenShot.ProgressLabel"]);
		});

		test("If the clipmode is region, the clipping panel should indicate so", () => {
			this.mockClipperState.currentMode.set(ClipMode.Region);
			MithrilUtils.mountToFixture(<ClippingPanel clipperState={this.mockClipperState}/>);

			strictEqual(document.getElementById(Constants.Ids.clipperApiProgressContainer).innerText,
				this.stringsJson["WebClipper.ClipType.Region.ProgressLabel"]);
		});

		test("If the clipmode is article, the clipping panel should indicate so", () => {
			this.mockClipperState.currentMode.set(ClipMode.Augmentation);
			this.mockClipperState.augmentationResult.data.ContentModel = AugmentationModel.Article;
			MithrilUtils.mountToFixture(<ClippingPanel clipperState={this.mockClipperState}/>);

			strictEqual(document.getElementById(Constants.Ids.clipperApiProgressContainer).innerText,
				this.stringsJson["WebClipper.ClipType.Article.ProgressLabel"]);
		});

		test("If the clipmode is recipe, the clipping panel should indicate so", () => {
			this.mockClipperState.currentMode.set(ClipMode.Augmentation);
			this.mockClipperState.augmentationResult.data.ContentModel = AugmentationModel.Recipe;
			MithrilUtils.mountToFixture(<ClippingPanel clipperState={this.mockClipperState}/>);

			strictEqual(document.getElementById(Constants.Ids.clipperApiProgressContainer).innerText,
				this.stringsJson["WebClipper.ClipType.Recipe.ProgressLabel"]);
		});

		test("If the clipmode is product, the clipping panel should indicate so", () => {
			this.mockClipperState.currentMode.set(ClipMode.Augmentation);
			this.mockClipperState.augmentationResult.data.ContentModel = AugmentationModel.Product;
			MithrilUtils.mountToFixture(<ClippingPanel clipperState={this.mockClipperState}/>);

			strictEqual(document.getElementById(Constants.Ids.clipperApiProgressContainer).innerText,
				this.stringsJson["WebClipper.ClipType.Product.ProgressLabel"]);
		});

		test("If the clipmode is full page and there were augmentation results, the clipping panel should indicate full page", () => {
			this.mockClipperState.currentMode.set(ClipMode.FullPage);
			this.mockClipperState.augmentationResult.data.ContentModel = AugmentationModel.Product;
			MithrilUtils.mountToFixture(<ClippingPanel clipperState={this.mockClipperState}/>);

			strictEqual(document.getElementById(Constants.Ids.clipperApiProgressContainer).innerText,
				this.stringsJson["WebClipper.ClipType.ScreenShot.ProgressLabel"]);
		});

		test("If the clipmode is some 'new' augmentation mode but we don't have a string to support it, the clipping panel should fall back to full page text", () => {
			this.mockClipperState.currentMode.set(ClipMode.Augmentation);
			this.mockClipperState.augmentationResult.data.ContentModel = AugmentationModel.BizCard;
			MithrilUtils.mountToFixture(<ClippingPanel clipperState={this.mockClipperState}/>);

			strictEqual(document.getElementById(Constants.Ids.clipperApiProgressContainer).innerText,
				this.stringsJson["WebClipper.ClipType.ScreenShot.ProgressLabel"]);
		});
	}
}

(new ClippingPanelTests()).runTests();
