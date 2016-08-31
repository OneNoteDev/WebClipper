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
				Clipper.Storage.getValue(Constants.StorageKeys.numSuccessfulClips, (numSuccessfulClips) => {
					if (Utils.isNullOrUndefined(lastBadRatingDate) && Utils.isNullOrUndefined(numSuccessfulClips)) {
						resolve(true);
					}
				});
			});
		});

		// TODO cache boolean in clipper state after first fetch for the session

		// TODO reject case?
	}
}
