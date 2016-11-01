import {Constants} from "../../constants";

import {AugmentationModel} from "../../contentCapture/augmentationHelper";

import {Localization} from "../../localization/localization";

import * as Log from "../../logging/log";

import {Utils} from "../../utils";

import {ClipMode} from "../clipMode";
import {Clipper} from "../frontEndGlobals";
import {ClipperStateProp} from "../clipperState";
import {ComponentBase} from "../componentBase";
import {Status} from "../status";

import {SpriteAnimation} from "../components/spriteAnimation";

class ClippingPanelClass extends ComponentBase<{}, ClipperStateProp> {
	getProgressLabel(): string {
		switch (this.props.clipperState.currentMode.get()) {
			case ClipMode.Pdf:
				return Localization.getLocalizedString("WebClipper.ClipType.Pdf.ProgressLabel");
			case ClipMode.Region:
				return Localization.getLocalizedString("WebClipper.ClipType.Region.ProgressLabel");
			case ClipMode.Augmentation:
				let retVal: string;
				try {
					let augmentationModelStr = AugmentationModel[this.props.clipperState.augmentationResult.data.ContentModel];
					retVal = Localization.getLocalizedString("WebClipper.ClipType." + augmentationModelStr + ".ProgressLabel");
				} catch (e) {
					Clipper.logger.logFailure(Log.Failure.Label.GetLocalizedString, Log.Failure.Type.Unexpected,
						{ error: e.message }, ClipMode[this.props.clipperState.currentMode.get()]);
					// Fallback string
					retVal = Localization.getLocalizedString("WebClipper.ClipType.ScreenShot.ProgressLabel");
				}
				return retVal;
			case ClipMode.Bookmark:
				return Localization.getLocalizedString("WebClipper.ClipType.Bookmark.ProgressLabel");
			case ClipMode.Selection:
				return Localization.getLocalizedString("WebClipper.ClipType.Selection.ProgressLabel");
			default:
			case ClipMode.FullPage:
				return Localization.getLocalizedString("WebClipper.ClipType.ScreenShot.ProgressLabel");
		}
	}

	render() {
		return (
			<div id={Constants.Ids.clipperApiProgressContainer} className="progressPadding">
				<SpriteAnimation spriteUrl={Utils.getImageResourceUrl("spinner_loop.png")} imageHeight={32} totalFrameCount={21} loop={true}/>
				<span className="actionLabelFont messageLabel"
					style={Localization.getFontFamilyAsStyle(Localization.FontFamily.Regular)}>
					{this.getProgressLabel()}
				</span>
			</div>
		);
	}
}

let component = ClippingPanelClass.componentize();
export {component as ClippingPanel};
