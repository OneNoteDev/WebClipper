import {DomUtils} from "./domUtils";
import {VideoExtractor} from "./videoExtractor";
import {VideoUtils} from "./videoUtils";

import {ObjectUtils} from "../objectUtils";

export class VimeoVideoExtractor extends VideoExtractor {
	private dataOriginalSrcAttribute = "data-original-src";

	public async createEmbeddedVideosFromHtml(html: string): Promise<HTMLIFrameElement[]> {
		if (!html) {
			return [];
		}

		// Looking for all matches in pageContent of the general format: id="clip_###"
		// - where ### could be any number of digits
		// - ignore casing
		// - ignore possible whitespacing variations between characters
		// - accept the use of either double- or single-quotes around clip_###
		let regex1 = /id\s*=\s*("\s*clip_(\d+)\s*"|'\s*clip_(\d+)\s*')/gi;

		// Also account for embedded Vimeo videos
		let regex2 = /player\.vimeo\.com\/video\/((\d+))\d{0}/gi;

		let ids = VideoUtils.matchRegexFromPageContent(html, [regex1, regex2]);
		if (!ids) {
			return [];
		}

		return ids.map((id) => this.createEmbeddedVideoFromId(id));
	}

	public async createEmbeddedVideoFromUrl(url: string): Promise<HTMLIFrameElement> {
		if (!url) {
			return undefined;
		}

		let match = url.match(/^https?:\/\/vimeo\.com\/(\d+)\d{0}/);
		if (match) {
			return this.createEmbeddedVideoFromId(match[1]);
		}

		match = url.match(/^https?:\/\/player.vimeo.com\/video\/(\d+)\d{0}/);
		if (match) {
			return this.createEmbeddedVideoFromId(match[1]);
		}

		return undefined;
	}

	public createEmbeddedVideoFromId(id: string): HTMLIFrameElement {
		if (!id) {
			return undefined;
		}

		let videoEmbed = DomUtils.createEmbedVideoIframe();
		let src = "https://player.vimeo.com/video/" + id;
		videoEmbed.src = src;
		videoEmbed.setAttribute(this.dataOriginalSrcAttribute, src);
		return videoEmbed;
	}
}
