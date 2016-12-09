import {VideoExtractor} from "./videoExtractor";
import {VideoUtils} from "./videoUtils";
import {YoutubeVideoExtractor} from "./youtubeVideoExtractor";

import {ObjectUtils} from "../objectUtils";

export class KhanAcademyVideoExtractor extends VideoExtractor {
	private youtubeExtractor: YoutubeVideoExtractor;

	constructor() {
		super();
		// KhanAcademy hosts their videos on Youtube
		this.youtubeExtractor = new YoutubeVideoExtractor();
	}

	public createEmbeddedVideosFromHtml(html: string): HTMLIFrameElement[] {
		if (!html) {
			return [];
		}

		// Matches strings of the form id="video_\S+" OR id='video_\S+'
		// with any amount of whitespace padding in between strings of interest
		let regex1 = /\sid\s*=\s*("\s*video_(\S+)\s*"|'\s*video_(\S+)\s*')/gi;

		// Matches strings of the form data-youtubeid="\S+" OR data-youtubeid='\S+'
		// with any amount of whitespace padding in between strings of interest
		let regex2 = /data-youtubeid\s*=\s*("\s*video_(\S+)\s*"|'\s*video_(\S+)\s*')/gi;

		let ids = VideoUtils.matchRegexFromPageContent(html, [regex1, regex2]);
		if (!ids) {
			return [];
		}

		return ids.map((id) => this.createEmbeddedVideoFromId(id));
	}

	public createEmbeddedVideoFromUrl(url: string): HTMLIFrameElement {
		// KhanAcademy does not host their own videos. We can only derive videos
		// from their page's html.
		return undefined;
	}

	public createEmbeddedVideoFromId(id: string): HTMLIFrameElement {
		return this.youtubeExtractor.createEmbeddedVideoFromId(id);
	}
}
