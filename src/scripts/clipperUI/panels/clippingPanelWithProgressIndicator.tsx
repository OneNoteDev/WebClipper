import {Constants} from "../../constants";
import {ObjectUtils} from "../../objectUtils";

import {Localization} from "../../localization/localization";

import {ClipperStateProp} from "../clipperState";
import {ComponentBase} from "../componentBase";

import {ClippingPanel} from "./clippingPanel";

class ClippingPanelWithProgressIndicatorClass extends ComponentBase<{}, ClipperStateProp> {
	getMessageElement() {
		const pdfProgress = this.props.clipperState.pdfSaveStatus;

		// We would rather show no message at all, than show a broken message like "Clipping page -1 of -5...""
		if (ObjectUtils.isNullOrUndefined(pdfProgress.numPagesCompleted) || ObjectUtils.isNullOrUndefined(pdfProgress.totalPages)) {
			return undefined;
		} else if (pdfProgress.numPagesCompleted > pdfProgress.totalPages) {
			return undefined;
		} else if (pdfProgress.numPagesCompleted < 0 || pdfProgress.totalPages < 0) {
			return undefined;
		}

		let message = Localization.getLocalizedString("WebClipper.ClipType.Pdf.IncrementalProgressMessage").replace("{0}", (pdfProgress.numPagesCompleted + 1).toString());
		message = message.replace("{1}", pdfProgress.totalPages.toString());

		return (
			<span className="actionLabelFont messageLabel" id={Constants.Ids.clipProgressIndicatorMessage}
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
