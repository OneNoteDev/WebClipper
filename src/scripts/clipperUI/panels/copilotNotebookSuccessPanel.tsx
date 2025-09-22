import {Constants} from "../../constants";

import {ExtensionUtils} from "../../extensions/extensionUtils";

import {Localization} from "../../localization/localization";

import {ClipperStateProp} from "../clipperState";
import {ComponentBase} from "../componentBase";

import {SpriteAnimation} from "../components/spriteAnimation";

class CopilotNotebookSuccessPanelClass extends ComponentBase<{ }, ClipperStateProp> {
	render() {
		return (
			<div id={Constants.Ids.clipperSuccessContainer}>
				<div className="messageLabelContainer successPagePadding">
					<SpriteAnimation spriteUrl={ExtensionUtils.getImageResourceUrl("checkmark.png")} imageHeight={28} totalFrameCount={30} loop={false} tabIndex={-1}/>
					<span className="actionLabelFont messageLabel" role="alert"
						style={Localization.getFontFamilyAsStyle(Localization.FontFamily.Light)}>
						{Localization.getLocalizedString("WebClipper.Label.ClipSuccessful")}
					</span>
				</div>
			</div>
		);
	}
}

let component = CopilotNotebookSuccessPanelClass.componentize();
export {component as CopilotNotebookSuccessPanel};