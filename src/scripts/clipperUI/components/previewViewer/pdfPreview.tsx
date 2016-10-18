/// <reference path="../../../../../node_modules/onenoteapi/target/oneNoteApi.d.ts" />

import {Constants} from "../../../constants";
import {PdfPreviewInfo} from "../../../previewInfo";
import {StringUtils} from "../../../stringUtils";
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
	showPageNumbers: boolean;
}

class PdfPreview extends PreviewComponentBase<PdfPreviewState, ClipperStateProp> {
	private static latestScrollListener: (event: UIEvent) => void;
	private static scrollListenerTimeout: number;

	constructor(props: ClipperStateProp) {
		super(props);
		// We need to do this on every constructor to ensure the reference to the state
		// object is correct
		this.addScrollListener();
	}

	getInitialState(): PdfPreviewState {
		return {
			showPageNumbers: false
		};
	}

	private addScrollListener() {
		if (PdfPreview.latestScrollListener) {
			window.removeEventListener("scroll", PdfPreview.latestScrollListener, true);
		}
		// When we detect a scroll, show page numbers immediately.
		// When the user doesn't scroll for some period of time, fade them out.
		PdfPreview.latestScrollListener = (event) => {
			let element = event.target as HTMLElement;
			if (!!element && element.id === Constants.Ids.previewContentContainer) {
				if (Utils.isNumeric(PdfPreview.scrollListenerTimeout)) {
					clearTimeout(PdfPreview.scrollListenerTimeout);
				}
				PdfPreview.scrollListenerTimeout = setTimeout(() => {
					this.setState({
						showPageNumbers: false
					});
				}, Constants.Settings.timeUntilPdfPageNumbersFadeOutAfterScroll);

				// A little optimization to prevent us from calling render a large number of times
				if (!this.state.showPageNumbers) {
					this.setState({
						showPageNumbers: true
					});
				}
			}
		};
		window.addEventListener("scroll", PdfPreview.latestScrollListener, true /* allows the listener to listen to all elements */);
	}

	protected getContentBodyForCurrentStatus(): any[] {
		let state = this.props.clipperState;
		if (state.pdfResult.status === Status.InProgress || state.pdfResult.status === Status.NotStarted) {
			return [this.getSpinner()];
		}

		return this.convertPdfResultToContentData(state.pdfResult);
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
		// TODO: change this to _.assign, _.extend
		let newPdfPreviewInfo = Utils.createUpdatedObject(this.props.clipperState.pdfPreviewInfo, {
			selectedPageRange: text
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
		// let pageInfo = this.props.clipperState.pageInfo;
		let pdfResult = this.props.clipperState.pdfResult;
		switch (previewStatus) {
			case Status.Succeeded:
				// TODO: verify this is actually what happens
				if (pdfResult && !pdfResult.data.get()) {
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
		if (!data || this.props.clipperState.pdfResult.status !== Status.Succeeded) {
			return;
		}

		// Determine which pages should be marked as selected vs unselected
		let pagesToShow = StringUtils.parsePageRange(this.props.clipperState.pdfPreviewInfo.selectedPageRange);
		let allImages = data.dataUrls.map((dataUrl, index) => {
			return {
				dataUrl: dataUrl,
				selected: this.props.clipperState.pdfPreviewInfo.allPages || pagesToShow.indexOf(index) >= 0
			};
		});

		let shouldAttachPdf = this.props.clipperState.pdfPreviewInfo.shouldAttachPdf;

		let contentBody = [];
		switch (result.status) {
			case Status.Succeeded:
				// In OneNote we don't display the extension
				let defaultAttachmentName = "Original.pdf";
				let fullAttachmentName = this.props.clipperState.pageInfo ? Utils.getFileNameFromUrl(this.props.clipperState.pageInfo.rawUrl, defaultAttachmentName) : defaultAttachmentName;
				if (shouldAttachPdf) {
					contentBody.push(
						<span className={Constants.Classes.attachmentOverlay}>
							<img src={Utils.getImageResourceUrl("editorOptions/pdf_attachment_icon.png") }></img>
							<div className="file-name">{fullAttachmentName.split(".")[0]}</div>
						</span>);
				}

				let overlayClassName = "overlay" + (this.state.showPageNumbers ? "" : " overlay-hidden");
				for (let i = 0; i < allImages.length; i++) {
					let image = allImages[i];
					contentBody.push(
						<div class="pdf-preview-image-container">
							<img className={Constants.Classes.pdfPreviewImage + (image.selected ? "" : " unselected")} src={image.dataUrl}></img>
							<div className={overlayClassName}>
								<span class="overlay-number">{i + 1}</span>
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
