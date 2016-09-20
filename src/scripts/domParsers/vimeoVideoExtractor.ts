import {DomUtils} from "./domUtils";
import {VideoExtractor} from "./videoExtractor";
import {VideoUtils} from "./videoUtils";

import {Utils} from "../utils";

export class VimeoVideoExtractor implements VideoExtractor {
	private dataOriginalSrcAttribute = "data-original-src";

	/**
	 * Return id for a video on Vimeo.com
	 */
	public getVideoIds(pageUrl: string, pageContent: string): string[] {
		if (Utils.isNullOrUndefined(pageContent)) {
			return;
		}

		// looking for all matches in pageContent of the general format: id="clip_###"
		// 		- where ### could be any number of digits
		// 		- ignore casing
		// 		- ignore possible whitespacing variations between characters
		// 		- accept the use of either double- or single-quotes around clip_###
		let regex = /id\s*=\s*("\s*clip_(\d+)\s*"|'\s*clip_(\d+)\s*')/gi;
		return VideoUtils.matchRegexFromPageContent(pageContent, [regex]);
	}

	/**
	 * Return valid iframe src attribute value for the supported Vimeo domain
	 */
	public getVideoSrcValues(pageUrl: string, pageContent: string): string[] {
		if (Utils.isNullOrUndefined(pageContent)) {
			return;
		}

		let vimeoIds = this.getVideoIds(pageUrl, pageContent);
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
	 * Create iframes in correct format for Vimeo video embed in OneNote.
	 * Supports multiple videos.
	 */
	public createEmbeddedVideos(pageUrl: string, pageContent: string): HTMLIFrameElement[] {
		let vimeoSrcs = this.getVideoSrcValues(pageUrl, pageContent);

		if (Utils.isNullOrUndefined(vimeoSrcs)) {
			// fast fail: we expect all pages passed into this function in prod to contain clip ids
			throw new Error("Vimeo page content does not contain clip ids");
		}

		let iframes: HTMLIFrameElement[] = [];

		for (let vimeoSrc of vimeoSrcs) {
			let iframe = DomUtils.createEmbedVideoIframe();
			iframe.src = vimeoSrc;
			iframe.setAttribute(this.dataOriginalSrcAttribute, vimeoSrc);

			iframes.push(iframe);
		}

		return iframes;
	}
}
