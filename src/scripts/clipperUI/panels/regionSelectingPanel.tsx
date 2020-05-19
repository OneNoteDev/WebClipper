import {Constants} from "../../constants";
import {Localization} from "../../localization/localization";
import {ClipperStateProp} from "../clipperState";
import {ComponentBase} from "../componentBase";

class RegionSelectingPanelClass extends ComponentBase<{}, ClipperStateProp> {
	handleCancelButton() {
		this.props.clipperState.reset();
	}

	initiallySetFocusToBackButton(element: HTMLElement) {
		element.focus();
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
					<div className="wideButtonContainer">
						<a id={ Constants.Ids.regionClipCancelButton } role="button"
							{...this.onElementFirstDraw(this.initiallySetFocusToBackButton)}
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
