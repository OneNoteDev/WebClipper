import {ObjectUtils} from "../objectUtils";

import {UrlUtils} from "../urlUtils";

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
		if (!pageUrl) {
			return;
		}

		let pageUrlAsLowerCase = pageUrl.toLowerCase();
		if (!UrlUtils.onWhitelistedDomain(pageUrlAsLowerCase)) {
			return;
		}

		let hostname = UrlUtils.getHostname(pageUrlAsLowerCase).toLowerCase();

		for (let domainEnum in SupportedVideoDomains) {
			let domain = SupportedVideoDomains[domainEnum];
			if (typeof(domain) === "string" && hostname.indexOf(domain.toLowerCase() + ".") > -1) {
				return domain;
			}
		}

		return;
	}

	export function matchRegexFromPageContent(pageContent: string, regexes: RegExp[]): string[] {
		if (ObjectUtils.isNullOrUndefined(pageContent)) {
			return;
		}

		let match: RegExpExecArray;
		let matches = [];
		regexes.forEach((regex) => {
			// Calling exec multiple times with the same parameter will continue finding matches until
			// there are no more
			while (match = regex.exec(pageContent)) {
				if (match[2]) {
					matches.push(match[2]);
				} else if (match[3]) {
					matches.push(match[3]);
				}
			}
		});

		if (matches.length === 0) {
			return;
		}
		return matches.filter((element, index, array) => { return array.indexOf(element) === index; }); // unique values only
	}
}
