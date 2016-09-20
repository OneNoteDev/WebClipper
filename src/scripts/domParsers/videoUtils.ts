import {Utils} from "../utils";

import {VideoExtractor} from "./VideoExtractor";
import {KhanAcademyVideoExtractor} from "./khanAcademyVideoExtractor";

export module VideoUtils {
	export const youTubeWatchVideoBaseUrl = "https://www.youtube.com/watch";
	export const youTubeVideoIdQueryKey = "v";

	export enum SupportedVideoDomains {
		YouTube,
		Vimeo,
		KhanAcademy
	}

	/**
	 * Returns a string from the SupportedVideoDomains enum iff
	 * the pageUrl's hostname contains the enum string
	 */
	export function videoDomainIfSupported(pageUrl: string): string {
		if (!Utils.onWhitelistedDomain(pageUrl)) {
			return;
		}

		let hostname = Utils.getHostname(pageUrl);

		for (let domain in SupportedVideoDomains) {
			if (typeof(domain) === "string" && hostname.indexOf(domain.toLowerCase() + ".") > -1) {
				return domain;
			}
		}

		return;
	}

	export function matchRegexFromPageContent(pageContent: string, regexes: RegExp[]): string[] {
		if (Utils.isNullOrUndefined(pageContent)) {
			return;
		}

		// looking for all matches in pageContent of the general format: id="clip_###"
		// 		- where ### could be any number of digits
		// 		- ignore casing
		// 		- ignore possible whitespacing variations between characters
		// 		- accept the use of either double- or single-quotes around clip_###
		let m;
		let matches = [];
		regexes.forEach((regex) => {
			while (m = regex.exec(pageContent)) {
				if (m[2]) {
					matches.push(m[2]);
				} else {
					matches.push(m[3]);
				}
			}
		});

		if (matches.length === 0) {
			return;
		}
		return matches.filter((element, index, array) => { return array.indexOf(element) === index; }); // unique values only
	}
}
