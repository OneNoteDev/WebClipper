import {VideoUtils} from "../../scripts/domParsers/videoUtils";

import {TestModule} from "../testModule";

export class VideoUtilsTests extends TestModule {
	protected module() {
		return "videoUtils";
	}

	protected tests() {
		test("videoDomainIfSupported should return undefined on the YouTube homepage", () => {
			strictEqual(VideoUtils.videoDomainIfSupported("https://www.youtube.com/"), undefined,
				"YouTube homepage should not be recognized as a page with a video");
		});

		test("videoDomainIfSupported should return undefined on the Vimeo homepage", () => {
			strictEqual(VideoUtils.videoDomainIfSupported("https://www.vimeo.com/"), undefined,
				"Vimeo homepage should not be recognized as a page with a video");
		});

		test("videoDomainIfSupported should return undefined on a YouTube channel page", () => {
			strictEqual(VideoUtils.videoDomainIfSupported("https://www.youtube.com/channel/UC38IQsAvIsxxjztdMZQtwHA"), undefined,
				"YouTube channel page should not be recognized as a page with a video");
		});

		test("videoDomainIfSupported should return undefined on a Vimeo user page", () => {
			strictEqual(VideoUtils.videoDomainIfSupported("https://vimeo.com/user12402347"), undefined,
				"Vimeo user page should not be recognized as a page with a video");
		});

		test("videoDomainIfSupported should return undefined on a Vimeo collections page", () => {
			strictEqual(VideoUtils.videoDomainIfSupported("https://vimeo.com/45196609/collections/channels"), undefined,
				"Vimeo collections page should not be recognized as a page with a video");
		});

		test("videoDomainIfSupported should return YouTube if the url represents a video, embedded video, or mobile video on YouTube", () => {
			let supportedYouTubeUrls = [
				"https://youtube.com/watch?v=dQw4w9WgXcQ",
				"https://www.youtube.com/watch?v=dQw4w9WgXcQ",
				"https://www.youtube.com/watch?v=dQw4w9WgXcQ&feature=youtu.be&t=30s",
				"https://www.youtube.com/watch?v=dQw4w9WgXcQ#foo",
				"https://www.youtube.com/watch?feature=youtu.be&t=30s&v=dQw4w9WgXcQ",
				"https://m.youtube.com/watch?v=dQw4w9WgXcQ&feature=youtu.be",
				"https://www.youtube.com/embed/dQw4w9WgXcQ"
			];

			for (let pageUrl of supportedYouTubeUrls) {
				let domain = VideoUtils.videoDomainIfSupported(pageUrl);
				strictEqual(domain, "YouTube", pageUrl + " should return YouTube");
			}
		});

		test("videoDomainIfSupported should return Vimeo if the url represents a video, staffpick, album, or ondemand video on Vimeo", () => {
			let supportedVimeoUrls = [
				"https://vimeo.com/45196609",
				"https://www.vimeo.com/45196609",
				"https://vimeo.com/45196609?autoplay=1",
				"https://vimeo.com/45196609#t=0",
				"https://vimeo.com/channels/staffpicks/45196609",
				"https://vimeo.com/album/45196609/",
				"https://vimeo.com/album/45196609/page:1",
				"https://vimeo.com/album/45196609/page:3/sort:preset/format:thumbnail",
				"https://vimeo.com/album/45196609/sort:preset/format:thumbnail/page:2",
				"https://vimeo.com/album/45196609/video/45196609",
				"https://vimeo.com/ondemand/45196609"
			];
			for (let pageUrl of supportedVimeoUrls) {
				let domain = VideoUtils.videoDomainIfSupported(pageUrl);
				strictEqual(domain, "Vimeo", pageUrl + " should return Vimeo");
			}
		});

		test("videoDomainIfSupported should return Vimeo on a Vimeo ondemand page", () => {
			strictEqual(VideoUtils.videoDomainIfSupported("https://vimeo.com/ondemand/reeltoreal"), "Vimeo",
				"Vimeo ondemand page should be recognized as a page with a video");
			strictEqual(VideoUtils.videoDomainIfSupported("https://vimeo.com/ondemand/"), undefined,
				"Vimeo ondemand root page should not be recognized as a page with a video");
		});

		test("videoDomainIfSupported should correctly return the domain if its a video site, regardless of the url's casing", () => {
			let supportedVimeoUrls = [
				"https://VIMEO.com/45196609",
				"https://vImEO.com/45196609?autoplay=1",
				"https://vimeo.com/45196609?AUTOPLAY=1"
			];
			for (let pageUrl of supportedVimeoUrls) {
				let domain = VideoUtils.videoDomainIfSupported(pageUrl);
				strictEqual(domain, "Vimeo", pageUrl + " should return Vimeo");
			}
		});

		test("videoDomainIfSupported should return undefined on arbitrary urls", () => {
			let unsupportedOtherUrls = [
				"https://www.hulu.com/",
				"https://www.google.com/",
				"https://fistbump.reviews/",
				"abcde",
				"12345.com"
			];
			for (let pageUrl of unsupportedOtherUrls) {
				let domain = VideoUtils.videoDomainIfSupported(pageUrl);
				strictEqual(domain, undefined, pageUrl + " should not be recognized as a video page and should return undefined");
			}
		});

		test("videoDomainIfSupported should return undefined on arbitrary urls even if the url contains a domain we support as a substring", () => {
			let unsupportedOtherUrls = [
				"https://www.youtube1.com/watch?v=dQw4w9WgXcQ",
				"https://vimeoo.com/45196609",
				"https://avimeo.com/45196609"
			];
			for (let pageUrl of unsupportedOtherUrls) {
				let domain = VideoUtils.videoDomainIfSupported(pageUrl);
				strictEqual(domain, undefined, pageUrl + " should not be recognized as a video page and should return undefined");
			}
		});

		test("videoDomainIfSupported should return undefined when passed undefined or empty string", () => {
			let unsupportedOtherUrls = [
				"",
				undefined
			];
			for (let pageUrl of unsupportedOtherUrls) {
				let domain = VideoUtils.videoDomainIfSupported(pageUrl);
				strictEqual(domain, undefined, pageUrl + " should not be recognized as a video page and should return undefined");
			}
		});
	}
}

(new VideoUtilsTests()).runTests();
