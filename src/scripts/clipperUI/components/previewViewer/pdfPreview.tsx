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
import { PreviewViewerPdfHeader } from "./previewViewerPdfHeader";

import * as _ from "lodash";

interface PdfPreviewState {
	allPages?: boolean;
	pagesToShow?: number[];
	shouldAttachPdf?: boolean;
}

class PdfPreview extends PreviewComponentBase<PdfPreviewState, ClipperStateProp> {
	getInitialState(): PdfPreviewState {
		return {
			allPages: true,
			pagesToShow: [0, 2, 4],
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

	// Takes a range of the form 1,3-6,7,8,13,1,3,4,a-b, etc. and then returns an array
	// corresponding to the numbers in that range. It ignores invalid input, sorts it, and removes duplicates
	private parsePageRange(text: string): number[] {
		let initialRange = text.split(",").reduce((previousValue, currentValue) => {
			let valueToAppend: number[] = [], matches;
			// The value could be a single digit
			if (/^\d+$/.test(currentValue)) {
				valueToAppend = [parseInt(currentValue, 10 /* radix */)];
				// ... or it could a range of the form [#]-[#]
			} else if (matches = /^(\d+)-(\d+)$/.exec(currentValue)) {
				let lhs = parseInt(matches[1], 10), rhs = parseInt(matches[2], 10) + 1;
				// TODO: what do we do if start > end? This is a behavior question, not an implementation one
				valueToAppend = _.range(lhs, rhs);
			}
			return previousValue = previousValue.concat(valueToAppend);
		}, []);
		return _(initialRange).sortBy().sortedUniq().value();
	}

	onTextChange(text: string) {
		console.log(this.parsePageRange(text));
		console.log("text: " + text);
	}

	// onStopTyping(text: string) {
	// 	return _.debounce(this.onTextChange, )
	// }

	protected getHeader(): any {
		return <PreviewViewerPdfHeader
				onSelectionChange={this.onSelectionChange.bind(this)}
				onTextChange={_.debounce(this.onTextChange.bind(this), 500)}
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
			// TODO: parse this when the user actually types it in
			// pagesToShow = pagesToShow.map((index) => { return index - 1; });
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
