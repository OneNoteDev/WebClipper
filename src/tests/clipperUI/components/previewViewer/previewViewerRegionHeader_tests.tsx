import {PreviewViewerRegionHeader} from "../../../../scripts/clipperUI/components/previewViewer/previewViewerRegionHeader";

import {ClipperState} from "../../../../scripts/clipperUI/clipperState";
import {Status} from "../../../../scripts/clipperUI/status";

import {Constants} from "../../../../scripts/constants";

import {HelperFunctions} from "../../../helperFunctions";

let defaultComponent;
let mockClipperState: ClipperState;

QUnit.module("previewViewerAugmentationHeader", {
	beforeEach: () => {
		mockClipperState = HelperFunctions.getMockClipperState();
		defaultComponent =
			<PreviewViewerRegionHeader
				clipperState={mockClipperState} />;
	}
});

test("The addRegionControl should be visible", () => {
	HelperFunctions.mountToFixture(defaultComponent);
	ok(!!document.getElementById(Constants.Ids.addRegionControl));
});

test("The addRegionControl's buttons should be visible", () => {
	HelperFunctions.mountToFixture(defaultComponent);
	ok(!!document.getElementById(Constants.Ids.addAnotherRegionButton));
});

test("When clicking on the add region button, the regionResult prop should be set accordingly", () => {
	let previewViewerRegionHeader = HelperFunctions.mountToFixture(defaultComponent);

	let previousRegionResultData = mockClipperState.regionResult.data;

	let addAnotherRegionButton = document.getElementById(Constants.Ids.addAnotherRegionButton);
	HelperFunctions.simulateAction(() => {
		addAnotherRegionButton.click();
	});

	deepEqual(previewViewerRegionHeader.props.clipperState.regionResult, { status: Status.InProgress, data: previousRegionResultData },
		"The status of the region result should be in progress, and the data untouched");
});
