import {Constants} from "../../../constants";
import {Localization} from "../../../localization/localization";

import {ClipperStateProp} from "../../clipperState";

import {ControlGroup, HeaderClasses, PreviewViewerHeaderComponentBase} from "./previewViewerHeaderComponentBase";

interface PdfPreviewProp {
	onCheckboxChange: (checked: boolean) => void;
	onTextChange: (text: string) => void;
	onSelectionChange: (selection: boolean) => void;
	allPages: boolean;
	shouldAttachPdf: boolean;
};

class PreviewViewerPdfHeaderClass extends PreviewViewerHeaderComponentBase<{}, PdfPreviewProp> {
	private static textAreaListenerAttached = false;

	getInitialState() {
		if (!PreviewViewerPdfHeaderClass.textAreaListenerAttached) {
			this.addTextAreaListener();
			PreviewViewerPdfHeaderClass.textAreaListenerAttached = true;
		}
		return {};
	}

	getControlGroups(): ControlGroup[] {
		return [this.getPageRangeGroup(), this.getAttachmentCheckbox()];
	}

	private addTextAreaListener() {
		document.addEventListener("input", (event) => {
			let element = event.target;
			let pageRangeField = document.getElementById("rangeInput") as HTMLTextAreaElement;
			if (!!element && element === pageRangeField) {
				this.handlePageRangeFieldChanged(pageRangeField.value);
			}
		});
	}

	private addRadioButtonListener(element: HTMLElement) {
		element.addEventListener("click", (event) => {
			let target = event.target as HTMLInputElement;
			console.log(target.value);
		});
	}

	private handlePageRangeFieldChanged(annotationValue: string) {
		this.props.onTextChange(annotationValue);
	}

	private handleRadioButtonClick(event: MouseEvent) {
		console.log(event);
		let target = event.target as HTMLInputElement;
		// console.log(target.value);
		let value = (target.value.toLowerCase() === "true") ? true : false;
		this.props.onSelectionChange(value);
	}

	private getPageRangeGroup(): ControlGroup {
		// <input id="all-pages" type="radio" value="true" checked={this.props.allPages} onclick={this.handleRadioButtonClick.bind(this)}></input>
		let allPagesRadioClassName = "pdf-indicator pdf-radio-indicator" + (this.props.allPages ? " pdf-radio-active" : "");
		let somePagesRadioClassName = "pdf-indicator pdf-radio-indicator" + (!this.props.allPages ? " pdf-radio-active" : "");
		return {
			id: Constants.Ids.pageRangeControl,
			innerElements: [
				<label class="pdf-control pdf-label" {...this.enableInvoke(this.props.onSelectionChange, 190, true)}>{Localization.getLocalizedString("WebClipper.Preview.Header.PdfAllPagesRadioButtonLabel")}
					<div className={allPagesRadioClassName}></div>
					{this.props.allPages ? <div class="pdf-indicator-two"></div> : ""}
				</label>,
				<label class="pdf-control pdf-label" {...this.enableInvoke(this.props.onSelectionChange, 190, false)}>
					<input type="text" id="rangeInput" placeholder="e.g. 1-5, 7, 9-12"></input>
					<div className={somePagesRadioClassName}></div>
					{!this.props.allPages ? <div class="pdf-indicator-two"></div> : ""}
				</label>,
			]
		};
	}

	private handleCheckboxChange(event: Event) {
		let target = event.target as HTMLInputElement;
		this.props.onCheckboxChange(target.checked);
	}

	private getAttachmentCheckbox(): ControlGroup {
		return {
			id: "attachmentCheckboxControl",
			innerElements: [
				<label class="pdf-control pdf-checkbox-control pdf-label" for="attachment-checkbox">{Localization.getLocalizedString("WebClipper.Preview.Header.PdfAttachPdfCheckboxLabel")}
					<input id="attachment-checkbox" type="checkbox" checked={this.props.shouldAttachPdf} value="true" onchange={this.handleCheckboxChange.bind(this)}></input>
					<div class="pdf-indicator pdf-checkbox-indicator"></div>
					<div class="checkbox"></div>
				</label>
			]
		};
	}
}

let component = PreviewViewerPdfHeaderClass.componentize();
export {component as PreviewViewerPdfHeader};
