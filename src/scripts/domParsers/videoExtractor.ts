import * as _ from "lodash";

export abstract class VideoExtractor {
	/**
	 * Given a page's url and its body html, return a unique list of
	 * OneNoteApi-compliant video embeds. If there's a video associated
	 * with the page url, it will be first in the list.
	 */
	public async createEmbeddedVideosFromPage(url: string, html: string): Promise<HTMLIFrameElement[]> {
		let allVideoEmbeds: HTMLIFrameElement[] = [];
		let videoEmbedFromUrl = await this.createEmbeddedVideoFromUrl(url);
		if (videoEmbedFromUrl) {
			allVideoEmbeds.push(videoEmbedFromUrl);
		}

		allVideoEmbeds = allVideoEmbeds.concat(await this.createEmbeddedVideosFromHtml(html));
		return _.uniqWith(allVideoEmbeds, (v1: HTMLIFrameElement, v2: HTMLIFrameElement) => {
			return v1.src === v2.src;
		});
	}

	/**
	 * Given some arbitrary html with n embedded videos that the
	 * extractor recognizes, return a list of n OneNoteApi-compliant
	 * video embeds.
	 */
	public abstract createEmbeddedVideosFromHtml(html: string): Promise<HTMLIFrameElement[]>;

	/**
	 * Given the url of a video page belonging to the extractor's domain, or
	 * an extisting embedded element, return a OneNoteApi-compliant video
	 * embed.
	 */
	public abstract createEmbeddedVideoFromUrl(url: string): Promise<HTMLIFrameElement>;

	/**
	 * Given the id of the video, return a OneNoteApi-compliant video embed.
	 */
	public abstract createEmbeddedVideoFromId(id: string): HTMLIFrameElement;
};
