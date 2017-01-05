import {VideoUtils} from "../../scripts/domParsers/videoUtils";
import {VimeoVideoExtractor} from "../../scripts/domParsers/vimeoVideoExtractor";

import {TestModule} from "../testModule";

export class VimeoVideoExtractorTests extends TestModule {
	private pageContentWithOneClipId = [
		"<div id='clip_45196609'> </div>", // standard
		"<div id = ' clip_45196609 ' > </div> ", // weird whitespace
		"<DIV ID='Clip_45196609'> </DIV>", // weird casing
		"<div id=\"clip_45196609\"> </div>" // double quotations
	];

	private pageContentWithNoClipId = [
		undefined,
		"",
		"<div id='clip'> </div>", // no clip id
		"<div id='clip_abcdefg'> </div>" // invalid clip id
	];

	private pageContentWithMultipleClipIds = [
		"<div id='clip_45196609'></div> <DIV ID='clip_45196610'></DIV> <div id='clip_45196611'> </div>", // unique ids
		"<div id='clip_45196609'></div> <DIV ID='clip_45196610'></DIV> <DIV ID='clip_45196609'></DIV><div id='clip_45196611'> </div>" // has a duplicate
	];

	private pageUrl = "";
	private vimeoExtractor = new VimeoVideoExtractor();

	protected module() {
		return "vimeoVideoExtractor";
	}

	protected tests() {
		test("createEmbeddedVimeosFromHtml should a list of iframes with the src and data-original-src set to the player url with the clip id", () => {
			let expectedId = "45196609";
			for (let pageContentSnippet of this.pageContentWithOneClipId) {
				let embedVideos = this.vimeoExtractor.createEmbeddedVideosFromHtml(pageContentSnippet);
				strictEqual(embedVideos.length, 1, "There should be one iframe");
				strictEqual(embedVideos[0].src, "https://player.vimeo.com/video/" + expectedId,
					"The src should be set to the player url");
				strictEqual(embedVideos[0].attributes.getNamedItem("data-original-src").value, "https://player.vimeo.com/video/" + expectedId,
					"The data original src attribute should be set to the player url");
			}
		});

		test("createEmbeddedVimeosFromHtml should a list of iframes with the src and data-original-src set to the player url with the clip id when there's more than 0 video in the html", () => {
			let expectedIds = [
				["45196609", "45196610", "45196611"],
				["45196609", "45196610", "45196609", "45196611"]
			];
			for (let i = 0; i < this.pageContentWithMultipleClipIds.length; i++) {
				let embedVideos = this.vimeoExtractor.createEmbeddedVideosFromHtml(this.pageContentWithMultipleClipIds[i]);
				strictEqual(embedVideos.length, expectedIds[i].length, "There should be " + expectedIds[i].length + " iframes");

				for (let j = 0; j < expectedIds[i].length; j++) {
					strictEqual(embedVideos[j].src, "https://player.vimeo.com/video/" + expectedIds[i][j],
						"The src should be set to the player url");
					strictEqual(embedVideos[j].attributes.getNamedItem("data-original-src").value, "https://player.vimeo.com/video/" + expectedIds[i][j],
						"The data original src attribute should be set to the player url");
				}
			}
		});

		test("createEmbeddedVimeosFromHtml should return the empty list if there are no embed videos in the html", () => {
			let embedVideos = this.vimeoExtractor.createEmbeddedVideosFromHtml("<div></div>");
			strictEqual(embedVideos.length, 0, "There should be 0 iframes in the returned");

			embedVideos = this.vimeoExtractor.createEmbeddedVideosFromHtml("");
			strictEqual(embedVideos.length, 0, "There should be 0 iframes in the returned");
		});

		test("createEmbeddedVimeosFromHtml should return the empty list if the html is undefined", () => {
			let embedVideos = this.vimeoExtractor.createEmbeddedVideosFromHtml(undefined);
			strictEqual(embedVideos.length, 0, "There should be 0 iframes in the returned");
		});

		test("createEmbedVideoFromUrl should return an iframe with the src set to the player url, and the data-original-src set to the player url", () => {
			let embedVideo = this.vimeoExtractor.createEmbeddedVideoFromUrl("https://vimeo.com/193851364");
			strictEqual(embedVideo.src, "https://player.vimeo.com/video/193851364",
				"The src should be set to the player url");
			strictEqual(embedVideo.attributes.getNamedItem("data-original-src").value, "https://player.vimeo.com/video/193851364",
				"The data original src attribute should be set to the player url");
		});

		test("createEmbedVideoFromUrl should return an iframe with the src set to the player url without query parameters, and the data-original-src set to the player url", () => {
			let embedVideo = this.vimeoExtractor.createEmbeddedVideoFromUrl("https://vimeo.com/193851364?foo=134");
			strictEqual(embedVideo.src, "https://player.vimeo.com/video/193851364",
				"The src should be set to the player url");
			strictEqual(embedVideo.attributes.getNamedItem("data-original-src").value, "https://player.vimeo.com/video/193851364",
				"The data original src attribute should be set to the player url");
		});

		test("createEmbeddedVideoFromUrl should return undefined when provided unsupported parameters for the Vimeo domain", () => {
			let embedVideo = this.vimeoExtractor.createEmbeddedVideoFromUrl("https://vimeo.com/ondemand/lifeanimated");
			strictEqual(embedVideo, undefined, "The returned iframe should be undefined");

			embedVideo = this.vimeoExtractor.createEmbeddedVideoFromUrl("https://vimeo.com");
			strictEqual(embedVideo, undefined, "The returned iframe should be undefined");
		});

		test("createEmbeddedVideoFromUrl should return undefined if the input value is empty string or undefined", () => {
			strictEqual(this.vimeoExtractor.createEmbeddedVideoFromUrl(""), undefined);
			strictEqual(this.vimeoExtractor.createEmbeddedVideoFromUrl(undefined), undefined);
		});

		test("createEmbeddedVideoFromId should create an iframe with the src set to the player url, and the data-original-src set to the player url", () => {
			let id = "12345";
			let embedVideo = this.vimeoExtractor.createEmbeddedVideoFromId(id);
			strictEqual(embedVideo.src, "https://player.vimeo.com/video/" + id,
				"The src should be set to the embed url");
			strictEqual(embedVideo.attributes.getNamedItem("data-original-src").value, "https://player.vimeo.com/video/" + id,
				"The data original src attribute should be set to the watch url");
		});

		test("createEmbeddedVideoFromId should return undefined if the input value is empty string or undefined", () => {
			strictEqual(this.vimeoExtractor.createEmbeddedVideoFromId(""), undefined);
			strictEqual(this.vimeoExtractor.createEmbeddedVideoFromId(undefined), undefined);
		});
	}
}

(new VimeoVideoExtractorTests()).runTests();
