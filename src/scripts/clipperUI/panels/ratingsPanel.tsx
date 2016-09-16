import {ClientType} from "../../clientType";
import {Constants} from "../../constants";
import {Utils} from "../../utils";

import {Localization} from "../../localization/localization";

import * as Log from "../../logging/log";

import {ClipMode} from "../clipMode";
import {ClipperState, ClipperStateProp} from "../clipperState";
import {ComponentBase} from "../componentBase";
import {Clipper} from "../frontEndGlobals";
import {RatingsHelper, RatingsPromptStage} from "../ratingsHelper";
import {Status} from "../status";

import {AnimationStrategy} from "../animations/animationStrategy";
import {SlideFromRightAnimationStrategy} from "../animations/slideFromRightAnimationStrategy";

import {SpriteAnimation} from "../components/spriteAnimation";

import {DialogButton, DialogPanel} from "./dialogPanel";

interface RatingsPanelState {
	currentRatingsPromptStage?: RatingsPromptStage;
	userSelectedRatingsPromptStage?: RatingsPromptStage;
}

class RatingsPanelClass extends ComponentBase<RatingsPanelState, ClipperStateProp> {
	getInitialState(): RatingsPanelState {
		return {
			currentRatingsPromptStage: RatingsPromptStage.Init,
			userSelectedRatingsPromptStage: RatingsPromptStage.Init
		};
	}

	/**
	 * Get the animation strategy for the ratings subpanel of the success panel provided
	 */
	private getAnimationStategy(panel: RatingsPanelClass): AnimationStrategy {
		return new SlideFromRightAnimationStrategy({
			extShouldAnimateIn: () => {	return panel.state.userSelectedRatingsPromptStage !== panel.state.currentRatingsPromptStage; },
			extShouldAnimateOut: () => { return false; },
			onAfterAnimateIn: () => { panel.setState({ currentRatingsPromptStage: panel.state.userSelectedRatingsPromptStage }); }
		});
	}

	/**
	 * Get appropriate dialog panel message for the ratings prompt stage provided
	 */
	private getMessage(stage: RatingsPromptStage): string {
		switch (stage) {
			case RatingsPromptStage.Init:
				return Localization.getLocalizedString("WebClipper.Label.Ratings.Message.Init");
			case RatingsPromptStage.Rate:
				return Localization.getLocalizedString("WebClipper.Label.Ratings.Message.Rate");
			case RatingsPromptStage.Feedback:
				return Localization.getLocalizedString("WebClipper.Label.Ratings.Message.Feedback");
			case RatingsPromptStage.End:
				return Localization.getLocalizedString("WebClipper.Label.Ratings.Message.End");
			default:
			case RatingsPromptStage.None:
				return;
		}
	}

