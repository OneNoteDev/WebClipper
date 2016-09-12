import {Constants} from "../../constants";
import {Utils} from "../../utils";

import {Localization} from "../../localization/localization";

import * as Log from "../../logging/log";

import {ClipMode} from "../clipMode";
import {ClipperStateProp} from "../clipperState";
import {ComponentBase} from "../componentBase";
import {Clipper} from "../frontEndGlobals";
import {RatingsHelper, RatingsPromptStage} from "../ratingsHelper";
import {Status} from "../status";

import {SpriteAnimation} from "../components/spriteAnimation";

import {DialogButton, DialogPanel} from "./dialogPanel";

interface SuccessPanelState {
	currentRatingsPromptStage?: RatingsPromptStage;
	userSelectedRatingsPromptStage?: RatingsPromptStage;
}

export class SuccessPanelClass extends ComponentBase<SuccessPanelState, ClipperStateProp> {
	getInitialState(): SuccessPanelState {
		return {
			currentRatingsPromptStage: RatingsPromptStage.INIT,
			userSelectedRatingsPromptStage: RatingsPromptStage.INIT
		};
	}

	public onLaunchOneNoteButton() {
		Clipper.logger.logUserFunnel(Log.Funnel.Label.ViewInWac);
		let data = this.props.clipperState.oneNoteApiResult.data as OneNoteApi.Page;
		if (data && data.links && data.links.oneNoteWebUrl && data.links.oneNoteWebUrl.href) {
			window.open(data.links.oneNoteWebUrl.href, "_blank");
		} else {
			Clipper.logger.logFailure(Log.Failure.Label.OnLaunchOneNoteButton, Log.Failure.Type.Unexpected,
				{ error: "Page created and returned by API is either missing entirely, or missing its links, oneNoteWebUrl, or oneNoteWebUrl.href. Page: " + data });
		}
	}

	private showRatingsPrompt(): any[] {
		if (this.props.clipperState.shouldShowRatingsPrompt) {
			let message: string = RatingsHelper.getMessage(this.state.userSelectedRatingsPromptStage);
			let buttons: DialogButton[] = RatingsHelper.getDialogButtons(this);

			if (!Utils.isNullOrUndefined(message)) {
				let animationStrategy = RatingsHelper.getAnimationStategy(this);

				return (
					<DialogPanel
						message={message}
						buttons={buttons}
						buttonFontFamily={Localization.FontFamily.Regular}
						divId={Constants.Ids.ratingsPromptContainer}
						animationStrategy={animationStrategy} />
				);
			}
		}
	}

	render() {
		return (
			<div id={Constants.Ids.clipperSuccessContainer}>
				<div>
					<div className="messageLabelContainer successPagePadding">
						<SpriteAnimation spriteUrl={Utils.getImageResourceUrl("checkmark.png")} imageHeight={28} totalFrameCount={30} loop={false}/>
						<span className="actionLabelFont messageLabel"
							style={Localization.getFontFamilyAsStyle(Localization.FontFamily.Light)}>
							{Localization.getLocalizedString("WebClipper.Label.ClipSuccessful")}
						</span>
					</div>
					<a id={Constants.Ids.launchOneNoteButton} {...this.enableInvoke(this.onLaunchOneNoteButton, 70) }>
						<div className="wideButtonContainer">
							<span className="wideButtonFont wideActionButton"
								style={Localization.getFontFamilyAsStyle(Localization.FontFamily.Regular)}>
								{Localization.getLocalizedString("WebClipper.Action.ViewInOneNote")}
							</span>
						</div>
					</a>
				</div>
				{this.showRatingsPrompt()}
			</div>
		);
	}
}

let component = SuccessPanelClass.componentize();
export {component as SuccessPanel};
