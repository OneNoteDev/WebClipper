import {ClientType} from "./clientType";
import {Constants} from "./constants";
import {Settings} from "./settings";

import {ClipperState} from "./clipperUI/clipperState";
import {TooltipType} from "./clipperUI/tooltipType";

export module Utils {
	/**
	 * This function opens a new window (of hard-coded size) of the specified URL
	 */
	export function openPopupWindow(url: string): Window {
		let popupWidth = 1000;
		let popupHeight = 700;
		let leftPosition: number = (screen.width) ? (screen.width - popupWidth) / 2 : 0;
		let topPosition: number = (screen.height) ? (screen.height - popupHeight) / 2 : 0;

		let settings: string = "height=" + popupHeight + ",width=" + popupWidth + ",top=" + topPosition + ",left=" + leftPosition + ",scrollbars=yes,resizable=yes,location=no,menubar=no,status=yes,titlebar=no,toolbar=no";

		return window.open(url, "_blank", settings);
	}

	/**
	 * Gets the query value of the given url and key.
	 *
	 * @param url The URL to get the query value from
	 * @param key The query key in the URL to get the query value from
	 * @return Undefined if the key does not exist; "" if the key exists but has no matching
	 * value; otherwise the query value
	 */
	export function getQueryValue(url: string, key: string): string {
		if (!url || !key) {
			return undefined;
		}

		let escapedKey = key.replace(/[\[\]]/g, "\\$&");
		let regex = new RegExp("[?&]" + escapedKey + "(=([^&#]*)|&|#|$)", "i");
		let results = regex.exec(url);

		if (!results) {
			return undefined;
		}
		if (!results[2]) {
			return "";
		}
		return decodeURIComponent(results[2].replace(/\+/g, " "));
	}

