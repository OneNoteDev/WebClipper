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
	// onTextChange: (text: string) => void;
	// onSelectionChange: (selection: boolean) => void;
	allPages: boolean;
	shouldAttachPdf: boolean;
	shouldDistributePages: boolean;
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
			console.log("event listener added");
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
		console.log("onTextChange: " + text);
		_.assign(_.extend(this.props.clipperState.pdfPreviewInfo, {
			selectedPageRange: text
		} as PdfPreviewInfo), this.props.clipperState.setState);

		let pagesToShow = StringUtils.parsePageRange(text);
		let validUpperBounds = _.every(pagesToShow, (ind: number) => {
			return ind <= this.props.clipperState.pdfResult.data.get().pdf.numPages();
		});

		if (!pagesToShow || !validUpperBounds) {
			this.setState({
				invalidRange: true
			});
		} else {
			this.setState({
				invalidRange: false
			});
		}
	}

	getAllPagesRadioElement(): any {
		return (
			<div id={Constants.Ids.radioAllPagesLabel} className="pdf-control" {...this.enableInvoke(this.onSelectionChange, 190, true) }>
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
			<div id={Constants.Ids.radioPageRangeLabel} className="pdf-control" {...this.enableInvoke(this.onSelectionChange, 191, false) }>
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
			<div id={Constants.Ids.radioAllPagesLabel} className="pdf-control" {...this.enableInvoke(this.onDistributionChange, 190, false) }>
				<div class="pdf-indicator pdf-radio-indicator">
					{!this.props.shouldDistributePages ? <div class="pdf-radio-indicator-fill"></div> : ""}
				</div>
				<span class="pdf-label">{Localization.getLocalizedString("WebClipper.Options.SingleNoteForAllPdfPages")}</span>
			</div>
		);
	}

	getOnePageForEachPdfPageRadioElement(): any {
		return (
			<div id={Constants.Ids.radioAllPagesLabel} className="pdf-control" {...this.enableInvoke(this.onDistributionChange, 190, true) }>
				<div class="pdf-indicator pdf-radio-indicator">
					{this.props.shouldDistributePages ? <div class="pdf-radio-indicator-fill"></div> : ""}
				</div>
				<span class="pdf-label">{Localization.getLocalizedString("WebClipper.Options.SingleNoteForEachPdfPage")}</span>
			</div>
		);
	}

	getAttachmentCheckbox(): any {
		if (this.props.clipperState.pdfResult.status !== Status.Succeeded || this.props.clipperState.pdfResult.data.get().byteLength >= Constants.Settings.maximumMimeSizeLimit) {
			return (
				<div className="pdf-control" id={Constants.Ids.attachmentCheckboxLabel} {...this.enableInvoke(this.onCheckboxChange, 193, !this.props.shouldAttachPdf) }>
					<div class="pdf-indicator pdf-checkbox-indicator"></div>
					{this.props.shouldAttachPdf ? <div class="checkbox"></div> : ""}
					<span class="pdf-label">{Localization.getLocalizedString("WebClipper.Preview.Header.PdfAttachPdfTooLargeMessage")}</span>
				</div>
			);
		}

		return (
			<div className="pdf-control" id={Constants.Ids.attachmentCheckboxLabel} {...this.enableInvoke(this.onCheckboxChange, 193, !this.props.shouldAttachPdf) }>
				<div class="pdf-indicator pdf-checkbox-indicator"></div>
				{this.props.shouldAttachPdf ? <div class="checkbox"></div> : ""}
				<span class="pdf-label">{Localization.getLocalizedString("WebClipper.Preview.Header.PdfAttachPdfCheckboxLabel")}</span>
			</div>
		);
	}

	getDistributePagesCheckbox(): any {
		return (
			<div className="pdf-control" id={Constants.Ids.attachmentCheckboxLabel} {...this.enableInvoke(this.onDistributionChange, 193, !this.props.shouldDistributePages) }>
				<div class="pdf-indicator pdf-checkbox-indicator"></div>
				{this.props.shouldDistributePages ? <div class="checkbox"></div> : ""}
				<span class="pdf-label">{Localization.getLocalizedString("WebClipper.Preview.Header.PdfDistributePagesCheckboxLabel")}</span>
			</div>
		);
	}

	render() {
		console.log("render");
		if (!PdfClipOptionsClass.textAreaListenerAttached) {
			console.log("render listener");
			this.addTextAreaListener();
			PdfClipOptionsClass.textAreaListenerAttached = true;
		}

		return (
			<div className={"clipOptionsContainer"}>
				<div class="clipOptionsTitleContainer">
					<span className="clipOptionsTitle">PDF Options</span>
				</div>
				{this.getAllPagesRadioElement()}
				{this.getPageRangeRadioElement()}
				{this.getOnePageForEntirePdfRadioElement()}				
				{this.getOnePageForEachPdfPageRadioElement()}
				{this.getAttachmentCheckbox()}
			</div>
		);

		// return (
		// 	<div className={"clipOptionsContainer"}>
		// 		<span>PDF Options</span>
				// <div id={Constants.Ids.radioAllPagesLabel} className="pdf-control" {...this.enableInvoke(this.props.onSelectionChange, 190, true) }>
				// 	<div class="pdf-indicator pdf-radio-indicator">
				// 		{this.props.allPages ? <div class="pdf-radio-indicator-fill"></div> : ""}
				// 	</div>
				// 	<span class="pdf-label">{Localization.getLocalizedString("WebClipper.Preview.Header.PdfAllPagesRadioButtonLabel")}</span>
				// </div>
				// <div id={Constants.Ids.radioPageRangeLabel} className="pdf-control" {...this.enableInvoke(this.props.onSelectionChange, 191, false) }>
				// 	<div class="pdf-indicator pdf-radio-indicator">
				// 		{!this.props.allPages ? <div class="pdf-radio-indicator-fill"></div> : ""}
				// 	</div>
				// 	{!this.props.allPages ?
				// 		<input type="text" id={Constants.Ids.rangeInput} className={invalidClassName} placeholder="e.g. 1-5, 7, 9-12" value={this.props.clipperState.pdfPreviewInfo.selectedPageRange} {...this.enableInvoke(this.props.onSelectionChange, 192, false) }></input>
				// 		: <span class="pdf-label">{Localization.getLocalizedString("WebClipper.Preview.Header.PdfPageRangeRadioButtonLabel")}</span>}

				// 	{!this.props.allPages && this.props.invalidRange ?
				// 		<div class="popover">{Localization.getLocalizedString("WebClipper.Preview.Header.PdfInvalidPageRange")}</div>
				// 		: ""}
				// </div>
		// 	</div>
		// );
	}
}

let component = PdfClipOptionsClass.componentize();
export { component as PdfClipOptions };
