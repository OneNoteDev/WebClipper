/// <reference path="../../../../../typings/main/ambient/qunit/qunit.d.ts" />

import {Constants} from "../../../../scripts/constants";

import {ClipperState} from "../../../../scripts/clipperUI/clipperState";
import {ClipMode} from "../../../../scripts/clipperUI/clipMode";

import {SelectionPreview} from "../../../../scripts/clipperUI/components/previewViewer/selectionPreview";

import {HelperFunctions} from "../../../helperFunctions";

function getMockSelectionModeState(): ClipperState {
	let state = HelperFunctions.getMockClipperState() as ClipperState;
	state.currentMode.set(ClipMode.Selection);
	state.selectionPreviewInfo = {
		previewBodyHtml: "The selection"
	};
	return state;
}

let mockClipperState: ClipperState;
let defaultComponent;

QUnit.module("selectionPreview", {
	beforeEach: () => {
		mockClipperState = getMockSelectionModeState();
		defaultComponent = <SelectionPreview clipperState={mockClipperState} />;
	}
});

test("The selection preview should render the content", () => {
	HelperFunctions.mountToFixture(defaultComponent);

	strictEqual(document.getElementById(Constants.Ids.previewBody).innerText,
		mockClipperState.selectionPreviewInfo.previewBodyHtml,
		"The editable selection result content is displayed in the preview body");

	strictEqual(document.getElementById(Constants.Ids.previewBody).innerHTML,
		mockClipperState.selectionPreviewInfo.previewBodyHtml,
		"Only the editable selection result content is displayed in the preview body");
});

test("The selection preview should render the content as HTML, not purely text", () => {
	mockClipperState.selectionPreviewInfo.previewBodyHtml = "<div>The selection</div>";
	defaultComponent = <SelectionPreview clipperState={mockClipperState} />;
	HelperFunctions.mountToFixture(defaultComponent);

	let previewBody = document.getElementById(Constants.Ids.previewBody);

	strictEqual(previewBody.innerHTML, mockClipperState.selectionPreviewInfo.previewBodyHtml,
		"Only the editable selection result content is displayed in the preview body");
	strictEqual(previewBody.childElementCount, 1, "There should be one child");

	let child = previewBody.firstElementChild as HTMLElement;
	strictEqual(child.outerHTML, mockClipperState.selectionPreviewInfo.previewBodyHtml,
		"The child's outer HTML should be the preview body html");
	strictEqual(child.innerHTML, "The selection",
		"The child's outer HTML should be the selection text");
});
