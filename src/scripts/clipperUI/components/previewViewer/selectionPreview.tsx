import {Constants} from "../../../constants";
import {Utils} from "../../../utils";

import {AugmentationModel, AugmentationResult} from "../../../contentCapture/augmentationHelper";

import {Localization} from "../../../localization/localization";

import {ClipperStateProp, DataResult} from "../../clipperState";
import {Status} from "../../status";

import {SpriteAnimation} from "../../components/spriteAnimation";

import {EditorPreviewComponentBase, EditorPreviewState} from "./editorPreviewComponentBase";

class SelectionPreview extends EditorPreviewComponentBase<EditorPreviewState, ClipperStateProp> {
	protected getHighlightableContentBodyForCurrentStatus(): any {
		return m.trust(this.props.clipperState.selectionPreviewInfo.previewBodyHtml);
	}

	protected getStatus(): Status {
		return Status.Succeeded;
	}

	protected getTitleTextForCurrentStatus(): string {
		return this.props.clipperState.previewGlobalInfo.previewTitleText;
	}

	protected handleBodyChange(newBodyHtml: string) {
		this.props.clipperState.setState({
			selectionPreviewInfo: { previewBodyHtml: newBodyHtml }
		});
	}
}

let component = SelectionPreview.componentize();
export {component as SelectionPreview};
