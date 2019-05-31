import {ClientType} from "../clientType";
import {ClipperUrls} from "../clipperUrls";
import {Constants} from "../constants";
import {ObjectUtils} from "../objectUtils";
import {Settings} from "../settings";

import * as Log from "../logging/log";

import {ClipperStorageKeys} from "../storage/clipperStorageKeys";

import {Version} from "../versioning/version";

import {ClipperState} from "./clipperState";
import {Clipper} from "./frontEndGlobals";

// ordered by stage progression
export enum RatingsPromptStage {
	Init = 0,
	Rate = 1,
	Feedback = 2,
	End = 3,
	None = 4
}

interface RatingsLoggingInfo {
	badRatingTimingDelayIsOver?: boolean;
	badRatingVersionDelayIsOver?: boolean;
	clipSuccessDelayIsOver?: boolean;
	doNotPromptRatings?: boolean;
	lastBadRatingDate?: string;
	lastBadRatingVersion?: string;
	lastSeenVersion?: string;
	numSuccessfulClips?: number;
	numSuccessfulClipsAnchor?: number;
	ratingsPromptEnabledForClient?: boolean;
	usedCachedValue?: boolean;
}

export class RatingsHelper {
	public static rateUrlSettingNameSuffix = "_RatingUrl";
	public static ratingsPromptEnabledSettingNameSuffix = "_RatingsEnabled";

	/**
	 * Returns true if ClipperStorageKeys.lastBadRatingDate already contained a cached value
	 * (meaning the user had already rated us negatively)
	 */
	public static badRatingAlreadyOccurred(): boolean {
		let lastBadRatingDateAsStr: string = Clipper.getCachedValue(ClipperStorageKeys.lastBadRatingDate);
		let lastBadRatingDate: number = parseInt(lastBadRatingDateAsStr, 10);
		if (!isNaN(lastBadRatingDate) && RatingsHelper.isValidDate(lastBadRatingDate)) {
			return true;
		}
		return false;
	}

	/**
	 * Get the feedback URL with the special ratings prompt log category, if it exists
	 */
	public static getFeedbackUrlIfExists(clipperState: ClipperState): string {
		let ratingsPromptLogCategory: string = Settings.getSetting("LogCategory_RatingsPrompt");
		if (!ObjectUtils.isNullOrUndefined(ratingsPromptLogCategory) && ratingsPromptLogCategory.length > 0) {
			return ClipperUrls.generateFeedbackUrl(clipperState, Clipper.getUserSessionId(), ratingsPromptLogCategory);
		}
	}

	/**
	 * Get ratings/reviews URL for the provided ClientType/ClipperType, if it exists
	 */
	public static getRateUrlIfExists(clientType: ClientType): string {
		let settingName: string = RatingsHelper.getRateUrlSettingNameForClient(clientType);
		return Settings.getSetting(settingName);
	}

	/**
	 * Pre-cache values needed to determine whether to show the ratings prompt
	 */
	public static preCacheNeededValues(): void {
		let ratingsPromptStorageKeys = [
			ClipperStorageKeys.doNotPromptRatings,
			ClipperStorageKeys.lastBadRatingDate,
			ClipperStorageKeys.lastBadRatingVersion,
			ClipperStorageKeys.lastSeenVersion,
			ClipperStorageKeys.numSuccessfulClips,
			ClipperStorageKeys.numSuccessfulClipsRatingsEnablement
		];
		Clipper.preCacheStoredValues(ratingsPromptStorageKeys);
	}

	/**
	 * Set ClipperStorageKeys.doNotPromptRatings value to "true"
	 */
	public static setDoNotPromptStatus(): void {
		Clipper.storeValue(ClipperStorageKeys.doNotPromptRatings, "true");

		Clipper.logger.logEvent(new Log.Event.BaseEvent(Log.Event.Label.SetDoNotPromptRatings));
	}

