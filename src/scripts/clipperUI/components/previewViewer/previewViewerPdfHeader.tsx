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
		let target = event.target as HTMLInputElement;
		// console.log(target.value);
		let value = (target.value.toLowerCase() === "true") ? true : false;
		this.props.onSelectionChange(value);
	}

	private getPageRangeGroup(): ControlGroup {
		return {
			id: "pageRangeControl",
			innerElements: [
				<input id="all-pages" type="radio" name="pageSelection" value="true" onclick={this.handleRadioButtonClick.bind(this)}></input>,
				<label for="all-pages"><span class="radio-control-label">{Localization.getLocalizedString("WebClipper.Preview.Header.PdfAllPagesRadioButtonLabel")}</span></label>,
				<input id="all-pages" type="radio" name="pageSelection" value="false" onclick={this.handleRadioButtonClick.bind(this)}></input>,
				<label for="all-pages"><input type="text" id="rangeInput" name="some" placeholder="e.g. 1-5, 7, 9-12"></input></label>
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
				<input id="attachment-checkbox" type="checkbox" value="true" onchange={this.handleCheckboxChange.bind(this)}></input>,
				<input id="attachment-checkbox-two" type="checkbox" {...this.enableInvoke(this.handleCheckboxChange.bind(this), 0)}></input>,
				<label id="attachment-checkbox-label" for="attachment-checkbox"><span>{Localization.getLocalizedString("WebClipper.Preview.Header.PdfAttachPdfCheckboxLabel")}</span></label>
			]
		};
	}
}

let component = PreviewViewerPdfHeaderClass.componentize();
export {component as PreviewViewerPdfHeader};
