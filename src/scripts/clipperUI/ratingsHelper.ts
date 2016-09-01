import {Constants} from "../constants";
import {Utils} from "../utils";

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

		return new Promise<boolean>((resolve, reject) => {
			Clipper.Storage.getValue(Constants.StorageKeys.doNotPromptRatings, (doNotPromptRatingsStr) => {
				Clipper.Storage.getValue(Constants.StorageKeys.lastBadRatingDate, (lastBadRatingDateAsStr) => {
					Clipper.Storage.getValue(Constants.StorageKeys.numClipSuccess, (numClipsAsStr) => {
						if (Utils.isNullOrUndefined(lastBadRatingDateAsStr) && Utils.isNullOrUndefined(numClipsAsStr)) {
							resolve(false); // TODO when does this happen?
						}

						let doNotPrompt: boolean = Boolean(doNotPromptRatingsStr);
						if (doNotPrompt) {
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
			}
		});
	}

	public static badRatingDelayIsOver(badRatingsDate: number, currentDate: number): boolean {
		// last bad rating time > k weeks OR undefined

		if (isNaN(badRatingsDate)) {
			// value has never been set, no bad rating given
			return true;
		}
		return (currentDate - badRatingsDate) >= Constants.Settings.timeBetweenBadRatings;
	}

	public static clipSuccessDelayIsOver(numClips: number): boolean {
		// # successful clips > n
		// (?) # successful clips % m === 0, where m is the gap between successful clips that we'd like to display the prompt
		// (?) # of successful clips < nMax
			// MVP+: collapse panel into a Rate Us hyperlink in the footer that is always available

		return numClips >= Constants.Settings.minClipSuccessForRatingsPrompt;
	}
}