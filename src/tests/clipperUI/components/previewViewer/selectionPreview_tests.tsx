import {Constants} from "../../../../scripts/constants";

import {ClipperState} from "../../../../scripts/clipperUI/clipperState";
import {ClipMode} from "../../../../scripts/clipperUI/clipMode";

import {SelectionPreview} from "../../../../scripts/clipperUI/components/previewViewer/selectionPreview";

import {MithrilUtils} from "../../../mithrilUtils";
import {MockProps} from "../../../mockProps";
import {TestModule} from "../../../testModule";

export class SelectionPreviewTests extends TestModule {
	private mockClipperState: ClipperState;
	private defaultComponent;

	protected module() {
		return "selectionPreview";
	}

	protected beforeEach() {
		this.mockClipperState = this.getMockSelectionModeState();
		this.defaultComponent = <SelectionPreview clipperState={this.mockClipperState} />;
	}

	protected tests() {
		// test("The selection's highlightable preview body should render the content", () => {
		// 	MithrilUtils.mountToFixture(this.defaultComponent);

		// 	let highlightablePreviewBody = document.getElementById(Constants.Ids.highlightablePreviewBody);
		// 	strictEqual(highlightablePreviewBody.innerText.trim(),
		// 		this.mockClipperState.selectionPreviewInfo.join(""),
		// 		"The editable selection result content is displayed in the preview body");
		// });

		// test("The selection preview's highlightable preview body should render the content as HTML, not purely text", () => {
		// 	this.mockClipperState.selectionPreviewInfo = ["<div>The selection</div>"];
		// 	this.defaultComponent = <SelectionPreview clipperState={this.mockClipperState} />;
		// 	MithrilUtils.mountToFixture(this.defaultComponent);

		// 	let highlightablePreviewBody = document.getElementById(Constants.Ids.highlightablePreviewBody);

		// 	strictEqual(highlightablePreviewBody.innerHTML, this.mockClipperState.selectionPreviewInfo.join(""),
		// 		"Only the editable selection result content is displayed in the preview body");
		// 	strictEqual(highlightablePreviewBody.childElementCount, 1, "There should be one child");

		// 	let child = highlightablePreviewBody.firstElementChild as HTMLElement;
		// 	strictEqual(child.outerHTML, this.mockClipperState.selectionPreviewInfo.join(""),
		// 		"The child's outer HTML should be the preview body html");
		// 	strictEqual(child.innerHTML, "The selection",
		// 		"The child's outer HTML should be the selection text");
		// });
	}

	private getMockSelectionModeState(): ClipperState {
		let state = MockProps.getMockClipperState() as ClipperState;
		state.currentMode.set(ClipMode.Selection);
		state.selectionPreviewInfo = ["The selection"];
		return state;
	}
}

(new SelectionPreviewTests()).runTests();
