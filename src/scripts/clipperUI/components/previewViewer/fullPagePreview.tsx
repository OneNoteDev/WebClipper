import {Constants} from "../../../constants";

import {SmartValue} from "../../../communicator/smartValue";

import {FullPageScreenshotResult} from "../../../contentCapture/fullPageScreenshotHelper";
import {PdfScreenshotResult} from "../../../contentCapture/pdfScreenshotHelper";

import {ExtensionUtils} from "../../../extensions/extensionUtils";

import {Localization} from "../../../localization/localization";

import {ClipperStateProp, DataResult} from "../../clipperState";
import {Status} from "../../status";

import {RotatingMessageSpriteAnimation} from "../../components/rotatingMessageSpriteAnimation";

import {PreviewComponentBase} from "./previewComponentBase";
import {PreviewViewerFullPageHeader} from "./previewViewerFullPageHeader";

class FullPagePreview extends PreviewComponentBase<{}, ClipperStateProp> {
	protected getContentBodyForCurrentStatus(): any[] {
		let state = this.props.clipperState;

		if (!state.pageInfo) {
			return [this.getSpinner()];
		}

		return this.convertFullPageResultToContentData(state.fullPageResult);
	}

	protected getHeader(): any {
		return <PreviewViewerFullPageHeader
			clipperState={this.props.clipperState} />;
	}

	protected getStatus(): Status {
		if (!this.props.clipperState.pageInfo) {
			return Status.NotStarted;
		}

		return this.props.clipperState.fullPageResult.status;
	}

	protected getTitleTextForCurrentStatus(): string {
		let noContentFoundString = Localization.getLocalizedString("WebClipper.Preview.NoContentFound");
		let failureMessage: string;

		let previewStatus = this.getStatus();
		let pageInfo = this.props.clipperState.pageInfo;

		switch (previewStatus) {
			case Status.Succeeded:
				if (pageInfo &&  !this.props.clipperState.fullPageResult.data) {
					return Localization.getLocalizedString("WebClipper.Preview.NoContentFound");
				}
				return this.props.clipperState.previewGlobalInfo.previewTitleText;
			case Status.NotStarted:
			case Status.InProgress:
				return Localization.getLocalizedString("WebClipper.Preview.LoadingMessage");
			default:
			case Status.Failed:
				failureMessage = this.props.clipperState.fullPageResult.data.failureMessage;
				return !!failureMessage ? failureMessage : noContentFoundString;
		}
	}

	private convertFullPageResultToContentData(result: DataResult<FullPageScreenshotResult>): any[] {
		let contentBody = [];

		switch (result.status) {
			case Status.Succeeded:
				let pageTitle = this.props.clipperState.pageInfo ? this.props.clipperState.pageInfo.contentTitle : "";
				let altTag = Localization.getLocalizedString("WebClipper.Preview.FullPageModeScreenshotDescription").replace("{0}", pageTitle);

				if (this.props.clipperState.fullPageResult.data) {
					let screenshotImages: FullPageScreenshotResult = this.props.clipperState.fullPageResult.data;
					for (let imageData of screenshotImages.Images) {
						let dataUrl = "data:image/" + screenshotImages.ImageFormat + ";" + screenshotImages.ImageEncoding + "," + imageData;
						contentBody.push(<img src={dataUrl} alt={altTag}></img>);
					}
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
		let spinner = <RotatingMessageSpriteAnimation
			spriteUrl={ExtensionUtils.getImageResourceUrl("spinner_loop_colored.png") }
			imageHeight={65}
			imageWidth={45}
			totalFrameCount={21}
			loop={true}
			shouldDisplayMessage={false} />;
		return <div className={Constants.Classes.centeredInPreview}>{spinner}</div>;
	}
}

let component = FullPagePreview.componentize();
export {component as FullPagePreview};
