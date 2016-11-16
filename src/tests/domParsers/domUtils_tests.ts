import {DomUtils} from "../../scripts/domParsers/domUtils";
import {AugmentationHelper} from "../../scripts/contentCapture/augmentationHelper";
import {Constants} from "../../scripts/constants";
import {HelperFunctions} from "../helperFunctions";
import {DataUrls} from "../clipperUI/regionSelector_tests_dataUrls";

import {TestModule} from "../testModule";

export class DomUtilsTests extends TestModule {
	private fixture: HTMLDivElement;

	protected module() {
		return "domUtils";
	}

	protected beforeEach() {
		// Since some of the domUtils functions expect a document object parameter, we will add
		// all our test elements to the fixture before passing in the document object.
		this.fixture = HelperFunctions.getFixture() as HTMLDivElement;
	}

	protected tests() {
		test("removeClipperElements should remove the root script iframe", () => {
			this.fixture.appendChild(this.createRootScriptIFrame());
			ok(document.getElementById(Constants.Ids.clipperRootScript),
				"Sanity check: the root script iframe should be present before the removeClipperElements call");

			DomUtils.removeClipperElements(document);
			ok(!document.getElementById(Constants.Ids.clipperRootScript),
				"The root script iframe should be removed");
		});

		test("removeClipperElements should remove the UI iframe", () => {
			this.fixture.appendChild(this.createUiIFrame());
			ok(document.getElementById(Constants.Ids.clipperUiFrame),
				"Sanity check: the UI iframe should be present before the removeClipperElements call");

			DomUtils.removeClipperElements(document);
			ok(!document.getElementById(Constants.Ids.clipperUiFrame),
				"The UI iframe should be removed");
		});

		test("removeClipperElements should remove the Ext iframe", () => {
			this.fixture.appendChild(this.createExtIFrame());
			ok(document.getElementById(Constants.Ids.clipperExtFrame),
				"Sanity check: the Ext iframe should be present before the removeClipperElements call");

			DomUtils.removeClipperElements(document);
			ok(!document.getElementById(Constants.Ids.clipperExtFrame),
				"The Ext iframe should be removed");
		});

		test("removeClipperElements should remove all Web Clipper iframes", () => {
			this.fixture.appendChild(this.createRootScriptIFrame());
			this.fixture.appendChild(this.createUiIFrame());
			this.fixture.appendChild(this.createExtIFrame());

			DomUtils.removeClipperElements(document);
			ok(!document.getElementById(Constants.Ids.clipperRootScript),
				"The root script iframe should be removed");
			ok(!document.getElementById(Constants.Ids.clipperUiFrame),
				"The UI iframe should be removed");
			ok(!document.getElementById(Constants.Ids.clipperExtFrame),
				"The Ext iframe should be removed");
		});

		test("removeClipperElements should remove all Web Clipper iframes, but not an arbitrary iframe", () => {
			this.fixture.appendChild(this.createRootScriptIFrame());
			this.fixture.appendChild(this.createUiIFrame());
			this.fixture.appendChild(this.createExtIFrame());

			let arbitraryIframe = document.createElement("iframe") as HTMLIFrameElement;
			let arbitraryIframeId = "whatever";
			arbitraryIframe.id = arbitraryIframeId;
			arbitraryIframe.src = "https://www.mywebsite.doesnotexist";
			this.fixture.appendChild(arbitraryIframe);

			ok(document.getElementById(arbitraryIframeId),
				"Sanity check: the non Web Clipper iframe should be present");

			DomUtils.removeClipperElements(document);

			ok(!document.getElementById(Constants.Ids.clipperRootScript),
				"The root script iframe should be removed");
			ok(!document.getElementById(Constants.Ids.clipperUiFrame),
				"The UI iframe should be removed");
			ok(!document.getElementById(Constants.Ids.clipperExtFrame),
				"The Ext iframe should be removed");

			ok(document.getElementById(arbitraryIframeId),
				"The non Web Clipper iframe should still be present");
		});

		test("removeUnwantedElements should remove elements with tags that we don't support in full page mode", () => {
			let tagsNotSupportedForFullPage = ["script", "noscript"];
			for (let i = 0; i < tagsNotSupportedForFullPage.length; i++) {
				let element = document.createElement(tagsNotSupportedForFullPage[i]);
				element.id = tagsNotSupportedForFullPage[i];
				this.fixture.appendChild(element);
			}

			DomUtils.removeUnwantedElements(document);

			for (let i = 0; i < tagsNotSupportedForFullPage.length; i++) {
				ok(!document.getElementById(tagsNotSupportedForFullPage[i]),
					"The element should no longer be present in the document");
			}
		});

		test("removeUnwantedElements should not remove elements with tags that we support in full page mode", () => {
			// Example subset
			let tagsSupportedForFullPage = ["applet", "img", "div", "style", "svg", "video"];
			for (let i = 0; i < tagsSupportedForFullPage.length; i++) {
				let element = document.createElement(tagsSupportedForFullPage[i]);
				element.id = tagsSupportedForFullPage[i];
				this.fixture.appendChild(element);
			}

			DomUtils.removeUnwantedElements(document);

			for (let i = 0; i < tagsSupportedForFullPage.length; i++) {
				ok(document.getElementById(tagsSupportedForFullPage[i]),
					"The element should still be present in the document");
			}
		});

		test("removeUnwantedElements should not remove elements with tags that we support in full page mode when the " +
			"document has both supported and unsupported elements", () => {
			let tagsNotSupportedForFullPage = ["script", "noscript"];
			for (let i = 0; i < tagsNotSupportedForFullPage.length; i++) {
				let element = document.createElement(tagsNotSupportedForFullPage[i]);
				element.id = tagsNotSupportedForFullPage[i];
				this.fixture.appendChild(element);
			}

			// Example subset
			let tagsSupportedForFullPage = ["applet", "img", "div", "style", "svg", "video"];
			for (let i = 0; i < tagsSupportedForFullPage.length; i++) {
				let element = document.createElement(tagsSupportedForFullPage[i]);
				element.id = tagsSupportedForFullPage[i];
				this.fixture.appendChild(element);
			}

			DomUtils.removeUnwantedElements(document);

			for (let i = 0; i < tagsNotSupportedForFullPage.length; i++) {
				ok(!document.getElementById(tagsNotSupportedForFullPage[i]),
					"The element should no longer be present in the document");
			}

			for (let i = 0; i < tagsSupportedForFullPage.length; i++) {
				ok(document.getElementById(tagsSupportedForFullPage[i]),
					"The element should still be present in the document");
			}
		});

		test("removeUnwantedAttributes should remove the srcset on images without modifying other attributes", () => {
			let image = document.createElement("img") as HTMLImageElement;
			let id = "IMG";
			image.id = id;
			let src = "https://cdn.mywebsite.doesnotexist";
			image.setAttribute("src", src);
			image.setAttribute("srcset", "asdfasdf");
			this.fixture.appendChild(image);

			DomUtils.removeUnwantedAttributes(document);

			let imageFromDocument = document.getElementById(id) as HTMLImageElement;
			ok(imageFromDocument, "The image should still exist");
			ok(!(imageFromDocument.getAttribute("srcset") || imageFromDocument.srcset),
				"The srcset attribute should no longer be present");
			strictEqual((imageFromDocument.getAttribute("src") || imageFromDocument.src), src,
				"The src attribute should be unmodified");
		});

		test("removeUnwantedAttributes should remove the srcset on images without modifying other attributes " +
			"in the case of multiple images", () => {
			let numberOfImages = 3;
			let src = "https://cdn.mywebsite.doesnotexist";
			for (let i = 0; i < numberOfImages; i++) {
				let image = document.createElement("img") as HTMLImageElement;
				let id = "IMG" + i;
				image.id = id;
				image.setAttribute("src", src);
				image.setAttribute("srcset", "asdfasdf" + i);
				this.fixture.appendChild(image);
			}

			DomUtils.removeUnwantedAttributes(document);

			for (let i = 0; i < numberOfImages; i++) {
				let imageFromDocument = document.getElementById("IMG" + i) as HTMLImageElement;
				ok(imageFromDocument, "The image should still exist");
				ok(!(imageFromDocument.getAttribute("srcset") || imageFromDocument.srcset),
					"The srcset attribute should no longer be present");
				strictEqual((imageFromDocument.getAttribute("src") || imageFromDocument.src), src,
					"The src attribute should be unmodified");
			}
		});

		let vimeoPageContentWithNoClipId = "";
		let vimeoPageContentWithOneClipId = "<div id='clip_45196609'> </div>";
		let vimeoPageContentWithMultipleClipIds = "<div id='clip_45196609'></div> <DIV ID='clip_45196610'></DIV> <div id='clip_45196611'> </div>";
		test("addEmbeddedVideosWhereSupported should resolve with a video url on supported YouTube subdomains even if MainArticleContainer is undefined", (assert: QUnitAssert) => {
			let done = assert.async();

			let previewElement = AugmentationHelper.getArticlePreviewElement(document);

			let pageUrl = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";
			let embedUrl = "https://www.youtube.com/embed/dQw4w9WgXcQ";
			DomUtils.addEmbeddedVideosWhereSupported(previewElement, vimeoPageContentWithOneClipId, pageUrl).then((videoSrcUrls: DomUtils.EmbeddedVideoIFrameSrcs[]) => {
				strictEqual(videoSrcUrls[0].dataOriginalSrcAttribute, pageUrl);
				strictEqual(videoSrcUrls[0].srcAttribute, embedUrl);
			}, (error: OneNoteApi.GenericError) => {
				ok(false, "reject should not be called");
			}).then(() => {
				done();
			});
		});

		test("addEmbeddedVideosWhereSupported should resolve with a video url on supported YouTube subdomains", (assert: QUnitAssert) => {
			let done = assert.async();

			this.fixture.appendChild(this.createMainArticleContainer());
			let previewElement = AugmentationHelper.getArticlePreviewElement(document);

			let pageUrl = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";
			let embedUrl = "https://www.youtube.com/embed/dQw4w9WgXcQ";
			DomUtils.addEmbeddedVideosWhereSupported(previewElement, vimeoPageContentWithOneClipId, pageUrl).then((videoSrcUrls: DomUtils.EmbeddedVideoIFrameSrcs[]) => {
				strictEqual(videoSrcUrls[0].dataOriginalSrcAttribute, pageUrl);
				strictEqual(videoSrcUrls[0].srcAttribute, embedUrl);
			}, (error: OneNoteApi.GenericError) => {
				ok(false, "reject should not be called");
			}).then(() => {
				done();
			});
		});

		test("addEmbeddedVideosWhereSupported should resolve with a video url on supported Vimeo subdomains", (assert: QUnitAssert) => {
			let done = assert.async();

			this.fixture.appendChild(this.createMainArticleContainer());
			let previewElement = AugmentationHelper.getArticlePreviewElement(document);

			DomUtils.addEmbeddedVideosWhereSupported(previewElement, vimeoPageContentWithOneClipId, "https://vimeo.com/45196609").then((videoSrcUrls: DomUtils.EmbeddedVideoIFrameSrcs[]) => {
				let embedUrl = "https://player.vimeo.com/video/45196609";
				strictEqual(videoSrcUrls[0].dataOriginalSrcAttribute, embedUrl);
				strictEqual(videoSrcUrls[0].srcAttribute, embedUrl);
			}, (error: OneNoteApi.GenericError) => {
				ok(false, "reject should not be called");
			}).then(() => {
				done();
			});
		});

		test("addEmbeddedVideosWhereSupported should resolve with multiple video urls on supported Vimeo subdomains with multiple videos", (assert: QUnitAssert) => {
			let done = assert.async();

			this.fixture.appendChild(this.createMainArticleContainer());
			let previewElement = AugmentationHelper.getArticlePreviewElement(document);

			DomUtils.addEmbeddedVideosWhereSupported(previewElement, vimeoPageContentWithMultipleClipIds, "https://vimeo.com/album/3637653/").then((videoSrcUrls: DomUtils.EmbeddedVideoIFrameSrcs[]) => {
				let expectedVideoIds = ["45196609", "45196610", "45196611"];
				for (let i = 0; i < expectedVideoIds.length; i++) {
					let expectedUrl = "https://player.vimeo.com/video/" + expectedVideoIds[i];
					strictEqual(videoSrcUrls[i].dataOriginalSrcAttribute, expectedUrl, "expected dataOriginalSrcAttribute: " + expectedUrl);
					strictEqual(videoSrcUrls[i].srcAttribute, expectedUrl, "expected srcAttribute: " + expectedUrl);
				}
			}, (error: OneNoteApi.GenericError) => {
				ok(false, "reject should not be called");
			}).then(() => {
				done();
			});
		});

		test("addEmbeddedVideosWhereSupported should resolve undefined on unsupported domains", (assert: QUnitAssert) => {
			let done = assert.async();

			this.fixture.appendChild(this.createMainArticleContainer());
			let previewElement = AugmentationHelper.getArticlePreviewElement(document);

			DomUtils.addEmbeddedVideosWhereSupported(previewElement, vimeoPageContentWithOneClipId, "https://www.google.com/").then((videoSrcUrls: DomUtils.EmbeddedVideoIFrameSrcs[]) => {
				strictEqual(videoSrcUrls, undefined);
			}, (error: OneNoteApi.GenericError) => {
				ok(false, "reject should not be called");
			}).then(() => {
				DomUtils.addEmbeddedVideosWhereSupported(previewElement, vimeoPageContentWithOneClipId, "https://www.youtube.com/channel/UC38IQsAvIsxxjztdMZQtwHA").then((videoSrcUrls: DomUtils.EmbeddedVideoIFrameSrcs[]) => {
					strictEqual(videoSrcUrls, undefined);
				}, (error: OneNoteApi.GenericError) => {
					ok(false, "reject should not be called");
				}).then(() => {
					DomUtils.addEmbeddedVideosWhereSupported(previewElement, vimeoPageContentWithOneClipId, "https://www.vimeo.com/").then((videoSrcUrls: DomUtils.EmbeddedVideoIFrameSrcs[]) => {
						strictEqual(videoSrcUrls, undefined);
					}, (error: OneNoteApi.GenericError) => {
						ok(false, "reject should not be called");
					}).then(() => {
						done();
					});
				});
			});
		});

		test("addEmbeddedVideosWhereSupported should reject on 'supported' Vimeo subdomains that we don't actually support", (assert: QUnitAssert) => {
			let done = assert.async();

			this.fixture.appendChild(this.createMainArticleContainer());
			let previewElement = AugmentationHelper.getArticlePreviewElement(document);

			let pageUrl = "https://vimeo.com/45196609";
			DomUtils.addEmbeddedVideosWhereSupported(previewElement, vimeoPageContentWithNoClipId, pageUrl).then((videoSrcUrls: DomUtils.EmbeddedVideoIFrameSrcs[]) => {
				ok(false, "resolve should not be called");
			}, (error: OneNoteApi.GenericError) => {
				strictEqual(JSON.parse(error.error).message, "Vimeo page content does not contain clip ids", "correct error message should be provided");
			}).then(() => {
				done();
			});
		});

		test("imageIsBlank should return true if the image is purely white", (assert: QUnitAssert) => {
			let done = assert.async();
			let img = new Image();
			img.onload = () => {
				ok(DomUtils.imageIsBlank(img), "A white pixel should be detected as blank");
				done();
			};
			img.src = DataUrls.whitePixelUrl;
		});

		test("imageIsBlank should return false if the image is not purely white or fully transparent", (assert: QUnitAssert) => {
			let done = assert.async();
			let img = new Image();
			img.onload = () => {
				ok(!DomUtils.imageIsBlank(img), "A black cube should not be detected as blank");
				done();
			};
			img.src = DataUrls.twoByTwoUpperCornerBlackOnTransparentUrl;
		});

		test("imageIsBlank should return false if the image is not purely white or fully transparent for a huge image", (assert: QUnitAssert) => {
			let done = assert.async();
			let img = new Image();
			img.onload = () => {
				ok(!DomUtils.imageIsBlank(img), "A huge non-blank should not be detected as blank");
				done();
			};
			img.src = DataUrls.bigImgUrl;
		});

		test("imageIsBlank should return true if the image is purely white for a huge image", (assert: QUnitAssert) => {
			let done = assert.async();
			let img = new Image();
			img.onload = () => {
				ok(DomUtils.imageIsBlank(img), "A huge white image should be detected as blank");
				done();
			};
			img.src = DataUrls.bigWhiteUrl;
		});

		test("imageIsBlank should return true if the image is a mix of white and transparent for a huge 1200x1200 image", (assert: QUnitAssert) => {
			let done = assert.async();
			let img = new Image();
			img.onload = () => {
				ok(DomUtils.imageIsBlank(img), "A huge white and transparent image should be detected as blank");
				done();
			};
			img.src = DataUrls.bigBlankAndWhiteUrl;
		});

		test("toAbsoluteUrl should convert a relative url to an absolute one", () => {
			let url = "/1";
			let base = "http://www.base.url";
			strictEqual(DomUtils.toAbsoluteUrl(url, base), "http://www.base.url/1");

			base = "https://www.base.url";
			strictEqual(DomUtils.toAbsoluteUrl(url, base), "https://www.base.url/1");

			base = "https://www.base.url/";
			strictEqual(DomUtils.toAbsoluteUrl(url, base), "https://www.base.url/1");
		});

		test("toAbsoluteUrl should convert a relative url to an absolute one for deeper relative paths", () => {
			let url = "/1/2";
			let base = "http://www.base.url";
			strictEqual(DomUtils.toAbsoluteUrl(url, base), "http://www.base.url/1/2");
		});

		test("toAbsoluteUrl should convert a relative url to an absolute one for paths with an extension", () => {
			let url = "/1/index.html";
			let base = "http://www.base.url";
			strictEqual(DomUtils.toAbsoluteUrl(url, base), "http://www.base.url/1/index.html");
		});

		test("toAbsoluteUrl should convert a relative url to an absolute one for paths that go backwards", () => {
			let url = "../index.html";
			let base = "http://www.base.url/1/2/";
			strictEqual(DomUtils.toAbsoluteUrl(url, base), "http://www.base.url/1/index.html");
		});

		test("toAbsoluteUrl should return the absolute url if one is passed in", () => {
			let url = "http://www.base.url/1/2/";
			let base = "http://www.xyz.url/1/2/";
			strictEqual(DomUtils.toAbsoluteUrl(url, base), "http://www.base.url/1/2/");

			url = "http://www.base.url/1/2";
			strictEqual(DomUtils.toAbsoluteUrl(url, base), "http://www.base.url/1/2");

			url = "http://www.base.url/1/2.aspx";
			strictEqual(DomUtils.toAbsoluteUrl(url, base), "http://www.base.url/1/2.aspx");
		});

		test("toAbsoluteUrl should throw an error if url is empty", () => {
			let url = "";
			let base = "http://www.xyz.url/1/2/";
			throws(() => {
				DomUtils.toAbsoluteUrl(url, base);
			}, Error("parameters must be non-empty, but was: " + url + ", " + base));
		});

		test("toAbsoluteUrl should throw an error if url is undefined", () => {
			let url = undefined;
			let base = "http://www.xyz.url/1/2/";
			throws(() => {
				DomUtils.toAbsoluteUrl(url, base);
			}, Error("parameters must be non-empty, but was: " + url + ", " + base));
		});

		test("toAbsoluteUrl should throw an error if base is empty", () => {
			let url = "/path";
			let base = "";
			throws(() => {
				DomUtils.toAbsoluteUrl(url, base);
			}, Error("parameters must be non-empty, but was: " + url + ", " + base));
		});

		test("toAbsoluteUrl should throw an error if base is undefined", () => {
			let url = "/path";
			let base = undefined;
			throws(() => {
				DomUtils.toAbsoluteUrl(url, base);
			}, Error("parameters must be non-empty, but was: " + url + ", " + base));
		});
	}

	private createRootScriptIFrame(): HTMLIFrameElement {
		let iframe = document.createElement("iframe") as HTMLIFrameElement;
		iframe.id = Constants.Ids.clipperRootScript;
		return iframe;
	}

	private createUiIFrame(): HTMLIFrameElement {
		let iframe = document.createElement("iframe") as HTMLIFrameElement;
		iframe.id = Constants.Ids.clipperUiFrame;
		return iframe;
	}

	private createExtIFrame(): HTMLIFrameElement {
		let iframe = document.createElement("iframe") as HTMLIFrameElement;
		iframe.id = Constants.Ids.clipperExtFrame;
		return iframe;
	}

	private createMainArticleContainer(): HTMLHtmlElement {
		let div = <any>document.createElement("div") as HTMLHtmlElement;
		div.className = "MainArticleContainer";
		return div;
	}
}

(new DomUtilsTests()).runTests();
