import {KhanAcademyVideoExtractor} from "../../scripts/domParsers/khanAcademyVideoExtractor";

import {TestModule} from "../testModule";

export class KhanAcademyVideoExtractorTests extends TestModule {
	private pageContentWithNoClipId = [
		undefined,
		"",
		"<div id='clip'> </div>", // no clip id
		"<div id='clip_abcdefg'> </div>" // invalid clip id
	];

	private pageContentWithHyphenatedVideoIds = [
		"<div id='video_8-5DTsl1V5k'> </div>", // standard
		"<div id = ' video_8-5DTsl1V5k ' > </div> ", // weird whitespace
		"<DIV ID='Video_8-5DTsl1V5k'> </DIV>", // weird casing
		"<div id=\"video_8-5DTsl1V5k\"> </div>" // double quotations,
	];

	private pageContentWithDataYoutubeIds = [
		"<div data-youtubeid='video_8-5DTsl1V5k'> </div>", // standard
		"<div data-youtubeid = ' video_8-5DTsl1V5k ' > </div> ", // weird whitespace
		"<DIV data-youtubeid='Video_8-5DTsl1V5k'> </DIV>", // weird casing
		"<div data-youtubeid=\"video_8-5DTsl1V5k\"> </div>" // double quotations
	];

	private pageContentWithMultipleHyphenatedVideoIds = [
		"<div id='video_8-5DTsl1V5k'></div> <DIV ID='video_8-53sl1V5k'></DIV> <div id='video_4ba196611'> </div>", // unique ids
		"<div id='video_8-5DTsl1V5k'></div> <DIV ID='video_8-53sl1V5k'></div> <DIV ID='video_8-53sl1V5k'></DIV> <div id='video_4ba196611'> </div>" // has a duplicate
	];

	private khanAcademyVideoExtractor = new KhanAcademyVideoExtractor();
	private pageUrl = "";

	protected module() {
		return "khanAcademyVideoExtractor";
	}

