import {Constants} from "../../../scripts/constants";

import {Status} from "../../../scripts/clipperUI/status";
import {SuccessPanel} from "../../../scripts/clipperUI/panels/successPanel";

import {MithrilUtils} from "../../mithrilUtils";
import {MockProps} from "../../mockProps";
import {TestModule} from "../../testModule";

export class SuccessPanelTests extends TestModule {
	private mockSuccessPanelProps = {
		clipperState: MockProps.getMockClipperState()
	};

	private defaultComponent;

	protected module() {
		return "successPanel";
	}

	protected beforeEach() {
		// Setup a successful API result
		let state = MockProps.getMockClipperState();
		state.oneNoteApiResult = {
			status: Status.Succeeded,
			data: {
				links: {
					oneNoteWebUrl: {
						href: "https://www.onenote.com/page"
					}
				}
			}
		};
		this.mockSuccessPanelProps.clipperState = state;
		this.defaultComponent = <SuccessPanel {...this.mockSuccessPanelProps}/>;
	}

	protected tests() {
		test("The success panel should render the 'View in OneNote' button", () => {
			MithrilUtils.mountToFixture(this.defaultComponent);

			let button = document.getElementById(Constants.Ids.launchOneNoteButton);
			ok(button, "The 'View in OneNote' button should be present");
		});

		test("The success panel should set focus on the 'View in OneNote' button when rendered", (assert) => {
			let done = assert.async();
			
			MithrilUtils.mountToFixture(this.defaultComponent);
			
			// Wait for the next tick to allow Mithril to complete rendering
			setTimeout(() => {
				let button = document.getElementById(Constants.Ids.launchOneNoteButton);
				strictEqual(document.activeElement, button, "The 'View in OneNote' button should have focus");
				done();
			}, 0);
		});
	}
}

(new SuccessPanelTests()).run();
