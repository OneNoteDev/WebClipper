/// <reference path="../../../../node_modules/onenoteapi/target/oneNoteApi.d.ts" />

import {Constants} from "../../constants";

import {InvokeMode} from "../../extensions/invokeOptions";

import {Localization} from "../../localization/localization";

import {ModeButtonSelector} from "../components/modeButtonSelector";
import {SectionPicker} from "../components/sectionPicker";

import {ClipMode} from "../clipMode";
import {ClipperStateHelperFunctions, ClipperStateProp} from "../clipperState";
import {ComponentBase} from "../componentBase";
import {Status} from "../status";

interface OptionsPanelProps extends ClipperStateProp {
	onStartClip: () => void;
	onPopupToggle: (shouldNowBeOpen: boolean) => void;
}

class OptionsPanelClass extends ComponentBase<{ }, OptionsPanelProps> {
	render() {
		let clipButtonEnabled = ClipperStateHelperFunctions.clipButtonEnabled(this.props.clipperState);

		return (
			<div className="optionsPanel">
				<ModeButtonSelector clipperState={this.props.clipperState} />
				<SectionPicker onPopupToggle={this.props.onPopupToggle.bind(this)} clipperState={this.props.clipperState} />

				<div id={Constants.Ids.clipButtonContainer} className="wideButtonContainer">
					{clipButtonEnabled
					?	<a id={Constants.Ids.clipButton} className="wideActionButton" {...this.enableInvoke(this.props.onStartClip, 1) }>
							<span className="wideButtonFont"
								style={Localization.getFontFamilyAsStyle(Localization.FontFamily.Semibold)}>
								{Localization.getLocalizedString("WebClipper.Action.Clip")}
							</span>
						</a>
					:	<a id={Constants.Ids.clipButton} className="wideActionButton disabled">
							<span className="wideButtonFont"
								style={Localization.getFontFamilyAsStyle(Localization.FontFamily.Semibold)}>
								{Localization.getLocalizedString("WebClipper.Action.Clip")}
							</span>
						</a>}
				</div>
			</div>
		);
	}
}

let component = OptionsPanelClass.componentize();
export {component as OptionsPanel};
