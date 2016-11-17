import * as sinon from "sinon";

import {Constants} from "../../../scripts/constants";

import {ClipMode} from "../../../scripts/clipperUI/clipMode";
import {ClipperState} from "../../../scripts/clipperUI/clipperState";
import {Status} from "../../../scripts/clipperUI/status";

import {ClippingPanelWithDelayedMessage} from "../../../scripts/clipperUI/panels/clippingPanelWithDelayedMessage";

import {HelperFunctions} from "../../helperFunctions";
import {MithrilUtils} from "../../mithrilUtils";
import {MockProps} from "../../mockProps";
import {TestModule} from "../../testModule";

export class ClippingPanelWithDelayedMessageTests extends TestModule {
	private mockClipperState: ClipperState;
	private clock: sinon.SinonFakeTimers;

	protected module() {
		return "clippingPanelWithDelayedMessage";
	}

	protected beforeEach() {
		this.mockClipperState = MockProps.getMockClipperState();
		this.clock = sinon.useFakeTimers();
	}

	protected afterEach() {
		this.clock.restore();
	}

	protected tests() {
		test("If passed a delay of 0, the panel should display the delayed message as soon as it is instantiated", () => {
			let expectedMessage = "hello world";
			MithrilUtils.mountToFixture(<ClippingPanelWithDelayedMessage clipperState={this.mockClipperState} delay={0} message={expectedMessage} />);
			MithrilUtils.tick(this.clock, 1);

			let clipProgressDelayedMessage = document.getElementById(Constants.Ids.clipProgressDelayedMessage);
			ok(clipProgressDelayedMessage, "The clip progress delayed message should render immediately");
			strictEqual(clipProgressDelayedMessage.innerText, expectedMessage,
				"The message should be rendered in the clip progress delayed message");
		});

		test("If passed a non-zero positive delay, the panel should not display the delayed message until the delay has been passed", () => {
			let expectedMessage = "hello world";
			let delay = 10000;
			MithrilUtils.mountToFixture(<ClippingPanelWithDelayedMessage clipperState={this.mockClipperState} delay={delay} message={expectedMessage} />);

			let clipProgressDelayedMessage = document.getElementById(Constants.Ids.clipProgressDelayedMessage);
			ok(!clipProgressDelayedMessage, "The clip progress delayed message should not render immediately");

			MithrilUtils.tick(this.clock, delay - 1);
			clipProgressDelayedMessage = document.getElementById(Constants.Ids.clipProgressDelayedMessage);
			ok(!clipProgressDelayedMessage, "The clip progress delayed message should not render just before the delay");

			MithrilUtils.tick(this.clock, 1);
			clipProgressDelayedMessage = document.getElementById(Constants.Ids.clipProgressDelayedMessage);
			ok(clipProgressDelayedMessage, "The clip progress delayed message should render after the delay");
			strictEqual(clipProgressDelayedMessage.innerText, expectedMessage,
				"The message should be rendered in the clip progress delayed message");
		});

		test("If passed a delay < 0, the panel should display the delayed message as soon as it is instantiated", () => {
			let expectedMessage = "hello world";
			MithrilUtils.mountToFixture(<ClippingPanelWithDelayedMessage clipperState={this.mockClipperState} delay={-10000} message={expectedMessage} />);
			MithrilUtils.tick(this.clock, 1);

			let clipProgressDelayedMessage = document.getElementById(Constants.Ids.clipProgressDelayedMessage);
			ok(clipProgressDelayedMessage, "The clip progress delayed message should render immediately");
			strictEqual(clipProgressDelayedMessage.innerText, expectedMessage,
				"The message should be rendered in the clip progress delayed message");
		});
	}
}

(new ClippingPanelWithDelayedMessageTests()).runTests();
