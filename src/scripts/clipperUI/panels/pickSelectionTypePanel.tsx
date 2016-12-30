import {Constants} from "../../constants";

import {SelectionMode} from "../../contentCapture/selectionHelper";

import {Localization} from "../../localization/localization";

import {ClipMode} from "../clipMode";
import {ClipperStateProp} from "../clipperState";
import {ComponentBase} from "../componentBase";
import {Status} from "../status";

class PickSelectionTypePanelClass extends ComponentBase<{}, ClipperStateProp> {
	handleCancelButton() {
		this.props.clipperState.reset();
	}

	setSelectionType(mode: SelectionMode) {
		// TODO use lodash
		this.props.clipperState.setState({
			selectionResult: {
				status: Status.NotStarted,
				data: {
					mode: mode,
					htmlSelections: this.props.clipperState.selectionResult.data.htmlSelections
				}
			}
		});
	}

	render() {
		return (
			<div id={Constants.Ids.regionInstructionsContainer}>
				<div className="regionClipPadding">
					<div className="messageLabelContainer">
						<span className="informationLabelFont messageLabel"
							style={Localization.getFontFamilyAsStyle(Localization.FontFamily.Light)}>
							{Localization.getLocalizedString("WebClipper.Label.PickSelectionType")}
						</span>
					</div>
					<a id={Constants.Ids.pickRegionSelectionButton} {...this.enableInvoke(this.setSelectionType, 70, SelectionMode.Region) }>
						<div className="wideButtonContainer">
							<span className="wideButtonFont wideActionButton"
								style={Localization.getFontFamilyAsStyle(Localization.FontFamily.Semibold)}>
								{Localization.getLocalizedString("WebClipper.Action.PickRegionType") }
							</span>
						</div>
					</a>
					<a id={Constants.Ids.pickHtmlSelectionButton} {...this.enableInvoke(this.setSelectionType, 71, SelectionMode.Html) }>
						<div className="wideButtonContainer">
							<span className="wideButtonFont wideActionButton"
								style={Localization.getFontFamilyAsStyle(Localization.FontFamily.Semibold)}>
								{Localization.getLocalizedString("WebClipper.Action.PickHtmlType") }
							</span>
						</div>
					</a>
					<a id={Constants.Ids.regionClipCancelButton} {...this.enableInvoke(this.handleCancelButton, 72) }>
						<div className="wideButtonContainer">
							<span className="wideButtonFont wideActionButton"
								style={Localization.getFontFamilyAsStyle(Localization.FontFamily.Semibold)}>
								{Localization.getLocalizedString("WebClipper.Action.Cancel") }
							</span>
						</div>
					</a>
				</div>
			</div>
		);
	}
}

let component = PickSelectionTypePanelClass.componentize();
export {component as PickSelectionTypePanel};
