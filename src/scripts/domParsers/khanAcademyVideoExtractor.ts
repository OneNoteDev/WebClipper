import {VideoExtractor} from "./videoExtractor";
import {VideoUtils} from "./videoUtils";
import {YoutubeVideoExtractor} from "./youtubeVideoExtractor";

import {Utils} from "../utils";

export class KhanAcademyVideoExtractor implements VideoExtractor {
	private youtubeExtractor: YoutubeVideoExtractor;

	constructor() {
		this.youtubeExtractor = new YoutubeVideoExtractor();
	}

	public getVideoIds(pageUrl: string, pageContent: string): string[] {
		let regex = /id\s*=\s*("\s*video_(\S+)\s*"|'\s*video_(\S+)\s*')/gi;
		let regexTwo = /data-youtubeid\s*=\s*("\s*(\S+)\s*"|'\s*(\S+)\s*')/gi;
		let regexes = [regex, regexTwo];
		return VideoUtils.matchRegexFromPageContent(pageContent, regexes);
	}	
	
	public getVideoSrcValues(pageUrl: string, pageContent: string): string[] {
		if (Utils.isNullOrUndefined(pageContent)) {
			return;
		}

		let videoIds = this.getVideoIds(pageUrl, pageContent);
		if (Utils.isNullOrUndefined(videoIds)) {
			return;
		}

		if (videoIds.length === 0) {
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
