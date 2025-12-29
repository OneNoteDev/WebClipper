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
		test("When the back button is clicked, focus should return to the region button", (done) => {
			let mockState = MockProps.getMockClipperState();
			mockState.currentMode.set(ClipMode.Region);

			MithrilUtils.mountToFixture(<RegionSelectingPanel clipperState={mockState}/>);

			// Create a mock region button to test focus
			let regionButton = document.createElement("a");
			regionButton.id = Constants.Ids.regionButton;
			regionButton.tabIndex = 0;
			document.body.appendChild(regionButton);

			// Track if focus was called
			let focusCalled = false;
			regionButton.focus = () => {
				focusCalled = true;
			};

			let backButton = document.getElementById(Constants.Ids.regionClipCancelButton);
			ok(backButton, "The back button should be rendered");

			// Click the back button
			MithrilUtils.simulateAction(() => {
				backButton.click();
			});

			// Wait for setTimeout to execute
			setTimeout(() => {
				ok(focusCalled, "Focus should be called on the region button after clicking back");

				// Clean up
				document.body.removeChild(regionButton);
				done();
			}, 10);
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

		test("The back button should not fail if region button does not exist", (done) => {
			let mockState = MockProps.getMockClipperState();
			mockState.currentMode.set(ClipMode.Region);

			MithrilUtils.mountToFixture(<RegionSelectingPanel clipperState={mockState}/>);

			let backButton = document.getElementById(Constants.Ids.regionClipCancelButton);
			ok(backButton, "The back button should be rendered");

			// Click the back button without a region button present
			MithrilUtils.simulateAction(() => {
				backButton.click();
			});

			// Wait for setTimeout to execute - should not throw
			setTimeout(() => {
				ok(true, "Should not throw even if region button does not exist");
				done();
			}, 10);
		});
	}
}

(new RegionSelectingPanelTests()).runTests();
