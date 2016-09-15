/// <reference path="../../../typings/main/ambient/qunit/qunit.d.ts" />

import {VideoUtils} from "../../scripts/domParsers/videoUtils";

let supportedYouTubeUrls = [
	"https://www.youtube.com/watch?v=dQw4w9WgXcQ",
	"https://www.youtube.com/watch?v=dQw4w9WgXcQ&feature=youtu.be&t=30s",
	"https://www.youtube.com/watch?v=dQw4w9WgXcQ#foo",
	"https://www.youtube.com/watch?feature=youtu.be&t=30s&v=dQw4w9WgXcQ",
	"https://m.youtube.com/watch?v=dQw4w9WgXcQ&feature=youtu.be",
	"https://www.youtube.com/embed/dQw4w9WgXcQ"
];
let supportedVimeoUrls = [
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
let unsupportedYouTubeUrls = [
	"https://www.youtube.com/",
	"https://www.youtube.com/channel/UC38IQsAvIsxxjztdMZQtwHA"
];
let unsupportedVimeoUrls = [
	"https://www.vimeo.com/",
	"https://vimeo.com/user12402347",
	"https://vimeo.com/ondemand/reeltoreal", // TODO can we support this one?
	"https://vimeo.com/45196609/collections/channels"
];

let unsupportedOtherUrls = [
	"https://www.hulu.com/",
	"https://www.google.com/",
	undefined,
	""
];

let pageContentHtmlWrapperPrepend = "<html lang='en'> <body>";
let pageContentHtmlWrapperAppend = "</body> </html>";

let pageContentWithOneClipId = [
	"<div id='clip_45196609'> </div>", // standard
	"<div id = ' clip_45196609 ' > </div> ", // weird whitespace
	"<DIV ID='Clip_45196609'> </DIV>", // weird casing
	"<div id=\"clip_45196609\"> </div>" // double quotations
];
let pageContentWithNoClipId = [
	undefined,
	"",
	"<div id='clip'> </div>", // no clip id
	"<div id='clip_abcdefg'> </div>" // invalid clip id
];

let pageContentWithMultipleClipIds = [
	"<div id='clip_45196609'></div> <DIV ID='clip_45196610'></DIV> <div id='clip_45196611'> </div>",
	"<div id='clip_45196609'></div> <DIV ID='clip_45196610'></DIV> <DIV ID='clip_45196609'></DIV><div id='clip_45196611'> </div>"
];

QUnit.module("videoUtils");

test("videoDomainIfSupported", () => {
	for (let pageUrl of unsupportedYouTubeUrls) {
		let domain = VideoUtils.videoDomainIfSupported(pageUrl);
		strictEqual(domain, undefined, pageUrl + " should NOT be supported");
	}

	for (let pageUrl of unsupportedVimeoUrls) {
		let domain = VideoUtils.videoDomainIfSupported(pageUrl);
		strictEqual(domain, undefined, pageUrl + " should NOT be supported");
	}

	for (let pageUrl of unsupportedOtherUrls) {
		let domain = VideoUtils.videoDomainIfSupported(pageUrl);
		strictEqual(domain, undefined, pageUrl + " should NOT be supported");
	}

	for (let pageUrl of supportedYouTubeUrls) {
		let domain = VideoUtils.videoDomainIfSupported(pageUrl);
		strictEqual(domain,	VideoUtils.SupportedVideoDomains[VideoUtils.SupportedVideoDomains.YouTube],
			pageUrl + " should be supported");
	}

	for (let pageUrl of supportedVimeoUrls) {
		let domain = VideoUtils.videoDomainIfSupported(pageUrl);
		strictEqual(domain,	VideoUtils.SupportedVideoDomains[VideoUtils.SupportedVideoDomains.Vimeo],
			pageUrl + " should be supported");
	}
});

test("getYouTubeVideoSrcValue should return undefined when provided unsupported parameters for the YouTube domain", () => {
	for (let otherUrl of unsupportedOtherUrls) {
		let videoSrcUrl = VideoUtils.getYouTubeVideoSrcValue(otherUrl);
		strictEqual(videoSrcUrl, undefined, otherUrl + " is unsupported by YouTube domain");
	}

	for (let vimeoUrl of supportedVimeoUrls) {
		let videoSrcUrl = VideoUtils.getYouTubeVideoSrcValue(vimeoUrl);
		strictEqual(videoSrcUrl, undefined, vimeoUrl + " is unsupported by YouTube domain");
	}

	for (let youTubeUrl of unsupportedYouTubeUrls) {
		let videoSrcUrl = VideoUtils.getYouTubeVideoSrcValue(youTubeUrl);
		strictEqual(videoSrcUrl, undefined, youTubeUrl + " is in incorrect format for the pageUrl");
	}
});

test("getVimeoVideoSrcValues should return undefined when provided unsupported parameters for the Vimeo domain", () => {
	for (let pageContentSnippet of pageContentWithNoClipId) {
		let pageContent = pageContentHtmlWrapperPrepend + pageContentSnippet + pageContentHtmlWrapperAppend;
		let videoSrcUrls = VideoUtils.getVimeoVideoSrcValues(pageContent);
		deepEqual(videoSrcUrls, undefined, "pageContentSnippet: " + pageContentSnippet);
	}
});

test("getYouTubeVideoSrcValue should return a url on supported YouTube domain urls", () => {
	for (let pageUrl of supportedYouTubeUrls) {
		let videoSrcUrl = VideoUtils.getYouTubeVideoSrcValue(pageUrl);
		strictEqual(videoSrcUrl, "https://www.youtube.com/embed/dQw4w9WgXcQ", "pageUrl param: " + pageUrl);
	}
});

test("getVimeoVideoSrcValues should return a url on supported Vimeo domain urls", () => {
	for (let pageContentSnippet of pageContentWithOneClipId) {
		let pageContent = pageContentHtmlWrapperPrepend + pageContentSnippet + pageContentHtmlWrapperAppend;
		let videoSrcUrls = VideoUtils.getVimeoVideoSrcValues(pageContent);
		deepEqual(videoSrcUrls, ["https://player.vimeo.com/video/45196609"], "pageContentSnippet: " + pageContentSnippet);
	}

	for (let pageContentSnippet of pageContentWithMultipleClipIds) {
		let pageContent = pageContentHtmlWrapperPrepend + pageContentSnippet + pageContentHtmlWrapperAppend;
		let videoSrcUrls = VideoUtils.getVimeoVideoSrcValues(pageContent);
		deepEqual(videoSrcUrls, ["https://player.vimeo.com/video/45196609", "https://player.vimeo.com/video/45196610", "https://player.vimeo.com/video/45196611"], "pageContentSnippet: " + pageContentSnippet);
	}
});

test("getYouTubeVideoId should return undefined for unsupported urls", () => {
	for (let pageUrl of unsupportedOtherUrls) {
		let videoId = VideoUtils.getYouTubeVideoId(pageUrl);
		strictEqual(videoId, undefined);
	}

	for (let pageUrl of supportedVimeoUrls) {
		let videoId = VideoUtils.getYouTubeVideoId(pageUrl);
		strictEqual(videoId, undefined);
	}

	for (let pageUrl of unsupportedYouTubeUrls) {
		let videoId = VideoUtils.getYouTubeVideoId(pageUrl);
		strictEqual(videoId, undefined);
	}
});

test("getYouTubeVideoId should return id for supported YouTube video url", () => {
	for (let pageUrl of supportedYouTubeUrls) {
		let videoId = VideoUtils.getYouTubeVideoId(pageUrl);
		strictEqual(videoId, "dQw4w9WgXcQ");
	}
});

test("getVimeoVideoIds should return undefined for unsupported urls", () => {
	for (let pageContentSnippet of pageContentWithNoClipId) {
		let pageContent = pageContentHtmlWrapperPrepend + pageContentSnippet + pageContentHtmlWrapperAppend;
		let videoSrcUrls = VideoUtils.getVimeoVideoIds(pageContent);
		deepEqual(videoSrcUrls, undefined, "pageContentSnippet: " + pageContentSnippet);
	}
});

test("getVimeoVideoIds should return id for supported Vimeo video url", () => {
	for (let pageContentSnippet of pageContentWithOneClipId) {
		let pageContent = pageContentHtmlWrapperPrepend + pageContentSnippet + pageContentHtmlWrapperAppend;
		let videoSrcUrls = VideoUtils.getVimeoVideoIds(pageContent);
		deepEqual(videoSrcUrls, ["45196609"], "pageContentSnippet: " + pageContentSnippet);
	}

	for (let pageContentSnippet of pageContentWithMultipleClipIds) {
		let pageContent = pageContentHtmlWrapperPrepend + pageContentSnippet + pageContentHtmlWrapperAppend;
		let videoSrcUrls = VideoUtils.getVimeoVideoIds(pageContent);
		deepEqual(videoSrcUrls, ["45196609", "45196610", "45196611"], "pageContentSnippet: " + pageContentSnippet);
	}
});
