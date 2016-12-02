import {Constants} from "../../constants";

import {Localization} from "../../localization/localization";

import {Clipper} from "../frontEndGlobals";

import {ClipMode} from "../clipMode";
import {ClipperStateProp} from "../clipperState";
import {ComponentBase} from "../componentBase";
import {Status} from "../status";

class HtmlSelectingPanelClass extends ComponentBase<{}, ClipperStateProp> {
	handleGrabSelectionButton() {
		Clipper.getInjectCommunicator().callRemoteFunction(Constants.FunctionKeys.getCurrentSelection, {
			callback: (newSelection: string) => {
				let newSelections = this.props.clipperState.selectionPreviewInfo;
				newSelections.push(newSelection);
				this.props.clipperState.setState({
					selectionStatus: Status.Succeeded,
					selectionPreviewInfo: newSelections
				});
			}
		});
	}

	handleCancelButton() {
		this.props.clipperState.reset();
	}

	render() {
		return (
			<div id={Constants.Ids.htmlSelectionInstructionsContainer}>
				<div className="regionClipPadding">
					<div className="messageLabelContainer">
						<span className="informationLabelFont messageLabel"
							style={Localization.getFontFamilyAsStyle(Localization.FontFamily.Light)}>
							{Localization.getLocalizedString("WebClipper.Label.DragAndRelease")}
						</span>
					</div>
					<a id={Constants.Ids.htmlSelectionGrabSelectionButton} {...this.enableInvoke(this.handleGrabSelectionButton, 70) }>
						<div className="wideButtonContainer">
							<span className="wideButtonFont wideActionButton"
								style={Localization.getFontFamilyAsStyle(Localization.FontFamily.Semibold)}>
								{ "Grab Selection" }
							</span>
						</div>
					</a>
					<a id={Constants.Ids.htmlSelectionCancelButton} {...this.enableInvoke(this.handleCancelButton, 71) }>
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

let component = HtmlSelectingPanelClass.componentize();
export {component as HtmlSelectingPanel};
