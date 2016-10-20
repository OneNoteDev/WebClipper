import {Constants} from "../../../constants";
import {Localization} from "../../../localization/localization";

import {ClipperStateProp} from "../../clipperState";

import {ControlGroup, HeaderClasses, PreviewViewerHeaderComponentBase} from "./previewViewerHeaderComponentBase";

interface PdfPreviewProp extends ClipperStateProp {
	onCheckboxChange: (checked: boolean) => void;
	onTextChange: (text: string) => void;
	onSelectionChange: (selection: boolean) => void;
	allPages: boolean;
	shouldAttachPdf: boolean;
	invalidRange: boolean;
	enabled: boolean;
};

class PreviewViewerPdfHeaderClass extends PreviewViewerHeaderComponentBase<{}, PdfPreviewProp> {
	private static textAreaListenerAttached = false;

	getControlGroups(): ControlGroup[] {
		if (!PreviewViewerPdfHeaderClass.textAreaListenerAttached) {
			this.addTextAreaListener();
			PreviewViewerPdfHeaderClass.textAreaListenerAttached = true;
		}

		return [this.getPageRangeGroup(), this.getAttachmentCheckbox()];
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
				<label class="pdf-control pdf-label" {...this.enableInvoke(this.props.onSelectionChange, 190, true)}>{Localization.getLocalizedString("WebClipper.Preview.Header.PdfAllPagesRadioButtonLabel")}
					<div class="pdf-indicator pdf-radio-indicator">
						{this.props.allPages ? <div class="pdf-radio-indicator-fill"></div> : ""}
					</div>
				</label>,
				<label class="pdf-control pdf-label" {...this.enableInvoke(this.props.onSelectionChange, 190, false)}>{this.props.allPages ?  Localization.getLocalizedString("WebClipper.Preview.Header.PdfPageRangeRadioButtonLabel") : ""}
					<div class="pdf-indicator pdf-radio-indicator">
						{!this.props.allPages ? <div class="pdf-radio-indicator-fill"></div> : ""}
					</div>
					{!this.props.allPages ? <input className={invalidClassName} type="text" id={Constants.Ids.rangeInput} placeholder="e.g. 1-5, 7, 9-12" value={this.props.clipperState.pdfPreviewInfo.selectedPageRange}></input> : ""}
				</label>,
			]
		};
	}

	private getAttachmentCheckbox(): ControlGroup {
		return {
			id: Constants.Ids.attachmentCheckboxControl,
			innerElements: [
				<label id={Constants.Ids.attachmentCheckboxLabel} class="pdf-control pdf-checkbox-control pdf-label" {...this.enableInvoke(this.props.onCheckboxChange, 191, !this.props.shouldAttachPdf)}>{Localization.getLocalizedString("WebClipper.Preview.Header.PdfAttachPdfCheckboxLabel")}
					<div class="pdf-indicator pdf-checkbox-indicator"></div>
					{this.props.shouldAttachPdf && this.props.enabled ? <div class="checkbox"></div> : ""}
				</label>
			]
		};
	}
}

let component = PreviewViewerPdfHeaderClass.componentize();
export {component as PreviewViewerPdfHeader};
