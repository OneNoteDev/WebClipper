import {Constants} from "../../../../scripts/constants";

import {ClipperState} from "../../../../scripts/clipperUI/clipperState";
import {ClipMode} from "../../../../scripts/clipperUI/clipMode";
import {Status} from "../../../../scripts/clipperUI/status";

import {RegionPreview} from "../../../../scripts/clipperUI/components/previewViewer/regionPreview";

import {HelperFunctions} from "../../../helperFunctions";
import {MithrilUtils} from "../../../mithrilUtils";
import {MockProps} from "../../../mockProps";
import {TestModule} from "../../../testModule";

declare function require(name: string);

export class RegionPreviewTests extends TestModule {
	private stringsJson = require("../../../../strings.json");

	protected module() {
		return "regionPreview";
	}

	protected tests() {
		test("The tab order flow from the header to the preview title is correct in Region mode", () => {
			let mockClipperState = this.getMockRegionModeState();
			let defaultComponent = <RegionPreview clipperState={mockClipperState} />;
			MithrilUtils.mountToFixture(defaultComponent);

			let elementsInExpectedTabOrder = [
				{ name: Constants.Ids.addRegionControl, elem: document.getElementById(Constants.Ids.addRegionControl) },
				{ name: Constants.Ids.previewHeaderInput, elem: document.getElementById(Constants.Ids.previewHeaderInput) }
			];

			for (let i = 1; i < elementsInExpectedTabOrder.length; i++) {
				ok(elementsInExpectedTabOrder[i].elem.tabIndex > elementsInExpectedTabOrder[i - 1].elem.tabIndex,
					"Element " + elementsInExpectedTabOrder[i].name + " should have a greater tabIndex than element " + elementsInExpectedTabOrder[i - 1].name);
			}
		});

		test("The tab order flow from the preview title through the region delete buttons is correct in Region mode, and each tab index should not be less than 1", () => {
			let mockClipperState = this.getMockRegionModeState();
			let defaultComponent = <RegionPreview clipperState={mockClipperState} />;
			MithrilUtils.mountToFixture(defaultComponent);

			let elementsInExpectedTabOrder = [
				{ name: Constants.Ids.previewHeaderInput, elem: document.getElementById(Constants.Ids.previewHeaderInput) }
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
			let mockClipperState = this.getMockRegionModeState();
			let defaultComponent = <RegionPreview clipperState={mockClipperState} />;
			MithrilUtils.mountToFixture(defaultComponent);

			ok(document.getElementById(Constants.Ids.addRegionControl), "The region control should exist");

			ok(!document.getElementById(Constants.Ids.highlightControl), "The highlight control should not exist");
			ok(!document.getElementById(Constants.Ids.serifControl), "The font family control should not exist");
			ok(!document.getElementById(Constants.Ids.decrementFontSize), "The decrement font size button should not exist");
			ok(!document.getElementById(Constants.Ids.incrementFontSize), "The increment font size button should not exist");
		});

		test("The editable title of the page should be displayed in the preview title in Region mode", () => {
			let mockClipperState = this.getMockRegionModeState();
			let defaultComponent = <RegionPreview clipperState={mockClipperState} />;
			MithrilUtils.mountToFixture(defaultComponent);

			let previewHeaderInput = document.getElementById(Constants.Ids.previewHeaderInput) as HTMLTextAreaElement;
			strictEqual(previewHeaderInput.value, mockClipperState.previewGlobalInfo.previewTitleText,
				"The title of the page should be displayed in the preview title");
			ok(!previewHeaderInput.readOnly);
		});

		test("There should be one image rendered for every data url in state in Region mode", () => {
			let mockClipperState = this.getMockRegionModeState();
			let defaultComponent = <RegionPreview clipperState={mockClipperState} />;
			MithrilUtils.mountToFixture(defaultComponent);

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
			let mockClipperState = this.getMockRegionModeState();
			let defaultComponent = <RegionPreview clipperState={mockClipperState} />;
			MithrilUtils.mountToFixture(defaultComponent);

			let previewBody = document.getElementById(Constants.Ids.previewBody);
			let selections = previewBody.getElementsByClassName(Constants.Classes.regionSelection);

			let indexToRemove = 1;

			// This does not represent a user action, but is done to make testing easier
			mockClipperState.regionResult.data.splice(indexToRemove, 1);

			let removeButton = selections[indexToRemove].getElementsByClassName(Constants.Classes.regionSelectionRemoveButton)[0] as HTMLAnchorElement;
			MithrilUtils.simulateAction(() => {
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
			let mockClipperState = this.getMockRegionModeState();
			let defaultComponent = <RegionPreview clipperState={mockClipperState} />;
			MithrilUtils.mountToFixture(defaultComponent);

			let previewBody = document.getElementById(Constants.Ids.previewBody);
			let selections = previewBody.getElementsByClassName(Constants.Classes.regionSelection);

			let indexToRemove = 0;

			// This does not represent a user action, but is done to make testing easier
			mockClipperState.regionResult.data.splice(indexToRemove, 1);

			let removeButton = selections[indexToRemove].getElementsByClassName(Constants.Classes.regionSelectionRemoveButton)[0] as HTMLAnchorElement;
			MithrilUtils.simulateAction(() => {
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
			let mockClipperState = this.getMockRegionModeState();
			let defaultComponent = <RegionPreview clipperState={mockClipperState} />;
			MithrilUtils.mountToFixture(defaultComponent);

			let previewBody = document.getElementById(Constants.Ids.previewBody);
			let selections = previewBody.getElementsByClassName(Constants.Classes.regionSelection);

			let indexToRemove = mockClipperState.regionResult.data.length - 1;

			// This does not represent a user action, but is done to make testing easier
			mockClipperState.regionResult.data.splice(indexToRemove, 1);

			let removeButton = selections[indexToRemove].getElementsByClassName(Constants.Classes.regionSelectionRemoveButton)[0] as HTMLAnchorElement;
			MithrilUtils.simulateAction(() => {
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

		test("When region clipping is disabled, remove image buttons are not rendered. The mode itself is still available because of context image selection mode.", () => {
			let mockClipperState = this.getMockRegionModeState();
			mockClipperState.injectOptions.enableRegionClipping = false;
			let defaultComponent = <RegionPreview clipperState={mockClipperState} />;
			MithrilUtils.mountToFixture(defaultComponent);

			let regionButtons = document.getElementsByClassName(Constants.Classes.regionSelectionRemoveButton);
			strictEqual(regionButtons.length, 0, "No remove image buttons should be rendered");
		});

		test("When region clipping is disabled, the add another region button should not be rendered.", () => {
			let mockClipperState = this.getMockRegionModeState();
			mockClipperState.injectOptions.enableRegionClipping = false;
			let defaultComponent = <RegionPreview clipperState={mockClipperState} />;
			MithrilUtils.mountToFixture(defaultComponent);

			let addAnotherRegionButton = document.getElementById(Constants.Ids.addAnotherRegionButton);
			ok(!addAnotherRegionButton, "The add another region button should not be rendered");
		});
	}

	private getMockRegionModeState(): ClipperState {
		let state = MockProps.getMockClipperState() as ClipperState;
		state.currentMode.set(ClipMode.Region);
		state.regionResult = {
			data: ["data:image/png;base64,123", "data:image/png;base64,456", "data:image/png;base64,789", "data:image/png;base64,0"],
			status: Status.Succeeded
		};
		return state;
	}
}

(new RegionPreviewTests()).runTests();