	/**
	 * Get appropriate dialog panel buttons for the panel (with its internal states) provided
	 */
	private getDialogButtons(panel: RatingsPanelClass): DialogButton[] {
		let stage: RatingsPromptStage = panel.state.userSelectedRatingsPromptStage;
		let clipperState: ClipperState = panel.props.clipperState;
		let clientType: ClientType = clipperState.clientInfo.clipperType;

		let buttons: DialogButton[] = [];

		switch (stage) {
			case RatingsPromptStage.Init:
				buttons.push({
					id: Constants.Ids.ratingsButtonInitYes,
					label: Localization.getLocalizedString("WebClipper.Label.Ratings.Button.Init.Positive"),
					handler: () => {
						RatingsHelper.setDoNotPromptStatus();

						let rateUrl: string = RatingsHelper.getRateUrlIfExists(clientType);
						if (!Utils.isNullOrUndefined(rateUrl) && rateUrl.length > 0) {
							panel.setState({
								userSelectedRatingsPromptStage: RatingsPromptStage.Rate
							});
						} else {
							panel.setState({
								userSelectedRatingsPromptStage: RatingsPromptStage.End
							});
						}
					}
				}, {
						id: Constants.Ids.ratingsButtonInitNo,
						label: Localization.getLocalizedString("WebClipper.Label.Ratings.Button.Init.Negative"),
						handler: () => {
							let lastSeenVersion: string = Clipper.Storage.getCachedValue(Constants.StorageKeys.lastSeenVersion);
							let badRatingAlreadyOccurred: boolean = RatingsHelper.setLastBadRating(Date.now().toString(), lastSeenVersion);
							if (badRatingAlreadyOccurred) {
								// setting this to prevent additional ratings prompts after the second bad rating
								RatingsHelper.setDoNotPromptStatus();
							}
							let feedbackUrl: string = RatingsHelper.getFeedbackUrlIfExists(clipperState);
							if (!Utils.isNullOrUndefined(feedbackUrl) && feedbackUrl.length > 0) {
								panel.setState({
									userSelectedRatingsPromptStage: RatingsPromptStage.Feedback
								});
							} else {
								panel.setState({
									userSelectedRatingsPromptStage: RatingsPromptStage.End
								});
							}
						}
					});
				break;
			case RatingsPromptStage.Rate:
				let rateUrl: string = RatingsHelper.getRateUrlIfExists(clientType);
				if (!Utils.isNullOrUndefined(rateUrl) && rateUrl.length > 0) {
					buttons.push({
						id: Constants.Ids.ratingsButtonRateYes,
						label: Localization.getLocalizedString("WebClipper.Label.Ratings.Button.Rate"),
						handler: () => {
							window.open(rateUrl, "_blank");

							panel.setState({
								userSelectedRatingsPromptStage: RatingsPromptStage.End
							});
						}
					}, {
						id: Constants.Ids.ratingsButtonRateNo,
						label: Localization.getLocalizedString("WebClipper.Label.Ratings.Button.NoThanks"),
						handler: () => {
							panel.setState({
								userSelectedRatingsPromptStage: RatingsPromptStage.None
							});
						}
					});
				} else {
					// this shouldn't happen
					panel.setState({
						userSelectedRatingsPromptStage: RatingsPromptStage.None
					});
				}
				break;
			case RatingsPromptStage.Feedback:
				let feedbackUrl: string = RatingsHelper.getFeedbackUrlIfExists(clipperState);
				if (!Utils.isNullOrUndefined(feedbackUrl) && feedbackUrl.length > 0) {
					buttons.push({
						id: Constants.Ids.ratingsButtonFeedbackYes,
						label: Localization.getLocalizedString("WebClipper.Label.Ratings.Button.Feedback"),
						handler: () => {
							window.open(feedbackUrl, "_blank");

							panel.setState({
								userSelectedRatingsPromptStage: RatingsPromptStage.End
							});
						}
					}, {
						id: Constants.Ids.ratingsButtonFeedbackNo,
						label: Localization.getLocalizedString("WebClipper.Label.Ratings.Button.NoThanks"),
						handler: () => {
							panel.setState({
								userSelectedRatingsPromptStage: RatingsPromptStage.None
							});
						}
					});
				} else {
					// this shouldn't happen
					panel.setState({
						userSelectedRatingsPromptStage: RatingsPromptStage.None
					});
				}
				break;
			default:
			case RatingsPromptStage.End:
			case RatingsPromptStage.None:
				break;
		}

		return buttons;
	}

	render() {
		if (!this.props.clipperState.showRatingsPrompt || !this.props.clipperState.showRatingsPrompt.get()) {
			return <div />;
		}

		let message: string = this.getMessage(this.state.userSelectedRatingsPromptStage);

		if (!Utils.isNullOrUndefined(message)) {
			let buttons: DialogButton[] = this.getDialogButtons(this);
			let animationStrategy = this.getAnimationStategy(this);

			return (
				<DialogPanel
					message={message}
					buttons={buttons}
					buttonFontFamily={Localization.FontFamily.Regular}
					divId={Constants.Ids.ratingsPromptContainer}
					animationStrategy={animationStrategy} />
			);
		}

		return <div />;
	}
}

let component = RatingsPanelClass.componentize();
export {component as RatingsPanel};
