import {KhanAcademyVideoExtractor} from "./khanAcademyVideoExtractor";
import {SupportedVideoDomains, VideoUtils} from "./videoUtils";
import {VideoExtractor} from "./VideoExtractor";
import {VimeoVideoExtractor} from "./vimeoVideoExtractor";
import {YoutubeVideoExtractor} from "./YoutubeVideoExtractor";

/**
 * Factory class to return a domain specific video extractor given a Domain
 * The video extractor examines pageInfo and returns data about the videos on the page
 * to be used in the preview and posting to OneNote
 */
export module VideoExtractorFactory {
	export function createVideoExtractor(domain: SupportedVideoDomains): VideoExtractor {
		// shorter typename
		let domains = SupportedVideoDomains;
		switch (domain) {
			case domains.KhanAcademy:
				return new KhanAcademyVideoExtractor();
			case domains.Vimeo:
				return new VimeoVideoExtractor();
			case domains.YouTube:
				return new YoutubeVideoExtractor();
			default:
				return;
		}
	}
}
