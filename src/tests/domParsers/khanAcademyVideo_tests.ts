/// <reference path="../../../typings/main/ambient/qunit/qunit.d.ts" />

import {VideoUtils} from "../../scripts/domParsers/videoUtils";

let supportedKhanAcademyUrls = [
	"https://www.khanacademy.org/humanities/art-1010/beginners-guide-20-21/v/representation-abstraction-looking-at-millais-and-newman",
	"https://www.khanacademy.org/computing/computer-programming/programming/intro-to-programming/v/programming-intro",
	"https://www.khanacademy.org/college-admissions/applying-to-college/introduction-atc/v/sal-khans-story-applying-to-college"
];

let unsupportedKhanAcademyUrls = [
	"https://www.khanacademy.org",
	"https://www.khanacademy.org/college-admissions/applying-to-college/college-application-process/a/filling-out-the-college-application-common-application-walkthrough",
	"https://www.khanacademy.org/college-admissions/applying-to-college?ref=our_favorite_topics"
];

let pageContentHtmlWrapperPrepend = "<html lang='en'> <body>";
let pageContentHtmlWrapperAppend = "</body> </html>";

let pageContentWithNoClipId = [
	undefined,
	"",
	"<div id='clip'> </div>", // no clip id
	"<div id='clip_abcdefg'> </div>" // invalid clip id
];

let pageContentWithHyphenatedVideoIds = [
	"<div id='video_8-5DTsl1V5k'> </div>", // standard
	"<div id = ' video_8-5DTsl1V5k ' > </div> ", // weird whitespace
	"<DIV ID='Video_8-5DTsl1V5k'> </DIV>", // weird casing
	"<div id=\"video_8-5DTsl1V5k\"> </div>", // double quotations,
];

let pageContentWithDataYoutubeIds = [
	"<div data-youtubeid='video_8-5DTsl1V5k'> </div>", // standard
	"<div data-youtubeid = ' video_8-5DTsl1V5k ' > </div> ", // weird whitespace
	"<DIV data-youtubeid='Video_8-5DTsl1V5k'> </DIV>", // weird casing
	"<div data-youtubeid=\"video_8-5DTsl1V5k\"> </div>" // double quotations
];

let pageContentWithMultipleHyphenatedVideoIds = [
	"<div id='video_8-5DTsl1V5k'></div> <DIV ID='video_8-53sl1V5k'></DIV> <div id='video_4ba196611'> </div>",
];

QUnit.module("videoUtils");

test("videoDomainIfSupported", () => {
	for (let pageUrl of unsupportedKhanAcademyUrls) {
		let domain = VideoUtils.videoDomainIfSupported(pageUrl);
		strictEqual(domain, undefined, pageUrl + " should NOT be supported");
	}

	for (let pageUrl of supportedKhanAcademyUrls) {
		let domain = VideoUtils.videoDomainIfSupported(pageUrl);
		strictEqual(domain, VideoUtils.SupportedVideoDomains[VideoUtils.SupportedVideoDomains.KhanAcademy],
			pageUrl + " should be supported");
	}
});

test("getKhanAcademyVideoSrcValue should return undefined when provided unsupported parameters for the KhanAcademy domain", () => {
	for (let pageContentSnippet of pageContentWithNoClipId) {
		let pageContent = pageContentHtmlWrapperPrepend + pageContentSnippet + pageContentHtmlWrapperAppend;
		let videoSrcUrl = VideoUtils.getKhanAcademyVideoSrcValue(pageContent);
		deepEqual(videoSrcUrl, undefined, "pageContentSnippet: " + pageContentSnippet);
	}
});

test("getKhanAcademyVideoSrcValue should return a url on supported KhanAcademy domain urls", () => {
	for (let pageContentSnippet of pageContentWithHyphenatedVideoIds) {
		let pageContent = pageContentHtmlWrapperPrepend + pageContentSnippet + pageContentHtmlWrapperAppend;
		let videoSrcUrl = VideoUtils.getKhanAcademyVideoSrcValue(pageContent);
		strictEqual(videoSrcUrl, "https://www.youtube.com/embed/8-5DTsl1V5k", "pageContentSnippet: " + pageContentSnippet);
	}

	for (let pageContentSnippet of pageContentWithMultipleHyphenatedVideoIds) {
		let pageContent = pageContentHtmlWrapperPrepend + pageContentSnippet + pageContentHtmlWrapperAppend;
		let videoSrcUrl = VideoUtils.getKhanAcademyVideoSrcValue(pageContent);
		strictEqual(videoSrcUrl, "https://www.youtube.com/embed/8-5DTsl1V5k", "pageContentSnippet: " + pageContentSnippet);
	}
});

test("getKhanAcademyVideoIds should return undefined for unsupported urls", () => {
	for (let pageContentSnippet of pageContentWithNoClipId) {
		let pageContent = pageContentHtmlWrapperPrepend + pageContentSnippet + pageContentHtmlWrapperAppend;
		let videoSrcUrls = VideoUtils.getKhanAcademyVideoIds(pageContent);
		deepEqual(videoSrcUrls, undefined, "pageContentSnippet: " + pageContentSnippet);
	}
});

test("getKhanAcademyVideoIds should return id for supported KhanAcademy video url", () => {
	for (let pageContentSnippet of pageContentWithHyphenatedVideoIds) {
		let pageContent = pageContentHtmlWrapperPrepend + pageContentSnippet + pageContentHtmlWrapperAppend;
		let videoSrcUrls = VideoUtils.getKhanAcademyVideoIds(pageContent);
		deepEqual(videoSrcUrls, ["8-5DTsl1V5k"], "pageContentSnippet: " + pageContentSnippet);
	}

	for (let pageContentSnippet of pageContentWithMultipleHyphenatedVideoIds) {
		let pageContent = pageContentHtmlWrapperPrepend + pageContentSnippet + pageContentHtmlWrapperAppend;
		let videoSrcUrls = VideoUtils.getKhanAcademyVideoIds(pageContent);
		deepEqual(videoSrcUrls, ["8-5DTsl1V5k", "8-53sl1V5k", "4ba196611"], "pageContentSnippet: " + pageContentSnippet);
	}
});
