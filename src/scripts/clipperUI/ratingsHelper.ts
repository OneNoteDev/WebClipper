import {Localization} from "../localization/localization";

import {ClientType} from "../clientType";
import {Constants} from "../constants";
import {Utils} from "../utils";
import {Settings} from "../settings";

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

	public static getDialogButtons(stage: RatingsPromptStage, clipperState: ClipperState): DialogButton[] {
		let buttons: DialogButton[] = [];

		switch (stage) {
			case RatingsPromptStage.INIT:
				buttons.push({
					id: "",
					label: Localization.getLocalizedString("WebClipper.Label.Ratings.Button.Init.Positive"),
					handler: () => {
						RatingsHelper.setDoNotPromptStatus();

						let rateUrl: string = RatingsHelper.getRateUrlIfExists(clipperState.clientInfo.clipperType);
						if (!Utils.isNullOrUndefined(rateUrl)) {
							clipperState.setState({
								ratingsPromptStage: RatingsPromptStage.RATE
							});
						} else {
							clipperState.setState({
								ratingsPromptStage: RatingsPromptStage.END
							});
						}
					}
				}, {
						id: "",
						label: Localization.getLocalizedString("WebClipper.Label.Ratings.Button.Init.Negative"),
						handler: () => {
							RatingsHelper.setLastBadRatingDate();

							// TODO check if feedback link exists
							clipperState.setState({
								ratingsPromptStage: RatingsPromptStage.FEEDBACK
							});
						}
					});
				break;
			case RatingsPromptStage.RATE:
				buttons.push({
					id: "",
					label: Localization.getLocalizedString("WebClipper.Label.Ratings.Button.Rate"),
					handler: () => {
						let rateUrl: string = RatingsHelper.getRateUrlIfExists(clipperState.clientInfo.clipperType);
						if (!Utils.isNullOrUndefined(rateUrl)) {
							window.open(rateUrl, "_blank");
						}

						clipperState.setState({
							ratingsPromptStage: RatingsPromptStage.END
						});
					}
				}, {
						id: "",
						label: Localization.getLocalizedString("WebClipper.Label.Ratings.Button.NoThanks"),
						handler: () => {
							// TODO we could set a value that lets us know they got here
							// so that we could put the Rate Us link in their footer

							clipperState.setState({
								ratingsPromptStage: RatingsPromptStage.NONE
							});
						}
					});
				break;
			case RatingsPromptStage.FEEDBACK:
				buttons.push({
					id: "",
					label: Localization.getLocalizedString("WebClipper.Label.Ratings.Button.Feedback"),
					handler: () => {
						clipperState.setState({
							ratingsPromptStage: RatingsPromptStage.END
						});
					}
				}, {
						id: "",
						label: Localization.getLocalizedString("WebClipper.Label.Ratings.Button.NoThanks"),
						handler: () => {
							// TODO should we set doNotPromptStatus immediately here when they decide not to provide feedback?

							clipperState.setState({
								ratingsPromptStage: RatingsPromptStage.NONE
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

	public static shouldShowRatingsPrompt(clipperState: ClipperState): Promise<boolean> {
		if (!Utils.isNullOrUndefined(clipperState.shouldShowRatingsPrompt)) {
			// return cache in clipper state if it exists
			// TODO is this useful?
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
					});
				});
			});
		});

		// TODO reject case?
	}

	public static incrementClipSuccessCount(): Promise<void> {
		return new Promise<void>((resolve, reject) => {
			Clipper.Storage.getValue(Constants.StorageKeys.numClipSuccess, (numClipsAsStr: string) => {
				let numClips: number = parseInt(numClipsAsStr, 10); // TODO could return NaN
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
	public static setDoNotPromptStatus(): void {
		// TODO log this and how it got called
		Clipper.Storage.setValue(Constants.StorageKeys.doNotPromptRatings, "true");
	}

	// TODO public for testing
	public static setLastBadRatingDate(): void {
		// we are only going to allow two sets of bad rating date by calling this method
		// any additional sets will result in a set of the do not prompt status
		// - meaning a user will never see the ratings prompt again

		// (?) # of bad ratings > p, where p is like 2

		let badDateKey: string = Constants.StorageKeys.lastBadRatingDate;

		Clipper.Storage.getValue(badDateKey, (lastBadRatingDateAsStr) => {
			let lastBadRatingDate: number = parseInt(lastBadRatingDateAsStr, 10);
			if (!isNaN(lastBadRatingDate)) {
				RatingsHelper.setDoNotPromptStatus();
				// TODO consider immediately setting this if we feel overwhelmed by feedback received through this channel
			}

			Clipper.Storage.setValue(badDateKey, Date.now().toString());
		});
	}

	// TODO public for testing
	public static ratingsPromptEnabledForClient(clientType: ClientType): boolean {
		let settingName: string = RatingsHelper.getRatingsPromptEnabledSettingNameForClient(clientType);
		let isEnabledAsStr: string = Settings.getSetting(settingName);
		return !Utils.isNullOrUndefined(isEnabledAsStr) && isEnabledAsStr.toLowerCase() === "true";
	}

	// TODO public for testing
	public static getRateUrlIfExists(clientType: ClientType): string {
		let settingName: string = RatingsHelper.getRateUrlSettingNameForClient(clientType);
		return Settings.getSetting(settingName);
	}

	// TODO public for testing
	public static badRatingDelayIsOver(badRatingsDate: number, currentDate: number): boolean {
		// last bad rating time > k weeks OR undefined

		if (isNaN(badRatingsDate)) {
			// value has never been set, no bad rating given
			return true;
		}
		return (currentDate - badRatingsDate) >= Constants.Settings.timeBetweenBadRatings;
	}

	// TODO public for testing
	public static clipSuccessDelayIsOver(numClips: number): boolean {
		// # successful clips > n
		// (?) # successful clips % m === 0, where m is the gap between successful clips that we'd like to display the prompt
		// (?) # of successful clips < nMax
			// MVP+: collapse panel into a Rate Us hyperlink in the footer that is always available

		if (isNaN(numClips)) {
			// this should never happen
			return false;
		}

		return numClips >= Constants.Settings.minClipSuccessForRatingsPrompt;
	}

	// TODO public for testing
	public static getRateUrlSettingNameForClient(clientType: ClientType): string {
		return RatingsHelper.combineClientTypeAndSuffix(clientType, "_RatingUrl");
	}

	// TODO public for testing
	public static getRatingsPromptEnabledSettingNameForClient(clientType: ClientType): string {
		return RatingsHelper.combineClientTypeAndSuffix(clientType, "_RatingsEnabled");
	}

	private static combineClientTypeAndSuffix(clientType: ClientType, suffix: string): string {
		return ClientType[clientType] + suffix;
	}
}
