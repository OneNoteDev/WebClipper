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

import {AnimationStrategy} from "../animations/animationStrategy";
import {SlideFromRightAnimationStrategy} from "../animations/slideFromRightAnimationStrategy";

import {SpriteAnimation} from "../components/spriteAnimation";

import {DialogButton, DialogPanel} from "./dialogPanel";

interface SuccessPanelState {
	currentRatingsPromptStage: RatingsPromptStage;
}

class SuccessPanelClass extends ComponentBase<SuccessPanelState, ClipperStateProp> {
	getInitialState(): SuccessPanelState {
		return {
			currentRatingsPromptStage: RatingsPromptStage.INIT
		};
	}

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
							RatingsHelper.setDoNotPromptStatus();

							let rateUrl: string = RatingsHelper.getRateUrlIfExists(this.props.clipperState.clientInfo.clipperType);
							if (!Utils.isNullOrUndefined(rateUrl)) {
								this.props.clipperState.setState({
									ratingsPromptStage: RatingsPromptStage.RATE
								});
							} else {
								this.props.clipperState.setState({
									ratingsPromptStage: RatingsPromptStage.END
								});
							}
						}
					}, {
							id: "",
							label: "It could be better.",
							handler: () => {
								RatingsHelper.setLastBadRatingDate();

								// TODO check if feedback link exists
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
							let rateUrl: string = RatingsHelper.getRateUrlIfExists(this.props.clipperState.clientInfo.clipperType);
							if (!Utils.isNullOrUndefined(rateUrl)) {
								window.open(rateUrl, "_blank");
							}

							this.props.clipperState.setState({
								ratingsPromptStage: RatingsPromptStage.END
							});
						}
					}, {
							id: "",
							label: "No thanks",
							handler: () => {
								// TODO we could set a value that lets us know they got here
								// so that we could put the Rate Us link in their footer

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
								// TODO should we set doNotPromptStatus immediately here when they decide not to provide feedback?

								this.props.clipperState.setState({
									ratingsPromptStage: RatingsPromptStage.NONE
								});
							}
						});
					break;
				case RatingsPromptStage.END:
					message = "Thanks for your feedback!";
					break;
				default:
				case RatingsPromptStage.NONE:
					break;
			}

			if (!Utils.isNullOrUndefined(message)) {
				let animationStrategy: AnimationStrategy = new SlideFromRightAnimationStrategy({
					extShouldAnimateIn: () => {	return this.props.clipperState.ratingsPromptStage !== this.state.currentRatingsPromptStage; },
					extShouldAnimateOut: () => { return false; },
					onAfterAnimateIn: () => { this.setState({ currentRatingsPromptStage: this.props.clipperState.ratingsPromptStage }); }
				});

				console.log(RatingsPromptStage[this.props.clipperState.ratingsPromptStage], RatingsPromptStage[this.state.currentRatingsPromptStage]);

				return (
					<DialogPanel
						message={message}
						buttons={buttons}
						fontFamily={Localization.FontFamily.Regular}
						divId={Constants.Ids.ratingsPromptContainer}
						animationStrategy={animationStrategy} />
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
