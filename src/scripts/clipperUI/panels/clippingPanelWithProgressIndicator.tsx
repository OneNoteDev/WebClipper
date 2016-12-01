import {Constants} from "../../constants";

import {Localization} from "../../localization/localization";

import {ClipperStateProp} from "../clipperState";
import {ComponentBase} from "../componentBase";

import {ClippingPanel} from "./clippingPanel";

class ClippingPanelWithProgressIndicatorClass extends ComponentBase<{}, ClipperStateProp> {
	getMessageElement() {
		const pdfProgress = this.props.clipperState.pdfSaveStatus;
		let message = Localization.getLocalizedString("WebClipper.ClipType.Pdf.IncrementalProgressMessage").replace("{0}", (pdfProgress.numPagesCompleted + 1).toString());
		message = message.replace("{1}", pdfProgress.totalPages.toString());

		return (
			<span className="actionLabelFont messageLabel" id={Constants.Ids.clipProgressDelayedMessage}
				style={Localization.getFontFamilyAsStyle(Localization.FontFamily.Regular)}>
				{message}
			</span>
		);
	}

	render() {
		return (
			<div>
				<ClippingPanel clipperState={this.props.clipperState} />
				{this.getMessageElement()}
			</div>
		);
	}
}

let component = ClippingPanelWithProgressIndicatorClass.componentize();
export {component as ClippingPanelWithProgressIndicator};
