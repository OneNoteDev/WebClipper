/// <reference path="../../../typings/main/ambient/qunit/qunit.d.ts" />

import {VideoUtils} from "../../scripts/domParsers/videoUtils";
import {YoutubeVideoExtractor} from "../../scripts/domParsers/youtubeVideoExtractor";

let unsupportedOtherUrls = [
	"https://www.hulu.com/",
	"https://www.google.com/",
	undefined,
	""
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

let supportedYouTubeUrls = [
	"https://www.youtube.com/watch?v=dQw4w9WgXcQ",
	"https://www.youtube.com/watch?v=dQw4w9WgXcQ&feature=youtu.be&t=30s",
	"https://www.youtube.com/watch?v=dQw4w9WgXcQ#foo",
	"https://www.youtube.com/watch?feature=youtu.be&t=30s&v=dQw4w9WgXcQ",
	"https://m.youtube.com/watch?v=dQw4w9WgXcQ&feature=youtu.be",
	"https://www.youtube.com/embed/dQw4w9WgXcQ"
];

QUnit.module("youtubeExtractor");

let youtubeExtractor = new YoutubeVideoExtractor();

test("getVideoSrcValues should return undefined when provided unsupported parameters for the YouTube domain", () => {
	for (let otherUrl of unsupportedOtherUrls) {
		let videoSrcUrl = youtubeExtractor.getVideoSrcValues(otherUrl, "");
		deepEqual(videoSrcUrl, undefined, otherUrl + " is unsupported by YouTube domain");
	}

	for (let vimeoUrl of supportedVimeoUrls) {
		let videoSrcUrl = youtubeExtractor.getVideoSrcValues(vimeoUrl, "");
		deepEqual(videoSrcUrl, undefined, vimeoUrl + " is unsupported by YouTube domain");
	}

	for (let youTubeUrl of unsupportedYouTubeUrls) {
		let videoSrcUrl = youtubeExtractor.getVideoSrcValues(youTubeUrl, "");
		deepEqual(videoSrcUrl, undefined, youTubeUrl + " is in incorrect format for the pageUrl");
	}
});

test("getVideoSrcValues should return undefined when provided unsupported parameters for the YouTube domain", () => {
	for (let otherUrl of unsupportedOtherUrls) {
		let videoSrcUrl = youtubeExtractor.getVideoSrcValues(otherUrl, "");
		deepEqual(videoSrcUrl, undefined, otherUrl + " is unsupported by YouTube domain");
	}

	for (let vimeoUrl of supportedVimeoUrls) {
		let videoSrcUrl = youtubeExtractor.getVideoSrcValues(vimeoUrl, "");
		deepEqual(videoSrcUrl, undefined, vimeoUrl + " is unsupported by YouTube domain");
	}

	for (let youTubeUrl of unsupportedYouTubeUrls) {
		let videoSrcUrl = youtubeExtractor.getVideoSrcValues(youTubeUrl, "");
		deepEqual(videoSrcUrl, undefined, youTubeUrl + " is in incorrect format for the pageUrl");
	}
});

test("getVideoIds should return undefined for unsupported urls", () => {
	for (let pageUrl of unsupportedOtherUrls) {
		let videoId = youtubeExtractor.getVideoIds(pageUrl, "");
		deepEqual(videoId, undefined);
	}

	for (let pageUrl of supportedVimeoUrls) {
		let videoId = youtubeExtractor.getVideoIds(pageUrl, "");
		deepEqual(videoId, undefined);
	}

	for (let pageUrl of unsupportedYouTubeUrls) {
		let videoId = youtubeExtractor.getVideoIds(pageUrl, "");
		deepEqual(videoId, undefined);
	}
});

test("getVideoIds should return id for supported YouTube video url", () => {
	for (let pageUrl of supportedYouTubeUrls) {
		let videoId = youtubeExtractor.getVideoIds(pageUrl, "");
		deepEqual(videoId, ["dQw4w9WgXcQ"]);
	}
});
