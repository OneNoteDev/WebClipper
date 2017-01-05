import {VideoUtils} from "../../scripts/domParsers/videoUtils";
import {YoutubeVideoExtractor} from "../../scripts/domParsers/youtubeVideoExtractor";

import {TestModule} from "../testModule";

export class YoutubeVideoExtractorTests extends TestModule {
	private unsupportedOtherUrls = [
		"https://www.hulu.com/",
		"https://www.google.com/",
		undefined,
		""
	];

	private supportedVimeoUrls = [
		"https://vimeo.com/45196609",
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

	private unsupportedYouTubeUrls = [
		"https://www.youtube.com/",
		"https://www.youtube.com/channel/UC38IQsAvIsxxjztdMZQtwHA"
	];

	private supportedYouTubeUrls = [
		"https://www.youtube.com/watch?v=dQw4w9WgXcQ",
		"https://www.youtube.com/watch?v=dQw4w9WgXcQ&feature=youtu.be&t=30s",
		"https://www.youtube.com/watch?v=dQw4w9WgXcQ#foo",
		"https://www.youtube.com/watch?feature=youtu.be&t=30s&v=dQw4w9WgXcQ",
		"https://m.youtube.com/watch?v=dQw4w9WgXcQ&feature=youtu.be",
		"https://www.youtube.com/embed/dQw4w9WgXcQ",
		"https://www.youtube.com/embed/dQw4w9WgXcQ/",
		"https://www.youtube.com/embed/dQw4w9WgXcQ?start=900"
	];

	private youtubeExtractor = new YoutubeVideoExtractor();

	protected module() {
		return "youtubeVideoExtractor";
	}

	protected tests() {
		test("createEmbeddedVimeosFromHtml should return a list of iframes with the src set to the embed url, and the data-original-src set to the watch url", () => {
			let ids = ["1", "2", "3"];
			let outerDiv = this.createDivWithEmbeddedVideos(ids);
			let embedVideos = this.youtubeExtractor.createEmbeddedVideosFromHtml(outerDiv.outerHTML);
			strictEqual(embedVideos.length, ids.length, "There should be one iframe for each unique video");
			for (let i = 0; i < embedVideos.length; i++) {
				strictEqual(embedVideos[i].src, "https://www.youtube.com/embed/" + ids[i],
					"The src should be set to the embed url");
				strictEqual(embedVideos[i].attributes.getNamedItem("data-original-src").value, "https://www.youtube.com/watch?v=" + ids[i],
					"The data original src attribute should be set to the watch url");
			}
		});

		test("createEmbeddedVimeosFromHtml should return a non-unique list of iframes given some videos are duplicates in the html", () => {
			let ids = ["1", "1", "2"];
			let outerDiv = this.createDivWithEmbeddedVideos(ids);
			let embedVideos = this.youtubeExtractor.createEmbeddedVideosFromHtml(outerDiv.outerHTML);
			strictEqual(embedVideos.length, ids.length, "There should be one iframe for each unique video");
			for (let i = 0; i < embedVideos.length; i++) {
				strictEqual(embedVideos[i].src, "https://www.youtube.com/embed/" + ids[i],
					"The src should be set to the embed url");
				strictEqual(embedVideos[i].attributes.getNamedItem("data-original-src").value, "https://www.youtube.com/watch?v=" + ids[i],
					"The data original src attribute should be set to the watch url");
			}
		});

		test("createEmbeddedVimeosFromHtml should return the empty list if there are no embed videos in the html", () => {
			let embedVideos = this.youtubeExtractor.createEmbeddedVideosFromHtml("<div></div>");
			strictEqual(embedVideos.length, 0, "There should be 0 iframes in the returned");

			embedVideos = this.youtubeExtractor.createEmbeddedVideosFromHtml("");
			strictEqual(embedVideos.length, 0, "There should be 0 iframes in the returned");
		});

		test("createEmbeddedVimeosFromHtml should return the empty list if the html is undefined", () => {
			let embedVideos = this.youtubeExtractor.createEmbeddedVideosFromHtml(undefined);
			strictEqual(embedVideos.length, 0, "There should be 0 iframes in the returned");
		});

		test("createEmbedVideoFromUrl should return an iframe with the src set to the embed url, and the data-original-src set to the watch url", () => {
			// We use this same id in all each of the candidate urls for the test
			let id = "dQw4w9WgXcQ";
			for (let supportedYouTubeUrl of this.supportedYouTubeUrls) {
				let embedVideo = this.youtubeExtractor.createEmbeddedVideoFromUrl(supportedYouTubeUrl);
				strictEqual(embedVideo.src, "https://www.youtube.com/embed/" + id,
					"The src should be set to the embed url");
				strictEqual(embedVideo.attributes.getNamedItem("data-original-src").value, "https://www.youtube.com/watch?v=" + id,
					"The data original src attribute should be set to the watch url");
			}
		});

		test("createEmbeddedVideoFromUrl should return undefined when provided unsupported parameters for the YouTube domain", () => {
			for (let otherUrl of this.unsupportedOtherUrls) {
				let embedVideo = this.youtubeExtractor.createEmbeddedVideoFromUrl(otherUrl);
				strictEqual(embedVideo, undefined, otherUrl + " is unsupported by YouTube domain");
			}

			for (let vimeoUrl of this.supportedVimeoUrls) {
				let embedVideo = this.youtubeExtractor.createEmbeddedVideoFromUrl(vimeoUrl);
				strictEqual(embedVideo, undefined, vimeoUrl + " is unsupported by YouTube domain");
			}

			for (let youTubeUrl of this.unsupportedYouTubeUrls) {
				let embedVideo = this.youtubeExtractor.createEmbeddedVideoFromUrl(youTubeUrl);
				strictEqual(embedVideo, undefined, youTubeUrl + " is in incorrect format for the pageUrl");
			}
		});

		test("createEmbeddedVideoFromUrl should return undefined if the input value is empty string or undefined", () => {
			strictEqual(this.youtubeExtractor.createEmbeddedVideoFromUrl(""), undefined);
			strictEqual(this.youtubeExtractor.createEmbeddedVideoFromUrl(undefined), undefined);
		});

		test("createEmbeddedVideoFromId should create an iframe with the src set to the embed url, and the data-original-src set to the watch url", () => {
			let id = "12345";
			let embedVideo = this.youtubeExtractor.createEmbeddedVideoFromId(id);
			strictEqual(embedVideo.src, "https://www.youtube.com/embed/" + id,
				"The src should be set to the embed url");
			strictEqual(embedVideo.attributes.getNamedItem("data-original-src").value, "https://www.youtube.com/watch?v=" + id,
				"The data original src attribute should be set to the watch url");
		});

		test("createEmbeddedVideoFromId should return undefined if the input value is empty string or undefined", () => {
			strictEqual(this.youtubeExtractor.createEmbeddedVideoFromId(""), undefined);
			strictEqual(this.youtubeExtractor.createEmbeddedVideoFromId(undefined), undefined);
		});
	}

	private createDivWithEmbeddedVideos(ids: string[]): HTMLDivElement {
		let outerDiv = document.createElement("div") as HTMLDivElement;
		for (let i = 0; i < ids.length; i++) {
			let video = document.createElement("iframe") as HTMLIFrameElement;
			video.src = "https://www.youtube.com/embed/" + ids[i];
			outerDiv.appendChild(video);
		}
		return outerDiv;
	}
}

(new YoutubeVideoExtractorTests()).runTests();
