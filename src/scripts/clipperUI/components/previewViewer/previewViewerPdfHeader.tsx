import {Constants} from "../../../constants";

import {Localization} from "../../../localization/localization";

import {ClipperStateProp} from "../../clipperState";
import {Status} from "../../status";

import {ControlGroup, HeaderClasses, PreviewViewerHeaderComponentBase} from "./previewViewerHeaderComponentBase";

export interface PreviewViewerPdfHeaderProp extends ClipperStateProp {
	onCheckboxChange: (checked: boolean) => void;
	onTextChange: (text: string) => void;
	onSelectionChange: (selection: boolean) => void;
	allPages: boolean;
	shouldAttachPdf: boolean;
	invalidRange: boolean;
};

class PreviewViewerPdfHeaderClass extends PreviewViewerHeaderComponentBase<{}, PreviewViewerPdfHeaderProp> {
	private static textAreaListenerAttached = false;

	getControlGroups(): ControlGroup[] {
		if (!PreviewViewerPdfHeaderClass.textAreaListenerAttached) {
			this.addTextAreaListener();
			PreviewViewerPdfHeaderClass.textAreaListenerAttached = true;
		}

		let controlGroups = [this.getPageRangeGroup()];
		let attachmentControlGroup = this.getAttachmentCheckbox();
		if (attachmentControlGroup) {
			controlGroups.push(attachmentControlGroup);
		}
		return controlGroups;
	}

	private addTextAreaListener() {
		document.addEventListener("input", (event) => {
			let element = event.target;
			let pageRangeField = document.getElementById(Constants.Ids.rangeInput) as HTMLTextAreaElement;
			if (!!element && element === pageRangeField) {
				this.handlePageRangeFieldChanged(pageRangeField.value);
			}
		});
	}

	private handlePageRangeFieldChanged(pageRange: string) {
		this.props.onTextChange(pageRange);
	}

	private getPageRangeGroup(): ControlGroup {
		let allPagesRadioClassName = "pdf-indicator pdf-radio-indicator" + (this.props.allPages ? " pdf-radio-active" : "");
		let somePagesRadioClassName = "pdf-indicator pdf-radio-indicator" + (!this.props.allPages ? " pdf-radio-active" : "");
		let invalidClassName = this.props.invalidRange ? "invalid" : "";
		return {
			id: Constants.Ids.pageRangeControl,
			innerElements: [
				<div id={Constants.Ids.radioAllPagesLabel} className="pdf-control" {...this.enableInvoke(this.props.onSelectionChange, 190, true) }>
					<div class="pdf-indicator pdf-radio-indicator">
						{this.props.allPages ? <div class="pdf-radio-indicator-fill"></div> : ""}
					</div>
					<span class="pdf-label">{Localization.getLocalizedString("WebClipper.Preview.Header.PdfAllPagesRadioButtonLabel")}</span>
				</div>,
				<div id={Constants.Ids.radioPageRangeLabel} className="pdf-control" {...this.enableInvoke(this.props.onSelectionChange, 191, false) }>
					<div class="pdf-indicator pdf-radio-indicator">
						{!this.props.allPages ? <div class="pdf-radio-indicator-fill"></div> : ""}
					</div>
					{!this.props.allPages ?
						<input type="text" id={Constants.Ids.rangeInput} className={invalidClassName} placeholder="e.g. 1-5, 7, 9-12" value={this.props.clipperState.pdfPreviewInfo.selectedPageRange} {...this.enableInvoke(this.props.onSelectionChange, 192, false) }></input>
						: <span class="pdf-label">{Localization.getLocalizedString("WebClipper.Preview.Header.PdfPageRangeRadioButtonLabel")}</span>}

					{!this.props.allPages && this.props.invalidRange ?
						<div class="popover">{Localization.getLocalizedString("WebClipper.Preview.Header.PdfInvalidPageRange")}</div>
						: ""}
				</div>
			]
		};
	}

	private getAttachmentCheckbox(): ControlGroup {
		if (this.props.clipperState.pdfResult.status !== Status.Succeeded || this.props.clipperState.pdfResult.data.get().byteLength >= Constants.Settings.maximumMimeSizeLimit) {
			return undefined;
		}

		return {
			id: Constants.Ids.attachmentCheckboxControl,
			innerElements: [
				<div className="pdf-control" id={Constants.Ids.attachmentCheckboxLabel} {...this.enableInvoke(this.props.onCheckboxChange, 193, !this.props.shouldAttachPdf) }>
					<div class="pdf-indicator pdf-checkbox-indicator"></div>
					{this.props.shouldAttachPdf ? <div class="checkbox"></div> : ""}
					<span class="pdf-label">{Localization.getLocalizedString("WebClipper.Preview.Header.PdfAttachPdfCheckboxLabel")}</span>
				</div>,
			]
		};
	}
}

let component = PreviewViewerPdfHeaderClass.componentize();
export {component as PreviewViewerPdfHeader};
