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
				if (newSelection) {
					let newSelections = this.props.clipperState.selectionPreviewInfo;
					newSelections.push(newSelection);
					this.props.clipperState.setState({
						selectionStatus: Status.Succeeded,
						selectionPreviewInfo: newSelections
					});
				} else {
					// The user attempted to grab selection and did not select anything. TODO: we should surface a message and remain
					// on this panel I think
					this.handleCancelButton();
				}
			}
		});
	}

	handleCancelButton() {
		this.props.clipperState.setState({
			selectionStatus: this.props.clipperState.selectionPreviewInfo && this.props.clipperState.selectionPreviewInfo.length > 0 ?
				Status.Succeeded : Status.NotStarted
		});
		this.props.clipperState.reset();
	}

	render() {
		return (
			<div id={Constants.Ids.htmlSelectionInstructionsContainer}>
				<div className="regionClipPadding">
					<div className="messageLabelContainer">
						<span className="informationLabelFont messageLabel"
							style={Localization.getFontFamilyAsStyle(Localization.FontFamily.Light)}>
							{Localization.getLocalizedString("WebClipper.Label.SelectionInstructions")}
						</span>
					</div>
					<a id={Constants.Ids.htmlSelectionGrabSelectionButton} {...this.enableInvoke(this.handleGrabSelectionButton, 70) }>
						<div className="wideButtonContainer">
							<span className="wideButtonFont wideActionButton"
								style={Localization.getFontFamilyAsStyle(Localization.FontFamily.Semibold)}>
								{Localization.getLocalizedString("WebClipper.Action.GrabSelection")}
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