	/**
	 * Add a name/value pair to the query string of a URL.
	 * If the name already exists, simply replace the value (there is no existing standard
	 * for the usage of multiple identical names in the same URL, so we assume adding a
	 * duplicate name is unintended).
	 *
	 * @param originalUrl The URL to add the name/value to
	 * @param name New value name
	 * @param value New value
	 * @return Resulting URL
	 */
	export function addUrlQueryValue(originalUrl: string, key: string, value: string, keyToCamelCase = false): string {
		if (!originalUrl || !key || !value) {
			return originalUrl;
		}

		if (keyToCamelCase) {
			key = Utils.toCamelCase(key);
		}

		// The fragment refers to the last part of the url consisting of "#" and everything after it
		let regexResult = originalUrl.match(/^([^#]*)(#.*)?$/);
		let beforeFragment = regexResult[1];
		let fragment = regexResult[2] ? regexResult[2] : "";

		let queryStartIndex = beforeFragment.indexOf("?");
		if (queryStartIndex === -1) {
			// There is no query string, so create a new one
			return beforeFragment + "?" + key + "=" + value + fragment;
		} else if (queryStartIndex === beforeFragment.length - 1) {
			// Sometimes for some reason there are no name/value pairs specified after the '?'
			return beforeFragment + key + "=" + value + fragment;
		} else {
			// Check that name does not already exist
			let pairs = beforeFragment.substring(queryStartIndex + 1).split("&");
			for (let i = 0; i < pairs.length; i++) {
				let splitPair = pairs[i].split("=");
				if (splitPair[0] === key) {
					// Replace the value
					pairs[i] = splitPair[0] + "=" + value;
					return beforeFragment.substring(0, queryStartIndex + 1) + pairs.join("&") + fragment;
				}
			}
			// No existing name found
			return beforeFragment + "&" + key + "=" + value + fragment;
		}
	}

	/**
	 * Adds the authType, clipperId, and sessionId to the given URL.
	 */
	function addAuthenticationQueryValues(originalUrl: string, clipperId: string, sessionId: string, authType: string): string {
		let authenticationUrl = Utils.addUrlQueryValue(originalUrl, Constants.Urls.QueryParams.authType, authType);
		authenticationUrl = Utils.addUrlQueryValue(authenticationUrl, Constants.Urls.QueryParams.clipperId, clipperId);
		authenticationUrl = Utils.addUrlQueryValue(authenticationUrl, Constants.Urls.QueryParams.userSessionId, sessionId);

		return authenticationUrl;
	}

	export function generateSignInUrl(clipperId: string, sessionId: string, authType: string): string {
		return addAuthenticationQueryValues(Constants.Urls.Authentication.signInUrl, clipperId, sessionId, authType);
	}

	export function generateSignOutUrl(clipperId: string, sessionId: string, authType: string): string {
		return addAuthenticationQueryValues(Constants.Urls.Authentication.signOutUrl, clipperId, sessionId, authType);
	}

	export function generateFeedbackUrl(clipperState: ClipperState, usid: string, logCategory: string): string {
		let generatedFeedbackUrl = Utils.addUrlQueryValue(Constants.Urls.clipperFeedbackUrl,
			"LogCategory", logCategory);
		generatedFeedbackUrl = Utils.addUrlQueryValue(generatedFeedbackUrl,
			"originalUrl", clipperState.pageInfo.rawUrl);
		generatedFeedbackUrl = Utils.addUrlQueryValue(generatedFeedbackUrl,
			"clipperId", clipperState.clientInfo.clipperId);
		generatedFeedbackUrl = Utils.addUrlQueryValue(generatedFeedbackUrl,
			"usid", usid);
		generatedFeedbackUrl = Utils.addUrlQueryValue(generatedFeedbackUrl,
			"type", ClientType[clipperState.clientInfo.clipperType]);
		generatedFeedbackUrl = Utils.addUrlQueryValue(generatedFeedbackUrl,
			"version", clipperState.clientInfo.clipperVersion);

		return generatedFeedbackUrl;
	}

	/**
	 * Creates a random Guid
	 */
	export function generateGuid(): string {
		return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, c => {
			let r = Math.random() * 16 | 0, v = c === "x" ? r : (r & 0x3 | 0x8);
			return v.toString(16);
		});
	}

	export function getHostname(url: string): string {
		let l = document.createElement("a");
		l.href = url;
		return l.protocol + "//" + l.host + "/";
	}

	export function getPathname(url: string): string {
		let l = document.createElement("a");
		l.href = url;

		let urlPathName = l.pathname;

		// We need to ensure the leading forward slash to make it consistant across all browsers.
		return this.ensureLeadingForwardSlash(urlPathName);
	}

	export function checkIfUrlMatchesAContentType(url: string, tooltipTypes: TooltipType[]): TooltipType {
		for (let i = 0; i < tooltipTypes.length; ++i) {
			let tooltipType = tooltipTypes[i];
			let contentTypeAsString = TooltipType[tooltipType];
			let contentTypeRegexes = Settings.getSetting(contentTypeAsString + "Domains");
			let concatenatedRegExes = new RegExp(contentTypeRegexes.join("|"), "i");
			if (concatenatedRegExes.test(url)) {
				return tooltipType;
			}
		}

		return;
	}

	export function ensureLeadingForwardSlash(url: string): string {
		url = this.isNullOrUndefined(url) ? "/" : url;

		return (url.length > 0 && url.charAt(0) === "/") ? url : "/" + url;
	}

	export function getFileNameFromUrl(url: string, fallbackResult?: string): string {
		if (!url) {
			return fallbackResult;
		}
		let regexResult = /\/(?=[^\/]+\.\w{3,4}$).+/g.exec(url);
		return regexResult && regexResult[0] ? regexResult[0].slice(1) : fallbackResult;
	}

	export function isNullOrUndefined(varToCheck: any) {
		/* tslint:disable:no-null-keyword */
		if (varToCheck === null || varToCheck === undefined) {
			return true;
		}
		return false;
		/* tslint:enable:no-null-keyword */
	}

	export function isNumeric(varToCheck: any) {
		return typeof varToCheck === "number" && !isNaN(varToCheck);
	}

	/*
	 * Returns the relative path to the images directory.
	 * Also, since Chromebook has case-sensitive urls, we always go with lowercase image names
	 * (see the use of "lowerCasePathName" in gulpfile.js where the images names are lower-cased when copied)
	 */
	export function getImageResourceUrl(imageName: string) {
		return ("images/" + imageName).toLowerCase();
	}

	export function toCamelCase(str: string): string {
		return str.charAt(0).toUpperCase() + str.slice(1);
	}

	export function onWhitelistedDomain(url: string): boolean {
		if (!url) {
			return false;
		}

		let validDomains = ["AugmentationDefault_WhitelistedDomains", "ProductDomains", "RecipeDomains"];
		let whitelistedDomains = [];
		validDomains.forEach((domain) => {
			whitelistedDomains = whitelistedDomains.concat(Settings.getSetting(domain));
		});

		for (let identifier of whitelistedDomains) {
			if (new RegExp(identifier).test(url)) {
				return true;
			}
		}

		return false;
	}

	export function appendHiddenIframeToDocument(url: string) {
		let iframe = document.createElement("iframe");
		iframe.hidden = true;
		iframe.style.display = "none";
		iframe.src = url;
		document.body.appendChild(iframe);
	}

	export function createUpdatedObject(old: {}, additions: {}): {} {
		let retVal = {};
		if (old) {
			for (let key in old) {
				if (old.hasOwnProperty(key)) {
					retVal[key] = old[key];
				}
			}
		}
		if (additions) {
			for (let key in additions) {
				if (additions.hasOwnProperty(key)) {
					retVal[key] = additions[key];
				}
			}
		}
		return retVal;
	}

	export function readCookie(cookieName: string, doc?: Document) {
		if (Utils.isNullOrUndefined(doc)) {
			doc = document;
		}

		let cookieKVPairs: string[][] = document.cookie.split(";").map(kvPair => kvPair.split("="));

		for (let cookie of cookieKVPairs) {
			if (cookie[0].trim() === cookieName) {
				return cookie[1].trim();
			}
		}
	}
}
