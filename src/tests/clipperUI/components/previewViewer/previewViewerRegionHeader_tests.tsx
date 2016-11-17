import {PreviewViewerRegionHeader} from "../../../../scripts/clipperUI/components/previewViewer/previewViewerRegionHeader";

import {ClipperState} from "../../../../scripts/clipperUI/clipperState";
import {Status} from "../../../../scripts/clipperUI/status";

import {Constants} from "../../../../scripts/constants";

import {HelperFunctions} from "../../../helperFunctions";
import {MithrilUtils} from "../../../mithrilUtils";
import {MockProps} from "../../../mockProps";
import {TestModule} from "../../../testModule";

export class PreviewViewerAugmentationHeaderTests extends TestModule {
	private defaultComponent;
	private mockClipperState: ClipperState;

	protected module() {
		return "previewViewerAugmentationHeader";
	}

	protected beforeEach() {
		this.mockClipperState = MockProps.getMockClipperState();
		this.defaultComponent =
			<PreviewViewerRegionHeader
				clipperState={this.mockClipperState} />;
	}

	protected tests() {
		test("The addRegionControl should be visible", () => {
			MithrilUtils.mountToFixture(this.defaultComponent);
			ok(!!document.getElementById(Constants.Ids.addRegionControl));
		});

		test("The addRegionControl's buttons should be visible", () => {
			MithrilUtils.mountToFixture(this.defaultComponent);
			ok(!!document.getElementById(Constants.Ids.addAnotherRegionButton));
		});

		test("When clicking on the add region button, the regionResult prop should be set accordingly", () => {
			let previewViewerRegionHeader = MithrilUtils.mountToFixture(this.defaultComponent);

			let previousRegionResultData = this.mockClipperState.regionResult.data;

			let addAnotherRegionButton = document.getElementById(Constants.Ids.addAnotherRegionButton);
			MithrilUtils.simulateAction(() => {
				addAnotherRegionButton.click();
			});

			deepEqual(previewViewerRegionHeader.props.clipperState.regionResult, { status: Status.InProgress, data: previousRegionResultData },
				"The status of the region result should be in progress, and the data untouched");
		});
	}
}

(new PreviewViewerAugmentationHeaderTests()).runTests();
