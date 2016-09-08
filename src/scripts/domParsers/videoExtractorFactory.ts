import {KhanAcademyVideoExtractor} from "./khanAcademyVideoExtractor";
import {VideoExtractor} from "./VideoExtractor";
import {VideoUtils} from "./videoUtils";
import {VimeoVideoExtractor} from "./vimeoVideoExtractor";
import {YoutubeVideoExtractor} from "./YoutubeVideoExtractor";

/**
 * Factory class to return a domain specific video extractor given a Domain
 * The video extractor examines pageInfo and returns data about the videos on the page
 * to be used in the preview and posting to OneNote
 */
export module VideoExtractorFactory {
	export function createVideoExtractor(domain: VideoUtils.SupportedVideoDomains): VideoExtractor {
		// shorter typename
		let Domains = VideoUtils.SupportedVideoDomains;
		switch (domain) {
			case Domains.KhanAcademy:
				return new KhanAcademyVideoExtractor();	
			case Domains.Vimeo:
				return new VimeoVideoExtractor();	
			case Domains.YouTube:
				return new YoutubeVideoExtractor();	
			default: 
				return	
		}
	}
}