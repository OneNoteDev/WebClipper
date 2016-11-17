import {Constants} from "../../../../scripts/constants";

import {ClipperState} from "../../../../scripts/clipperUI/clipperState";
import {ClipMode} from "../../../../scripts/clipperUI/clipMode";
import {Status} from "../../../../scripts/clipperUI/status";

import {AugmentationModel} from "../../../../scripts/contentCapture/augmentationHelper";

import {AugmentationPreview} from "../../../../scripts/clipperUI/components/previewViewer/augmentationPreview";

import {HelperFunctions} from "../../../helperFunctions";
import {MithrilUtils} from "../../../mithrilUtils";
import {TestModule} from "../../../testModule";

declare function require(name: string);

export class AugmentationPreviewTests extends TestModule {
	private stringsJson = require("../../../../strings.json");

	private sansSerifFontFamily = this.stringsJson["WebClipper.FontFamily.Preview.SansSerifDefault"];
	private sansSerifDefaultFontSize = this.stringsJson["WebClipper.FontSize.Preview.SansSerifDefault"];

	private serifFontFamily = this.stringsJson["WebClipper.FontFamily.Preview.SerifDefault"];
	private fontSizeStep = Constants.Settings.fontSizeStep;

	protected module() {
		return "augmentationPreview";
	}

