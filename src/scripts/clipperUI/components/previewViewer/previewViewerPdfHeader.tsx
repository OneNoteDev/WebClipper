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

	getControlGroups(): ControlGroup[] {
		return [this.getPageRangeGroup()];
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

	private handlePageRangeFieldChanged(annotationValue: string) {
		this.props.onTextChange(annotationValue);
	}

	private getPageRangeGroup(): ControlGroup {
		return {
			id: "pageRangeControl",
			innerElements: [
				<input type="radio" name="pageSelection" value="all">{Localization.getLocalizedString("WebClipper.Preview.Header.AddAnotherRegionButtonLabel")}</input>,
				<input type="radio" name="pageSelection" value="some">{<span>"Range"</span>}
				</input>,
				<input type="text" id="rangeInput" name="some" placeholer="e.g. 1-3,5,7"></input>
			]
		};
	}
}

let component = PreviewViewerPdfHeaderClass.componentize();
export {component as PreviewViewerPdfHeader};
