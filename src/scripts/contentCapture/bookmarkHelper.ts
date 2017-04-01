import {ObjectUtils} from "../objectUtils";

import {Clipper} from "../clipperUI/frontEndGlobals";

import {DomUtils} from "../domParsers/domUtils";

import * as Log from "../logging/log";

import {CaptureFailureInfo} from "./captureFailureInfo";

export interface BookmarkResult extends CaptureFailureInfo {
	url: string;
	title: string;
	description?: string;
	thumbnailSrc?: string;
}

export interface BookmarkError extends OneNoteApi.GenericError {
	url: string;
	description?: string;
	thumbnailSrc?: string;
}

export interface MetadataKeyValuePair {
	key: string;
	value: string;
}

export class BookmarkHelper {
	public static maxNumCharsInDescription = 140;

	public static metadataTagNames: string[] = [ DomUtils.tags.meta, DomUtils.tags.link ];

	public static nameAttrName = "name";
	public static propertyAttrName = "property";
	public static relAttrName = "rel";
	public static srcAttrName = "src";

	public static primaryDescriptionKeyValuePair: MetadataKeyValuePair = { key: BookmarkHelper.propertyAttrName, value: "og:description" };
	public static primaryThumbnailKeyValuePair: MetadataKeyValuePair = { key: BookmarkHelper.propertyAttrName, value: "og:image" };

	public static firstImageOnPageKeyValuePair: MetadataKeyValuePair = { key: "", value: "firstImageOnPage" };
	public static textOnPageKeyValuePair: MetadataKeyValuePair = { key: "", value: "textOnPage" };

	// list is ordered by fallback priority
	public static fallbackDescriptionKeyValuePairs: MetadataKeyValuePair[] = [
		{ key: BookmarkHelper.nameAttrName, value: "description" },
		{ key: BookmarkHelper.nameAttrName, value: "twitter:description" },
		{ key: BookmarkHelper.nameAttrName, value: "keywords" },
		{ key: BookmarkHelper.propertyAttrName, value: "article:tag" }
	];

	// list is ordered by fallback priority
	public static fallbackThumbnailKeyValuePairs: MetadataKeyValuePair[] = [
		{ key: BookmarkHelper.nameAttrName, value: "twitter:image:src" },
		{ key: BookmarkHelper.nameAttrName, value: "twitter:image" },
		{ key: BookmarkHelper.relAttrName, value: "image_src" },
		{ key: BookmarkHelper.relAttrName, value: "icon" }
	];

