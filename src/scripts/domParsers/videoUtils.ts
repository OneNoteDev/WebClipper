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

	export function createExtractor(domain: string): VideoExtractor {
		let domainAsEnum = VideoUtils.SupportedVideoDomains[domain];
		switch (domainAsEnum) {
			case VideoUtils.SupportedVideoDomains.KhanAcademy:
				return new KhanAcademyVideoExtractor();
			default:
				return;
		}
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

	/**
	 * Return valid iframe src attribute value for the supported YouTube domain
	 */
	export function getYouTubeVideoSrcValue(pageUrl: string): string {
		if (Utils.isNullOrUndefined(pageUrl)) {
			return;
		}

		let youTubeVideoId = getYouTubeVideoId(pageUrl);
		if (Utils.isNullOrUndefined(youTubeVideoId)) {
			return;
		}

		return "https://www.youtube.com/embed/" + youTubeVideoId;
	}

	/**
	 * Return valid iframe src attribute value for the supported Vimeo domain
	 */
	export function getVimeoVideoSrcValues(pageContent: string): string[] {
		if (Utils.isNullOrUndefined(pageContent)) {
			return;
		}

		let vimeoIds = getVimeoVideoIds(pageContent);
		if (Utils.isNullOrUndefined(vimeoIds)) {
			return;
		}

		let values = [];
		for (let id of vimeoIds) {
			values.push("https://player.vimeo.com/video/" + id);
		}

		return values;
	}

	/**
	 * Return id for a video on YouTube.com
	 */
	export function getYouTubeVideoId(youTubeUrl: string): string {
		if (Utils.isNullOrUndefined(youTubeUrl)) {
			return;
		}

		let youTubeId;
		if (Utils.getPathname(youTubeUrl).indexOf("/watch") === 0) {
			youTubeId = Utils.getQueryValue(youTubeUrl, youTubeVideoIdQueryKey);
			if (Utils.isNullOrUndefined(youTubeId)) {
				return;
			}
		}

		if (Utils.getPathname(youTubeUrl).indexOf("/embed") === 0) {
			let youTubeIdMatch = youTubeUrl.match(/youtube\.com\/embed\/(\S+)/);
			if (Utils.isNullOrUndefined(youTubeIdMatch) || Utils.isNullOrUndefined(youTubeIdMatch[1])) {
				return;
			}
			youTubeId = youTubeIdMatch[1];
		}

		return youTubeId;
	}

	/**
	 * Return id for a video on Vimeo.com
	 */
	export function getVimeoVideoIds(pageContent: string): string[] {
		if (Utils.isNullOrUndefined(pageContent)) {
			return;
		}

		// looking for all matches in pageContent of the general format: id="clip_###"
		// 		- where ### could be any number of digits
		// 		- ignore casing
		// 		- ignore possible whitespacing variations between characters
		// 		- accept the use of either double- or single-quotes around clip_###
		let regex = /id\s*=\s*("\s*clip_(\d+)\s*"|'\s*clip_(\d+)\s*')/gi;
		return matchRegexFromPageContent(pageContent, [regex]);
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
