import {DomUtils} from "./domUtils";
import {VideoExtractor} from "./videoExtractor";

import {UrlUtils} from "../urlUtils";

export class YoutubeVideoExtractor extends VideoExtractor {
	private youTubeWatchVideoBaseUrl = "https://www.youtube.com/watch";
	private youTubeVideoIdQueryKey = "v";
	private dataOriginalSrcAttribute = "data-original-src";

	public async createEmbeddedVideosFromHtml(html: string): Promise<HTMLIFrameElement[]> {
		if (!html) {
			return [];
		}

		let divContainer = document.createElement("div") as HTMLDivElement;
		divContainer.innerHTML = html;
		let allIframes = divContainer.getElementsByTagName("iframe") as HTMLCollectionOf<HTMLIFrameElement>;

		let videoEmbeds: HTMLIFrameElement[] = [];
		for (let i = 0; i < allIframes.length; i++) {
			if (this.isYoutubeUrl(allIframes[i].src)) {
				let videoEmbed = await this.createEmbeddedVideoFromUrl(allIframes[i].src);
				if (videoEmbed) {
					videoEmbeds.push(videoEmbed);
				}
			}
		}
		return videoEmbeds;
	}

	private isYoutubeUrl(url: string): boolean {
		return /[^\w]youtube\.com\/watch(\?v=(\w+)|.*\&v=(\w+))/.test(url) || /[^\w]youtube\.com\/embed\/(\w+)/.test(url);
	}

	public async createEmbeddedVideoFromUrl(url: string): Promise<HTMLIFrameElement> {
		if (!url) {
			return undefined;
		}

		let urlPathName = await UrlUtils.getPathname(url);

		if (urlPathName.indexOf("/watch") === 0) {
			return this.createEmbeddedVideoFromId(UrlUtils.getQueryValue(url, this.youTubeVideoIdQueryKey));
		}

		if (urlPathName.indexOf("/embed") === 0) {
			let youTubeIdMatch = url.match(/youtube\.com\/embed\/([^?|\/?]+)/);
			return this.createEmbeddedVideoFromId(youTubeIdMatch[1]);
		}

		return undefined;
	}

	public createEmbeddedVideoFromId(id: string): HTMLIFrameElement {
		if (!id) {
			return undefined;
		}

		let videoEmbed = DomUtils.createEmbedVideoIframe();
		let src = "https://www.youtube.com/embed/" + id;
		videoEmbed.src = src;
		let dataOriginalSrc = UrlUtils.addUrlQueryValue(this.youTubeWatchVideoBaseUrl, this.youTubeVideoIdQueryKey, id);
		videoEmbed.setAttribute(this.dataOriginalSrcAttribute, dataOriginalSrc);
		return videoEmbed;
	}
}
