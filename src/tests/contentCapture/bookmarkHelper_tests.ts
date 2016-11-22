import {Clipper} from "../../scripts/clipperUI/frontEndGlobals";

import {BookmarkError, BookmarkHelper, BookmarkResult, MetadataKeyValuePair} from "../../scripts/contentCapture/bookmarkHelper";

import {ObjectUtils} from "../../scripts/objectUtils";

import {StubSessionLogger} from "../../scripts/logging/stubSessionLogger";

import {TestModule} from "../testModule";

export class BookmarkHelperTests extends TestModule {
	protected module() {
		return "bookmarkHelper";
	}

	protected beforeEach() {
		Clipper.logger = new StubSessionLogger();
	}

	protected tests() {
		test("bookmarkPage rejects when url is undefined or empty", (assert: QUnitAssert) => {
			let done = assert.async();

			let metadata = TestHelper.createListOfMetaTags([TestHelper.StandardMetadata.PrimaryDescription, TestHelper.StandardMetadata.PrimaryThumbnail]);

			BookmarkHelper.bookmarkPage(undefined, TestHelper.Content.testPageTitle, metadata).then(() => {
				ok(false, "undefined url should not resolve");
				done();
			}, () => {
				BookmarkHelper.bookmarkPage("", TestHelper.Content.testPageTitle, metadata).then(() => {
					ok(false, "empty url should not resolve");
				}).catch(() => {
					ok(true, "empty url should reject");
				}).then(() => {
					done();
				});
			});
		});

		test("bookmarkPage returns complete BookmarkResult when fully-formed list of metadata exists", (assert: QUnitAssert) => {
			let done = assert.async();

			let expectedResult: BookmarkResult = {
				url: TestHelper.Content.testBookmarkUrl,
				title: TestHelper.Content.testPageTitle,
				description: TestHelper.Content.testDescriptionValue
			};

			let metadata = TestHelper.createListOfMetaTags([TestHelper.StandardMetadata.PrimaryDescription]);

			BookmarkHelper.bookmarkPage(expectedResult.url, TestHelper.Content.testPageTitle, metadata).then((result: BookmarkResult) => {
				strictEqual(result.url, expectedResult.url, "bookmarked url is incorrect");
				strictEqual(result.description, expectedResult.description, "bookmarked description is incorrect");
				strictEqual(result.thumbnailSrc, expectedResult.thumbnailSrc, "bookmarked thumbnail source is incorrect");
			}).catch((error: BookmarkError) => {
				ok(false, "fully-formed list of metadata should not reject. error: " + error);
			}).then(() => {
				done();
			});
		});

		test("bookmarkPage returns BookmarkResult with just a url when list of metadata does not exist", (assert: QUnitAssert) => {
			let done = assert.async();

			let expectedResult: BookmarkResult = {
				url: TestHelper.Content.testBookmarkUrl,
				title: TestHelper.Content.testPageTitle
			};

			BookmarkHelper.bookmarkPage(expectedResult.url, TestHelper.Content.testPageTitle, undefined).then((result: BookmarkResult) => {
				strictEqual(result.url, expectedResult.url, "bookmarked url is incorrect");
				strictEqual(result.description, undefined, "bookmarked description should be undefined. actual: '" + result.description + "'");
				strictEqual(result.thumbnailSrc, undefined, "bookmarked thumbnail source should be undefined. actual: '" + result.thumbnailSrc + "'");
			}).catch((error: BookmarkError) => {
				ok(false, "undefined list of metadata should not reject. error: " + error);
			}).then(() => {
				done();
			});
		});

		test("bookmarkPage returns BookmarkResult with just a url when list of metadata is empty", (assert: QUnitAssert) => {
			let done = assert.async();

			let expectedResult: BookmarkResult = {
				url: TestHelper.Content.testBookmarkUrl,
				title: TestHelper.Content.testPageTitle
			};

			BookmarkHelper.bookmarkPage(expectedResult.url, TestHelper.Content.testPageTitle, new Array<HTMLMetaElement>()).then((result: BookmarkResult) => {
				strictEqual(result.url, expectedResult.url, "bookmarked url is incorrect");
				strictEqual(result.description, undefined, "bookmarked description should be undefined. actual: '" + result.description + "'");
				strictEqual(result.thumbnailSrc, undefined, "bookmarked thumbnail source should be undefined. actual: '" + result.thumbnailSrc + "'");
			}).catch((error: BookmarkError) => {
				ok(false, "empty list of metadata should not reject. error: " + error);
			}).then(() => {
				done();
			});
		});

		test("bookmarkPage returns BookmarkResult with just a url when list of metadata contains no useful information", (assert: QUnitAssert) => {
			let done = assert.async();

			let expectedResult: BookmarkResult = {
				url: TestHelper.Content.testBookmarkUrl,
				title: TestHelper.Content.testPageTitle
			};

			let metadata = TestHelper.createListOfMetaTags([TestHelper.StandardMetadata.Fake]);

			BookmarkHelper.bookmarkPage(expectedResult.url, TestHelper.Content.testPageTitle, metadata).then((result: BookmarkResult) => {
				strictEqual(result.url, expectedResult.url, "bookmarked url is incorrect");
				strictEqual(result.description, undefined, "bookmarked description should be undefined. actual: '" + result.description + "'");
				strictEqual(result.thumbnailSrc, undefined, "bookmarked thumbnail source should be undefined. actual: '" + result.thumbnailSrc + "'");
			}).catch((error: BookmarkError) => {
				ok(false, "useless list of metadata should not reject. error: " + error);
			}).then(() => {
				done();
			});
		});

		test("getPrimaryDescription returns undefined if og:description meta tag does not exist", () => {
			strictEqual(BookmarkHelper.getPrimaryDescription(undefined), undefined, "undefined list of meta tags should return undefined. actual: '" + BookmarkHelper.getPrimaryDescription(undefined));

			let metaTags = new Array<HTMLMetaElement>();

			strictEqual(BookmarkHelper.getPrimaryDescription(metaTags), undefined, "empty list of meta tags should return undefined");

			metaTags = TestHelper.createListOfMetaTags([
				TestHelper.StandardMetadata.FallbackDescription,
				TestHelper.StandardMetadata.FallbackDescription,
				TestHelper.StandardMetadata.FallbackThumbnail,
				TestHelper.StandardMetadata.FallbackThumbnail,
				TestHelper.StandardMetadata.PrimaryThumbnail
			]);

			let result = BookmarkHelper.getPrimaryDescription(metaTags);
			strictEqual(result, undefined, "missing og:description should return undefined. actual: '" + result + "'");
		});

		test("getPrimaryDescription returns content of og:description meta tag", () => {
			let metaTags = TestHelper.createListOfMetaTags([
				TestHelper.StandardMetadata.PrimaryDescription
			]);
			strictEqual(BookmarkHelper.getPrimaryDescription(metaTags).description, TestHelper.Content.testDescriptionValue, "description is incorrect");
		});

		test("getFallbackDescription returns undefined if fallback description meta tags do not exist", () => {
			let metaTags = TestHelper.createListOfMetaTags([
				TestHelper.StandardMetadata.PrimaryDescription,
				TestHelper.StandardMetadata.PrimaryThumbnail,
				TestHelper.StandardMetadata.Fake,
				TestHelper.StandardMetadata.FallbackThumbnail
			]);

			let result = BookmarkHelper.getFallbackDescription(metaTags);
			strictEqual(BookmarkHelper.getFallbackDescription(metaTags), undefined, "missing fallback description should return undefined. actual: '" + result + "'");
		});

		test("getFallbackDescription returns content if fallback description meta tags with content exist", () => {
			let metaTags = new Array<HTMLMetaElement>();

			// add all fallback description attributes to tag list
			for (let iFallback = 0; iFallback < BookmarkHelper.fallbackDescriptionKeyValuePairs.length; iFallback++) {
				metaTags.push(TestHelper.createListOfMetaTags([
					TestHelper.StandardMetadata.FallbackDescription
				], iFallback)[0]);
			}

			let assertCounter = 0;
			while (metaTags.length > 0) {
				let descResult = BookmarkHelper.getFallbackDescription(metaTags);
				let expectedDesc = TestHelper.Content.fallbackDescContentPrefix + assertCounter;
				strictEqual(descResult.description, expectedDesc, "content is incorrect - is fallback order incorrect?");

				assertCounter++;

				if (metaTags.length > 1) {
					// remove content and make sure it falls back to next in line
					metaTags[0].removeAttribute("content");
					descResult = BookmarkHelper.getFallbackDescription(metaTags);
					expectedDesc = TestHelper.Content.fallbackDescContentPrefix + assertCounter;
					strictEqual(descResult.description, expectedDesc, "content is incorrect - are we incorrectly falling back to undefined content?");
				}

				metaTags.shift();
			}
		});

		test("getPrimaryThumbnailSrc returns undefined if og:image meta tag does not exist", () => {
			strictEqual(BookmarkHelper.getPrimaryThumbnailSrc(undefined), undefined, "undefined list of meta tags should return undefined");

			let metaTags = new Array<HTMLMetaElement>();

			strictEqual(BookmarkHelper.getPrimaryThumbnailSrc(metaTags), undefined, "empty list of meta tags should return undefined");

			metaTags = TestHelper.createListOfMetaTags([
				TestHelper.StandardMetadata.FallbackDescription,
				TestHelper.StandardMetadata.FallbackDescription,
				TestHelper.StandardMetadata.FallbackThumbnail,
				TestHelper.StandardMetadata.FallbackThumbnail,
				TestHelper.StandardMetadata.PrimaryDescription
			]);

			let result = BookmarkHelper.getPrimaryThumbnailSrc(metaTags);
			strictEqual(result, undefined, "missing og:image should return undefined. actual: '" + result + "'");
		});

		test("getPrimaryThumbnailSrc returns content of og:image meta tag", () => {
			let metaTags = TestHelper.createListOfMetaTags([
				TestHelper.StandardMetadata.PrimaryThumbnail
			]);

			strictEqual(BookmarkHelper.getPrimaryThumbnailSrc(metaTags).thumbnailSrc, TestHelper.Content.testThumbnailSrcValue, "thumbnail source is incorrect");
		});

		test("getFallbackThumbnailSrc returns undefined if fallback thumbnail src meta tags do not exist", () => {
			let metaTags = TestHelper.createListOfMetaTags([
				TestHelper.StandardMetadata.PrimaryDescription,
				TestHelper.StandardMetadata.PrimaryThumbnail,
				TestHelper.StandardMetadata.Fake,
				TestHelper.StandardMetadata.FallbackDescription
			]);

			let result = BookmarkHelper.getFallbackThumbnailSrc(metaTags);
			strictEqual(result, undefined, "missing fallback thumbnail src should return undefined. actual: '" + result + "'");
		});

		test("getFallbackThumbnailSrc returns content if fallback thumbnail src meta tags with content exist", () => {
			let metaTags = new Array<HTMLMetaElement>();

			// add all fallback thumbnail src attributes to tag list
			for (let iFallback = 0; iFallback < BookmarkHelper.fallbackThumbnailKeyValuePairs.length; iFallback++) {
				metaTags.push(TestHelper.createListOfMetaTags([
					TestHelper.StandardMetadata.FallbackThumbnail
				], iFallback)[0]);
			}

			let assertCounter = 0;
			while (metaTags.length > 0) {
				let thumbnailSrcResult = BookmarkHelper.getFallbackThumbnailSrc(metaTags);
				let expectedThumbnailSrc = TestHelper.Content.fallbackThumbnailSrcContentBase + assertCounter;
				strictEqual(thumbnailSrcResult.thumbnailSrc, expectedThumbnailSrc, "content is incorrect - is fallback order incorrect?");

				assertCounter++;

				if (metaTags.length > 1) {
					// remove content and make sure it falls back to next in line
					metaTags[0].removeAttribute("content");
					thumbnailSrcResult = BookmarkHelper.getFallbackThumbnailSrc(metaTags);
					expectedThumbnailSrc = TestHelper.Content.fallbackThumbnailSrcContentBase + assertCounter;
					strictEqual(thumbnailSrcResult.thumbnailSrc, expectedThumbnailSrc, "content is incorrect - are we incorrectly falling back to undefined content?");
				}

				metaTags.shift();
			}
		});

		test("getFirstImageOnPage returns undefined if image tags do not exist", () => {
			let thumbnailSrcResult = BookmarkHelper.getFirstImageOnPage(undefined);

			strictEqual(thumbnailSrcResult, undefined, "undefined list of image elements should return undefined");

			let images: HTMLImageElement[] = new Array<HTMLImageElement>();
			thumbnailSrcResult = BookmarkHelper.getFirstImageOnPage(images);

			strictEqual(thumbnailSrcResult, undefined, "empty list of image elements should return undefined");
		});

		test("getFirstImageOnPage returns undefined if image tag without src values exist", () => {
			let images: HTMLImageElement[] = new Array<HTMLImageElement>();

			images.push(TestHelper.createHTMLImageElement(undefined));
			images.push(TestHelper.createHTMLImageElement(""));

			let thumbnailSrcResult = BookmarkHelper.getFirstImageOnPage(images);

			strictEqual(thumbnailSrcResult, undefined, "list of image elements without src values should return undefined");
		});

		test("getFirstImageOnPage returns content if image tag with content exist", () => {
			let images: HTMLImageElement[] = new Array<HTMLImageElement>();

			images.push(TestHelper.createHTMLImageElement(TestHelper.Content.fallbackThumbnailSrcContentBase + "0"));
			images.push(TestHelper.createHTMLImageElement(TestHelper.Content.fallbackThumbnailSrcContentBase + "1"));

			let thumbnailSrcResult = BookmarkHelper.getFirstImageOnPage(images);

			strictEqual(thumbnailSrcResult.thumbnailSrc, TestHelper.Content.fallbackThumbnailSrcContentBase + "0");
		});

		test("getMetaContent returns undefined if metatags are undefined", () => {
			let result = BookmarkHelper.getMetaContent(undefined, BookmarkHelper.primaryThumbnailKeyValuePair);
			strictEqual(result, undefined, "actual: " + result);
		});

		test("getMetaContent returns undefined if metatags are empty", () => {
			let result = BookmarkHelper.getMetaContent(new Array<HTMLMetaElement>(), BookmarkHelper.primaryThumbnailKeyValuePair);
			strictEqual(result, undefined, "actual: " + result);
		});

		test("getMetaContent returns undefined if metadata is undefined", () => {
			let metaTags = TestHelper.createListOfMetaTags([
				TestHelper.StandardMetadata.Fake
			]);

			let result = BookmarkHelper.getMetaContent(metaTags, undefined);
			strictEqual(result, undefined, "actual: " + result);
		});

		test("getMetaContent returns undefined if metadata is empty", () => {
			let metaTags = TestHelper.createListOfMetaTags([
				TestHelper.StandardMetadata.Fake
			]);

			let emptyMetadata: MetadataKeyValuePair = { key: BookmarkHelper.propertyAttrName, value: "" };
			let result = BookmarkHelper.getMetaContent(metaTags, emptyMetadata);
			strictEqual(result, undefined, "actual: " + result);
		});

		test("getMetaContent returns undefined if the metadata exists but the content is undefined", () => {
			// non-standard metadata, so not using TestHelper.createListOfMetaTags
			let metaTags = new Array<HTMLMetaElement>();
			metaTags.push(TestHelper.createHTMLMetaElement(BookmarkHelper.primaryThumbnailKeyValuePair, undefined));

			let result = BookmarkHelper.getMetaContent(metaTags, BookmarkHelper.primaryThumbnailKeyValuePair);
			strictEqual(result, undefined, "actual: " + result);
		});

		test("getMetaContent returns undefined if the metadata exists but the content is empty", () => {
			// non-standard metadata, so not using TestHelper.createListOfMetaTags
			let metaTags = new Array<HTMLMetaElement>();
			metaTags.push(TestHelper.createHTMLMetaElement(BookmarkHelper.primaryThumbnailKeyValuePair, ""));

			let result = BookmarkHelper.getMetaContent(metaTags, BookmarkHelper.primaryThumbnailKeyValuePair);
			strictEqual(result, undefined, "actual: " + result);
		});

		test("getMetaContent returns content if it exists", () => {
			let metaTags = TestHelper.createListOfMetaTags([
				TestHelper.StandardMetadata.PrimaryThumbnail
			]);

			let result = BookmarkHelper.getMetaContent(metaTags, BookmarkHelper.primaryThumbnailKeyValuePair);
			strictEqual(result, TestHelper.Content.testThumbnailSrcValue, "actual: " + result);
		});
	}
}

