import {ClientType} from "../../clientType";
import {Constants} from "../../constants";
import {Utils} from "../../utils";

import {SmartValue} from "../../communicator/smartValue";

import {Localization} from "../../localization/localization";

import * as Log from "../../logging/log";

import {ClipperStorageKeys} from "../../storage/clipperStorageKeys";

import {ClipMode} from "../clipMode";
import {ClipperState, ClipperStateProp} from "../clipperState";
import {ComponentBase} from "../componentBase";
import {Clipper} from "../frontEndGlobals";
import {RatingsHelper, RatingsPromptStage} from "../ratingsHelper";
import {Status} from "../status";

import {AnimationState} from "../animations/animationState";
import {AnimationStrategy} from "../animations/animationStrategy";
import {SlideContentInFromTopAnimationStrategy} from "../animations/slideContentInFromTopAnimationStrategy";

import {SpriteAnimation} from "../components/spriteAnimation";

import {DialogButton, DialogPanel} from "./dialogPanel";

interface RatingsPanelState {
	currentRatingsPromptStage?: RatingsPromptStage;
	userSelectedRatingsPromptStage?: RatingsPromptStage;
}

interface RatingsPanelProp extends ClipperStateProp {
	ratingsAnimationState: SmartValue<AnimationState>;
	updateFrameHeight: (newContainerHeight: number) => void;
}

class RatingsPanelClass extends ComponentBase<RatingsPanelState, RatingsPanelProp> {
	getInitialState(): RatingsPanelState {
		return {
			currentRatingsPromptStage: RatingsPromptStage.Init
		};
	}

	/**
	 * Get the panel animation strategy for the ratings subpanel of the success panel provided
	 */
	private getPanelAnimationStrategy(panel: RatingsPanelClass): AnimationStrategy {
		return new SlideContentInFromTopAnimationStrategy({
			extShouldAnimateIn: () => {
				/*console.log("extShouldAnimateIn", RatingsPromptStage[panel.state.userSelectedRatingsPromptStage], RatingsPromptStage[panel.state.currentRatingsPromptStage], !panel.state.userSelectedRatingsPromptStage ||
					panel.state.userSelectedRatingsPromptStage !== panel.state.currentRatingsPromptStage);*/
				return (!panel.state.userSelectedRatingsPromptStage ||
					panel.state.userSelectedRatingsPromptStage !== panel.state.currentRatingsPromptStage);
			},
			extShouldAnimateOut: () => {
				/*console.log("extShouldAnimateOut", RatingsPromptStage[panel.state.userSelectedRatingsPromptStage], RatingsPromptStage[panel.state.currentRatingsPromptStage], !panel.state.userSelectedRatingsPromptStage &&
					panel.state.userSelectedRatingsPromptStage !== panel.state.currentRatingsPromptStage);*/
				return (panel.state.userSelectedRatingsPromptStage &&
					panel.state.userSelectedRatingsPromptStage !== panel.state.currentRatingsPromptStage);
			},
			onBeforeAnimateIn: () => { panel.setState({ currentRatingsPromptStage: panel.state.userSelectedRatingsPromptStage ? panel.state.userSelectedRatingsPromptStage : RatingsPromptStage.Init });	},
			onAfterAnimateOut: () => { panel.setState({ currentRatingsPromptStage: panel.state.currentRatingsPromptStage }); } // TODO I know this is weird
		}, this.props.ratingsAnimationState);
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
		let stage: RatingsPromptStage = panel.state.currentRatingsPromptStage;
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
						if (rateUrl) {
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
							if (RatingsHelper.badRatingAlreadyOccurred()) {
								// setting this to prevent additional ratings prompts after the second bad rating
								RatingsHelper.setDoNotPromptStatus();
							}

							let lastSeenVersion: string = Clipper.getCachedValue(ClipperStorageKeys.lastSeenVersion);
							Clipper.storeValue(ClipperStorageKeys.lastBadRatingDate, Date.now().toString());
							Clipper.storeValue(ClipperStorageKeys.lastBadRatingVersion, lastSeenVersion);

							let feedbackUrl: string = RatingsHelper.getFeedbackUrlIfExists(clipperState);
							if (feedbackUrl) {
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
				if (rateUrl) {
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
				if (feedbackUrl) {
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

		let message: string = this.getMessage(this.state.currentRatingsPromptStage);

		if (!Utils.isNullOrUndefined(message)) {
			let buttons: DialogButton[] = this.getDialogButtons(this);
			let panelAnimationStrategy = this.getPanelAnimationStrategy(this);

			return (
				<DialogPanel
					message={message}
					buttons={buttons}
					buttonFontFamily={Localization.FontFamily.Regular}
					containerId={Constants.Ids.ratingsPromptContainer}
					panelAnimationStrategy={panelAnimationStrategy} />
			);
		}

		return <div />;
	}
}

let component = RatingsPanelClass.componentize();
export {component as RatingsPanel};
