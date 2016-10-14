/// <reference path="../../../../../node_modules/onenoteapi/target/oneNoteApi.d.ts" />

import {Constants} from "../../../constants";
import {PdfPreviewInfo} from "../../../previewInfo";
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
	fadeIn: boolean;
}

class PdfPreview extends PreviewComponentBase<PdfPreviewState, ClipperStateProp> {
	private static scrollListenerAdded: boolean = false; // done on purpose

	private addScrollListener() {
		if (!PdfPreview.scrollListenerAdded) {
			let previewContentContainer = document.getElementById("previewContentContainer");
			if (!!previewContentContainer) {
				previewContentContainer.addEventListener("scroll", (ev) => {
					console.log("scroll handler");
				});
				PdfPreview.scrollListenerAdded = true;
			}
		}
		return;
	}

	protected getContentBodyForCurrentStatus(): any[] {
		let state = this.props.clipperState;
		if (state.pdfResult.status === Status.InProgress) {
			return [this.getSpinner()];
		}

		return this.convertPdfResultToContentData(state.pdfResult);
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
		return _(initialRange).sortBy().sortedUniq().map((page) => { return page - 1; }).value();
	}

	onSelectionChange(selection: boolean) {
		// TODO: change this to _.assign, _.extend
		let newPdfPreviewInfo = Utils.createUpdatedObject(this.props.clipperState.pdfPreviewInfo, {
			allPages: selection
		} as PdfPreviewInfo);

		this.props.clipperState.setState({
			pdfPreviewInfo: newPdfPreviewInfo
		});
	}

	onTextChange(text: string) {
		let pagesToShow = this.parsePageRange(text);

		// TODO: change this to _.assign, _.extend
		let newPdfPreviewInfo = Utils.createUpdatedObject(this.props.clipperState.pdfPreviewInfo, {
			pagesToShow: pagesToShow
		} as PdfPreviewInfo);

		this.props.clipperState.setState({
			pdfPreviewInfo: newPdfPreviewInfo
		});
	}

	onCheckboxChange(checked: boolean) {
		let newPdfPreviewInfo = Utils.createUpdatedObject(this.props.clipperState.pdfPreviewInfo, {
			shouldAttachPdf: checked
		} as PdfPreviewInfo);

		this.props.clipperState.setState({
			pdfPreviewInfo: newPdfPreviewInfo
		});
	}

	protected getHeader(): any {
		return <PreviewViewerPdfHeader
				shouldAttachPdf={this.props.clipperState.pdfPreviewInfo.shouldAttachPdf}
				allPages={this.props.clipperState.pdfPreviewInfo.allPages}
				onCheckboxChange={this.onCheckboxChange.bind(this)}
				onSelectionChange={this.onSelectionChange.bind(this)}
				onTextChange={_.debounce(this.onTextChange.bind(this), 1000)}
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
		this.addScrollListener();
		let data = this.props.clipperState.pdfResult.data.get();
		if (!data || this.props.clipperState.pdfResult.status !== Status.Succeeded) {
			return;
		}

		let dataUrls = data.dataUrls;
		let contentBody = [];

		let imagesToShow = dataUrls.map((dataUrl, index) => {
			return {
				dataUrl: dataUrl,
				index: index
			};
		});

		if (!this.props.clipperState.pdfPreviewInfo.allPages) {
			let pagesToShow = this.props.clipperState.pdfPreviewInfo.pagesToShow;
			imagesToShow = imagesToShow.filter((dataUrlObject) => {
				return pagesToShow.indexOf(dataUrlObject.index) !== -1;
			});
		}

		let shouldAttachPdf = this.props.clipperState.pdfPreviewInfo.shouldAttachPdf;

		switch (result.status) {
			case Status.Succeeded:
				// In OneNote we don't display the extension
				let defaultAttachmentName = "Original.pdf";
				let fullAttachmentName = this.props.clipperState.pageInfo ? Utils.getFileNameFromUrl(this.props.clipperState.pageInfo.rawUrl, defaultAttachmentName) : defaultAttachmentName;
				if (shouldAttachPdf) {
					contentBody.push(
						<span className="attachment-overlay">
							<img src={Utils.getImageResourceUrl("editorOptions/pdf_attachment_icon.png") }></img>
							<div className="file-name">{fullAttachmentName.split(".")[0]}</div>
						</span>);
				}
				for (let dataUrlObject of imagesToShow) {
					contentBody.push(
						<div style="position: relative;">
							<img className={Constants.Classes.pdfPreviewImage} src={dataUrlObject.dataUrl}></img>
							<div className="overlay">
								<span class="overlay-number">{dataUrlObject.index}
								</span>
							</div>
						</div>);
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
