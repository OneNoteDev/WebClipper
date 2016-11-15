import {PdfPreviewInfo} from "../../previewInfo";

import { Constants } from "../../constants";

import {Localization} from "../../localization/localization";

import { ComponentBase } from "../componentBase";
import { ClipperStateProp } from "../clipperState";

import * as _ from "lodash";

interface PdfClipOptionsProps extends ClipperStateProp {
	onCheckboxChange: (checked: boolean) => void;
	onDistributionChange: (checked: boolean) => void;
	// onTextChange: (text: string) => void;
	// onSelectionChange: (selection: boolean) => void;
	// allPages: boolean;
	shouldAttachPdf: boolean;
	shouldDistributePages: boolean;
	// invalidRange: boolean;
}

class PdfClipOptionsClass extends ComponentBase<{}, PdfClipOptionsProps> {
	onCheckboxChange(checked: boolean): void {
		console.log("onCheckboxChange");
		_.assign(_.extend(this.props.clipperState.pdfPreviewInfo, {
			shouldAttachPdf: checked
		} as PdfPreviewInfo), this.props.clipperState.setState);
	}

	onDistributionChange(checked: boolean) {
		console.log("onDistributionChange");
		_.assign(_.extend(this.props.clipperState.pdfPreviewInfo, {
			shouldDistributePages: checked
		} as PdfPreviewInfo), this.props.clipperState.setState);
	}

	getAttachmentCheckbox(): any {
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
		return (
			<div className={"clipOptionsContainer"}>
				<div class="clipOptionsTitleContainer"><span className="clipOptionsTitle">PDF Options</span></div>
				{this.getAttachmentCheckbox()}
				{this.getDistributePagesCheckbox()}
			</div>
		);

		// return (
		// 	<div className={"clipOptionsContainer"}>
		// 		<span>PDF Options</span>
		// 		<div id={Constants.Ids.radioAllPagesLabel} className="pdf-control" {...this.enableInvoke(this.props.onSelectionChange, 190, true) }>
		// 			<div class="pdf-indicator pdf-radio-indicator">
		// 				{this.props.allPages ? <div class="pdf-radio-indicator-fill"></div> : ""}
		// 			</div>
		// 			<span class="pdf-label">{Localization.getLocalizedString("WebClipper.Preview.Header.PdfAllPagesRadioButtonLabel")}</span>
		// 		</div>
		// 		<div id={Constants.Ids.radioPageRangeLabel} className="pdf-control" {...this.enableInvoke(this.props.onSelectionChange, 191, false) }>
		// 			<div class="pdf-indicator pdf-radio-indicator">
		// 				{!this.props.allPages ? <div class="pdf-radio-indicator-fill"></div> : ""}
		// 			</div>
		// 			{!this.props.allPages ?
		// 				<input type="text" id={Constants.Ids.rangeInput} className={invalidClassName} placeholder="e.g. 1-5, 7, 9-12" value={this.props.clipperState.pdfPreviewInfo.selectedPageRange} {...this.enableInvoke(this.props.onSelectionChange, 192, false) }></input>
		// 				: <span class="pdf-label">{Localization.getLocalizedString("WebClipper.Preview.Header.PdfPageRangeRadioButtonLabel")}</span>}

		// 			{!this.props.allPages && this.props.invalidRange ?
		// 				<div class="popover">{Localization.getLocalizedString("WebClipper.Preview.Header.PdfInvalidPageRange")}</div>
		// 				: ""}
		// 		</div>
		// 	</div>
		// );
	}
}

let component = PdfClipOptionsClass.componentize();
export { component as PdfClipOptions };
