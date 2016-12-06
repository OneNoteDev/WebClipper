import * as sinon from "sinon";

import {Constants} from "../../../scripts/constants";

import {ClipMode} from "../../../scripts/clipperUI/clipMode";
import {ClipperState} from "../../../scripts/clipperUI/clipperState";
import {Status} from "../../../scripts/clipperUI/status";

import {ClippingPanelWithProgressIndicator} from "../../../scripts/clipperUI/panels/clippingPanelWithProgressIndicator";

import {MithrilUtils} from "../../mithrilUtils";
import {MockProps} from "../../mockProps";
import {TestModule} from "../../testModule";

export class ClippingPanelWithProgressIndicatorTests extends TestModule {
	private mockClipperState: ClipperState;

	protected module() {
		return "clippingPanelWithProgressIndicator";
	}

	protected beforeEach() {
		this.mockClipperState = MockProps.getMockClipperState();
	}

	protected tests() {
		test("Given that numPagesCompleted or totalPages is undefined, the panel should not render any loading message", () => {
			MithrilUtils.mountToFixture(<ClippingPanelWithProgressIndicator clipperState={this.mockClipperState} />);
			ok(!document.getElementById(Constants.Ids.clipProgressIndicatorMessage), "The clipping progress indication message should not be rendered");
		});

		test("If numPagesCompleted is greater than totalPages, the progress message should not be rendered", () => {
			this.mockClipperState.pdfSaveStatus.numPagesCompleted = 5;
			this.mockClipperState.pdfSaveStatus.totalPages = 1;
			ok(!document.getElementById(Constants.Ids.clipProgressIndicatorMessage), "The clipping progress indication message should not be rendered");
		});

		test("If numPagesCompleted is negative, the progress message should not be rendered", () => {
			this.mockClipperState.pdfSaveStatus.numPagesCompleted = -1;
			ok(!document.getElementById(Constants.Ids.clipProgressIndicatorMessage), "The clipping progress indication message should not be rendered");
		});

		test("If totalPages is negative, the progress message should not be rendered", () => {
			this.mockClipperState.pdfSaveStatus.totalPages = -1;
			ok(!document.getElementById(Constants.Ids.clipProgressIndicatorMessage), "The clipping progress indication message should not be rendered");
		});

		test("Given that state has a valid pdfSaveStatus, the panel should render the progress message with the correct values subsittuted", () => {
			this.mockClipperState.pdfSaveStatus.numPagesCompleted = 1;
			this.mockClipperState.pdfSaveStatus.totalPages = 5;
			MithrilUtils.mountToFixture(<ClippingPanelWithProgressIndicator clipperState={this.mockClipperState} />);

			let messageElement = document.getElementById(Constants.Ids.clipProgressIndicatorMessage);
			ok(messageElement, "The clipping progress indication message should be rendered");
			strictEqual(messageElement.innerText, "Clipping page 2 of 5...");

			MithrilUtils.simulateAction(() => {
				this.mockClipperState.pdfSaveStatus.numPagesCompleted = 2;
				this.mockClipperState.pdfSaveStatus.totalPages = 6;
			});

			messageElement = document.getElementById(Constants.Ids.clipProgressIndicatorMessage);
			ok(messageElement, "The clipping progress indication message should be rendered");
			strictEqual(messageElement.innerText, "Clipping page 3 of 6...");
		});
	}
}

(new ClippingPanelWithProgressIndicatorTests()).runTests();
