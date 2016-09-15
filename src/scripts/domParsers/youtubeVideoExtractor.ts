import {DomUtils} from "./domUtils";
import {VideoExtractor} from "./videoExtractor";

import {Utils} from "../utils";

export class YoutubeVideoExtractor implements VideoExtractor {
	private youTubeWatchVideoBaseUrl = "https://www.youtube.com/watch";
	private youTubeVideoIdQueryKey = "v";
	private dataOriginalSrcAttribute = "data-original-src";

	/**
	 * Return the ID of the video in the YouTube URL as an array
	 */
	public getVideoIds(youTubeUrl: string, pageContent: string): string[] {
		if (Utils.isNullOrUndefined(youTubeUrl)) {
			return;
		}

		let youTubeId;
		if (Utils.getPathname(youTubeUrl).indexOf("/watch") === 0) {
			youTubeId = Utils.getQueryValue(youTubeUrl, this.youTubeVideoIdQueryKey);
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

		if (Utils.isNullOrUndefined(youTubeId)) {
			return;
		}

		return [youTubeId];
	}

	/**
	 * Return valid iframe src attribute value for the supported YouTube domain
	 */
	public getVideoSrcValues(pageUrl: string, pageContent: string): string[] {
		if (Utils.isNullOrUndefined(pageUrl)) {
			return;
		}

		let youTubeVideoId = this.getVideoIds(pageUrl, pageContent);
		if (Utils.isNullOrUndefined(youTubeVideoId)) {
			return;
		}

		return ["https://www.youtube.com/embed/" + youTubeVideoId];
	}

	/**
	 * Create iframe in correct format for YouTube video embed in OneNote.
	 * Supports a single video.
	 */
	public createEmbeddedVideos(pageUrl: string, pageContent: string): HTMLIFrameElement[] {
		let iframe = DomUtils.createEmbedVideoIframe();
		let srcValue = this.getVideoSrcValues(pageUrl, pageContent);
		let videoId = this.getVideoIds(pageUrl, pageContent)[0];
		if (Utils.isNullOrUndefined(srcValue) || Utils.isNullOrUndefined(videoId)) {
			// fast fail: we expect all page urls passed into this function in prod to contain a video id
			throw new Error("YouTube page url does not contain video id");
		}
		iframe.src = srcValue[0];
		iframe.setAttribute(this.dataOriginalSrcAttribute, Utils.addUrlQueryValue(this.youTubeWatchVideoBaseUrl, this.youTubeVideoIdQueryKey, videoId));

		return [iframe];
	}
}
