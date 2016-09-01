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

class SuccessPanelClass extends ComponentBase<{ }, ClipperStateProp> {
	onLaunchOneNoteButton() {
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
			let message: string;
			let buttons: DialogButton[] = [];

			switch (this.props.clipperState.ratingsPromptStage) {
				case RatingsPromptStage.INIT:
					message = "Enjoying the Web Clipper?";
					buttons.push({
						id: "",
						label: "Yes, it's great!",
						handler: () => {
							this.props.clipperState.setState({
								ratingsPromptStage: RatingsPromptStage.RATE
							});
						}
					}, {
							id: "",
							label: "It could be better.",
							handler: () => {
								RatingsHelper.setLastBadRatingDate();

								this.props.clipperState.setState({
									ratingsPromptStage: RatingsPromptStage.FEEDBACK
								});
							}
						});
					break;
				case RatingsPromptStage.RATE:
					message = "Rate us in the Store";
					buttons.push({
						id: "",
						label: "Rate Web Clipper",
						handler: () => {
							this.props.clipperState.setState({
								ratingsPromptStage: RatingsPromptStage.END
							});
						}
					}, {
							id: "",
							label: "No thanks",
							handler: () => {
								this.props.clipperState.setState({
									ratingsPromptStage: RatingsPromptStage.NONE
								});
							}
						});
					break;
				case RatingsPromptStage.FEEDBACK:
					message = "Help us improve!";
					buttons.push({
						id: "",
						label: "Provide feedback",
						handler: () => {
							this.props.clipperState.setState({
								ratingsPromptStage: RatingsPromptStage.END
							});
						}
					}, {
							id: "",
							label: "No thanks",
							handler: () => {
								this.props.clipperState.setState({
									ratingsPromptStage: RatingsPromptStage.NONE
								});
							}
						});
					break;
				case RatingsPromptStage.END:
					message = "Thanks!";
					break;
				default:
				case RatingsPromptStage.NONE:
					break;
			}

			if (!Utils.isNullOrUndefined(message)) {
				return (
					<DialogPanel
						message={message}
						buttons={buttons}
						fontFamily={Localization.FontFamily.Regular}
						divId={Constants.Ids.ratingsPromptContainer}/>
				);
			}
		}
	}

	render() {
		return (
			<div id={Constants.Ids.clipperSuccessContainer} className="resultPagePadding">
				<div>
					<div className="messageLabelContainer successPagePadding">
						<SpriteAnimation spriteUrl={Utils.getImageResourceUrl("checkmark.png")} imageHeight={28} totalFrameCount={30} loop={false}/>
						<span className="actionLabelFont messageLabel"
							style={Localization.getFontFamilyAsStyle(Localization.FontFamily.Regular)}>
							{Localization.getLocalizedString("WebClipper.Label.ClipSuccessful")}
						</span>
					</div>
					<a id={Constants.Ids.launchOneNoteButton} {...this.enableInvoke(this.onLaunchOneNoteButton, 70) }>
						<div className="wideButtonContainer">
							<span className="wideButtonFont wideActionButton"
								style={Localization.getFontFamilyAsStyle(Localization.FontFamily.Semibold)}>
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
