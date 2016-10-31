import {Constants} from "../../../scripts/constants";

import {ClipMode} from "../../../scripts/clipperUI/clipMode";
import {ClipperState} from "../../../scripts/clipperUI/clipperState";
import {Status} from "../../../scripts/clipperUI/status";

import {OptionsPanel, OptionsPanelProp} from "../../../scripts/clipperUI/panels/optionsPanel";

import {HelperFunctions} from "../../helperFunctions";

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

test("If the current mode is full page and its call to the API has succeeded, the clip button should be active and clickable", () => {
	mockOptionsPanelProps.clipperState.currentMode.set(ClipMode.FullPage);
	mockOptionsPanelProps.clipperState.fullPageResult.status = Status.Succeeded;
	HelperFunctions.mountToFixture(<OptionsPanel onStartClip={mockOptionsPanelProps.onStartClip}
		onPopupToggle={mockOptionsPanelProps.onPopupToggle} clipperState={mockOptionsPanelProps.clipperState} />);

	let clipButton = document.getElementById(Constants.Ids.clipButton);
	ok(clipButton, "The clip button should be present");

	let clipButtonContainer = document.getElementById(Constants.Ids.clipButtonContainer);
	ok(clipButtonContainer, "The clip button container should be present");
	ok(!clipButtonContainer.classList.contains("disabled"),
		"The clip button container should indicate that the button is active");

	HelperFunctions.simulateAction(() => {
		clipButton.click();
	});

	ok(onStartClipCalled, "The onStartClip callback should be called");
});