	protected tests() {
		test("createEmbeddedVimeosFromHtml should return a list of iframes with the src set to the embed url, and the data-original-src set to the watch url, given the html has hyphenated ids", () => {
			let expectedId = "8-5DTsl1V5k";
			for (let i = 0; i < this.pageContentWithHyphenatedVideoIds.length; i++) {
				let embedVideos = this.khanAcademyVideoExtractor.createEmbeddedVideosFromHtml(this.pageContentWithHyphenatedVideoIds[i]);
				strictEqual(embedVideos.length, 1, "There should be one returned iframe");

				strictEqual(embedVideos[0].src, "https://www.youtube.com/embed/" + expectedId,
					"The src should be set to the embed url");
				strictEqual(embedVideos[0].attributes.getNamedItem("data-original-src").value, "https://www.youtube.com/watch?v=" + expectedId,
					"The data original src attribute should be set to the watch url");
			}
		});

		test("createEmbeddedVimeosFromHtml should return a list of iframes with the src set to the embed url, and the data-original-src set to the watch url, given the html has data youtube ids", () => {
			let expectedId = "8-5DTsl1V5k";
			for (let i = 0; i < this.pageContentWithDataYoutubeIds.length; i++) {
				let embedVideos = this.khanAcademyVideoExtractor.createEmbeddedVideosFromHtml(this.pageContentWithDataYoutubeIds[i]);
				strictEqual(embedVideos.length, 1, "There should be one returned iframe");

				strictEqual(embedVideos[0].src, "https://www.youtube.com/embed/" + expectedId,
					"The src should be set to the embed url");
				strictEqual(embedVideos[0].attributes.getNamedItem("data-original-src").value, "https://www.youtube.com/watch?v=" + expectedId,
					"The data original src attribute should be set to the watch url");
			}
		});

		test("createEmbeddedVimeosFromHtml should a list of iframes with the src and data-original-src set to the player url with the clip id when there's more than 0 video in the html", () => {
			let expectedIds = [
				["8-5DTsl1V5k", "8-53sl1V5k", "4ba196611"],
				["8-5DTsl1V5k", "8-53sl1V5k", "8-53sl1V5k", "4ba196611"]
			];
			for (let i = 0; i < this.pageContentWithMultipleHyphenatedVideoIds.length; i++) {
				let embedVideos = this.khanAcademyVideoExtractor.createEmbeddedVideosFromHtml(this.pageContentWithMultipleHyphenatedVideoIds[i]);
				strictEqual(embedVideos.length, expectedIds[i].length, "There should be " + expectedIds[i].length + " iframes");

				for (let j = 0; j < expectedIds[i].length; j++) {
					strictEqual(embedVideos[j].src, "https://www.youtube.com/embed/" + expectedIds[i][j],
						"The src should be set to the embed url");
					strictEqual(embedVideos[j].attributes.getNamedItem("data-original-src").value, "https://www.youtube.com/watch?v=" + expectedIds[i][j],
						"The data original src attribute should be set to the watch url");
				}
			}
		});

		test("createEmbeddedVimeosFromHtml should return the empty list if there are no embed videos in the html", () => {
			let embedVideos = this.khanAcademyVideoExtractor.createEmbeddedVideosFromHtml("<div></div>");
			strictEqual(embedVideos.length, 0, "There should be 0 iframes in the returned");

			embedVideos = this.khanAcademyVideoExtractor.createEmbeddedVideosFromHtml("");
			strictEqual(embedVideos.length, 0, "There should be 0 iframes in the returned");
		});

		test("createEmbeddedVimeosFromHtml should return the empty list if there elements with invalid ids in the html", () => {
			for (let i = 0; i < this.pageContentWithNoClipId.length; i++) {
				let embedVideos = this.khanAcademyVideoExtractor.createEmbeddedVideosFromHtml(this.pageContentWithNoClipId[i]);
				strictEqual(embedVideos.length, 0, "There should be 0 iframes in the returned");
			}
		});

		test("createEmbeddedVimeosFromHtml should return the empty list if the html is undefined", () => {
			let embedVideos = this.khanAcademyVideoExtractor.createEmbeddedVideosFromHtml(undefined);
			strictEqual(embedVideos.length, 0, "There should be 0 iframes in the returned");
		});

		test("createEmbeddedVideoFromUrl should return undefined, as KhanAcademy does not host their own videos", () => {
			strictEqual(this.khanAcademyVideoExtractor.createEmbeddedVideoFromUrl("https://www.khanacademy.org"), undefined,
				"createEmbeddedVideoFromUrl should always return undefined");
			strictEqual(this.khanAcademyVideoExtractor.createEmbeddedVideoFromUrl("https://www.khanacademy.org/humanities/art-1010/beginners-guide-20-21/v/representation-abstraction-looking-at-millais-and-newman"), undefined,
				"createEmbeddedVideoFromUrl should always return undefined");
			strictEqual(this.khanAcademyVideoExtractor.createEmbeddedVideoFromUrl("https://www.khanacademy.org/college-admissions/applying-to-college/college-application-process/a/filling-out-the-college-application-common-application-walkthrough"), undefined,
				"createEmbeddedVideoFromUrl should always return undefined");
			strictEqual(this.khanAcademyVideoExtractor.createEmbeddedVideoFromUrl(""), undefined,
				"createEmbeddedVideoFromUrl should always return undefined");
			strictEqual(this.khanAcademyVideoExtractor.createEmbeddedVideoFromUrl(undefined), undefined,
				"createEmbeddedVideoFromUrl should always return undefined");
		});

		test("createEmbeddedVideoFromId should create an iframe with the src set to the embed url, and the data-original-src set to the watch url", () => {
			let id = "12345";
			let embedVideo = this.khanAcademyVideoExtractor.createEmbeddedVideoFromId(id);
			strictEqual(embedVideo.src, "https://www.youtube.com/embed/" + id,
				"The src should be set to the embed url");
			strictEqual(embedVideo.attributes.getNamedItem("data-original-src").value, "https://www.youtube.com/watch?v=" + id,
				"The data original src attribute should be set to the watch url");
		});

		test("createEmbeddedVideoFromId should return undefined if the input value is empty string or undefined", () => {
			strictEqual(this.khanAcademyVideoExtractor.createEmbeddedVideoFromId(""), undefined);
			strictEqual(this.khanAcademyVideoExtractor.createEmbeddedVideoFromId(undefined), undefined);
		});
	}
}

(new KhanAcademyVideoExtractorTests()).runTests();
