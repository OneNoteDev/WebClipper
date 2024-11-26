export module ClipperStorageKeys {
	export var clipperId = "clipperId"; //modified .then
	export var cachedNotebooks = "notebooks"; //cache
	export var currentSelectedSection = "curSection"; //cache
	export var displayLanguageOverride = "displayLocaleOverride"; //modified .then
	export var doNotPromptRatings = "doNotPromptRatings"; //cache
	export var flightingInfo = "flightingInfo"; //note used
	export var hasPatchPermissions = "hasPatchPermissions"; //cache
	export var lastBadRatingDate = "lastBadRatingDate"; //cache
	export var lastBadRatingVersion = "lastBadRatingVersion"; //cache
	export var lastClippedDate = "lastClippedDate"; //only set never get
	export var lastSeenVersion = "lastSeenVersion"; // added await
	export var lastInvokedDate = "lastInvokedDate"; //set only
	export var lastSeenTooltipTimeBase = "lastSeenTooltipTime";
	export var lastClippedTooltipTimeBase = "lastClippedTooltipTime";
	export var locale = "locale";
	export var locStrings = "locStrings";
	export var numSuccessfulClips = "numSuccessfulClips";
	export var numSuccessfulClipsRatingsEnablement = "numSuccessfulClipsRatingsEnablement";
	export var numTimesTooltipHasBeenSeenBase = "numTimesTooltipHasBeenSeen";
	export var userInformation = "userInformation";
}