	protected tests() {
		test("The tab order flow from the header to the preview title is correct in Augmentation mode, and each tab index should not be less than 1", () => {
			let mockClipperState = this.getMockAugmentationModeState();
			let defaultComponent = <AugmentationPreview clipperState={mockClipperState} />;
			MithrilUtils.mountToFixture(defaultComponent);

			let elementsInExpectedTabOrder = [
				{ name: Constants.Ids.highlightButton, elem: document.getElementById(Constants.Ids.highlightButton) },
				{ name: Constants.Ids.sansSerif, elem: document.getElementById(Constants.Ids.sansSerif) },
				{ name: Constants.Ids.serif, elem: document.getElementById(Constants.Ids.serif) },
				{ name: Constants.Ids.decrementFontSize, elem: document.getElementById(Constants.Ids.decrementFontSize) },
				{ name: Constants.Ids.incrementFontSize, elem: document.getElementById(Constants.Ids.incrementFontSize) },
				{ name: Constants.Ids.previewHeaderInput, elem: document.getElementById(Constants.Ids.previewHeaderInput) }
			];

			for (let i = 1; i < elementsInExpectedTabOrder.length; i++) {
				ok(elementsInExpectedTabOrder[i].elem.tabIndex > elementsInExpectedTabOrder[i - 1].elem.tabIndex,
					"Element " + elementsInExpectedTabOrder[i].name + " should have a greater tabIndex than element " + elementsInExpectedTabOrder[i - 1].name);
			}

			for (let i = 0; i < elementsInExpectedTabOrder.length; i++) {
				ok(elementsInExpectedTabOrder[i].elem.tabIndex > 0);
			}
		});

		test("The augmentation header and all related controls should be displayed in Augmentation mode", () => {
			let mockClipperState = this.getMockAugmentationModeState();
			let defaultComponent = <AugmentationPreview clipperState={mockClipperState} />;
			MithrilUtils.mountToFixture(defaultComponent);

			ok(!document.getElementById(Constants.Ids.addRegionControl), "The region control should not exist");

			ok(document.getElementById(Constants.Ids.highlightControl), "The highlight control should exist");
			ok(document.getElementById(Constants.Ids.serifControl), "The font family control should exist");
			ok(document.getElementById(Constants.Ids.decrementFontSize), "The decrement font size control should exist");
			ok(document.getElementById(Constants.Ids.incrementFontSize), "The increment font size control should exist");
		});

		test("The editable title of the page should be displayed in the preview title in Augmentation mode", () => {
			let mockClipperState = this.getMockAugmentationModeState();
			let defaultComponent = <AugmentationPreview clipperState={mockClipperState} />;
			MithrilUtils.mountToFixture(defaultComponent);

			let previewHeaderInput = document.getElementById(Constants.Ids.previewHeaderInput) as HTMLTextAreaElement;
			strictEqual(previewHeaderInput.value, mockClipperState.previewGlobalInfo.previewTitleText,
				"The title of the page should be displayed in the preview title");
			ok(!previewHeaderInput.readOnly);
		});

		test("The augmented content of the page should be displayed in the highlightable preview body in Augmentation Mode", () => {
			let mockClipperState = this.getMockAugmentationModeState();
			let defaultComponent = <AugmentationPreview clipperState={mockClipperState} />;
			MithrilUtils.mountToFixture(defaultComponent);

			strictEqual(document.getElementById(Constants.Ids.highlightablePreviewBody).innerHTML,
				mockClipperState.augmentationPreviewInfo.previewBodyHtml,
				"The editable augmentation result content is displayed in the preview body's highlightable portion");
		});

		test("When the augmentation successfully completes, but no data is returned, the preview should indicate no content was found in Augmentation mode", () => {
			let clipperState = HelperFunctions.getMockClipperState();
			clipperState.currentMode.set(ClipMode.Augmentation);
			clipperState.augmentationResult = {
				data: undefined,
				status: Status.Succeeded
			};
			MithrilUtils.mountToFixture(<AugmentationPreview clipperState={clipperState} />);

			let previewHeaderInput = document.getElementById(Constants.Ids.previewHeaderInput) as HTMLTextAreaElement;
			strictEqual(previewHeaderInput.value, this.stringsJson["WebClipper.Preview.NoContentFound"],
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
			MithrilUtils.mountToFixture(<AugmentationPreview clipperState={clipperState} />);

			let previewHeaderInput = document.getElementById(Constants.Ids.previewHeaderInput) as HTMLTextAreaElement;
			strictEqual(previewHeaderInput.value, this.stringsJson["WebClipper.Preview.LoadingMessage"],
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
			MithrilUtils.mountToFixture(<AugmentationPreview clipperState={clipperState} />);

			let previewHeaderInput = document.getElementById(Constants.Ids.previewHeaderInput) as HTMLTextAreaElement;
			strictEqual(previewHeaderInput.value, this.stringsJson["WebClipper.Preview.LoadingMessage"],
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
			MithrilUtils.mountToFixture(<AugmentationPreview clipperState={clipperState} />);

			let previewHeaderInput = document.getElementById(Constants.Ids.previewHeaderInput) as HTMLTextAreaElement;
			strictEqual(previewHeaderInput.value, this.stringsJson["WebClipper.Preview.LoadingMessage"],
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
			MithrilUtils.mountToFixture(<AugmentationPreview clipperState={clipperState} />);

			let previewHeaderInput = document.getElementById(Constants.Ids.previewHeaderInput) as HTMLTextAreaElement;
			strictEqual(previewHeaderInput.value, this.stringsJson["WebClipper.Preview.LoadingMessage"],
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
			MithrilUtils.mountToFixture(<AugmentationPreview clipperState={clipperState} />);

			let previewHeaderInput = document.getElementById(Constants.Ids.previewHeaderInput) as HTMLTextAreaElement;
			strictEqual(previewHeaderInput.value, expectedMessage,
				"The title of the page should be displayed in the preview title");
			ok(previewHeaderInput.readOnly);
		});

		test("The default font-size and font-family should be the same as those specified in strings.json in Augmentation mode", () => {
			let mockClipperState = this.getMockAugmentationModeState();
			let defaultComponent = <AugmentationPreview clipperState={mockClipperState} />;
			MithrilUtils.mountToFixture(defaultComponent);

			let previewBody = document.getElementById(Constants.Ids.previewBody);
			strictEqual(previewBody.style.fontSize, this.sansSerifDefaultFontSize);
			strictEqual(previewBody.style.fontFamily, this.sansSerifFontFamily);
		});

		test("On clicking Serif, the fontFamily should be changed to the fontFamily specified in strings.json, and then back upon clicking Sans-Serif in Augmentation mode", () => {
			let mockClipperState = this.getMockAugmentationModeState();
			let defaultComponent = <AugmentationPreview clipperState={mockClipperState} />;
			MithrilUtils.mountToFixture(defaultComponent);

			let serifButton = document.getElementById(Constants.Ids.serif);
			let sansSerifButton = document.getElementById(Constants.Ids.sansSerif);

			MithrilUtils.simulateAction(() => {
				serifButton.click();
			});

			let previewBody = document.getElementById(Constants.Ids.previewBody);
			strictEqual(this.serifFontFamily, previewBody.style.fontFamily);

			MithrilUtils.simulateAction(() => {
				sansSerifButton.click();
			});

			strictEqual(this.sansSerifFontFamily, previewBody.style.fontFamily);
		});

		test("Clicking on the same fontFamily button multiple times should only set that fontFamily once in Augmentation mode", () => {
			let mockClipperState = this.getMockAugmentationModeState();
			let defaultComponent = <AugmentationPreview clipperState={mockClipperState} />;
			MithrilUtils.mountToFixture(defaultComponent);

			let serifButton = document.getElementById(Constants.Ids.serif);

			MithrilUtils.simulateAction(() => {
				serifButton.click();
			});

			let previewBody = document.getElementById(Constants.Ids.previewBody);
			strictEqual(this.serifFontFamily, previewBody.style.fontFamily);

			MithrilUtils.simulateAction(() => {
				serifButton.click();
			});

			strictEqual(this.serifFontFamily, previewBody.style.fontFamily);
		});

		test("The default fontSize should be the sansSerif default fontSize, and should increment by two and decrement by two for each click on up and down respectively in Augmentation mode", () => {
			let mockClipperState = this.getMockAugmentationModeState();
			let defaultComponent = <AugmentationPreview clipperState={mockClipperState} />;
			MithrilUtils.mountToFixture(defaultComponent);

			let increaseFontSizeButton = document.getElementById(Constants.Ids.incrementFontSize);
			let decreaseFontSizeButton = document.getElementById(Constants.Ids.decrementFontSize);

			let defaultFontSize = parseInt(this.sansSerifDefaultFontSize, 10);
			let largerFontSize = defaultFontSize + 2 * this.fontSizeStep;
			let smallerFontSize = defaultFontSize - this.fontSizeStep;

			let previewBody = document.getElementById(Constants.Ids.previewBody);
			strictEqual(parseInt(previewBody.style.fontSize, 10), parseInt(this.sansSerifDefaultFontSize, 10));

			MithrilUtils.simulateAction(() => {
				decreaseFontSizeButton.click();
			});

			strictEqual(parseInt(previewBody.style.fontSize, 10), smallerFontSize);

			MithrilUtils.simulateAction(() => {
				increaseFontSizeButton.click();
				increaseFontSizeButton.click();
				increaseFontSizeButton.click();
			});

			strictEqual(parseInt(previewBody.style.fontSize, 10), largerFontSize);
		});

		test("If the user tries to increase beyond the maximum fontSize for either Serif or SansSerif, it should cap at the max font size defined in strongs.json in Augmentation mode", () => {
			let maximumFontSize = Constants.Settings.maximumFontSize;
			let numClicks = (maximumFontSize - parseInt(this.sansSerifDefaultFontSize, 10)) / this.fontSizeStep;

			let mockClipperState = this.getMockAugmentationModeState();
			let defaultComponent = <AugmentationPreview clipperState={mockClipperState} />;
			MithrilUtils.mountToFixture(defaultComponent);

			let increaseFontSizeButton = document.getElementById(Constants.Ids.incrementFontSize);
			let previewBody = document.getElementById(Constants.Ids.previewBody);

			MithrilUtils.simulateAction(() => {
				for (let i = 0; i < (numClicks + 5); i++) {
					increaseFontSizeButton.click();
				}
			});

			strictEqual(parseInt(previewBody.style.fontSize, 10), maximumFontSize);
		});

		test("If the user tries to decrease beyond the minimum fontSize for either Serif or SansSerif, it should reset at the minimum font size in Augmentation mode", () => {
			let minimumFontSize = Constants.Settings.minimumFontSize;
			let numClicks = (parseInt(this.sansSerifDefaultFontSize, 10) - minimumFontSize) / this.fontSizeStep;

			let mockClipperState = this.getMockAugmentationModeState();
			let defaultComponent = <AugmentationPreview clipperState={mockClipperState} />;
			MithrilUtils.mountToFixture(defaultComponent);

			let decreaseFontSizeButton = document.getElementById(Constants.Ids.decrementFontSize);
			let previewBody = document.getElementById(Constants.Ids.previewBody);

			MithrilUtils.simulateAction(() => {
				for (let i = 0; i < (numClicks + 5); i++) {
					decreaseFontSizeButton.click();
				}
			});

			strictEqual(parseInt(previewBody.style.fontSize, 10), minimumFontSize);
		});

		test("The default internal state should show that 'Highlighting' is disabled in Augmentation mode", () => {
			let mockClipperState = this.getMockAugmentationModeState();
			let defaultComponent = <AugmentationPreview clipperState={mockClipperState} />;
			let augmentationPreview = MithrilUtils.mountToFixture(defaultComponent);

			let highlightButton = document.getElementById(Constants.Ids.highlightButton);

			ok(!augmentationPreview.props.clipperState.previewGlobalInfo.highlighterEnabled);
			strictEqual(highlightButton.className.indexOf("active"), -1, "The active class should not be applied to the highlight button");
		});

		test("If the user clicks the highlight button, the internal state should show that 'Highlighting' is enabled in Augmentation mode", () => {
			let mockClipperState = this.getMockAugmentationModeState();
			let defaultComponent = <AugmentationPreview clipperState={mockClipperState} />;
			let augmentationPreview = MithrilUtils.mountToFixture(defaultComponent);

			let highlightButton = document.getElementById(Constants.Ids.highlightButton);

			MithrilUtils.simulateAction(() => {
				highlightButton.click();
			});

			ok(augmentationPreview.props.clipperState.previewGlobalInfo.highlighterEnabled);
			notStrictEqual(highlightButton.className.indexOf("active"), -1, "The active class should be applied to the highlight button");
		});

		test("If the user selects something in the highlightable preview body, then clicks the highlight button, the internal state should show that 'Highlighting' is disabled in Augmentation mode, and the item should be highlighted", () => {
			let mockClipperState = this.getMockAugmentationModeState();
			let defaultComponent = <AugmentationPreview clipperState={mockClipperState} />;
			let augmentationPreview = MithrilUtils.mountToFixture(defaultComponent);

			// This id is necessary for the highlighting to be enabled on this element's children
			let paragraph = document.createElement("p");
			let paragraphId = "para";
			paragraph.id = paragraphId;
			let innerText = "Test";
			paragraph.innerHTML = innerText;
			document.getElementById(Constants.Ids.highlightablePreviewBody).appendChild(paragraph);

			let highlightButton = document.getElementById(Constants.Ids.highlightButton);

			MithrilUtils.simulateAction(() => {
				// Simulate a selection (http://stackoverflow.com/questions/6139107/programatically-select-text-in-a-contenteditable-html-element)
				let range = document.createRange();
				range.selectNodeContents(paragraph);
				let sel = window.getSelection();
				sel.removeAllRanges();
				sel.addRange(range);

				highlightButton.click();
			});

			ok(!augmentationPreview.props.clipperState.previewGlobalInfo.highlighterEnabled);
			strictEqual(highlightButton.className.indexOf("active"), -1, "The active class should not be applied to the highlight button");

			let childSpans = paragraph.getElementsByClassName(Constants.Classes.highlighted);
			strictEqual(childSpans.length, 1, "There should only be one highlighted element");
			strictEqual((childSpans[0] as HTMLElement).innerText, innerText,
				"The highlighted element should be the inner text of the paragraph");
		});

		test("If the user selects something outside the highlightable preview body, then clicks the highlight button, the internal state should show that 'Highlighting' is enabled in Augmentation mode, and nothing should be highlighted", () => {
			let mockClipperState = this.getMockAugmentationModeState();
			let defaultComponent = <AugmentationPreview clipperState={mockClipperState} />;
			let augmentationPreview = MithrilUtils.mountToFixture(defaultComponent);

			// This id is necessary for the highlighting to be enabled on this element's children
			let paragraph = document.createElement("p");
			let paragraphId = "para";
			paragraph.id = paragraphId;
			let innerText = "Test";
			paragraph.innerHTML = innerText;

			// Note this is outside the preview body
			MithrilUtils.getFixture().appendChild(paragraph);

			let highlightButton = document.getElementById(Constants.Ids.highlightButton);

			MithrilUtils.simulateAction(() => {
				let range = document.createRange();
				range.selectNodeContents(paragraph);
				let sel = window.getSelection();
				sel.removeAllRanges();
				sel.addRange(range);

				highlightButton.click();
			});

			ok(augmentationPreview.props.clipperState.previewGlobalInfo.highlighterEnabled);
			notStrictEqual(highlightButton.className.indexOf("active"), -1, "The active class should be applied to the highlight button");

			let childSpans = paragraph.getElementsByClassName(Constants.Classes.highlighted);
			strictEqual(childSpans.length, 0, "There should only be one highlighted element");
		});

		test("If the user is highlighting (i.e., highlighting mode is active), then the 'active' class should be applied to the highlightButton in Augmentation mode", () => {
			let mockClipperState = this.getMockAugmentationModeState();
			let defaultComponent = <AugmentationPreview clipperState={mockClipperState} />;
			MithrilUtils.mountToFixture(defaultComponent);

			let highlightButton = document.getElementById(Constants.Ids.highlightButton);

			MithrilUtils.simulateAction(() => {
				highlightButton.click();
			});
			// We do this to manually trigger a config call
			MithrilUtils.simulateAction(() => {});

			notStrictEqual(highlightButton.className.indexOf("active"), -1, "The active class should be applied to the highlight button");
		});

		test("If the user is not highlighting (i.e., highlighting mode is active), then the 'active' class should not be applied to the highlightButton in Augmentation mode", () => {
			let mockClipperState = this.getMockAugmentationModeState();
			let defaultComponent = <AugmentationPreview clipperState={mockClipperState} />;
			MithrilUtils.mountToFixture(defaultComponent);

			let highlightButton = document.getElementById(Constants.Ids.highlightButton);

			strictEqual(highlightButton.className.indexOf("active"), -1, "The active class should not be applied to the highlight button");
		});

		test("If the editable title feature is disabled, it should be readonly", () => {
			let mockClipperState = this.getMockAugmentationModeState();
			mockClipperState.injectOptions.enableEditableTitle = false;
			let defaultComponent = <AugmentationPreview clipperState={mockClipperState} />;
			MithrilUtils.mountToFixture(defaultComponent);

			let previewHeaderInput = document.getElementById(Constants.Ids.previewHeaderInput) as HTMLTextAreaElement;
			strictEqual(previewHeaderInput.value, mockClipperState.previewGlobalInfo.previewTitleText,
				"The title of the page should be displayed in the preview title");
			ok(previewHeaderInput.readOnly);
		});
	}

	private getMockAugmentationModeState(): ClipperState {
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
}

(new AugmentationPreviewTests()).runTests();
