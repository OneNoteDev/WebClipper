import {Localization} from "../../localization/localization";

import { PdfPreviewInfo } from "../../previewInfo";
import {StringUtils} from "../../stringUtils";

import { Constants } from "../../constants";

import { ComponentBase } from "../componentBase";
import { ClipperStateProp } from "../clipperState";
import {Status} from "../status";

import * as _ from "lodash";

interface PdfClipOptionsProps extends ClipperStateProp {
	onCheckboxChange: (checked: boolean) => void;
	onDistributionChange: (checked: boolean) => void;
	allPages: boolean;
	shouldAttachPdf: boolean;
	shouldDistributePages: boolean;
	isPopupOpen: boolean;
}

interface PdfClipOptionsState {
	invalidRange?: boolean;
}

class PdfClipOptionsClass extends ComponentBase<PdfClipOptionsState, PdfClipOptionsProps> {
	private static textAreaListenerAttached = false;

	getInitialState(): PdfClipOptionsState {
		return {
			invalidRange: false
		} as PdfClipOptionsState;
	}

	private addTextAreaListener() {
		document.addEventListener("input", (event) => {
			let element = event.target;
			let pageRangeField = document.getElementById(Constants.Ids.rangeInput) as HTMLTextAreaElement;
			if (!!element && element === pageRangeField) {
				this.onTextChange(pageRangeField.value);
			}
		});
	}

	onCheckboxChange(checked: boolean): void {
		_.assign(_.extend(this.props.clipperState.pdfPreviewInfo, {
			shouldAttachPdf: checked
		} as PdfPreviewInfo), this.props.clipperState.setState);
	}

	onDistributionChange(checked: boolean): void {
		_.assign(_.extend(this.props.clipperState.pdfPreviewInfo, {
			shouldDistributePages: checked
		} as PdfPreviewInfo), this.props.clipperState.setState);
	}

	onSelectionChange(selection: boolean) {
		_.assign(_.extend(this.props.clipperState.pdfPreviewInfo, {
			allPages: selection
		} as PdfPreviewInfo), this.props.clipperState.setState);
	}

	onTextChange(text: string) {
		_.assign(_.extend(this.props.clipperState.pdfPreviewInfo, {
			selectedPageRange: text
		} as PdfPreviewInfo), this.props.clipperState.setState);
	}

	getAllPagesRadioElement(): any {
		return (
			<div id={Constants.Ids.radioAllPagesLabel} className="pdf-control" {...this.enableInvoke(this.onSelectionChange, 62, true) }>
				<div class="pdf-indicator pdf-radio-indicator">
					{this.props.allPages ? <div class="pdf-radio-indicator-fill"></div> : ""}
				</div>
				<span class="pdf-label">{Localization.getLocalizedString("WebClipper.Preview.Header.PdfAllPagesRadioButtonLabel")}</span>
			</div>
		);
	}

	getPageRangeRadioElement(): any {
		let invalidClassName = this.state.invalidRange ? "invalid" : "";
		return (
			<div id={Constants.Ids.radioPageRangeLabel} className="pdf-control" {...this.enableInvoke(this.onSelectionChange, 63, false) }>
				<div class="pdf-indicator pdf-radio-indicator">
					{!this.props.allPages ? <div class="pdf-radio-indicator-fill"></div> : ""}
				</div>
				{!this.props.allPages ?
					<input type="text" id={Constants.Ids.rangeInput} className={invalidClassName} placeholder="e.g. 1-5, 7, 9-12" value={this.props.clipperState.pdfPreviewInfo.selectedPageRange} {...this.enableInvoke(this.onSelectionChange, 192, false) }></input>
					: <span class="pdf-label">{Localization.getLocalizedString("WebClipper.Preview.Header.PdfPageRangeRadioButtonLabel")}</span>}
				{!this.props.allPages && this.state.invalidRange ?
					<div class="popover">{Localization.getLocalizedString("WebClipper.Preview.Header.PdfInvalidPageRange")}</div>
					: ""}
			</div>
		);
	}