module TestHelper {
	export module Content {
		export let testDescriptionValue = "test description";
		export let testThumbnailSrcValue = "http://www.abc.com/thumbnail.jpg";
		export let testBookmarkUrl = "https://www.onenote.com";
		export let fallbackDescContentPrefix = "test fallback description ";
		export let fallbackThumbnailSrcContentBase = "http://www.abc.com/fallback.jpg?src=";
		export let testPageTitle = "";
	}

	export function createHTMLMetaElement(attribute: MetadataKeyValuePair, content: string): HTMLMetaElement {
		let metaElement: HTMLMetaElement = document.createElement("meta") as HTMLMetaElement;

		metaElement.setAttribute(attribute.key, attribute.value);
		if (content) {
			metaElement.content = content;
		}

		return metaElement;
	}

	export function createHTMLImageElement(srcUrl: string): HTMLImageElement {
		let imgElement: HTMLImageElement = document.createElement("img") as HTMLImageElement;
		if (srcUrl) {
			imgElement.setAttribute(BookmarkHelper.srcAttrName, srcUrl);
		}
		return imgElement;
	}

	export enum StandardMetadata {
		Fake,
		FallbackDescription,
		FallbackThumbnail,
		PrimaryDescription,
		PrimaryThumbnail
	}

	export function createListOfMetaTags(metadataTypes: StandardMetadata[], fallbackIndexer?: number): HTMLMetaElement[] {
		let metaTags = new Array<HTMLMetaElement>();

		for (let type of metadataTypes) {
			switch (type) {
				case StandardMetadata.PrimaryDescription:
					metaTags.push(
						TestHelper.createHTMLMetaElement(
							BookmarkHelper.primaryDescriptionKeyValuePair,
							TestHelper.Content.testDescriptionValue
						)
					);
					break;
				case StandardMetadata.PrimaryThumbnail:
					metaTags.push(
						TestHelper.createHTMLMetaElement(
							BookmarkHelper.primaryThumbnailKeyValuePair,
							TestHelper.Content.testThumbnailSrcValue
						)
					);
					break;
				case StandardMetadata.Fake:
					let uselessMetadata: MetadataKeyValuePair = {
						key: BookmarkHelper.propertyAttrName,
						value: "attributeFake"
					};
					metaTags.push(
						TestHelper.createHTMLMetaElement(
							uselessMetadata,
							"content fake"
						)
					);
					break;
				case StandardMetadata.FallbackDescription:
					let descIndexer: number;
					if (ObjectUtils.isNullOrUndefined(fallbackIndexer)) {
						// if not provided, get a random fallback description
						descIndexer = TestHelper.getRandomNumber(BookmarkHelper.fallbackDescriptionKeyValuePairs.length - 1);
					} else {
						descIndexer = fallbackIndexer;
					}
					let descMetadata: MetadataKeyValuePair = BookmarkHelper.fallbackDescriptionKeyValuePairs[descIndexer];

					metaTags.push(
						TestHelper.createHTMLMetaElement(
							descMetadata,
							TestHelper.Content.fallbackDescContentPrefix + descIndexer
						)
					);
					break;
				case StandardMetadata.FallbackThumbnail:
					let thumbnailIndexer: number;
					if (ObjectUtils.isNullOrUndefined(fallbackIndexer)) {
						// if not provided, get a random fallback thumbnail src
						thumbnailIndexer = TestHelper.getRandomNumber(BookmarkHelper.fallbackThumbnailKeyValuePairs.length - 1);
					} else {
						thumbnailIndexer = fallbackIndexer;
					}
					let thumbnailMetadata: MetadataKeyValuePair = BookmarkHelper.fallbackThumbnailKeyValuePairs[thumbnailIndexer];

					metaTags.push(
						TestHelper.createHTMLMetaElement(
							thumbnailMetadata,
							TestHelper.Content.fallbackThumbnailSrcContentBase + thumbnailIndexer
						)
					);
					break;
				default:
					break;
			}
		}

		return metaTags;
	}

	export function getRandomNumber(maxInclusive: number): number {
		return Math.floor(Math.random() * (maxInclusive + 1));
	}
}

(new BookmarkHelperTests()).runTests();
