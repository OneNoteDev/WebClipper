/// <reference path="../../../../../node_modules/onenoteapi/target/oneNoteApi.d.ts" />

import {Constants} from "../../../constants";
import {Utils} from "../../../utils";

import {SmartValue} from "../../../communicator/smartValue";

import {FullPageScreenshotResult} from "../../../contentCapture/fullPageScreenshotHelper";
import {PdfScreenshotResult} from "../../../contentCapture/pdfScreenshotHelper";

import {Localization} from "../../../localization/localization";

import {ClipperStateProp, DataResult} from "../../clipperState";
import {Status} from "../../status";

import {RotatingMessageSpriteAnimation} from "../../components/rotatingMessageSpriteAnimation";

import {PreviewComponentBase} from "./previewComponentBase";
import {PreviewViewerPdfHeader} from "./previewViewerPdfHeader";

interface PdfPreviewState {
	allPages?: boolean;
	pagesToShow?: number[];
	shouldAttachPdf?: boolean;
}

class PdfPreview extends PreviewComponentBase<PdfPreviewState, ClipperStateProp> {
	getInitialState(): PdfPreviewState {
		return {
			allPages: true,
			pagesToShow: [1, 3, 5],
			shouldAttachPdf: false
		} as PdfPreviewState;
	}

	protected getContentBodyForCurrentStatus(): any[] {
		let state = this.props.clipperState;

		if (!state.pageInfo) {
			return [this.getSpinner()];
		}

		return this.convertPdfResultToContentData(state.pdfResult);
	}

	onSelectionChange(sel: boolean) {
		this.setState({
			allPages: sel
		});
	}

	onTextChange(text: string) {
		console.log("text: " + text);
	}

	protected getHeader(): any {
		return <PreviewViewerPdfHeader
				onSelectionChange={this.onSelectionChange.bind(this)}
				onTextChange={this.onTextChange.bind(this)}
				clipperState={this.props.clipperState} />;
	}

	protected getStatus(): Status {
		if (!this.props.clipperState.pageInfo) {
			return Status.NotStarted;
		}
		return this.props.clipperState.pdfResult.status;
	}

	protected getTitleTextForCurrentStatus(): string {
		let noContentFoundString = Localization.getLocalizedString("WebClipper.Preview.NoContentFound");
		let failureMessage: string;

		let previewStatus = this.getStatus();
		let pageInfo = this.props.clipperState.pageInfo;
		switch (previewStatus) {
			case Status.Succeeded:
				if (pageInfo && pageInfo.contentType !== OneNoteApi.ContentType.EnhancedUrl &&
					!this.props.clipperState.fullPageResult.data) {
					return Localization.getLocalizedString("WebClipper.Preview.NoContentFound");
				}
				return this.props.clipperState.previewGlobalInfo.previewTitleText;
			case Status.NotStarted:
			case Status.InProgress:
				return Localization.getLocalizedString("WebClipper.Preview.LoadingMessage");
			default:
			case Status.Failed:
				failureMessage = this.props.clipperState.pdfResult.data.get().failureMessage;
				return !!failureMessage ? failureMessage : noContentFoundString;
		}
	}

	private convertPdfResultToContentData(result: DataResult<SmartValue<PdfScreenshotResult>>): any[] {
		let data = this.props.clipperState.pdfResult.data.get();
		if (!data) {
			return;
		}

		let contentBody = [];
		console.log("allPages: " + this.state.allPages + ", pagesToShow: " + this.state.pagesToShow.toString());
		let pagesToShow = this.state.pagesToShow;
		let dataUrls = this.props.clipperState.pdfResult.data.get().dataUrls;

		// TODO: make sure the range is valid
		if (!this.state.allPages) {
			pagesToShow = pagesToShow.map((index) => { return index - 1; });
			dataUrls = dataUrls.filter((page, pageIndex) => { return pagesToShow.indexOf(pageIndex) !== -1; });
		}
		// let previewImages = [];

		// dataUrls.forEach((dataUrl) => {
		// 	previewImages.push(<img src={dataUrl} className="previewThumbnail"></img>);
		// });
		let shouldAttachPdf = this.state.shouldAttachPdf;

		switch (result.status) {
			case Status.Succeeded:
				// In OneNote we don't display the extension
				let defaultAttachmentName = "Original.pdf";
				let fullAttachmentName = this.props.clipperState.pageInfo ? Utils.getFileNameFromUrl(this.props.clipperState.pageInfo.rawUrl, defaultAttachmentName) : defaultAttachmentName;
				// contentBody.push(
				// 	<span className="attachment-overlay">
				// 		<img src={Utils.getImageResourceUrl("editorOptions/pdf_attachment_icon.png") }></img>
				// 		<div className="file-name">{fullAttachmentName.split(".")[0]}</div>
				// 	</span>);
				// contentBody.push(
				// 	<div id="pdfPreviewScrollBar">
				// 		{previewImages}
				// 	</div>
				// );
				// contentBody.push(<div style="padding-top: 10px">);
				// contentBody.push(<div id="previewImages">);
				for (let dataUrl of dataUrls) {
					contentBody.push(<img className={Constants.Classes.pdfPreviewImage} src={dataUrl}></img>);
				}
				// contentBody.push(</div>);
				// contentBody.push(</div>);
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
			spriteUrl={Utils.getImageResourceUrl("spinner_loop_colored.png") }
			imageHeight={65}
			imageWidth={45}
			totalFrameCount={21}
			loop={true} />;
		return <div className={Constants.Classes.centeredInPreview}>{spinner}</div>;
	}
}

let component = PdfPreview.componentize();
export {component as PdfPreview};
