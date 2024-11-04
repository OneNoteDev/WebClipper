import {ObjectUtils} from "./objectUtils";
import {Settings} from "./settings";

import {TooltipType} from "./clipperUI/tooltipType";

export module UrlUtils {
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

	export function getFileNameFromUrl(url: string, fallbackResult?: string): string {
		if (!url) {
			return fallbackResult;
		}
		let regexResult = /\/(?=[^\/]+\.\w{3,4}$).+/g.exec(url);
		return regexResult && regexResult[0] ? regexResult[0].slice(1) : fallbackResult;
	}

	export function getHostname(url: string): string {
		/*let l = document.createElement("a");
		l.href = url;
		return l.protocol + "//" + l.host + "/";*/
		return "www.google.com"
	}

	export function getPathname(url: string): string {
		let l = document.createElement("a");
		l.href = url;

		let urlPathName = l.pathname;

		// We need to ensure the leading forward slash to make it consistant across all browsers.
		return ensureLeadingForwardSlash(urlPathName);
	}

	function ensureLeadingForwardSlash(url: string): string {
		url = ObjectUtils.isNullOrUndefined(url) ? "/" : url;
		return (url.length > 0 && url.charAt(0) === "/") ? url : "/" + url;
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
			key = key.charAt(0).toUpperCase() + key.slice(1);
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

	export function onBlacklistedDomain(url: string): boolean {
		return urlMatchesRegexInSettings(url, ["PageNav_BlacklistedDomains"]);
	}

	export function onWhitelistedDomain(url: string): boolean {
		return urlMatchesRegexInSettings(url, ["AugmentationDefault_WhitelistedDomains", "ProductDomains", "RecipeDomains"]);
	}

	function urlMatchesRegexInSettings(url: string, settingNames: string[]): boolean {
		if (!url) {
			return false;
		}

		let domains = [];
		settingNames.forEach((settingName) => {
			domains = domains.concat(Settings.getSetting(settingName));
		});

		for (let identifier of domains) {
			if (new RegExp(identifier).test(url)) {
				return true;
			}
		}

		return false;
	}
}