	getOnePageForEntirePdfRadioElement(): any {
		return (
			<div id={Constants.Ids.onePageForEntirePdfLabel} className="pdf-control" {...this.enableInvoke(this.onDistributionChange, 64, false) }>
				<div class="pdf-indicator pdf-radio-indicator">
					{!this.props.shouldDistributePages ? <div class="pdf-radio-indicator-fill"></div> : ""}
				</div>
				<span class="pdf-label">{Localization.getLocalizedString("WebClipper.Options.SingleNoteForAllPdfPages")}</span>
			</div>
		);
	}

	getOnePageForEachPdfPageRadioElement(): any {
		return (
			<div id={Constants.Ids.onePageForEachPdfLabel} className="pdf-control" {...this.enableInvoke(this.onDistributionChange, 65, true) }>
				<div class="pdf-indicator pdf-radio-indicator">
					{this.props.shouldDistributePages ? <div class="pdf-radio-indicator-fill"></div> : ""}
				</div>
				<span class="pdf-label">{Localization.getLocalizedString("WebClipper.Options.SingleNoteForEachPdfPage")}</span>
			</div>
		);
	}

	getAttachmentCheckbox(): any {
		const isPdfTooLarge = this.props.clipperState.pdfResult.status === Status.Succeeded && this.props.clipperState.pdfResult.data.get().byteLength > Constants.Settings.maximumMimeSizeLimit;

		return (
			<div className="pdf-control" id={Constants.Ids.attachmentCheckboxLabel} {...this.enableInvoke(this.onCheckboxChange, 66, !this.props.shouldAttachPdf) }>
				<div class="pdf-indicator pdf-checkbox-indicator"></div>
				{this.props.shouldAttachPdf ? <div class="checkbox"></div> : ""}
				<span class="pdf-label">{isPdfTooLarge ? Localization.getLocalizedString("WebClipper.Preview.Header.PdfAttachPdfTooLargeMessage") : Localization.getLocalizedString("WebClipper.Preview.Header.PdfAttachPdfCheckboxLabel")}</span>
			</div>
		);
	}

	// getDistributePagesCheckbox(): any {
	// 	return (
	// 		<div className="pdf-control" id={Constants.Ids.attachmentCheckboxLabel} {...this.enableInvoke(this.onDistributionChange, 193, !this.props.shouldDistributePages) }>
	// 			<div class="pdf-indicator pdf-checkbox-indicator"></div>
	// 			{this.props.shouldDistributePages ? <div class="checkbox"></div> : ""}
	// 			<span class="pdf-label">{Localization.getLocalizedString("WebClipper.Preview.Header.PdfDistributePagesCheckboxLabel")}</span>
	// 		</div>
	// 	);
	// }

	render() {
		if (!PdfClipOptionsClass.textAreaListenerAttached) {
			this.addTextAreaListener();
			PdfClipOptionsClass.textAreaListenerAttached = true;
		}

		let pagesToShow = StringUtils.parsePageRange(this.props.clipperState.pdfPreviewInfo.selectedPageRange);
		let validUpperBounds = this.props.clipperState.pdfResult.status === Status.Succeeded ? _.every(pagesToShow, (ind: number) => {
			return ind <= this.props.clipperState.pdfResult.data.get().pdf.numPages();
		}) : true;

		this.setState({
			invalidRange: !pagesToShow || !validUpperBounds
		});

		return (
			<div className={"clipOptionsContainer"} tabIndex={60}>
				<div class="clipOptionsTitleContainer">
					<span className="clipOptionsTitle" tabIndex={61}>PDF Options</span>
				</div>
				{this.getAllPagesRadioElement()}
				{this.getPageRangeRadioElement()}
				{this.getOnePageForEntirePdfRadioElement()}
				{this.getOnePageForEachPdfPageRadioElement()}
				{this.getAttachmentCheckbox()}
			</div>
		);
	}
}

let component = PdfClipOptionsClass.componentize();
export { component as PdfClipOptions };