	/**
	 * Grab useful metadata for a summary/bookmark view of a page from the provided DOM elements
	 *
	 * allowFallback: if true, we will attempt to infer bookmarking info from metadata
	 * that does not adhere to the Open Graph protocol (http://ogp.me/)
	 */
	public static bookmarkPage(url: string, pageTitle: string, metadataElements: Element[], allowFallback = false, imageElements?: HTMLImageElement[], textElements?: Text[]): Promise<BookmarkResult> {
		let bookmarkPageEvent = new Log.Event.PromiseEvent(Log.Event.Label.BookmarkPage);

		if (ObjectUtils.isNullOrUndefined(url) || url === "") {
			let error: BookmarkError = { error: "Page url is null, undefined, or empty", url: url };
			bookmarkPageEvent.setStatus(Log.Status.Failed);
			bookmarkPageEvent.setFailureInfo(error);

			Clipper.logger.logEvent(bookmarkPageEvent);
			return Promise.reject(error);
		}

		let result: BookmarkResult = {
			url: url,
			title: pageTitle
		};

		let bookmarkLoggingInfo = {
			metadataElementsExist: true,
			pageTitleExists: true,
			descriptionMetadataUsed: "",
			thumbnailSrcMetadataUsed: "",
			thumbnailSrcToDataUrlFailure: undefined
		};

		if (ObjectUtils.isNullOrUndefined(pageTitle) || pageTitle.length === 0) {
			bookmarkLoggingInfo.pageTitleExists = false;
		}

		if (ObjectUtils.isNullOrUndefined(metadataElements) || metadataElements.length === 0) {
			bookmarkLoggingInfo.metadataElementsExist = false;
			bookmarkPageEvent.setCustomProperty(Log.PropertyName.Custom.BookmarkInfo, JSON.stringify(bookmarkLoggingInfo));

			Clipper.logger.logEvent(bookmarkPageEvent);
			return Promise.resolve(result);
		}

		let descriptionResult = this.getPrimaryDescription(metadataElements);
		if (allowFallback && ObjectUtils.isNullOrUndefined(descriptionResult)) {
			descriptionResult = BookmarkHelper.getFallbackDescription(metadataElements);

			if (ObjectUtils.isNullOrUndefined(descriptionResult)) {
				// concatenate text on the page if all else fails
				descriptionResult = BookmarkHelper.getTextOnPage(textElements);
			}
		}

		let thumbnailSrcResult = this.getPrimaryThumbnailSrc(metadataElements);
		if (allowFallback && ObjectUtils.isNullOrUndefined(thumbnailSrcResult)) {
			thumbnailSrcResult = BookmarkHelper.getFallbackThumbnailSrc(metadataElements);

			if (ObjectUtils.isNullOrUndefined(thumbnailSrcResult)) {
				// get first image on the page as thumbnail if all else fails
				thumbnailSrcResult = BookmarkHelper.getFirstImageOnPage(imageElements);
			}
		}

		// populate final result object and log

		if (!ObjectUtils.isNullOrUndefined(descriptionResult)) {
			descriptionResult.description = BookmarkHelper.truncateString(descriptionResult.description);

			result.description = descriptionResult.description;
			bookmarkLoggingInfo.descriptionMetadataUsed = descriptionResult.metadataUsed.value;
		}

		if (!ObjectUtils.isNullOrUndefined(thumbnailSrcResult)) {
			bookmarkLoggingInfo.thumbnailSrcMetadataUsed = thumbnailSrcResult.metadataUsed.value;

			thumbnailSrcResult.thumbnailSrc = DomUtils.toAbsoluteUrl(thumbnailSrcResult.thumbnailSrc, url);

			return DomUtils.getImageDataUrl(thumbnailSrcResult.thumbnailSrc).then((thumbnailDataUrl: string) => {
				if (!ObjectUtils.isNullOrUndefined(thumbnailDataUrl)) {
					result.thumbnailSrc = thumbnailDataUrl;
				} else {
					result.thumbnailSrc = thumbnailSrcResult.thumbnailSrc;
					bookmarkLoggingInfo.thumbnailSrcToDataUrlFailure = "thumbnail conversion to data url returned undefined. falling back to non-data url as source: " + thumbnailSrcResult.thumbnailSrc;
				}
			}).catch((error: OneNoteApi.GenericError) => {
				bookmarkLoggingInfo.thumbnailSrcToDataUrlFailure = error.error;
			}).then(() => {
				bookmarkPageEvent.setCustomProperty(Log.PropertyName.Custom.BookmarkInfo, JSON.stringify(bookmarkLoggingInfo));

				Clipper.logger.logEvent(bookmarkPageEvent);
				return Promise.resolve(result);
			});
		} else {
			bookmarkPageEvent.setCustomProperty(Log.PropertyName.Custom.BookmarkInfo, JSON.stringify(bookmarkLoggingInfo));

			Clipper.logger.logEvent(bookmarkPageEvent);
			return Promise.resolve(result);
		}
	}

	/**
	 * Wrapper for native JS getElementsByTagName() which adds ability to provide multiple tag names
	 */
	public static getElementsByTagName(root: Document | Element, tagNames: string[]): Element[] {
		if (ObjectUtils.isNullOrUndefined(root) || ObjectUtils.isNullOrUndefined(tagNames)) {
			return;
		}

		let elements: Element[] = new Array<Element>();
		for (let tag of tagNames) {
			elements = elements.concat(elements, Array.prototype.slice.call(root.getElementsByTagName(tag)));
		}

		return elements;
	}

	/**
	 * Get non-whitespace text elements from the document
	 *
	 * cleanDoc: if true, THIS WILL MODIFY THE DOCUMENT PROVIDED -
	 * we will attempt to make the document ONML-friendly before grabbing text elements
	 */
	public static getNonWhiteSpaceTextElements(doc: Document, cleanDoc = false): Text[] {
		if (cleanDoc) {
			DomUtils.removeElementsNotSupportedInOnml(doc);
		}

		return DomUtils.textNodesNoWhitespaceUnder(doc);
	}

	public static getPrimaryDescription(metadataElements: Element[]): { metadataUsed: MetadataKeyValuePair, description: string } {
		let metadata = BookmarkHelper.primaryDescriptionKeyValuePair;
		let description = BookmarkHelper.getMetaContent(metadataElements, metadata);

		if (!ObjectUtils.isNullOrUndefined(description)) {
			return { metadataUsed: metadata, description: description };
		}
	}

