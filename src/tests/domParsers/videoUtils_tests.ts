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
