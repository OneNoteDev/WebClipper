import {Constants} from "../../constants";
import {UrlUtils} from "../../urlUtils";

import {ExtensionUtils} from "../../extensions/extensionUtils";

import {Localization} from "../../localization/localization";

import * as Log from "../../logging/log";

import {ClipperStateProp} from "../clipperState";
import {ComponentBase} from "../componentBase";
import {Clipper} from "../frontEndGlobals";

import {SpriteAnimation} from "../components/spriteAnimation";

class SuccessPanelClass extends ComponentBase<{ }, ClipperStateProp> {
	public onLaunchOneNoteButton() {
		Clipper.logger.logUserFunnel(Log.Funnel.Label.ViewInWac);
		let data = this.props.clipperState.oneNoteApiResult.data as OneNoteApi.Page;
		if (data && data.links && data.links.oneNoteWebUrl && data.links.oneNoteWebUrl.href) {
			let urlWithFromClipperParam = UrlUtils.addUrlQueryValue(data.links.oneNoteWebUrl.href, Constants.Urls.QueryParams.wdFromClipper, "1");
			window.open(urlWithFromClipperParam, "_blank");
		} else {
			Clipper.logger.logFailure(Log.Failure.Label.OnLaunchOneNoteButton, Log.Failure.Type.Unexpected,
				{ error: "Page created and returned by API is either missing entirely, or missing its links, oneNoteWebUrl, or oneNoteWebUrl.href. Page: " + data });
		}
	}

	render() {
		return (
			<div id={Constants.Ids.clipperSuccessContainer}>
				<div className="messageLabelContainer successPagePadding">
					<SpriteAnimation spriteUrl={ExtensionUtils.getImageResourceUrl("checkmark.png")} imageHeight={28} totalFrameCount={30} loop={false}/>
					<span className="actionLabelFont messageLabel" role="alert"
						style={Localization.getFontFamilyAsStyle(Localization.FontFamily.Light)}>
						{Localization.getLocalizedString("WebClipper.Label.ClipSuccessful")}
					</span>
				</div>
				<a id={Constants.Ids.launchOneNoteButton} {...this.enableInvoke({handleMethod: this.onLaunchOneNoteButton, tabIndex: 70})}>
					<div className="wideButtonContainer">
						<span className="wideButtonFont wideActionButton"
							style={Localization.getFontFamilyAsStyle(Localization.FontFamily.Regular)}>
							{Localization.getLocalizedString("WebClipper.Action.ViewInOneNote")}
						</span>
					</div>
				</a>
			</div>
		);
	}
}

let component = SuccessPanelClass.componentize();
export {component as SuccessPanel};
