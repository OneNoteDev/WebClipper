import {VideoUtils} from "../../scripts/domParsers/videoUtils";
import {VimeoVideoExtractor} from "../../scripts/domParsers/vimeoVideoExtractor";

import {TestModule} from "../testModule";

export class VimeoVideoTests extends TestModule {
	private pageContentHtmlWrapperPrepend = "<html lang='en'> <body>";
	private pageContentHtmlWrapperAppend = "</body> </html>";

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
		"<div id='clip_45196609'></div> <DIV ID='clip_45196610'></DIV> <div id='clip_45196611'> </div>",
		"<div id='clip_45196609'></div> <DIV ID='clip_45196610'></DIV> <DIV ID='clip_45196609'></DIV><div id='clip_45196611'> </div>"
	];

	private pageUrl = "";
	private vimeoExtractor = new VimeoVideoExtractor();

	protected module() {
		return "vimeoExtractor";
	}

	protected tests() {
		test("getVimeoVideoSrcValues should return undefined when provided unsupported parameters for the Vimeo domain", () => {
			for (let pageContentSnippet of this.pageContentWithNoClipId) {
				let pageContent = this.pageContentHtmlWrapperPrepend + pageContentSnippet + this.pageContentHtmlWrapperAppend;
				let videoSrcUrls = this.vimeoExtractor.getVideoSrcValues(this.pageUrl, pageContent);
				deepEqual(videoSrcUrls, undefined, "pageContentSnippet: " + pageContentSnippet);
			}
		});

		test("getVimeoVideoSrcValues should return a url on supported Vimeo domain urls", () => {
			for (let pageContentSnippet of this.pageContentWithOneClipId) {
				let pageContent = this.pageContentHtmlWrapperPrepend + pageContentSnippet + this.pageContentHtmlWrapperAppend;
				let videoSrcUrls = this.vimeoExtractor.getVideoSrcValues(this.pageUrl, pageContent);
				deepEqual(videoSrcUrls, ["https://player.vimeo.com/video/45196609"], "pageContentSnippet: " + pageContentSnippet);
			}

			for (let pageContentSnippet of this.pageContentWithMultipleClipIds) {
				let pageContent = this.pageContentHtmlWrapperPrepend + pageContentSnippet + this.pageContentHtmlWrapperAppend;
				let videoSrcUrls = this.vimeoExtractor.getVideoSrcValues(this.pageUrl, pageContent);
				deepEqual(videoSrcUrls, ["https://player.vimeo.com/video/45196609", "https://player.vimeo.com/video/45196610", "https://player.vimeo.com/video/45196611"], "pageContentSnippet: " + pageContentSnippet);
			}
		});

		test("getVimeoVideoIds should return undefined for unsupported urls", () => {
			for (let pageContentSnippet of this.pageContentWithNoClipId) {
				let pageContent = this.pageContentHtmlWrapperPrepend + pageContentSnippet + this.pageContentHtmlWrapperAppend;
				let videoSrcUrls = this.vimeoExtractor.getVideoIds(this.pageUrl, pageContent);
				deepEqual(videoSrcUrls, undefined, "pageContentSnippet: " + pageContentSnippet);
			}
		});

		test("getVimeoVideoIds should return id for supported Vimeo video url", () => {
			for (let pageContentSnippet of this.pageContentWithOneClipId) {
				let pageContent = this.pageContentHtmlWrapperPrepend + pageContentSnippet + this.pageContentHtmlWrapperAppend;
				let videoSrcUrls = this.vimeoExtractor.getVideoIds(this.pageUrl, pageContent);
				deepEqual(videoSrcUrls, ["45196609"], "pageContentSnippet: " + pageContentSnippet);
			}

			for (let pageContentSnippet of this.pageContentWithMultipleClipIds) {
				let pageContent = this.pageContentHtmlWrapperPrepend + pageContentSnippet + this.pageContentHtmlWrapperAppend;
				let videoSrcUrls = this.vimeoExtractor.getVideoIds(this.pageUrl, pageContent);
				deepEqual(videoSrcUrls, ["45196609", "45196610", "45196611"], "pageContentSnippet: " + pageContentSnippet);
			}
		});
	}
}

(new VimeoVideoTests()).runTests();
