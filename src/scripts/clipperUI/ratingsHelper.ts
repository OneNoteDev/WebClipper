import {Localization} from "../localization/localization";

import {ClientType} from "../clientType";
import {Constants} from "../constants";
import {Utils} from "../utils";
import {Settings} from "../settings";

import {AnimationStrategy} from "./animations/animationStrategy";
import {SlideFromRightAnimationStrategy} from "./animations/slideFromRightAnimationStrategy";

import {SuccessPanelClass} from "./panels/successPanel";

import {ClipperState} from "./clipperState";
import {DialogButton} from "./panels/dialogPanel";
import {Clipper} from "./frontEndGlobals";

import * as Log from "../logging/log";

export enum RatingsPromptStage {
	NONE,
	INIT,
	RATE,
	FEEDBACK,
	END
}

interface RatingsLoggingInfo {
	shouldShowRatingsPrompt: boolean;
	badRatingTimingDelayIsOver?: boolean;
	badRatingVersionDelayIsOver?: boolean;
	clipSuccessDelayIsOver?: boolean;
	doNotPromptRatings?: boolean;
	lastBadRatingDate?: string;
	lastBadRatingVersion?: string;
	lastSeenVersion?: string;
	numSuccessfulClips?: number;
	ratingsPromptEnabledForClient?: boolean;
	usedCachedValue?: boolean;
}

