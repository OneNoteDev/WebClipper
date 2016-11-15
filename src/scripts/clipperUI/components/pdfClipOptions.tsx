import {ComponentBase} from "../componentBase";
import {ClipperStateProp} from "../clipperState";

interface PdfClipOptionsProps extends ClipperStateProp {
	onCheckboxChange: (checked: boolean) => void;
	onTextChange: (text: string) => void;
	onSelectionChange: (selection: boolean) => void;
	allPages: boolean;
	shouldAttachPdf: boolean;
	invalidRange: boolean;
}

class PdfClipOptionsClass extends ComponentBase<{}, ClipperStateProp> {
	render() {
		return (
			<div id="clipOptionsContainer">
				<span>PDF Options</span>
				<div id={Constants.Ids.radioAllPagesLabel} className="pdf-control" {...this.enableInvoke(this.props.onSelectionChange, 190, true) }>
 					<div class="pdf-indicator pdf-radio-indicator">
 						{this.props.allPages ? <div class="pdf-radio-indicator-fill"></div> : ""}
 					<span class="pdf-label">{Localization.getLocalizedString("WebClipper.Preview.Header.PdfAllPagesRadioButtonLabel")}</span>
+				</div>
			</div>
		);
	}
}