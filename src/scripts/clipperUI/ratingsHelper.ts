import {Localization} from "../localization/localization";

import {ClientType} from "../clientType";
import {Constants} from "../constants";
import {Utils} from "../utils";
import {Settings} from "../settings";

import {AnimationStrategy} from "./animations/animationStrategy";
import {SlideFromRightAnimationStrategy} from "./animations/slideFromRightAnimationStrategy";

import {SuccessPanelClass, SuccessPanelState} from "./panels/successPanel";

import {ClipperState} from "./clipperState";
import {DialogButton} from "./panels/dialogPanel";
import {Clipper} from "./frontEndGlobals";

export enum RatingsPromptStage {
	NONE,
	INIT,
	RATE,
	FEEDBACK,
	END
}

export class RatingsHelper {

	/**
	 * Get appropriate dialog panel message for the ratings prompt stage provided
	 */
	public static getMessage(stage: RatingsPromptStage): string {
		switch (stage) {
			case RatingsPromptStage.INIT:
				return Localization.getLocalizedString("WebClipper.Label.Ratings.Message.Init");
			case RatingsPromptStage.RATE:
				return Localization.getLocalizedString("WebClipper.Label.Ratings.Message.Rate");
			case RatingsPromptStage.FEEDBACK:
				return Localization.getLocalizedString("WebClipper.Label.Ratings.Message.Feedback");
			case RatingsPromptStage.END:
				return Localization.getLocalizedString("WebClipper.Label.Ratings.Message.End");
			default:
			case RatingsPromptStage.NONE:
				break;
		}
	}

	/**
	 * Get appropriate dialog panel buttons for the ratings prompt stage provided
	 */
	public static getDialogButtons(panel: SuccessPanelClass): DialogButton[] {
		let stage: RatingsPromptStage = panel.state.userSelectedRatingsPromptStage;
		let clientType: ClientType = panel.props.clipperState.clientInfo.clipperType;
		let clipperState: ClipperState = panel.props.clipperState;

		let buttons: DialogButton[] = [];

		switch (stage) {
			case RatingsPromptStage.INIT:
				buttons.push({
					id: Constants.Ids.ratingsButtonInitYes,
					label: Localization.getLocalizedString("WebClipper.Label.Ratings.Button.Init.Positive"),
					handler: () => {
						RatingsHelper.setDoNotPromptStatus();

						let rateUrl: string = RatingsHelper.getRateUrlIfExists(clientType);
						if (!Utils.isNullOrUndefined(rateUrl) && rateUrl.length > 0) {
							panel.setState({
								userSelectedRatingsPromptStage: RatingsPromptStage.RATE
							});
						} else {
							panel.setState({
								userSelectedRatingsPromptStage: RatingsPromptStage.END
							});
						}
					}
				}, {
						id: Constants.Ids.ratingsButtonInitNo,
						label: Localization.getLocalizedString("WebClipper.Label.Ratings.Button.Init.Negative"),
						handler: () => {
							// TODO should we wait for this Promise before continuing?
							RatingsHelper.setLastBadRatingDate().then((badRatingAlreadyOccurred) => {
								if (badRatingAlreadyOccurred) {
									// setting this to prevent additional ratings prompts after the second bad rating
									RatingsHelper.setDoNotPromptStatus();
								}
							}, () => {
								// TODO reject case
							});

							let feedbackUrl: string = RatingsHelper.getFeedbackUrlIfExists(clipperState);
							if (!Utils.isNullOrUndefined(feedbackUrl) && feedbackUrl.length > 0) {
								panel.setState({
									userSelectedRatingsPromptStage: RatingsPromptStage.FEEDBACK
								});
							} else {
								panel.setState({
									userSelectedRatingsPromptStage: RatingsPromptStage.END
								});
							}
						}
					});
				break;
			case RatingsPromptStage.RATE:
				buttons.push({
					id: Constants.Ids.ratingsButtonRateYes,
					label: Localization.getLocalizedString("WebClipper.Label.Ratings.Button.Rate"),
					handler: () => {
						let rateUrl: string = RatingsHelper.getRateUrlIfExists(clientType);
						if (!Utils.isNullOrUndefined(rateUrl) && rateUrl.length > 0) {
							window.open(rateUrl, "_blank");
						}

						panel.setState({
							userSelectedRatingsPromptStage: RatingsPromptStage.END
						});
					}
				}, {
						id: Constants.Ids.ratingsButtonRateNo,
						label: Localization.getLocalizedString("WebClipper.Label.Ratings.Button.NoThanks"),
						handler: () => {
							// TODO we could set a value that lets us know they got here
							// so that we could put the Rate Us link in their footer

							panel.setState({
								userSelectedRatingsPromptStage: RatingsPromptStage.NONE
							});
						}
					});
				break;
			case RatingsPromptStage.FEEDBACK:
				buttons.push({
					id: Constants.Ids.ratingsButtonFeedbackYes,
					label: Localization.getLocalizedString("WebClipper.Label.Ratings.Button.Feedback"),
					handler: () => {
						let feedbackUrl: string = RatingsHelper.getFeedbackUrlIfExists(clipperState);
						if (!Utils.isNullOrUndefined(feedbackUrl) && feedbackUrl.length > 0) {
							window.open(feedbackUrl, "_blank");
						}

						panel.setState({
							userSelectedRatingsPromptStage: RatingsPromptStage.END
						});
					}
				}, {
						id: Constants.Ids.ratingsButtonFeedbackNo,
						label: Localization.getLocalizedString("WebClipper.Label.Ratings.Button.NoThanks"),
						handler: () => {
							// TODO should we set doNotPromptStatus immediately here when they decide not to provide feedback?

							panel.setState({
								userSelectedRatingsPromptStage: RatingsPromptStage.NONE
							});
						}
					});
				break;
			default:
			case RatingsPromptStage.END:
			case RatingsPromptStage.NONE:
				break;
		}

		return buttons;
	}