	/**
	 * We will show the ratings prompt if ALL of the below applies:
	 *   * Ratings prompt is enabled for the ClientType/ClipperType
	 *   * If ClipperStorageKeys.doNotPromptRatings is not "true"
	 *   * If RatingsHelper.badRatingTimingDelayIsOver(...) returns true when provided ClipperStorageKeys.lastBadRatingDate
	 *   * If RatingsHelper.badRatingVersionDelayIsOver(...) returns true when provided ClipperStorageKeys.lastBadRatingVersion and ClipperStorageKeys.lastSeenVersion
	 *   * If RatingsHelper.clipSuccessDelayIsOver(...) returns true when provided ClipperStorageKeys.numClipSuccess
	 */
	public static shouldShowRatingsPrompt(clipperState: ClipperState): boolean {
		let shouldShowRatingsPromptEvent = new Log.Event.PromiseEvent(Log.Event.Label.ShouldShowRatingsPrompt);
		let shouldShowRatingsPromptInfo: RatingsLoggingInfo = {};

		let shouldShowRatingsPrompt: boolean = RatingsHelper.shouldShowRatingsPromptInternal(clipperState, shouldShowRatingsPromptEvent, shouldShowRatingsPromptInfo);

		shouldShowRatingsPromptEvent.setCustomProperty(Log.PropertyName.Custom.ShouldShowRatingsPrompt, shouldShowRatingsPrompt);
		shouldShowRatingsPromptEvent.setCustomProperty(Log.PropertyName.Custom.RatingsInfo, JSON.stringify(shouldShowRatingsPromptInfo));
		Clipper.logger.logEvent(shouldShowRatingsPromptEvent);

		return shouldShowRatingsPrompt;
	}