export class RatingsHelper {
	public static rateUrlSettingNameSuffix = "_RatingUrl";
	public static ratingsPromptEnabledSettingNameSuffix = "_RatingsEnabled";

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
	 * Get appropriate dialog panel buttons for the panel (with its internal states) provided
	 */
	public static getDialogButtons(panel: SuccessPanelClass): DialogButton[] {
		let stage: RatingsPromptStage = panel.state.userSelectedRatingsPromptStage;
		let clipperState: ClipperState = panel.props.clipperState;
		let clientType: ClientType = clipperState.clientInfo.clipperType;

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
							Clipper.Storage.getValue(Constants.StorageKeys.lastSeenVersion, (lastSeenVersion) => {
								RatingsHelper.setLastBadRating(Date.now().toString(), lastSeenVersion).then((badRatingAlreadyOccurred) => {
									if (badRatingAlreadyOccurred) {
										// setting this to prevent additional ratings prompts after the second bad rating
										RatingsHelper.setDoNotPromptStatus();
									}
								}, () => {
									// values to set were invalid: err on the side of caution, always set do not prompt status
									RatingsHelper.setDoNotPromptStatus();
								}).then(() => {
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
								});
							});
						}
					});
				break;
			case RatingsPromptStage.RATE:
				let rateUrl: string = RatingsHelper.getRateUrlIfExists(clientType);
				if (!Utils.isNullOrUndefined(rateUrl) && rateUrl.length > 0) {
					buttons.push({
						id: Constants.Ids.ratingsButtonRateYes,
						label: Localization.getLocalizedString("WebClipper.Label.Ratings.Button.Rate"),
						handler: () => {
							window.open(rateUrl, "_blank");

							panel.setState({
								userSelectedRatingsPromptStage: RatingsPromptStage.END
							});
						}
					}, {
						id: Constants.Ids.ratingsButtonRateNo,
						label: Localization.getLocalizedString("WebClipper.Label.Ratings.Button.NoThanks"),
						handler: () => {
							panel.setState({
								userSelectedRatingsPromptStage: RatingsPromptStage.NONE
							});
						}
					});
				} else {
					// this shouldn't happen
					panel.setState({
						userSelectedRatingsPromptStage: RatingsPromptStage.NONE
					});
				}
				break;
			case RatingsPromptStage.FEEDBACK:
				let feedbackUrl: string = RatingsHelper.getFeedbackUrlIfExists(clipperState);
				if (!Utils.isNullOrUndefined(feedbackUrl) && feedbackUrl.length > 0) {
					buttons.push({
						id: Constants.Ids.ratingsButtonFeedbackYes,
						label: Localization.getLocalizedString("WebClipper.Label.Ratings.Button.Feedback"),
						handler: () => {
							window.open(feedbackUrl, "_blank");

							panel.setState({
								userSelectedRatingsPromptStage: RatingsPromptStage.END
							});
						}
					}, {
						id: Constants.Ids.ratingsButtonFeedbackNo,
						label: Localization.getLocalizedString("WebClipper.Label.Ratings.Button.NoThanks"),
						handler: () => {
							panel.setState({
								userSelectedRatingsPromptStage: RatingsPromptStage.NONE
							});
						}
					});
				} else {
					// this shouldn't happen
					panel.setState({
						userSelectedRatingsPromptStage: RatingsPromptStage.NONE
					});
				}
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
	 *   * If RatingsHelper.badRatingTimingDelayIsOver(...) returns true when provided StorageKeys.lastBadRatingDate
	 *   * If RatingsHelper.badRatingVersionDelayIsOver(...) returns true when provided StorageKeys.lastBadRatingVersion and StorageKeys.lastSeenVersion
	 *   * If RatingsHelper.clipSuccessDelayIsOver(...) returns true when provided StorageKeys.numClipSuccess
	 */
	public static shouldShowRatingsPrompt(clipperState: ClipperState): Promise<boolean> {
		return new Promise<boolean>((loggingResolve, loggingReject) => {
			let shouldShowRatingsPromptEvent = new Log.Event.PromiseEvent(Log.Event.Label.ShouldShowRatingsPrompt);
			let shouldShowRatingsPromptInfo: RatingsLoggingInfo = { shouldShowRatingsPrompt: undefined };

			RatingsHelper.shouldShowRatingsPromptInternal(clipperState, shouldShowRatingsPromptEvent, shouldShowRatingsPromptInfo).then((shouldShowRatingsPrompt: boolean) => {
				shouldShowRatingsPromptInfo.shouldShowRatingsPrompt = shouldShowRatingsPrompt;
				loggingResolve(shouldShowRatingsPrompt);
			}, () => {
				shouldShowRatingsPromptInfo.shouldShowRatingsPrompt = false;
				loggingReject(undefined);
			}).then(() => {
				shouldShowRatingsPromptEvent.setCustomProperty(Log.PropertyName.Custom.RatingsInfo, JSON.stringify(shouldShowRatingsPromptInfo));
				Clipper.logger.logEvent(shouldShowRatingsPromptEvent);
			});
		});
	}

	/**
	 * Get the animation strategy for the ratings subpanel of the success panel provided
	 */
	public static getAnimationStategy(panel: SuccessPanelClass): AnimationStrategy {
		return new SlideFromRightAnimationStrategy({
			extShouldAnimateIn: () => {	return panel.state.userSelectedRatingsPromptStage !== panel.state.currentRatingsPromptStage; },
			extShouldAnimateOut: () => { return false; },
			onAfterAnimateIn: () => { panel.setState({ currentRatingsPromptStage: panel.state.userSelectedRatingsPromptStage }); }
		});
	}

	/**
	 * Adds 1 to the value in StorageKeys.numClipSuccess.
	 * If the value does not exist yet or is invalid, we (re)initialize it to 1.
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

				return resolve();
			});
		});
	}

	/**
	 * Sets StorageKeys.lastBadRatingDate to the time provided (if valid),
	 * and StorageKeys.lastBadRatingVersion to the version provided (if in accepted format).
	 * Returns true if StorageKeys.lastBadRatingDate already contained a value before this set
	 * (meaning the user had already rated us negatively)
	 *
	 * Public for testing
	 */
	public static setLastBadRating(badRatingDateToSetAsStr: string, badRatingVersionToSet: string): Promise<boolean> {
		let badDateKey: string = Constants.StorageKeys.lastBadRatingDate;
		let badRatingAlreadyOccurred = false;

		let badRatingDateToSet: number = parseInt(badRatingDateToSetAsStr, 10);
		if (!RatingsHelper.isValidDate(badRatingDateToSet)) {
			return Promise.reject(undefined);
		}

		if (!RatingsHelper.versionHasCorrectFormat(badRatingVersionToSet)) {
			return Promise.reject(undefined);
		}

		return new Promise<boolean>((resolve, reject) => {
			Clipper.Storage.getValue(badDateKey, (lastBadRatingDateAsStr) => {
				let lastBadRatingDate: number = parseInt(lastBadRatingDateAsStr, 10);
				if (!isNaN(lastBadRatingDate) && RatingsHelper.isValidDate(lastBadRatingDate)) {
					badRatingAlreadyOccurred = true;
				}

				Clipper.Storage.setValue(badDateKey, badRatingDateToSetAsStr);
				Clipper.Storage.setValue(Constants.StorageKeys.lastBadRatingVersion, badRatingVersionToSet);

				return resolve(badRatingAlreadyOccurred);
			});
		});
	}

	/**
	 * Returns true if the ratings prompt is enabled for ClientType/ClipperType provided
	 *
	 * Public for testing
	 */
	public static ratingsPromptEnabledForClient(clientType: ClientType): boolean {
		let settingName: string = RatingsHelper.getRatingsPromptEnabledSettingNameForClient(clientType);
		let isEnabledAsStr: string = Settings.getSetting(settingName);
		return !Utils.isNullOrUndefined(isEnabledAsStr) && isEnabledAsStr.toLowerCase() === "true";
	}

	/**
	 * Get ratings/reviews URL for the provided ClientType/ClipperType, if it exists
	 *
	 * Public for testing
	 */
	public static getRateUrlIfExists(clientType: ClientType): string {
		let settingName: string = RatingsHelper.getRateUrlSettingNameForClient(clientType);
		return Settings.getSetting(settingName);
	}

	/**
	 * Get the feedback URL with the special ratings prompt log category, if it exists
	 *
	 * Public for testing
	 */
	public static getFeedbackUrlIfExists(clipperState: ClipperState): string {
		let ratingsPromptLogCategory: string = Settings.getSetting("LogCategory_RatingsPrompt");
		if (!Utils.isNullOrUndefined(ratingsPromptLogCategory) && ratingsPromptLogCategory.length > 0) {
			return Utils.generateFeedbackUrl(clipperState, Clipper.getUserSessionId(), ratingsPromptLogCategory);
		}
	}

	/**
	 * Returns true if ONE of the below applies:
	 *   1) A bad rating has never been given by the user, OR
	 *   2) Bad rating date provided is valid and occurred more than {Constants.Settings.minTimeBetweenBadRatings} ago
	 *      from the valid comparison date (e.g., the current date) provided
	 *
	 * Public for testing
	 */
	public static badRatingTimingDelayIsOver(badRatingDate: number, comparisonDate: number): boolean {
		if (isNaN(badRatingDate)) {
			// value has never been set, no bad rating given
			return true;
		}

		if (!RatingsHelper.isValidDate(badRatingDate) || !RatingsHelper.isValidDate(comparisonDate)) {
			return false;
		}

		return (comparisonDate - badRatingDate) >= Constants.Settings.minTimeBetweenBadRatings;
	}

	/**
	 * Returns true if ONE of the below applies:
	 *   1) A bad rating has never been given by the user, OR
	 *   2) There has been a non-patch version update since the bad rating, i.e.,
	 *      a) The major version last seen by the user is greater than the major version at the time of the last bad rating, OR
	 *      b) The major version remained the same, while the minor version last seen by the user is greater than
	 *          the minor version at the time of the last bad rating
	 *
	 * Public for testing
	 */
	public static badRatingVersionDelayIsOver(badRatingVersion: string, lastSeenVersion: string): boolean {
		if (Utils.isNullOrUndefined(badRatingVersion)) {
			// value has never been set, no bad rating given
			return true;
		}

		if (!RatingsHelper.versionHasCorrectFormat(lastSeenVersion) || !RatingsHelper.versionHasCorrectFormat(badRatingVersion)) {
			return false;
		}

		let lastSeenMajor: number = RatingsHelper.getMajorVersion(lastSeenVersion);
		let badRatingMajor: number = RatingsHelper.getMajorVersion(badRatingVersion);

		if (lastSeenMajor > badRatingMajor) {
			return true;
		}

		let lastSeenMinor: number = RatingsHelper.getMinorVersion(lastSeenVersion);
		let badRatingMinor: number = RatingsHelper.getMinorVersion(badRatingVersion);

		if (lastSeenMajor === badRatingMajor && lastSeenMinor > badRatingMinor) {
			return true;
		}

		return false;
	}

	/**
	 * Returns true if ALL of the below applies:
	 *   * Number of successful clips >= {Constants.Settings.minClipSuccessForRatingsPrompt}
	 *   * Number of successful clips <= {Constants.Settings.maxClipSuccessForRatingsPrompt}
	 *   * TODO Number of successful clips is on the "gap between prompts" boundary
	 *
	 * Public for testing
	 */
	public static clipSuccessDelayIsOver(numClips: number): boolean {
		// TODO Waiting for consensus on how should we handle users who never interact with the ratings prompt
			// (keep showing the prompt forever, stop after max # of successful clips, slowly increase "gap between prompts")

		// TODO MVP+? when # of successful clips > nMax, collapse panel into a Rate Us hyperlink in the footer that is always available

		if (isNaN(numClips)) {
			return false;
		}

		return numClips >= Constants.Settings.minClipSuccessForRatingsPrompt &&
			numClips <= Constants.Settings.maxClipSuccessForRatingsPrompt; /*&&
			numClips % Constants.Settings.gapBetweenClipSuccessForRatingsPrompt === 0;*/
	}

	/**
	 * Implementation of the logic described in the shouldShowRatingsPrompt(...) description
	 */
	private static shouldShowRatingsPromptInternal(clipperState: ClipperState, event: Log.Event.PromiseEvent, logEventInfo: RatingsLoggingInfo): Promise<boolean> {
		return new Promise<boolean>((resolve, reject) => {
			if (Utils.isNullOrUndefined(clipperState)) {
				event.setStatus(Log.Status.Failed);
				event.setFailureInfo({ error: "Clipper state is null or undefined" });
				return reject(undefined);
			}

			if (!Utils.isNullOrUndefined(clipperState.shouldShowRatingsPrompt)) {
				// return cached value in clipper state since it already exists
				logEventInfo.usedCachedValue = true;
				return resolve(clipperState.shouldShowRatingsPrompt);
			}

			let ratingsPromptEnabled: boolean = RatingsHelper.ratingsPromptEnabledForClient(clipperState.clientInfo.clipperType);
			logEventInfo.ratingsPromptEnabledForClient = ratingsPromptEnabled;
			if (!ratingsPromptEnabled) {
				return resolve(false);
			}

			Clipper.Storage.getValue(Constants.StorageKeys.doNotPromptRatings, (doNotPromptRatingsStr) => {
				Clipper.Storage.getValue(Constants.StorageKeys.lastBadRatingDate, (lastBadRatingDateAsStr) => {
					Clipper.Storage.getValue(Constants.StorageKeys.lastBadRatingVersion, (lastBadRatingVersion) => {
						Clipper.Storage.getValue(Constants.StorageKeys.lastSeenVersion, (lastSeenVersion) => {
							Clipper.Storage.getValue(Constants.StorageKeys.numClipSuccess, (numClipsAsStr) => {

								if (!Utils.isNullOrUndefined(doNotPromptRatingsStr) && doNotPromptRatingsStr.toLowerCase() === "true") {
									logEventInfo.doNotPromptRatings = true;
									return resolve(false);
								}

								let lastBadRatingDate: number = parseInt(lastBadRatingDateAsStr, 10);
								let numClips: number = parseInt(numClipsAsStr, 10);

								/* tslint:disable:no-null-keyword */
									// null is the value storage gives back; also, setting to undefined will keep this kvp from being logged at all
								logEventInfo.lastBadRatingDate = lastBadRatingDate ? new Date(lastBadRatingDate).toString() : null;
								/* tslint:enable:no-null-keyword */
								logEventInfo.lastBadRatingVersion = lastBadRatingVersion;
								logEventInfo.lastSeenVersion = lastSeenVersion;
								logEventInfo.numSuccessfulClips = numClips;

								let badRatingTimingDelayIsOver: boolean = RatingsHelper.badRatingTimingDelayIsOver(lastBadRatingDate, Date.now());
								let badRatingVersionDelayIsOver: boolean = RatingsHelper.badRatingVersionDelayIsOver(lastBadRatingVersion, lastSeenVersion);
								let clipSuccessDelayIsOver: boolean = RatingsHelper.clipSuccessDelayIsOver(numClips);

								logEventInfo.badRatingTimingDelayIsOver = badRatingTimingDelayIsOver;
								logEventInfo.badRatingVersionDelayIsOver = badRatingVersionDelayIsOver;
								logEventInfo.clipSuccessDelayIsOver = clipSuccessDelayIsOver;

								if (badRatingTimingDelayIsOver && badRatingVersionDelayIsOver && clipSuccessDelayIsOver) {
									return resolve(true);
								}

								return resolve(false);
							});
						});
					});
				});
			});
		});
	}

	private static combineClientTypeAndSuffix(clientType: ClientType, suffix: string): string {
		return ClientType[clientType] + suffix;
	}

	/**
	 * Based on the three-part version number convention "X.Y.Z", where:
	 *   * X = major version
	 *   * Y = minor version
	 *   * Z = patch
	 * Returns the major version, X
	 */
	private static getMajorVersion(versionNum: string): number {
		if (!Utils.isNullOrUndefined(versionNum)) {
			let versionSplit: string[] = versionNum.split(".");

			if (!Utils.isNullOrUndefined(versionSplit)) {
				return parseInt(versionSplit[0], 10);
			}
		}
	}

	/**
	 * Based on the three-part version number convention "X.Y.Z", where:
	 *   * X = major version
	 *   * Y = minor version
	 *   * Z = patch
	 * Returns the minor version, Y
	 */
	private static getMinorVersion(versionNum: string): number {
		if (!Utils.isNullOrUndefined(versionNum)) {
			let versionSplit: string[] = versionNum.split(".");

			if (!Utils.isNullOrUndefined(versionSplit)) {
				return parseInt(versionSplit[1], 10);
			}
		}
	}

	private static getRateUrlSettingNameForClient(clientType: ClientType): string {
		return RatingsHelper.combineClientTypeAndSuffix(clientType, RatingsHelper.rateUrlSettingNameSuffix);
	}

	private static getRatingsPromptEnabledSettingNameForClient(clientType: ClientType): string {
		return RatingsHelper.combineClientTypeAndSuffix(clientType, RatingsHelper.ratingsPromptEnabledSettingNameSuffix);
	}

	private static isValidDate(date: number): boolean {
		let minimumTimeValue: number = (Constants.Settings.maximumJSTimeValue * -1);
		return date >= minimumTimeValue && date <= Constants.Settings.maximumJSTimeValue;
	}

	private static setDoNotPromptStatus(): void {
		Clipper.Storage.setValue(Constants.StorageKeys.doNotPromptRatings, "true");

		Clipper.logger.logEvent(new Log.Event.BaseEvent(Log.Event.Label.SetDoNotPromptRatings));
	}

	private static versionHasCorrectFormat(version: string): boolean {
		if (!Utils.isNullOrUndefined(version)) {
			let versionSplit: string[] = version.split(".");

			if (Utils.isNullOrUndefined(versionSplit) ||
				versionSplit.length !== 3 ||
				isNaN(parseInt(versionSplit[0], 10)) ||
				isNaN(parseInt(versionSplit[1], 10)) ||
				isNaN(parseInt(versionSplit[2], 10))) {

				return false;
			}

			return true;
		}

		return false;
	}
}
