import {Constants} from "../../constants";
import {Localization} from "../../localization/localization";
import {ClipperStateProp} from "../clipperState";
import {ComponentBase} from "../componentBase";

class RegionSelectingPanelClass extends ComponentBase<{}, ClipperStateProp> {
	handleCancelButton() {
		this.props.clipperState.reset();
	}

	render() {
		return (
			<div id={Constants.Ids.regionInstructionsContainer}>
				<div className="regionClipPadding">
					<div className="messageLabelContainer regionSelectionContainer">
						<div className={Constants.Classes.srOnly} role="alert">
							{Localization.getLocalizedString("WebClipper.Label.RegionSelectionMouseInstruction")}
							{Localization.getLocalizedString("WebClipper.Label.RegionSelectionKeyboardInstruction")}
						</div>
						<span className="informationLabelFont messageLabel" style={Localization.getFontFamilyAsStyle(Localization.FontFamily.Light)}>
							{Localization.getLocalizedString("WebClipper.Label.RegionSelectionMouseInstruction")}
							<br/>
							{Localization.getLocalizedString("WebClipper.Label.RegionSelectionKeyboardInstruction")}
						</span>
					</div>
					<div className="wideButtonContainer">
						<a id={ Constants.Ids.regionClipCancelButton } role="button"
							{...this.enableInvoke({callback: this.handleCancelButton, tabIndex: 0})} >
							<span className="wideButtonFont wideActionButton buttonTextInHighContrast" style={Localization.getFontFamilyAsStyle(Localization.FontFamily.Semibold)}>
								{Localization.getLocalizedString("WebClipper.Action.BackToHome")}
							</span>
						</a>
					</div>
				</div>
			</div>
		);
	}
}

let component = RegionSelectingPanelClass.componentize();
export {component as RegionSelectingPanel};
