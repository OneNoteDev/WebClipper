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
	export var lastSeenTooltipTimeBase = "lastSeenTooltipTime";//added await/then
	export var lastClippedTooltipTimeBase = "lastClippedTooltipTime";//added await
	export var locale = "locale";//added then
	export var locStrings = "locStrings";//added await 
	export var numSuccessfulClips = "numSuccessfulClips";//cache
	export var numSuccessfulClipsRatingsEnablement = "numSuccessfulClipsRatingsEnablement";//cache
	export var numTimesTooltipHasBeenSeenBase = "numTimesTooltipHasBeenSeen";//added await/then
	export var userInformation = "userInformation";//added await
}
