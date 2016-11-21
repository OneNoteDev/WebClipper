import {AugmentationModel} from "../../../scripts/contentCapture/augmentationHelper";

import {ModeButtonSelector} from "../../../scripts/clipperUI/components/modeButtonSelector";

import {ClipMode} from "../../../scripts/clipperUI/clipMode";
import {Status} from "../../../scripts/clipperUI/status";

import {SmartValue} from "../../../scripts/communicator/smartValue";

import {InvokeMode} from "../../../scripts/extensions/invokeOptions";

import {ClientType} from "../../../scripts/clientType";

import {MithrilUtils} from "../../mithrilUtils";
import {MockProps} from "../../mockProps";
import {TestModule} from "../../testModule";

// These are not available in constants.ts as we currently dynamically generate them
// at runtime
module TestConstants {
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

export class ModeButtonSelectorTests extends TestModule {
	private stringsJson = require("../../../strings.json");
	private defaultComponent;

	protected module() {
		return "modeButtonSelector";
	}

	protected beforeEach() {
		this.defaultComponent =
			<ModeButtonSelector clipperState={ MockProps.getMockClipperState() } />;
	}

	protected tests() {
		test("The region clipping button should not appear when enableRegionClipping is injected as false", () => {
			let startingState = MockProps.getMockClipperState();
			startingState.injectOptions.enableRegionClipping = false;
			MithrilUtils.mountToFixture(
				<ModeButtonSelector clipperState={ startingState } />);

			let modeButtonSelector = MithrilUtils.getFixture().firstElementChild;
			let buttonElements = modeButtonSelector.getElementsByClassName(TestConstants.Classes.modeButton);

			strictEqual(buttonElements.length, 3, "There should only be three mode buttons");
			strictEqual(buttonElements[0].id, TestConstants.Ids.fullPageButton, "The first button should be the full page button");
			strictEqual(buttonElements[1].id, TestConstants.Ids.augmentationButton, "The second button should be the augmentation button");
			strictEqual(buttonElements[2].id, TestConstants.Ids.bookmarkButton, "The third button should be the bookmark button");
		});

		test("The region clipping button should appear when enableRegionClipping is injected as true", () => {
			MithrilUtils.mountToFixture(this.defaultComponent);

			let modeButtonSelector = MithrilUtils.getFixture().firstElementChild;
			let buttonElements = modeButtonSelector.getElementsByClassName(TestConstants.Classes.modeButton);

			strictEqual(buttonElements.length, 4, "There should be four mode buttons");
			strictEqual(buttonElements[0].id, TestConstants.Ids.fullPageButton, "The first button should be the full page button");
			strictEqual(buttonElements[1].id, TestConstants.Ids.regionButton, "The second button should be the region button");
			strictEqual(buttonElements[2].id, TestConstants.Ids.augmentationButton, "The third button should be the augmentation button");
			strictEqual(buttonElements[3].id, TestConstants.Ids.bookmarkButton, "The fourth button should be the bookmark button");
		});

		test("The region clipping button should appear when enableRegionClipping is injected as false, but invokeMode is set to image selection", () => {
			let startingState = MockProps.getMockClipperState();
			startingState.injectOptions.enableRegionClipping = false;
			startingState.invokeOptions.invokeMode = InvokeMode.ContextImage;
			MithrilUtils.mountToFixture(
				<ModeButtonSelector clipperState={ startingState } />);

			let modeButtonSelector = MithrilUtils.getFixture().firstElementChild;
			let buttonElements = modeButtonSelector.getElementsByClassName(TestConstants.Classes.modeButton);

			strictEqual(buttonElements.length, 4, "There should be four mode buttons");
			strictEqual(buttonElements[0].id, TestConstants.Ids.fullPageButton, "The first button should be the full page button");
			strictEqual(buttonElements[1].id, TestConstants.Ids.regionButton, "The second button should be the region button");
			strictEqual(buttonElements[2].id, TestConstants.Ids.augmentationButton, "The third button should be the augmentation button");
			strictEqual(buttonElements[3].id, TestConstants.Ids.bookmarkButton, "The fourth button should be the bookmark button");
		});

		test("The region button should be labeled 'Region' in non-Edge browsers", () => {
			let startingState = MockProps.getMockClipperState();
			startingState.clientInfo.clipperType = ClientType.ChromeExtension;
			MithrilUtils.mountToFixture(
				<ModeButtonSelector clipperState={ startingState } />);

			let modeButtonSelector = MithrilUtils.getFixture().firstElementChild;
			let buttonElements = modeButtonSelector.getElementsByClassName(TestConstants.Classes.modeButton);
			let regionButton = buttonElements[1];
			let label = regionButton.getElementsByClassName(TestConstants.Classes.label)[0] as Node;
			strictEqual(label.textContent, this.stringsJson["WebClipper.ClipType.Region.Button"]);
		});

		test("The region button should be labeled 'Region' in non-Edge browsers and an image was selected", () => {
			let startingState = MockProps.getMockClipperState();
			startingState.clientInfo.clipperType = ClientType.FirefoxExtension;
			startingState.invokeOptions = {
				invokeMode: InvokeMode.ContextImage,
				invokeDataForMode: "dummy-img"
			};
			MithrilUtils.mountToFixture(
				<ModeButtonSelector clipperState={ startingState } />);

			let modeButtonSelector = MithrilUtils.getFixture().firstElementChild;
			let buttonElements = modeButtonSelector.getElementsByClassName(TestConstants.Classes.modeButton);
			let regionButton = buttonElements[1];
			let label = regionButton.getElementsByClassName(TestConstants.Classes.label)[0] as Node;
			strictEqual(label.textContent, this.stringsJson["WebClipper.ClipType.Region.Button"]);
		});

		test("The region button should be labeled 'Image' in Edge and an image was selected", () => {
			let startingState = MockProps.getMockClipperState();
			startingState.clientInfo.clipperType = ClientType.EdgeExtension;
			startingState.invokeOptions = {
				invokeMode: InvokeMode.ContextImage,
				invokeDataForMode: "dummy-img"
			};
			MithrilUtils.mountToFixture(
				<ModeButtonSelector clipperState={ startingState } />);

			let modeButtonSelector = MithrilUtils.getFixture().firstElementChild;
			let buttonElements = modeButtonSelector.getElementsByClassName(TestConstants.Classes.modeButton);
			let imageButton = buttonElements[1];
			let label = imageButton.getElementsByClassName(TestConstants.Classes.label)[0] as Node;
			strictEqual(label.textContent, this.stringsJson["WebClipper.ClipType.Image.Button"]);
		});

		test("The selection button should appear when invokeMode is set to selection", () => {
			let startingState = MockProps.getMockClipperState();
			startingState.invokeOptions.invokeMode = InvokeMode.ContextTextSelection;
			MithrilUtils.mountToFixture(
				<ModeButtonSelector clipperState={ startingState } />);

			let modeButtonSelector = MithrilUtils.getFixture().firstElementChild;
			let buttonElements = modeButtonSelector.getElementsByClassName(TestConstants.Classes.modeButton);

			strictEqual(buttonElements.length, 5, "There should be five mode buttons");
			strictEqual(buttonElements[0].id, TestConstants.Ids.fullPageButton, "The first button should be the full page button");
			strictEqual(buttonElements[1].id, TestConstants.Ids.regionButton, "The second button should be the region button");
			strictEqual(buttonElements[2].id, TestConstants.Ids.augmentationButton, "The third button should be the augmentation button");
			strictEqual(buttonElements[3].id, TestConstants.Ids.selectionButton, "The fourth button should be the selection button");
			strictEqual(buttonElements[4].id, TestConstants.Ids.bookmarkButton, "The fifth button should be the bookmark button");
		});

		test("The selection button should appear when invokeMode is set to selection, and the region button should not appear when its disabled", () => {
			let startingState = MockProps.getMockClipperState();
			startingState.injectOptions.enableRegionClipping = false;
			startingState.invokeOptions.invokeMode = InvokeMode.ContextTextSelection;
			MithrilUtils.mountToFixture(
				<ModeButtonSelector clipperState={ startingState } />);

			let modeButtonSelector = MithrilUtils.getFixture().firstElementChild;
			let buttonElements = modeButtonSelector.getElementsByClassName(TestConstants.Classes.modeButton);

			strictEqual(buttonElements.length, 4, "There should be four mode buttons");
			strictEqual(buttonElements[0].id, TestConstants.Ids.fullPageButton, "The first button should be the full page button");
			strictEqual(buttonElements[1].id, TestConstants.Ids.augmentationButton, "The second button should be the augmentation button");
			strictEqual(buttonElements[2].id, TestConstants.Ids.selectionButton, "The third button should be the selection button");
			strictEqual(buttonElements[3].id, TestConstants.Ids.bookmarkButton, "The fourth button should be the bookmark button");
		});

		test("The tabbing should flow in element order, assuming they are all available, and each tab index should not be less than 1", () => {
			let startingState = MockProps.getMockClipperState();
			startingState.invokeOptions.invokeMode = InvokeMode.ContextTextSelection;
			MithrilUtils.mountToFixture(
				<ModeButtonSelector clipperState={ startingState } />);

			let modeButtonSelector = MithrilUtils.getFixture().firstElementChild;
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
			MithrilUtils.mountToFixture(this.defaultComponent);

			let modeButtonSelector = MithrilUtils.getFixture().firstElementChild;
			let buttonElements = modeButtonSelector.getElementsByClassName(TestConstants.Classes.modeButton);
			let fullPageButton = buttonElements[0];
			let regionButton = buttonElements[1];
			let augmentationButton = buttonElements[2];

			ok(fullPageButton.classList.contains(TestConstants.Classes.selected), "The fullpage button is selected");
			ok(!regionButton.classList.contains(TestConstants.Classes.selected), "The region button is not selected");
			ok(!augmentationButton.classList.contains(TestConstants.Classes.selected), "The augmentation button is not selected");
		});

		test("Other modes' buttons should have the 'selected' class styling applied to it if it's initially set as the starting mode", () => {
			let startingState = MockProps.getMockClipperState();
			startingState.currentMode = new SmartValue<ClipMode>(ClipMode.Region);
			MithrilUtils.mountToFixture(
				<ModeButtonSelector clipperState={ startingState } />);

			let modeButtonSelector = MithrilUtils.getFixture().firstElementChild;
			let buttonElements = modeButtonSelector.getElementsByClassName(TestConstants.Classes.modeButton);
			let fullPageButton = buttonElements[0];
			let regionButton = buttonElements[1];
			let augmentationButton = buttonElements[2];

			ok(!fullPageButton.classList.contains(TestConstants.Classes.selected), "The fullpage button is not selected");
			ok(regionButton.classList.contains(TestConstants.Classes.selected), "The region button is selected");
			ok(!augmentationButton.classList.contains(TestConstants.Classes.selected), "The augmentation button is not selected");
		});

		test("Other modes' buttons should have the 'selected' class styling applied to it if they are clicked on", () => {
			let controllerInstance = MithrilUtils.mountToFixture(this.defaultComponent);

			let fullPageButton = document.getElementById(TestConstants.Ids.fullPageButton);
			let regionButton = document.getElementById(TestConstants.Ids.regionButton);
			let augmentationButton = document.getElementById(TestConstants.Ids.augmentationButton);

			MithrilUtils.simulateAction(() => {
				regionButton.click();
			});
			ok(!fullPageButton.classList.contains(TestConstants.Classes.selected), "The fullpage button is not selected");
			ok(regionButton.classList.contains(TestConstants.Classes.selected), "The region button is selected");
			ok(!augmentationButton.classList.contains(TestConstants.Classes.selected), "The augmentation button is not selected");

			MithrilUtils.simulateAction(() => {
				fullPageButton.click();
			});
			ok(fullPageButton.classList.contains(TestConstants.Classes.selected), "The fullpage button is selected");
			ok(!regionButton.classList.contains(TestConstants.Classes.selected), "The region button is not selected");
			ok(!augmentationButton.classList.contains(TestConstants.Classes.selected), "The augmentation button is not selected");

			MithrilUtils.simulateAction(() => {
				augmentationButton.click();
			});
			ok(!fullPageButton.classList.contains(TestConstants.Classes.selected), "The fullpage button is not selected");
			ok(!regionButton.classList.contains(TestConstants.Classes.selected), "The region button is not selected");
			ok(augmentationButton.classList.contains(TestConstants.Classes.selected), "The augmentation button is selected");
		});

		test("The 'selected' class styling should not go away if the user clicks away from a previously clicked mode button", () => {
			let controllerInstance = MithrilUtils.mountToFixture(this.defaultComponent);

			let fullPageButton = document.getElementById(TestConstants.Ids.fullPageButton);
			let regionButton = document.getElementById(TestConstants.Ids.regionButton);
			let augmentationButton = document.getElementById(TestConstants.Ids.augmentationButton);

			MithrilUtils.simulateAction(() => {
				regionButton.click();
				regionButton.blur();
			});
			ok(!fullPageButton.classList.contains(TestConstants.Classes.selected), "The fullpage button is not selected");
			ok(regionButton.classList.contains(TestConstants.Classes.selected), "The region button is selected");
			ok(!augmentationButton.classList.contains(TestConstants.Classes.selected), "The augmentation button is not selected");
		});

		test("The current mode state should be updated accordingly depending on the mode button that was pressed", () => {
			let controllerInstance = MithrilUtils.mountToFixture(this.defaultComponent);

			let fullPageButton = document.getElementById(TestConstants.Ids.fullPageButton);
			let regionButton = document.getElementById(TestConstants.Ids.regionButton);
			let augmentationButton = document.getElementById(TestConstants.Ids.augmentationButton);

			MithrilUtils.simulateAction(() => {
				regionButton.click();
			});
			strictEqual(controllerInstance.props.clipperState.currentMode.get(), ClipMode.Region,
				"State of current mode should be region after clicking on region mode button");

			MithrilUtils.simulateAction(() => {
				fullPageButton.click();
			});
			strictEqual(controllerInstance.props.clipperState.currentMode.get(), ClipMode.FullPage,
				"State of current mode should be full page after clicking on full page mode button");

			MithrilUtils.simulateAction(() => {
				augmentationButton.click();
			});
			strictEqual(controllerInstance.props.clipperState.currentMode.get(), ClipMode.Augmentation,
				"State of current mode should be augmentation after clicking on augmentation mode button");
		});

		test("The augmentation button should be labeled as 'Article' by default", () => {
			MithrilUtils.mountToFixture(this.defaultComponent);

			let modeButtonSelector = MithrilUtils.getFixture().firstElementChild;
			let buttonElements = modeButtonSelector.getElementsByClassName(TestConstants.Classes.modeButton);
			let augmentationButton = buttonElements[2];
			let label = augmentationButton.getElementsByClassName(TestConstants.Classes.label)[0] as Node;
			strictEqual(label.textContent, this.stringsJson["WebClipper.ClipType.Article.Button"]);
		});

		test("The augmentation button should be labeled according to the content model of the augmentation result", () => {
			let startingState = MockProps.getMockClipperState();
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
			MithrilUtils.mountToFixture(
				<ModeButtonSelector clipperState={ startingState } />);

			let modeButtonSelector = MithrilUtils.getFixture().firstElementChild;
			let buttonElements = modeButtonSelector.getElementsByClassName(TestConstants.Classes.modeButton);
			let augmentationButton = buttonElements[2];
			let label = augmentationButton.getElementsByClassName(TestConstants.Classes.label)[0] as Node;
			strictEqual(label.textContent, this.stringsJson["WebClipper.ClipType.Recipe.Button"]);
		});

		test("The augmentation button should have its image set to the article icon by default", () => {
			MithrilUtils.mountToFixture(this.defaultComponent);

			let modeButtonSelector = MithrilUtils.getFixture().firstElementChild;
			let buttonElements = modeButtonSelector.getElementsByClassName(TestConstants.Classes.modeButton);
			let augmentationButton = buttonElements[2];
			let icon = augmentationButton.getElementsByClassName(TestConstants.Classes.icon)[0] as HTMLImageElement;

			// endsWith is polyfilled
			ok((icon.src.toLowerCase() as any).endsWith("article.png"));
		});

		test("The augmentation button should have its image set according to the content model of the augmentation result", () => {
			let startingState = MockProps.getMockClipperState();
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
			MithrilUtils.mountToFixture(
				<ModeButtonSelector clipperState={ startingState } />);

			let modeButtonSelector = MithrilUtils.getFixture().firstElementChild;
			let buttonElements = modeButtonSelector.getElementsByClassName(TestConstants.Classes.modeButton);
			let augmentationButton = buttonElements[2];
			let icon = augmentationButton.getElementsByClassName(TestConstants.Classes.icon)[0] as HTMLImageElement;

			// endsWith is polyfilled
			ok((icon.src.toLowerCase() as any).endsWith("product.png"));
		});

		test("In PDF Mode, only the PDF, Region, and Bookmark Mode Buttons should be rendered, and in that order", () => {
			let startingState = MockProps.getMockClipperState();
			startingState.currentMode.set(ClipMode.Pdf);
			startingState.pageInfo.contentType = OneNoteApi.ContentType.EnhancedUrl;

			MithrilUtils.mountToFixture(
				<ModeButtonSelector clipperState={ startingState } />);

			let modeButtonSelector = MithrilUtils.getFixture().firstElementChild;
			let buttonElements = modeButtonSelector.getElementsByClassName(TestConstants.Classes.modeButton);

			strictEqual(buttonElements.length, 3, "There should be three mode buttons");
			strictEqual(buttonElements[0].id, TestConstants.Ids.pdfButton, "The first button should be the pdf button");
			strictEqual(buttonElements[1].id, TestConstants.Ids.regionButton, "The second button should be the region button");
			strictEqual(buttonElements[2].id, TestConstants.Ids.bookmarkButton, "The third button should be the bookmark button");
		});

		test("The bookmark clipping button should not appear when a PDF was detected but was on a local file", () => {
			let startingState = MockProps.getMockClipperState();
			startingState.currentMode.set(ClipMode.Pdf);
			startingState.pageInfo.contentType = OneNoteApi.ContentType.EnhancedUrl;
			startingState.pageInfo.rawUrl = "file:///local.pdf";

			MithrilUtils.mountToFixture(
				<ModeButtonSelector clipperState={ startingState } />);

			let modeButtonSelector = MithrilUtils.getFixture().firstElementChild;
			let buttonElements = modeButtonSelector.getElementsByClassName(TestConstants.Classes.modeButton);

			strictEqual(buttonElements.length, 2, "There should be two mode buttons");
			strictEqual(buttonElements[0].id, TestConstants.Ids.pdfButton, "The first button should be the pdf button");
			strictEqual(buttonElements[1].id, TestConstants.Ids.regionButton, "The second button should be the region button");
		});
	}
}

(new ModeButtonSelectorTests()).runTests();
