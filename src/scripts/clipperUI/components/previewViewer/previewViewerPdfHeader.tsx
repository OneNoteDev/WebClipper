import {Constants} from "../../../constants";
import {Localization} from "../../../localization/localization";

import {ClipperStateProp} from "../../clipperState";

import {ControlGroup, HeaderClasses, PreviewViewerHeaderComponentBase} from "./previewViewerHeaderComponentBase";

interface PdfPreviewProp extends ClipperStateProp {
	onTextChange: (blah: string) => void;
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

	handleOnChange(event: any) {
		console.log(event);
	}

	getControlGroups(): ControlGroup[] {
		return [this.getPageRangeGroup()];
	}

	private addTextAreaListener() {

		// elements.forEach((element) => {
		// 	addEventListener("click", (event) => {
		// 		console.log(event);
		// 	});
		// });

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

	private getPageRangeGroup(): ControlGroup {
		return {
			id: "pageRangeControl",
			innerElements: [
				<input id="all-pages" type="radio" name="pageSelection" value="all" config={this.addRadioButtonListener}></input>,
				<label for="all-pages"><span>{"All Pages"}</span></label>,
				<input id="all-pages"type="radio" name="pageSelection" value="some" config={this.addRadioButtonListener}></input>,
				<label for="all-pages"><span>{"Some Pages"}</span></label>
			]
			// innerElements: [
			// 	<label><input type="radio" className="yolo" name="pageSelection" value="all" config={this.addRadioButtonListener}>{Localization.getLocalizedString("WebClipper.Preview.Header.AddAnotherRegionButtonLabel")}</input></label>,
			// 	<label><input type="radio" className="yolo" name="pageSelection" value="some" config={this.addRadioButtonListener}>{"Range"}</input></label>,
			// 	<input type="text" id="rangeInput" name="some" placeholder="e.g. 1-3,5,7"></input>
			// ]
		};
	}
}

let component = PreviewViewerPdfHeaderClass.componentize();
export {component as PreviewViewerPdfHeader};
