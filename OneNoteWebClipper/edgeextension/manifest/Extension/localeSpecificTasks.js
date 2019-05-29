(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";
var rtl_1 = require("../localization/rtl");
var clipperStorageKeys_1 = require("../storage/clipperStorageKeys");
/*
 * Responsible for executing locale-specific tasks before initializing and displaying
 * the Clipper.
 */
var LocaleSpecificTasks = (function () {
    function LocaleSpecificTasks() {
    }
    LocaleSpecificTasks.execute = function (locale) {
        this.appendDirectionalCssToHead(locale);
    };
    /*
     * Appends either the LTR or RTL css, whichever is suitable for the given locale
     */
    LocaleSpecificTasks.appendDirectionalCssToHead = function (locale) {
        var filenamePostfix = rtl_1.Rtl.isRtl(locale) ? "-rtl.css" : ".css";
        var cssFileNames = ["clipper", "sectionPicker"];
        for (var i = 0; i < cssFileNames.length; i++) {
            var clipperCssFilename = cssFileNames[i] + filenamePostfix;
            var clipperCssElem = document.createElement("link");
            clipperCssElem.setAttribute("rel", "stylesheet");
            clipperCssElem.setAttribute("type", "text/css");
            clipperCssElem.setAttribute("href", clipperCssFilename);
            document.getElementsByTagName("head")[0].appendChild(clipperCssElem);
        }
    };
    return LocaleSpecificTasks;
}());
exports.LocaleSpecificTasks = LocaleSpecificTasks;
var localeOverride;
try {
    localeOverride = window.localStorage.getItem(clipperStorageKeys_1.ClipperStorageKeys.displayLanguageOverride);
}
catch (e) { }
// navigator.userLanguage is only available in IE, and Typescript will not recognize this property
LocaleSpecificTasks.execute(localeOverride || navigator.language || navigator.userLanguage);

},{"../localization/rtl":2,"../storage/clipperStorageKeys":3}],2:[function(require,module,exports){
"use strict";
var Rtl;
(function (Rtl) {
    var rtlLanguageCodes = ["ar", "fa", "he", "sd", "ug", "ur"];
    /*
     * Given a ISO 639-1 code (with optional ISO 3166 postfix), returns true
     * if and only if our localized string servers support that language, and
     * that language is RTL.
     */
    function isRtl(locale) {
        if (!locale) {
            return false;
        }
        var iso639P1LocaleCode = getIso639P1LocaleCode(locale);
        for (var i = 0; i < rtlLanguageCodes.length; i++) {
            if (iso639P1LocaleCode === rtlLanguageCodes[i]) {
                return true;
            }
        }
        return false;
    }
    Rtl.isRtl = isRtl;
    function getIso639P1LocaleCode(locale) {
        if (!locale) {
            return "";
        }
        return locale.split("-")[0].split("_")[0].toLowerCase();
    }
    Rtl.getIso639P1LocaleCode = getIso639P1LocaleCode;
})(Rtl = exports.Rtl || (exports.Rtl = {}));

},{}],3:[function(require,module,exports){
"use strict";
var ClipperStorageKeys;
(function (ClipperStorageKeys) {
    ClipperStorageKeys.clipperId = "clipperId";
    ClipperStorageKeys.cachedNotebooks = "notebooks";
    ClipperStorageKeys.currentSelectedSection = "curSection";
    ClipperStorageKeys.displayLanguageOverride = "displayLocaleOverride";
    ClipperStorageKeys.doNotPromptRatings = "doNotPromptRatings";
    ClipperStorageKeys.flightingInfo = "flightingInfo";
    ClipperStorageKeys.hasPatchPermissions = "hasPatchPermissions";
    ClipperStorageKeys.lastBadRatingDate = "lastBadRatingDate";
    ClipperStorageKeys.lastBadRatingVersion = "lastBadRatingVersion";
    ClipperStorageKeys.lastClippedDate = "lastClippedDate";
    ClipperStorageKeys.lastSeenVersion = "lastSeenVersion";
    ClipperStorageKeys.lastInvokedDate = "lastInvokedDate";
    ClipperStorageKeys.lastSeenTooltipTimeBase = "lastSeenTooltipTime";
    ClipperStorageKeys.lastClippedTooltipTimeBase = "lastClippedTooltipTime";
    ClipperStorageKeys.locale = "locale";
    ClipperStorageKeys.locStrings = "locStrings";
    ClipperStorageKeys.numSuccessfulClips = "numSuccessfulClips";
    ClipperStorageKeys.numSuccessfulClipsRatingsEnablement = "numSuccessfulClipsRatingsEnablement";
    ClipperStorageKeys.numTimesTooltipHasBeenSeenBase = "numTimesTooltipHasBeenSeen";
    ClipperStorageKeys.userInformation = "userInformation";
})(ClipperStorageKeys = exports.ClipperStorageKeys || (exports.ClipperStorageKeys = {}));

},{}]},{},[1]);
