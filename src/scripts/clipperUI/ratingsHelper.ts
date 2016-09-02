import {ClientType} from "../clientType";
import {Constants} from "../constants";
import {Utils} from "../utils";
import {Settings} from "../settings";

import {ClipperState} from "./clipperState";
import {Clipper} from "./frontEndGlobals";

export enum RatingsPromptStage {
	NONE,
	INIT,
	RATE,
	FEEDBACK,
	END
}

export class RatingsHelper {
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
						if (Utils.isNullOrUndefined(lastBadRatingDateAsStr) && Utils.isNullOrUndefined(numClipsAsStr)) {
							resolve(false); // TODO when does this happen?
						}

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

	public static setDoNotPromptStatus(): void {
		// TODO log this and how it got called

		Clipper.Storage.setValue(Constants.StorageKeys.doNotPromptRatings, "true");
	}

	public static setLastBadRatingDate(): void {
		// we are only going to allow two sets of bad rating date by calling this method
		// any additional sets will result in a set of the do not prompt status
		// - meaning a user will never see the ratings prompt again

		// (?) # of bad ratings > p, where p is like 2

		let badDateKey: string = Constants.StorageKeys.lastBadRatingDate;

		Clipper.Storage.setValue(badDateKey, Date.now().toString());

		Clipper.Storage.getValue(badDateKey, (lastBadRatingDateAsStr) => {
			let lastBadRatingDate: number = parseInt(lastBadRatingDateAsStr, 10);
			if (!isNaN(lastBadRatingDate)) {
				RatingsHelper.setDoNotPromptStatus();
				// TODO consider immediately setting this if we feel overwhelmed by feedback received through this channel
			}
		});
	}

	// TODO public for testing
	public static ratingsPromptEnabledForClient(clientType: ClientType): boolean {
		let settingName: string = RatingsHelper.getRatingsPromptEnabledSettingNameForClient(clientType);
		let isEnabledAsStr: string = Settings.getSetting(settingName);
		return !Utils.isNullOrUndefined(isEnabledAsStr) && isEnabledAsStr.toLowerCase() === "true";
	}

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