	public static getFallbackDescription(metadataElements: Element[]): { metadataUsed: MetadataKeyValuePair, description: string } {
		for (let metadata of BookmarkHelper.fallbackDescriptionKeyValuePairs) {
			let description = BookmarkHelper.getMetaContent(metadataElements, metadata);
			if (!ObjectUtils.isNullOrUndefined(description)) {
				return { metadataUsed: metadata, description: description };
			}
		}
	}

	public static getTextOnPage(textElements: Text[], numberOfWords = 50): { metadataUsed: MetadataKeyValuePair, description: string } {
		if (!ObjectUtils.isNullOrUndefined(textElements) && textElements.length > 0) {
			let metadata = BookmarkHelper.textOnPageKeyValuePair;
			let description = textElements.map(text => text.wholeText.trim()).join(" ");
			if (!ObjectUtils.isNullOrUndefined(description) && description.length > 0) {
				return { metadataUsed: metadata, description: description };
			}
		}
	}

	public static truncateString(longStr: string, numChars = BookmarkHelper.maxNumCharsInDescription): string {
		if (ObjectUtils.isNullOrUndefined(longStr)) {
			return;
		}

		if (longStr.length === 0) {
			return "";
		}

		if (longStr.length <= numChars) {
			return longStr;
		}

		let ellipsisAppend = "...";
		let truncateRegEx = new RegExp("^(.{" + numChars + "}[^\\s]*)");
		let truncateMatch = longStr.replace(/\s+/g, " ").match(truncateRegEx);

		if (ObjectUtils.isNullOrUndefined(truncateMatch)) {
			return;
		}

		return truncateMatch[1] + ellipsisAppend;
	}

	public static getPrimaryThumbnailSrc(metaTags: Element[]): { metadataUsed: MetadataKeyValuePair, thumbnailSrc: string } {
		let metadata = BookmarkHelper.primaryThumbnailKeyValuePair;
		let imgSrc = BookmarkHelper.getMetaContent(metaTags, metadata);

		if (!ObjectUtils.isNullOrUndefined(imgSrc)) {
			return { metadataUsed: metadata, thumbnailSrc: imgSrc };
		}
	}

	public static getFallbackThumbnailSrc(metaTags: Element[]): { metadataUsed: MetadataKeyValuePair, thumbnailSrc: string } {
		for (let metadata of BookmarkHelper.fallbackThumbnailKeyValuePairs) {
			let imgSrc = BookmarkHelper.getMetaContent(metaTags, metadata);
			if (!ObjectUtils.isNullOrUndefined(imgSrc)) {
				return { metadataUsed: metadata, thumbnailSrc: imgSrc };
			}
		}
	}

	public static getFirstImageOnPage(imageElements: HTMLImageElement[]): { metadataUsed: MetadataKeyValuePair, thumbnailSrc: string } {
		if (!ObjectUtils.isNullOrUndefined(imageElements) && imageElements.length > 0) {
			let imgSrc = imageElements[0].getAttribute(BookmarkHelper.srcAttrName);
			let metadata = BookmarkHelper.firstImageOnPageKeyValuePair;
			if (!ObjectUtils.isNullOrUndefined(imgSrc) && imgSrc !== "") {
				return { metadataUsed: metadata, thumbnailSrc: imgSrc };
			}
		}
	}

	public static getMetaContent(metaTags: Element[], metadata: MetadataKeyValuePair): string {
		if (ObjectUtils.isNullOrUndefined(metaTags) ||
			ObjectUtils.isNullOrUndefined(metadata) ||
			ObjectUtils.isNullOrUndefined(metadata.key) ||
			ObjectUtils.isNullOrUndefined(metadata.value)) {
			return;
		}

		for (let tag of metaTags) {
			let attributeValue = tag.getAttribute(metadata.key);
			if (attributeValue &&
				attributeValue.toLowerCase().split(/\s/).indexOf(metadata.value.toLowerCase()) > -1) {

				let contentAttr: string;
				if (tag.nodeName === "LINK") {
					contentAttr = "href";
				}
				if (tag.nodeName === "META") {
					contentAttr = "content";
				}

				let content: string = tag.getAttribute(contentAttr);

				if (ObjectUtils.isNullOrUndefined(content) || content.length === 0) {
					return;
				}
				return content;
			}
		}
	}
}