	/**
	 * We will show the ratings prompt if ALL of the below applies:
	 *   * Ratings prompt is enabled for the ClientType/ClipperType
	 *   * If StorageKeys.doNotPromptRatings is not "true"
	 *   * If RatingsHelper.badRatingDelayIsOver(...) returns true when provided StorageKeys.lastBadRatingDate
	 *   * If RatingsHelper.clipSuccessDelayIsOver(...) returns true when provided StorageKeys.numClipSuccess
	 */
	public static shouldShowRatingsPrompt(clipperState: ClipperState): Promise<boolean> {
		if (!Utils.isNullOrUndefined(clipperState.shouldShowRatingsPrompt)) {
			// return cached value in clipper state if it exists
			// TODO ensure this resets with every distinct session
			return Promise.resolve(clipperState.shouldShowRatingsPrompt);
		}

		let ratingsPromptEnabled: boolean = RatingsHelper.ratingsPromptEnabledForClient(clipperState.clientInfo.clipperType);
		if (!ratingsPromptEnabled) {
			return Promise.resolve(false);
		}

		return new Promise<boolean>((resolve, reject) => {
			Clipper.Storage.getValue(Constants.StorageKeys.doNotPromptRatings, (doNotPromptRatingsStr) => {
				Clipper.Storage.getValue(Constants.StorageKeys.lastBadRatingDate, (lastBadRatingDateAsStr) => {
					Clipper.Storage.getValue(Constants.StorageKeys.numClipSuccess, (numClipsAsStr) => {
						if (!Utils.isNullOrUndefined(doNotPromptRatingsStr) && doNotPromptRatingsStr.toLowerCase() === "true") {
							resolve(false);
						}

						let lastBadRatingDate: number = parseInt(lastBadRatingDateAsStr, 10);
						if (RatingsHelper.badRatingDelayIsOver(lastBadRatingDate, Date.now())) {
							let numClips: number = parseInt(numClipsAsStr, 10);
							if (RatingsHelper.clipSuccessDelayIsOver(numClips)) {
								resolve(true);
							}
						}

						resolve(false);
					});
				});
			});
		});

		// TODO reject case?
	}

	public static getAnimationStategy(panel: SuccessPanelClass): AnimationStrategy {
		return new SlideFromRightAnimationStrategy({
			extShouldAnimateIn: () => {	return panel.state.userSelectedRatingsPromptStage !== panel.state.currentRatingsPromptStage; },
			extShouldAnimateOut: () => { return false; },
			onAfterAnimateIn: () => { panel.setState({ currentRatingsPromptStage: panel.state.userSelectedRatingsPromptStage }); }
		});
	}

	/**
	 * Adds 1 to the value in StorageKeys.numClipSuccess.
	 * If the value does not exist yet, we initialize it to 1.
	 */
	public static incrementClipSuccessCount(): Promise<void> {
		return new Promise<void>((resolve, reject) => {
			Clipper.Storage.getValue(Constants.StorageKeys.numClipSuccess, (numClipsAsStr: string) => {
				let numClips: number = parseInt(numClipsAsStr, 10);
				if (Utils.isNullOrUndefined(numClips) || isNaN(numClips)) {
					numClips = 0;
				}

				numClips++;

				Clipper.Storage.setValue(Constants.StorageKeys.numClipSuccess, numClips.toString());

				resolve();

				// TODO reject case?
			});
		});
	}

