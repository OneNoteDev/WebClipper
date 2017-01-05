import {BookmarkError, BookmarkHelper, BookmarkResult, MetadataKeyValuePair} from "../../scripts/contentCapture/bookmarkHelper";

import { ObjectUtils } from "../../scripts/objectUtils";

export enum StandardMetadata {
	Fake,
	FallbackDescription,
	FallbackThumbnail,
	PrimaryDescription,
	PrimaryThumbnail
}

export class TestHelper {
	public static Content = {
		testDescriptionValue: "test description",
		testThumbnailSrcValue: "http://www.abc.com/thumbnail.jpg",
		testBookmarkUrl: "https://www.onenote.com",
		fallbackDescContentPrefix: "test fallback description ",
		fallbackThumbnailSrcContentBase: "http://www.abc.com/fallback.jpg?src=",
		testPageTitle: ""
	};

	public static createHTMLMetaElement(attribute: MetadataKeyValuePair, content: string): HTMLMetaElement {
		let metaElement: HTMLMetaElement = document.createElement("meta") as HTMLMetaElement;

		metaElement.setAttribute(attribute.key, attribute.value);
		if (content) {
			metaElement.content = content;
		}

		return metaElement;
	}

	public static createHTMLImageElement(srcUrl: string): HTMLImageElement {
		let imgElement: HTMLImageElement = document.createElement("img") as HTMLImageElement;
		if (srcUrl) {
			imgElement.setAttribute(BookmarkHelper.srcAttrName, srcUrl);
		}
		return imgElement;
	}

	public static createListOfMetaTags(metadataTypes: StandardMetadata[], fallbackIndexer?: number): HTMLMetaElement[] {
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

	public static getRandomNumber(maxInclusive: number): number {
		return Math.floor(Math.random() * (maxInclusive + 1));
	}
}
