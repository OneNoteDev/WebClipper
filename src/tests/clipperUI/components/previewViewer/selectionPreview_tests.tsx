import {Constants} from "../../../../scripts/constants";

import {ClipperState} from "../../../../scripts/clipperUI/clipperState";
import {ClipMode} from "../../../../scripts/clipperUI/clipMode";
import {Status} from "../../../../scripts/clipperUI/status";

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
		test("The selection's highlightable preview body should render the content", () => {
			MithrilUtils.mountToFixture(this.defaultComponent);

			this.assertSelectionsAreRendered();
			this.assertDeleteButtonExistence(true);
		});

		test("The selection's highlightable preview body should render the content for more than one selection", () => {
			this.mockClipperState.selectionPreviewInfo = ["1", "2", "3"];
			this.defaultComponent = <SelectionPreview clipperState={this.mockClipperState} />;
			MithrilUtils.mountToFixture(this.defaultComponent);

			this.assertSelectionsAreRendered();
			this.assertDeleteButtonExistence(true);
		});

		test("In PDF mode, delete buttons should not be rendered", () => {
			this.mockClipperState.pageInfo.contentType = OneNoteApi.ContentType.EnhancedUrl;
			this.defaultComponent = <SelectionPreview clipperState={this.mockClipperState} />;
			MithrilUtils.mountToFixture(this.defaultComponent);

			this.assertSelectionsAreRendered();
			this.assertDeleteButtonExistence(false);
		});
	}

	private getMockSelectionModeState(): ClipperState {
		let state = MockProps.getMockClipperState() as ClipperState;
		state.currentMode.set(ClipMode.Selection);
		state.selectionPreviewInfo = ["The selection"];
		state.selectionStatus = Status.Succeeded;
		return state;
	}

	private assertSelectionsAreRendered() {
		let selectionElems = document.getElementsByClassName("html-selection-content");
		strictEqual(selectionElems.length, this.mockClipperState.selectionPreviewInfo.length);

		for (let i = 0; i < selectionElems.length; i++) {
			strictEqual((selectionElems[i] as HTMLElement).innerText.trim(), this.mockClipperState.selectionPreviewInfo[i]);
		}
	}

	private assertDeleteButtonExistence(exists: boolean) {
		let deleteButtonElems = document.getElementsByClassName("region-selection-remove-button");
		strictEqual(deleteButtonElems.length, exists ? this.mockClipperState.selectionPreviewInfo.length : 0);
	}
}

(new SelectionPreviewTests()).runTests();