	// TODO public for testing
	/**
	 * Sets StorageKeys.lastBadRatingDate to the current time.
	 * Returns true if StorageKeys.lastBadRating already contained a value before this set
	 * (meaning the user had already rated us negatively)
	 */
	public static setLastBadRatingDate(): Promise<boolean> {
		let badDateKey: string = Constants.StorageKeys.lastBadRatingDate;
		let badRatingAlreadyOccurred = false;

		return new Promise<boolean>((resolve, reject) => {
			Clipper.Storage.getValue(badDateKey, (lastBadRatingDateAsStr) => {
				let lastBadRatingDate: number = parseInt(lastBadRatingDateAsStr, 10);
				if (!isNaN(lastBadRatingDate)) {
					badRatingAlreadyOccurred = true;
					//
					// TODO consider immediately setting this if we feel overwhelmed by feedback received through this channel
				}

				if (!badRatingAlreadyOccurred) {
					Clipper.Storage.setValue(badDateKey, Date.now().toString());
				}

				resolve(badRatingAlreadyOccurred);
			});

			// TODO reject?
		});
	}

	// TODO public for testing
	/**
	 * Returns true if the ratings prompt is enabled for ClientType/ClipperType provided
	 */
	public static ratingsPromptEnabledForClient(clientType: ClientType): boolean {
		let settingName: string = RatingsHelper.getRatingsPromptEnabledSettingNameForClient(clientType);
		let isEnabledAsStr: string = Settings.getSetting(settingName);
		return !Utils.isNullOrUndefined(isEnabledAsStr) && isEnabledAsStr.toLowerCase() === "true";
	}

	// TODO public for testing
	/**
	 * Get ratings/reviews URL for the provided ClientType/ClipperType, if it exists
	 */
	public static getRateUrlIfExists(clientType: ClientType): string {
		let settingName: string = RatingsHelper.getRateUrlSettingNameForClient(clientType);
		return Settings.getSetting(settingName);
	}

	// TODO public for testing
	/**
	 * Get the feedback URL with the special ratings prompt log category, if it exists
	 */
	public static getFeedbackUrlIfExists(clipperState: ClipperState): string {
		let ratingsPromptLogCategory: string = Settings.getSetting("LogCategory_RatingsPrompt");
		if (!Utils.isNullOrUndefined(ratingsPromptLogCategory) && ratingsPromptLogCategory.length > 0) {
			return Utils.generateFeedbackUrl(clipperState, Clipper.getUserSessionId(), ratingsPromptLogCategory);
		}
	}

	// TODO public for testing
	/**
	 * Returns true if ONE of the below applies:
	 *   1) A bad rating has never been given by the user, OR
	 *   2) Bad rating date provided occurred more than {Constants.Settings.timeBetweenBadRatings} ago
	 */
	public static badRatingDelayIsOver(badRatingsDate: number, currentDate: number): boolean {
		if (isNaN(badRatingsDate)) {
			// value has never been set, no bad rating given
			return true;
		}
		return (currentDate - badRatingsDate) >= Constants.Settings.timeBetweenBadRatings;
	}

	// TODO public for testing
	/**
	 * Returns true if ALL of the below applies:
	 *   * Number of successful clips >= {Constants.Settings.minClipSuccessForRatingsPrompt}
	 *   * TODO?
	 */
	public static clipSuccessDelayIsOver(numClips: number): boolean {
		// TODO # successful clips % m === 0, where m is the gap between successful clips that we'd like to display the prompt
		// TODO # of successful clips < nMax
			// MVP+: collapse panel into a Rate Us hyperlink in the footer that is always available

		if (isNaN(numClips)) {
			return false;
		}

		return numClips >= Constants.Settings.minClipSuccessForRatingsPrompt;
	}

	private static combineClientTypeAndSuffix(clientType: ClientType, suffix: string): string {
		return ClientType[clientType] + suffix;
	}

	private static getRateUrlSettingNameForClient(clientType: ClientType): string {
		return RatingsHelper.combineClientTypeAndSuffix(clientType, "_RatingUrl");
	}

	private static getRatingsPromptEnabledSettingNameForClient(clientType: ClientType): string {
		return RatingsHelper.combineClientTypeAndSuffix(clientType, "_RatingsEnabled");
	}

	private static setDoNotPromptStatus(): void {
		// TODO log this and how it got called
		Clipper.Storage.setValue(Constants.StorageKeys.doNotPromptRatings, "true");
	}
}