	/**
	 * Returns true if the ratings prompt is enabled for ClientType/ClipperType provided
	 *
	 * Public for testing
	 */
	public static ratingsPromptEnabledForClient(clientType: ClientType): boolean {
		let settingName: string = RatingsHelper.getRatingsPromptEnabledSettingNameForClient(clientType);
		let isEnabledAsStr: string = Settings.getSetting(settingName);
		return !ObjectUtils.isNullOrUndefined(isEnabledAsStr) && isEnabledAsStr.toLowerCase() === "true";
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
	public static badRatingVersionDelayIsOver(badRatingVersionAsStr: string, lastSeenVersionAsStr: string): boolean {
		if (ObjectUtils.isNullOrUndefined(badRatingVersionAsStr)) {
			// value has never been set, no bad rating given
			return true;
		}

		let badRatingVersion: Version;
		let lastSeenVersion: Version;
		try {
			badRatingVersion = new Version(badRatingVersionAsStr);
			lastSeenVersion = new Version(lastSeenVersionAsStr);
		} catch (e) {
			return false;
		}

		return lastSeenVersion.isGreaterThan(badRatingVersion, true /* ignorePatchUpdate */);
	}

	/**
	 * Returns true if ALL of the below applies:
	 *   * (Number of successful clips - Anchor clip value) >= {Constants.Settings.minClipSuccessForRatingsPrompt}
	 *   * (Number of successful clips - Anchor clip value) <= {Constants.Settings.maxClipSuccessForRatingsPrompt}
	 *
	 * Public for testing
	 */
	public static clipSuccessDelayIsOver(numClips: number, anchorClipValue?: number): boolean {
		if (isNaN(numClips)) {
			return false;
		}

		if (isNaN(anchorClipValue)) {
			anchorClipValue = 0;
		}

		let numClipsAdjusted = numClips - anchorClipValue;

		return numClipsAdjusted >= Constants.Settings.minClipSuccessForRatingsPrompt &&
			numClipsAdjusted <= Constants.Settings.maxClipSuccessForRatingsPrompt;
	}

	/**
	 * Sets ClipperStorageKeys.numSuccessfulClipsRatingsEnablement to be
	 * the current value of (ClipperStorageKeys.numSuccessfulClips - 1), if needed.
	 *
	 * The set is "needed" if ALL of the below applies:
	 *   * The user has not already interacted with the prompt (ClipperStorageKeys.doNotPromptRatings is not set)
	 *   * ClipperStorageKeys.numSuccessfulClipsRatingsEnablement has not already been set
	 *
	 * Public for testing
	 *
	 * NOTE OF EXPLANATION: We first check if the user has already interacted with the prompt for backwards compatibility
	 * with the original implementation of the ratings prompt that did not include this method. It ensures that we will not
	 * re-raise the prompt for users who have already interacted with it (although it is possible users who didn't interact
	 * with the original prompt see it up to twice as many times as originally planned).
	 */
	public static setNumSuccessfulClipsRatingsEnablement(): void {
		let doNotPromptRatingsAsStr: string = Clipper.getCachedValue(ClipperStorageKeys.doNotPromptRatings);
		if (RatingsHelper.doNotPromptRatingsIsSet(doNotPromptRatingsAsStr)) {
			return;
		}

		let numSuccessfulClipsRatingsEnablementAsStr: string = Clipper.getCachedValue(ClipperStorageKeys.numSuccessfulClipsRatingsEnablement);
		if (parseInt(numSuccessfulClipsRatingsEnablementAsStr, 10) >= 0) {
			return;
		}

		let numSuccessfulClips: number = parseInt(Clipper.getCachedValue(ClipperStorageKeys.numSuccessfulClips), 10);
		// subtracting 1 below to account for the fact that this set is occuring after one already successful clip
		Clipper.storeValue(ClipperStorageKeys.numSuccessfulClipsRatingsEnablement, (numSuccessfulClips - 1).toString());
	}

	/**
	 * Implementation of the logic described in the setShowRatingsPromptState(...) description
	 */
	private static shouldShowRatingsPromptInternal(clipperState: ClipperState, event: Log.Event.PromiseEvent, logEventInfo: RatingsLoggingInfo): boolean {
		if (ObjectUtils.isNullOrUndefined(clipperState)) {
			event.setStatus(Log.Status.Failed);
			event.setFailureInfo({ error: "Clipper state is null or undefined" });
			return false;
		}

		if (!ObjectUtils.isNullOrUndefined(clipperState.showRatingsPrompt)) {
			// Return cached value in clipper state since it already exists
			logEventInfo.usedCachedValue = true;
			return clipperState.showRatingsPrompt;
		}

		let ratingsPromptEnabled: boolean = RatingsHelper.ratingsPromptEnabledForClient(clipperState.clientInfo.clipperType);
		logEventInfo.ratingsPromptEnabledForClient = ratingsPromptEnabled;
		if (!ratingsPromptEnabled) {
			return false;
		}

		RatingsHelper.setNumSuccessfulClipsRatingsEnablement();

		let doNotPromptRatingsStr: string = Clipper.getCachedValue(ClipperStorageKeys.doNotPromptRatings);
		let lastBadRatingDateAsStr: string = Clipper.getCachedValue(ClipperStorageKeys.lastBadRatingDate);
		let lastBadRatingVersion: string = Clipper.getCachedValue(ClipperStorageKeys.lastBadRatingVersion);
		let lastSeenVersion: string = Clipper.getCachedValue(ClipperStorageKeys.lastSeenVersion);
		let numClipsAsStr: string = Clipper.getCachedValue(ClipperStorageKeys.numSuccessfulClips);
		let numClipsAnchorAsStr: string = Clipper.getCachedValue(ClipperStorageKeys.numSuccessfulClipsRatingsEnablement);

		if (RatingsHelper.doNotPromptRatingsIsSet(doNotPromptRatingsStr)) {
			logEventInfo.doNotPromptRatings = true;
			return false;
		}

		let lastBadRatingDate: number = parseInt(lastBadRatingDateAsStr, 10);
		let numClips: number = parseInt(numClipsAsStr, 10);
		let numClipsAnchor: number = parseInt(numClipsAnchorAsStr, 10);

		/* tslint:disable:no-null-keyword */
		// null is the value storage gives back; also, setting to undefined will keep this kvp from being logged at all
		logEventInfo.lastBadRatingDate = lastBadRatingDate ? new Date(lastBadRatingDate).toString() : null;
		/* tslint:enable:no-null-keyword */
		logEventInfo.lastBadRatingVersion = lastBadRatingVersion;
		logEventInfo.lastSeenVersion = lastSeenVersion;
		logEventInfo.numSuccessfulClips = numClips;
		logEventInfo.numSuccessfulClipsAnchor = numClipsAnchor;

		let badRatingTimingDelayIsOver: boolean = RatingsHelper.badRatingTimingDelayIsOver(lastBadRatingDate, Date.now());
		let badRatingVersionDelayIsOver: boolean = RatingsHelper.badRatingVersionDelayIsOver(lastBadRatingVersion, lastSeenVersion);
		let clipSuccessDelayIsOver: boolean = RatingsHelper.clipSuccessDelayIsOver(numClips, numClipsAnchor);

		logEventInfo.badRatingTimingDelayIsOver = badRatingTimingDelayIsOver;
		logEventInfo.badRatingVersionDelayIsOver = badRatingVersionDelayIsOver;
		logEventInfo.clipSuccessDelayIsOver = clipSuccessDelayIsOver;

		if (badRatingTimingDelayIsOver && badRatingVersionDelayIsOver && clipSuccessDelayIsOver) {
			return true;
		}

		return false;
	}

	private static combineClientTypeAndSuffix(clientType: ClientType, suffix: string): string {
		return ClientType[clientType] + suffix;
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

	private static doNotPromptRatingsIsSet(doNotPromptRatingsStr: string): boolean {
		return !ObjectUtils.isNullOrUndefined(doNotPromptRatingsStr) && doNotPromptRatingsStr.toLowerCase() === "true";
	}
}
