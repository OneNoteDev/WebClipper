import {VideoExtractor} from "./videoExtractor";
import {VideoUtils} from "./videoUtils";
import {YoutubeVideoExtractor} from "./youtubeVideoExtractor";

import {ObjectUtils} from "../objectUtils";

export class KhanAcademyVideoExtractor implements VideoExtractor {
	private youtubeExtractor: YoutubeVideoExtractor;

	constructor() {
		this.youtubeExtractor = new YoutubeVideoExtractor();
	}

	public getVideoIds(pageUrl: string, pageContent: string): string[] {
		// Matches strings of the form id="video_\S+" OR id='video_\S+'
		// with any amount of whitespace padding in between strings of interest
		let regex1 = /id\s*=\s*("\s*video_(\S+)\s*"|'\s*video_(\S+)\s*')/gi;

		// Matches strings of the form data-youtubeid="\S+" OR data-youtubeid='\S+'
		// with any amount of whitespace padding in between strings of interest
		let regex2 = /data-youtubeid\s*=\s*("\s*(\S+)\s*"|'\s*(\S+)\s*')/gi;

		return VideoUtils.matchRegexFromPageContent(pageContent, [regex1, regex2]);
	}

	public getVideoSrcValues(pageUrl: string, pageContent: string): string[] {
		if (ObjectUtils.isNullOrUndefined(pageContent)) {
			return;
		}

		let videoIds = this.getVideoIds(pageUrl, pageContent);
		if (ObjectUtils.isNullOrUndefined(videoIds) || videoIds.length === 0) {
			return;
		}

		return ["https://www.youtube.com/embed/" + videoIds[0]];
	}

	/**
	 * Create iframe in correct format for KhanAcademy video (hosted on YouTube) embed in OneNote.
	 */
	public createEmbeddedVideos(pageUrl: string, pageContent: string): HTMLIFrameElement[] {
		let youtubeSrcFromKhanAcademyPage = this.getVideoSrcValues(pageUrl, pageContent);
		if (youtubeSrcFromKhanAcademyPage.length === 0) {
			return [];
		}
		let firstSource = youtubeSrcFromKhanAcademyPage[0];
		return this.youtubeExtractor.createEmbeddedVideos(firstSource, pageContent);
	}

}
