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
					<div className="messageLabelContainer">
						<div className={Constants.Classes.srOnly} role="alert">
							{Localization.getLocalizedString("WebClipper.Label.DragAndRelease")}
						</div>
						<span className="informationLabelFont messageLabel" style={Localization.getFontFamilyAsStyle(Localization.FontFamily.Light)}>
							{Localization.getLocalizedString("WebClipper.Label.DragAndRelease")}
						</span>
					</div>
					<a id={Constants.Ids.regionClipCancelButton} {...this.enableInvoke(this.handleCancelButton, 70)}>
						<div className="wideButtonContainer">
							<span className="wideButtonFont wideActionButton" style={Localization.getFontFamilyAsStyle(Localization.FontFamily.Semibold)}>
								{Localization.getLocalizedString("WebClipper.Action.BackToHome")}
							</span>
						</div>
					</a>
				</div>
			</div>
		);
	}
}

let component = RegionSelectingPanelClass.componentize();
export {component as RegionSelectingPanel};
