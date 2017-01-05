import {KhanAcademyVideoExtractor} from "./khanAcademyVideoExtractor";
import {VideoExtractor} from "./VideoExtractor";
import {SupportedVideoDomains, VideoUtils} from "./videoUtils";
import {VimeoVideoExtractor} from "./vimeoVideoExtractor";
import {YoutubeVideoExtractor} from "./YoutubeVideoExtractor";

/**
 * Factory class to return a domain specific video extractor given a Domain
 * The video extractor examines pageInfo and returns data about the videos on the page
 * to be used in the preview and posting to OneNote
 */
export class VideoExtractorFactory {
	public static createVideoExtractor(domain: SupportedVideoDomains): VideoExtractor {
		switch (domain) {
			case SupportedVideoDomains.KhanAcademy:
				return new KhanAcademyVideoExtractor();
			case SupportedVideoDomains.Vimeo:
				return new VimeoVideoExtractor();
			case SupportedVideoDomains.YouTube:
				return new YoutubeVideoExtractor();
			default:
				return;
		}
	}
}
