import {Constants} from "../../../scripts/constants";

import {ClipMode} from "../../../scripts/clipperUI/clipMode";
import {Clipper} from "../../../scripts/clipperUI/frontEndGlobals";
import {RegionSelectingPanel} from "../../../scripts/clipperUI/panels/regionSelectingPanel";

import {StubSessionLogger} from "../../../scripts/logging/stubSessionLogger";

import {MithrilUtils} from "../../mithrilUtils";
import {MockProps} from "../../mockProps";
import {TestModule} from "../../testModule";

export class RegionSelectingPanelTests extends TestModule {
	protected module() {
		return "regionSelectingPanel";
	}

	protected beforeEach() {
		Clipper.logger = new StubSessionLogger();
	}

	protected tests() {
		test("When the back button is clicked, focusOnRender should be set to region button ID", () => {
			let mockState = MockProps.getMockClipperState();
			mockState.currentMode.set(ClipMode.Region);

			MithrilUtils.mountToFixture(<RegionSelectingPanel clipperState={mockState}/>);

			let backButton = document.getElementById(Constants.Ids.regionClipCancelButton);
			ok(backButton, "The back button should be rendered");

			strictEqual(mockState.focusOnRender, undefined, "focusOnRender should not be set initially");

			// Click the back button
			MithrilUtils.simulateAction(() => {
				backButton.click();
			});

			strictEqual(mockState.focusOnRender, Constants.Ids.regionButton, "focusOnRender should be set to region button ID");
		});

		test("The back button should call reset on the clipper state", () => {
			let mockState = MockProps.getMockClipperState();
			let resetCalled = false;
			mockState.reset = () => {
				resetCalled = true;
			};
			mockState.currentMode.set(ClipMode.Region);

			MithrilUtils.mountToFixture(<RegionSelectingPanel clipperState={mockState}/>);

			let backButton = document.getElementById(Constants.Ids.regionClipCancelButton);
			ok(backButton, "The back button should be rendered");

			strictEqual(resetCalled, false, "Reset should not have been called yet");
			MithrilUtils.simulateAction(() => {
				backButton.click();
			});
			strictEqual(resetCalled, true, "Reset should be called when back button is clicked");
		});

		test("The back button should set focusOnRender even if region button does not exist", () => {
			let mockState = MockProps.getMockClipperState();
			mockState.currentMode.set(ClipMode.Region);

			MithrilUtils.mountToFixture(<RegionSelectingPanel clipperState={mockState}/>);

			let backButton = document.getElementById(Constants.Ids.regionClipCancelButton);
			ok(backButton, "The back button should be rendered");

			// Click the back button without a region button present - should not throw
			MithrilUtils.simulateAction(() => {
				backButton.click();
			});

			strictEqual(mockState.focusOnRender, Constants.Ids.regionButton, "focusOnRender should be set even if button doesn't exist");
		});
	}
}

(new RegionSelectingPanelTests()).runTests();
