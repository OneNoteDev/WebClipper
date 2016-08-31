import {Constants} from "../constants";
import {Utils} from "../utils";

import {Clipper} from "./frontEndGlobals";

export enum RatingsPromptStage {
	NONE,
	INIT,
	RATE,
	FEEDBACK,
	END
}

export class RatingsHelper {
	public static shouldShowRatingsPrompt(): Promise<boolean> {
		// last bad rating time > k weeks OR undefined
		// # successful clips > n
		// (?) # successful clips % m === 0, where m is the gap between successful clips that we'd like to display the prompt
		// (?) # of successful clips < nMax
			// MVP+: collapse panel into a Rate Us hyperlink in the footer that is always available

		return new Promise<boolean>((resolve, reject) => {
			Clipper.Storage.getValue(Constants.StorageKeys.lastBadRatingDate, (lastBadRatingDate) => {
				Clipper.Storage.getValue(Constants.StorageKeys.numSuccessfulClips, (numClipsAsStr) => {
					if (Utils.isNullOrUndefined(lastBadRatingDate) && Utils.isNullOrUndefined(numClipsAsStr)) {
						resolve(false);
					}

					let numClips: number = parseInt(numClipsAsStr, 10);
					if (numClips >= 0) {
						resolve(true);
					}
				});
			});
		});

		// TODO cache boolean in clipper state after first fetch for the session

		// TODO reject case?
	}

	public static incrementSuccessfulClipCount(): Promise<void> {
		return new Promise<void>((resolve, reject) => {
			Clipper.Storage.getValue(Constants.StorageKeys.numSuccessfulClips, (numClipsAsStr: string) => {
				let numClips: number = parseInt(numClipsAsStr, 10); // TODO could return NaN
				if (Utils.isNullOrUndefined(numClips) || isNaN(numClips)) {
					numClips = 0;
				}

				numClips++;

				Clipper.Storage.setValue(Constants.StorageKeys.numSuccessfulClips, numClips.toString());

				resolve();

				// TODO reject case?
			});
		});
	}
}
