import {Constants} from "../../../scripts/constants";

import {RegionSelectingPanel} from "../../../scripts/clipperUI/panels/regionSelectingPanel";

import {MithrilUtils} from "../../mithrilUtils";
import {MockProps} from "../../mockProps";
import {TestModule} from "../../testModule";

export class RegionSelectingPanelTests extends TestModule {
	private mockRegionSelectingPanelProps = {
		clipperState: MockProps.getMockClipperState()
	};

	private defaultComponent;

	protected module() {
		return "regionSelectingPanel";
	}

	protected beforeEach() {
		this.defaultComponent = <RegionSelectingPanel {...this.mockRegionSelectingPanelProps}/>;
	}

	protected tests() {
		test("The region selecting panel should render the 'Back to Home' button", () => {
			MithrilUtils.mountToFixture(this.defaultComponent);

			let button = document.getElementById(Constants.Ids.regionClipCancelButton);
			ok(button, "The 'Back to Home' button should be present");
		});

		test("The region selecting panel should set focus on the 'Back to Home' button when rendered", (assert) => {
			let done = assert.async();
			
			MithrilUtils.mountToFixture(this.defaultComponent);
			
			// Wait for the next tick to allow Mithril to complete rendering
			setTimeout(() => {
				let button = document.getElementById(Constants.Ids.regionClipCancelButton);
				strictEqual(document.activeElement, button, "The 'Back to Home' button should have focus");
				done();
			}, 0);
		});
	}
}

(new RegionSelectingPanelTests()).run();
