import {Constants} from "../../../constants";
import {Utils} from "../../../utils";

import {AugmentationModel, AugmentationResult} from "../../../contentCapture/augmentationHelper";

import {Localization} from "../../../localization/localization";

import {ClipperStateProp, DataResult} from "../../clipperState";
import {Status} from "../../status";

import {SpriteAnimation} from "../../components/spriteAnimation";

import {EditorPreviewComponentBase, EditorPreviewState} from "./editorPreviewComponentBase";

class AugmentationPreview extends EditorPreviewComponentBase<EditorPreviewState, ClipperStateProp> {
	protected getContentBodyForCurrentStatus(): any[] {
		let state = this.props.clipperState;
		return this.convertAugmentationResultToContentData(state.augmentationResult);
	}

	protected getStatus(): Status {
		return this.props.clipperState.augmentationResult.status;
	}

	protected getTitleTextForCurrentStatus(): string {
		let noContentFoundString = Localization.getLocalizedString("WebClipper.Preview.NoContentFound");
		let failureMessage: string;

		let previewStatus = this.getStatus();

		switch (previewStatus) {
			case Status.Succeeded:
				if (!this.props.clipperState.augmentationResult.data || this.props.clipperState.augmentationResult.data.ContentModel === AugmentationModel.None) {
					return Localization.getLocalizedString("WebClipper.Preview.NoContentFound");
				}
				return this.props.clipperState.previewGlobalInfo.previewTitleText;
			case Status.NotStarted:
			case Status.InProgress:
				return Localization.getLocalizedString("WebClipper.Preview.LoadingMessage");
			default:
			case Status.Failed:
				failureMessage = this.props.clipperState.augmentationResult.data.failureMessage;
				return !!failureMessage ? failureMessage : noContentFoundString;
		}
	}

	protected handleBodyChange(newBodyHtml: string) {
		this.props.clipperState.setState({
			augmentationPreviewInfo: { previewBodyHtml: newBodyHtml }
		});
	}

	private convertAugmentationResultToContentData(result: DataResult<AugmentationResult>): any[] {
		let contentBody = [];

		switch (result.status) {
			case Status.Succeeded:
				if (this.props.clipperState.augmentationResult.data && this.props.clipperState.augmentationResult.data.ContentModel !== AugmentationModel.None) {
					contentBody.push(m.trust(this.props.clipperState.augmentationPreviewInfo.previewBodyHtml));
				}
				break;
			case Status.NotStarted:
			case Status.InProgress:
				contentBody.push(this.getSpinner());
				break;
			default:
			case Status.Failed:
				break;
		}

		return contentBody;
	}

	private getSpinner(): any {
		let spinner = <SpriteAnimation
			spriteUrl={Utils.getImageResourceUrl("spinner_loop_colored.png") }
			imageHeight={65}
			imageWidth={45}
			totalFrameCount={21}
			loop={true} />;

		return <div className={Constants.Classes.centeredInPreview}>{spinner}</div>;
	}
}

let component = AugmentationPreview.componentize();
export {component as AugmentationPreview};
