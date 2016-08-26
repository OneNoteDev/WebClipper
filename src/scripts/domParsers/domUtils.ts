/// <reference path="../../../node_modules/onenoteapi/target/oneNoteApi.d.ts" />
/// <reference path="../../../typings/main/ambient/mithril/mithril.d.ts"/>

import {Constants} from "../constants";
import {PageInfo} from "../pageInfo";
import {Utils} from "../utils";
import {VideoUtils} from "./videoUtils";

/**
 * Dom specific Helper utility methods
 */
export module DomUtils {
	export module Tags {
		export const a = "a";
		export const applet = "applet";
		export const audio = "audio";
		export const base = "base";
		export const button = "button";
		export const canvas = "canvas";
		export const embed = "embed";
		export const head = "head";
		export const hr = "hr";
		export const html = "html";
		export const iframe = "iframe";
		export const img = "img";
		export const input = "input";
		export const link = "link";
		export const map = "map";
		export const menu = "menu";
		export const menuitem = "menuitem";
		export const meta = "meta";
		export const meter = "meter";
		export const noscript = "noscript";
		export const progress = "progress";
		export const script = "script";
		export const style = "style";
		export const svg = "svg";
		export const video = "video";
	}

	const tagsNotSupportedInOnml = [
		Tags.applet,
		Tags.audio,
		Tags.button,
		Tags.canvas,
		Tags.embed,
		Tags.hr,
		Tags.input,
		Tags.link,
		Tags.map,
		Tags.menu,
		Tags.menuitem,
		Tags.meter,
		Tags.noscript,
		Tags.progress,
		Tags.script,
		Tags.style,
		Tags.video
	];

	export function removeElementsNotSupportedInOnml(doc: Document) {
		domReplacer(doc, tagsNotSupportedInOnml.join());
	}

	export function domReplacer(doc: Document, querySelector: string, getReplacement: (oldNode: Node, index: number) => Node = () => undefined) {
		let nodes: NodeList = doc.querySelectorAll(querySelector);

		for (let i = 0; i < nodes.length; i++) {
			let oldNode: Node = nodes[i];

			try {
				let newNode = getReplacement(oldNode, i);

				if (!newNode) {
					oldNode.parentNode.removeChild(oldNode);
				} else if (oldNode !== newNode) {
					oldNode.parentNode.replaceChild(newNode, oldNode);
				}
			} catch (e) {
				// There are some cases (like dirty canvases) where running replace will throw an error.
				// We catch it, thus leaving the original.
			}
		}
	}

	export function domReplacerAsync(doc: Document, querySelector: string, getReplacement: (oldNode: Node, index: number) => Promise<Node> = () => Promise.resolve(undefined)): Promise<void> {
		return new Promise<void>((resolve) => {
			let nodes: NodeList = doc.querySelectorAll(querySelector);
			let doneCount = 0;

			if (nodes.length === 0) {
				resolve();
			}

			for (let i = 0; i < nodes.length; i++) {
				let oldNode: Node = nodes[i];

				getReplacement(oldNode, i).then((newNode) => {
					if (!newNode) {
						oldNode.parentNode.removeChild(oldNode);
					} else if (oldNode !== newNode) {
						oldNode.parentNode.replaceChild(newNode, oldNode);
					}
				}, () => {
					// There are some cases (like dirty canvases) where running replace will throw an error.
					// We catch it, thus leaving the original.
				}).then(() => {
					if (++doneCount === nodes.length) {
						resolve();
					}
				});
			}
		});
	}

	/**
	 * Gets the content type of the page based on the embed tags on the page
	 * returns ClipTypes.EnhancedUrl if there's an embed tag of type application/pdf
	 * else returns ClipTypes.Html
	 */
	export function getPageContentType(doc: Document): OneNoteApi.ContentType {
		let anchor = doc.createElement("a");
		anchor.href = doc.URL;
		if (/\.pdf$/i.test(anchor.pathname)) {
			// Check if there's a PDF embed element
			let embedElement = doc.querySelector("embed");
			if (embedElement && /application\/pdf/i.test((<any>embedElement).type)) {
				return OneNoteApi.ContentType.EnhancedUrl;
			}

			// Check if this was a PDF rendered with PDF.js
			if (window && (<any>window).PDFJS) {
				return OneNoteApi.ContentType.EnhancedUrl;
			}
		}
		return OneNoteApi.ContentType.Html;
	}

	/**
	 * Return the best CanonicalUrl for the document
	 * Some sites mistakenly declare multiple canonical urls. Pick the shortest one.
	 * (Most canonical urls involve stripping away directory index, fragments, query
	 * variables etc. hence we pick the shortest one as it is likely to be correct.)
	 */
	export function fetchCanonicalUrl(doc: Document): string {
		let canonicalLinkDeclarations = doc.querySelectorAll("link[rel=canonical]");
		if (canonicalLinkDeclarations.length === 0) {
			return doc.URL;
		} else {
			let shortestHref: string = (<HTMLBaseElement>canonicalLinkDeclarations[0]).href;
			let currentHref: string;
			for (let i = 1; i < canonicalLinkDeclarations.length; i++) {
				currentHref = (<HTMLBaseElement>canonicalLinkDeclarations.item(i)).href;
				if (currentHref.length < shortestHref.length) {
					shortestHref = currentHref;
				}
			}
			return shortestHref;
		}
	}

	/**
	 * Get a clone of the current DOM, with our own UI and other unwanted tags removed, and as much CSS and canvas
	 * inlining as possible given the API's upload size limitation.
	 *
	 * @returns The cleaned DOM
	 */
	export function getCleanDomOfCurrentPage(originalDoc: Document): string {
		let doc = cloneDocument(originalDoc);
		convertCanvasElementsToImages(doc, originalDoc);

		addBaseTagIfNecessary(doc, originalDoc.location);

		removeClipperElements(doc);
		removeUnwantedElements(doc);
		removeUnwantedAttributes(doc);

		addImageSizeInformationToDom(doc);

		let domString = getDomString(doc);

		return domString;
	}

	/**
	 * Adds any additional styling to the preview elements
	 */
	export function addPreviewContainerStyling(previewElement: HTMLElement) {
		// What this does is add a little extra padding after each of the paragraphs in an article. This
		// makes what we are saving into OneNote match what we see in the preview (which is how browsers
		// render the paragraph elements).
		previewElement.setAttribute("style", "margin-bottom: 16px");
	}

	export interface EmbeddedVideoIFrameSrcs {
		srcAttribute: string;
		dataOriginalSrcAttribute: string;
	}

	const dataOriginalSrcAttribute = "data-original-src";

	/**
	 * Add embedded videos to the article preview where supported
	 */
	export function addEmbeddedVideosWhereSupported(previewElement: HTMLElement, pageContent: string, pageUrl: string): Promise<EmbeddedVideoIFrameSrcs[]> {
		return new Promise<EmbeddedVideoIFrameSrcs[]>((resolve, reject: (error: OneNoteApi.GenericError) => void) => {
			let supportedDomain = VideoUtils.videoDomainIfSupported(pageUrl);
			if (!supportedDomain) {
				resolve();
			}

			let iframes: HTMLIFrameElement[] = [];
			try {
				if (VideoUtils.SupportedVideoDomains[supportedDomain] === VideoUtils.SupportedVideoDomains.Vimeo) {
					iframes = iframes.concat(createEmbeddedVimeoVideos(pageContent));
				}
				if (VideoUtils.SupportedVideoDomains[supportedDomain] === VideoUtils.SupportedVideoDomains.YouTube) {
					iframes.push(createEmbeddedYouTubeVideo(pageUrl));
				}
			} catch (e) {
				// if we end up here, we're unexpectedly broken
				// (e.g, vimeo schema updated, we say we're supporting a domain we don't actually, etc)
				reject({ error: JSON.stringify({ doc: previewElement.outerHTML, pageContent: pageContent, message: e.message }) });
			}

			resolve(addVideosToElement(previewElement, iframes));
		});
	}

	/**
	 * Create iframes in correct format for Vimeo video embed in OneNote.
	 * Supports multiple videos.
	 */
	function createEmbeddedVimeoVideos(pageContent: string): HTMLIFrameElement[] {
		let vimeoSrcs = VideoUtils.getVimeoVideoSrcValues(pageContent);

		if (Utils.isNullOrUndefined(vimeoSrcs)) {
			// fast fail: we expect all pages passed into this function in prod to contain clip ids
			throw new Error("Vimeo page content does not contain clip ids");
		}

		let iframes: HTMLIFrameElement[] = [];

		for (let vimeoSrc of vimeoSrcs) {
			let iframe = createEmbedVideoIframe();
			iframe.src = vimeoSrc;
			iframe.setAttribute(dataOriginalSrcAttribute, vimeoSrc);

			iframes.push(iframe);
		}

		return iframes;
	}

	/**
	 * Create iframe in correct format for YouTube video embed in OneNote.
	 * Supports a single video.
	 */
	function createEmbeddedYouTubeVideo(pageUrl: string): HTMLIFrameElement {
		let iframe = createEmbedVideoIframe();
		let srcValue = VideoUtils.getYouTubeVideoSrcValue(pageUrl);
		let videoId = VideoUtils.getYouTubeVideoId(pageUrl);
		if (Utils.isNullOrUndefined(srcValue) || Utils.isNullOrUndefined(videoId)) {
			// fast fail: we expect all page urls passed into this function in prod to contain a video id
			throw new Error("YouTube page url does not contain video id");
		}
		iframe.src = srcValue;
		iframe.setAttribute(dataOriginalSrcAttribute, Utils.addUrlQueryValue(VideoUtils.youTubeWatchVideoBaseUrl, VideoUtils.youTubeVideoIdQueryKey, videoId));

		return iframe;
	}

	/**
	 * Create base iframe with reasonable style properties for video embed in OneNote.
	 */
	function createEmbedVideoIframe(): HTMLIFrameElement {
		let iframe = document.createElement("iframe");
		// these values must be set inline, else the embed in OneNote won't respect them
		// width and height set to preserve a 16:9 aspect ratio
		iframe.width = "600";
		iframe.height = "338";
		iframe.frameBorder = "0";
		iframe.allowFullscreen = false;

		return iframe;
	}

	/**
	 * Add an array of iframes to the top of the article previewer.
	 * Ordering of iframes in the array will be respected.
	 */
	function addVideosToElement(previewElement: HTMLElement, iframeNodes: HTMLIFrameElement[]): EmbeddedVideoIFrameSrcs[] {
		if (Utils.isNullOrUndefined(previewElement) || Utils.isNullOrUndefined(iframeNodes) || iframeNodes.length === 0) {
			return;
		}

		let videoSrcUrls: EmbeddedVideoIFrameSrcs[] = [];

		let lastInsertedNode: Node;
		for (let node of iframeNodes) {
			if (Utils.isNullOrUndefined(node.src) || Utils.isNullOrUndefined(node.getAttribute(dataOriginalSrcAttribute))) {
				// iframe constructed without a src or data-original-src attribute (somehow)
				// invalid construction, but we want record of it happening
				videoSrcUrls.push({ srcAttribute: "", dataOriginalSrcAttribute: "" });
				continue;
			}

			lastInsertedNode = insertIFrame(previewElement, node, lastInsertedNode);
			lastInsertedNode = insertSpacer(previewElement, lastInsertedNode.nextSibling);

			videoSrcUrls.push({ srcAttribute: node.src, dataOriginalSrcAttribute: node.getAttribute(dataOriginalSrcAttribute) });
		}

		return videoSrcUrls;
	}

	/**
	 * Given an html element, insert a node at the top of it.
	 * If lastInsertedNode provided, insert the node within the html element
	 * but immediately after lastInsertedNode instead.
	 */
	function insertIFrame(container: HTMLElement, newNode: Node, lastInsertedNode?: Node): Node {
		let referenceNode;
		if (Utils.isNullOrUndefined(lastInsertedNode)) {
			referenceNode = container.children[0]; // initial referenceNode
		} else {
			referenceNode = lastInsertedNode.nextSibling;
		}

		return container.insertBefore(newNode, referenceNode);
	}

	/**
	 * Given an html element and a reference node, insert a <br /> node
	 * within the html element, before the reference node
	 */
	function insertSpacer(container: HTMLElement, referenceNode: Node): Node {
		let spacerNode = document.createElement("br");
		return container.insertBefore(spacerNode, referenceNode);
	}

	/**
	 * Clones the document into a new document object
	 */
	export function cloneDocument(originalDoc: Document): Document {
		return originalDoc.cloneNode(true) as Document;
	}

	/**
	 * If the head doesn't contains a 'base' tag, then add one in case relative paths are used.
	 * If the location is not specified, the current document's location will be used.
	 */
	export function addBaseTagIfNecessary(doc: Document, location?: Location) {
		// Sometimes there is no head in the DOM e.g., pdfs in incognito mode
		if (!doc.head) {
			let headElement = doc.createElement(Tags.head);
			let htmlElement = doc.getElementsByTagName(Tags.html)[0] as HTMLHtmlElement;
			htmlElement.insertBefore(headElement, htmlElement.children[0]);
		}

		if (!location) {
			location = document.location;
		}

		let bases: NodeList = doc.head.getElementsByTagName(Tags.base);
		if (bases.length === 0) {
			let baseUrl = location.href.split("#")[0].split("?")[0];
			baseUrl = baseUrl.substr(0, baseUrl.lastIndexOf("/") + 1);

			let baseTag: HTMLBaseElement = <HTMLBaseElement>doc.createElement(Tags.base);
			baseTag.href = baseUrl;
			doc.head.insertBefore(baseTag, doc.head.firstChild);
		}
	}

	/**
	 * Remove blank images from the DOM. A blank image is defined as an image where all
	 * the pixels are either purely white or fully transparent.
	 */
	export function removeBlankImages(doc: Document): Promise<void> {
		return domReplacerAsync(doc, Tags.img, (node: Node) => {
			return new Promise<Node>((resolve) => {
				let img: HTMLImageElement = <HTMLImageElement>node;

				// Just passing in the image node won't work as it won't render properly
				// and the algorithm will think every pixel is (0,0,0,0)
				let theImg = new Image();
				theImg.src = img.src;

				// In Firefox, a SecurityError is thrown if the image is not CORS-enabled
				theImg.crossOrigin = "anonymous";

				theImg.onload = () => {
					resolve(imageIsBlank(theImg) ? undefined : node);
				};
				// onload can return a non-200 in some weird cases, so we have to specify this
				theImg.onerror = () => {
					resolve(undefined);
				};
			});
		});
	}

	/**
	 * Return true if every pixel in the image is either purely white or fully transparent;
	 * false otherwise. Assumes that the image is loaded already.
	 */
	export function imageIsBlank(img: HTMLImageElement) {
		if (img.width === 0 || img.height === 0) {
			return false;
		}

		let canvas = document.createElement("CANVAS") as HTMLCanvasElement;
		canvas.width = img.width;
		canvas.height = img.height;

		let context = canvas.getContext("2d");
		context.drawImage(img, 0, 0, img.width, img.height);

		// Each pixel is a 4 index block representing RGBA
		try {
			let area = context.getImageData(0, 0, canvas.width, canvas.height);
			let pixelArray = area.data;
			for (let i = 0; i < pixelArray.length; i += 4) {
				// If pixel is fully transparent
				if (pixelArray[i + 3] === 0) {
					continue;
				}
				// If pixel is purely white
				if (pixelArray[i] === 255 && pixelArray[i + 1] === 255 && pixelArray[i + 2] === 255) {
					continue;
				}
				return false;
			}
			return true;
		} catch (e) {
			// A SecurityError is sometimes thrown in Firefox on 'tainted' images
			// https://developer.mozilla.org/en-US/docs/Web/HTML/CORS_enabled_image
			return false;
		}
	}

	/**
	 * Remove Clipper elements from the DOM entirely
	 */
	export function removeClipperElements(doc: Document) {
		domReplacer(doc, [
			"#" + Constants.Ids.clipperRootScript,
			"#" + Constants.Ids.clipperUiFrame,
			"#" + Constants.Ids.clipperExtFrame
		].join());

		// Remove iframes that point to local files
		domReplacer(doc, Tags.iframe, (node: Node) => {
			let iframe: HTMLIFrameElement = <HTMLIFrameElement>node;
			let src = iframe.src;
			if (src.indexOf("chrome-extension://") === 0 ||
				src.indexOf("safari-extension://") === 0 ||
				src.indexOf("firefox-extension://") === 0 ||
				src.indexOf("file://") === 0) {
				return undefined;
			}
			return iframe;
		});
	}

	/**
	 * Remove unwanted elements from the DOM entirely
	 */
	export function removeUnwantedElements(doc: Document) {
		domReplacer(doc, [Tags.script, Tags.noscript].join());
	}

	/**
	 * Remove unwanted attributes from the DOM's elements
	 */
	export function removeUnwantedAttributes(doc: Document) {
		let images = doc.getElementsByTagName("IMG");
		for (let i = 0; i < images.length; i++) {
			let image = images[i] as HTMLImageElement;
			image.srcset = undefined;
			image.removeAttribute("srcset");
		}
	}

	/**
	 * Converts all images and links in a document to using absolute urls. To be
	 * called in the same context as the website.
	 */
	export function convertRelativeUrlsToAbsolute(doc: Document) {
		domReplacer(doc, Tags.img, (node: Node, index: number) => {
			let nodeAsImage = node as HTMLImageElement;

			// We don't use nodeAsImage.src as it returns undefined for relative urls
			let possiblyRelativeSrcAttr = (nodeAsImage.attributes as any).src;
			if (possiblyRelativeSrcAttr && possiblyRelativeSrcAttr.value) {
				nodeAsImage.src = toAbsoluteUrl(possiblyRelativeSrcAttr.value, location.origin);
				return nodeAsImage;
			}

			// This image has no src attribute. Assume it's rubbish!
			return undefined;
		});

		domReplacer(doc, Tags.a, (node: Node, index: number) => {
			let nodeAsAnchor = node as HTMLAnchorElement;

			let possiblyRelativeSrcAttr = (nodeAsAnchor.attributes as any).href;
			if (possiblyRelativeSrcAttr && possiblyRelativeSrcAttr.value) {
				nodeAsAnchor.href = toAbsoluteUrl(possiblyRelativeSrcAttr.value, location.origin);
				return nodeAsAnchor;
			}

			// Despite the href not being present, it's best to keep the element
			return node;
		});
	}

	export function toAbsoluteUrl(url: string, base: string): string {
		if (!url || !base) {
			throw new Error("parameters must be non-empty, but was: " + url + ", " + base);
		}

		let uri = new URI(url);
		if (uri.is("relative")) {
			return uri.absoluteTo(base).valueOf();
		}
		return url;
	}

	/**
	 * Replace canvas elements into images
	 * TODO: Deal with the situation of not running over max bytes
	 */
	export function convertCanvasElementsToImages(doc: Document, originalDoc: Document) {
		// We need to get the canvas's data from the original DOM since the cloned DOM doesn't have it
		let originalCanvasElements: NodeList = originalDoc.querySelectorAll(Tags.canvas);

		domReplacer(doc, Tags.canvas, (node: Node, index: number) => {
			let originalCanvas = originalCanvasElements[index] as HTMLCanvasElement;
			if (!originalCanvas) {
				return undefined;
			}

			let image: HTMLImageElement = <HTMLImageElement>doc.createElement(Tags.img);
			image.src = originalCanvas.toDataURL();
			image.style.cssText = window.getComputedStyle(originalCanvas).cssText;
			return image;
		});
	}

	/**
	 * Given a DOM, it will add image height and width information to all image tags
	 */
	export function addImageSizeInformationToDom(doc: Document) {
		let imgs = doc.getElementsByTagName("img");

		for (let i = 0; i < imgs.length; i++) {
			let img = imgs[i];
			if (!img.hasAttribute("data-height")) {
				let height = img.height;
				img.setAttribute("data-height", height.toString());
			}
			if (!img.hasAttribute("data-width")) {
				let width = img.width;
				img.setAttribute("data-width", width.toString());
			}
		}
	}

	/**
	 * Convert an image src url into a base 64 data url, if possible.
	 * Enables us to embed image data directly into a document.
	 * Uses idea by: https://davidwalsh.name/convert-image-data-uri-javascript
	 * Uses cached image idea by: https://developer.mozilla.org/en-US/docs/Web/HTML/CORS_enabled_image
	 */
	export function getImageDataUrl(imageSrcUrl: string): Promise<string> {
		return new Promise<string>((resolve: (result: string) => void, reject: (error: OneNoteApi.GenericError) => void) => {
			if (Utils.isNullOrUndefined(imageSrcUrl) || imageSrcUrl === "") {
				reject({ error: "image source is undefined or empty" });
			}

			let image = new Image();
			// see https://developer.mozilla.org/en-US/docs/Web/HTML/CORS_enabled_image for why this is needed
			image.crossOrigin = "anonymous";

			image.onload = function () {
				let canvas = document.createElement(Tags.canvas) as HTMLCanvasElement;
				canvas.width = this.naturalWidth;
				canvas.height = this.naturalHeight;

				canvas.getContext("2d").drawImage(this, 0, 0);

				try {
					let dataUrl: string = canvas.toDataURL("image/png");
					dataUrl = DomUtils.adjustImageQualityIfNecessary(canvas, dataUrl);

					resolve(dataUrl);
				} catch (e) {
					// There are some cases (like dirty canvases) where running toDataURL will throw an error.
					// We catch it and return the original image source url.
					resolve(imageSrcUrl);
				}
			};

			image.onerror = function (ev: Event) {
				let erroredImg: HTMLImageElement = ev.currentTarget as HTMLImageElement;
				let erroredImgSrc: string;
				if (!Utils.isNullOrUndefined(erroredImg)) {
					erroredImgSrc = erroredImg.src;
				}
				reject({ error: "onerror occurred fetching " + erroredImgSrc});
			};

			image.src = imageSrcUrl;

			// make sure the load event fires for cached images too
			if (image.complete || image.complete === undefined) {
				image.src = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==";
				image.src = imageSrcUrl;
			}
		});
	}

	export let maxBytesForMediaTypes: number = 2097152 - 500; // Settings.Instance.Apis_MediaTypesHandledInMemoryMaxRequestLength - 500 byte buffer for the request padding.

	/**
	 * If a high-quality image is too big for the request, then switch to JPEG and step down
	 */
	export function adjustImageQualityIfNecessary(canvas: HTMLCanvasElement, dataUrl: string, quality = 1, qualityStep = 0.1): string {
		let stepDownCount = 0;
		while (quality > 0 && dataUrl.length > maxBytesForMediaTypes) {
			dataUrl = canvas.toDataURL("image/jpeg", quality);

			quality -= qualityStep;
			stepDownCount++;
		}

		return dataUrl;
	}

	/**
	 * Returns a string representing the entire document
	 */
	export function getDomString(doc: Document): string {
		return getDoctype(doc) + doc.documentElement.outerHTML;
	}

	/**
	 * Returns the document represented by the dom string.
	 * If title is provided, the title attribute will be populated in the head element.
	 */
	export function getDocumentFromDomString(domString: string, title?: string): Document {
		let doc = document.implementation.createHTMLDocument(title);
		doc.documentElement.innerHTML = domString;

		return doc;
	}

	/**
	 * Return the DOCTYPE defined in the file
	 */
	export function getDoctype(doc: Document): string {
		let doctype: DocumentType = doc.doctype;

		if (!doctype) {
			// Quirks mode
			return "";
		}

		return "<!DOCTYPE "
			+ doctype.name
			+ (doctype.publicId ? " PUBLIC \"" + doctype.publicId + "\"" : "")
			+ (!doctype.publicId && doctype.systemId ? " SYSTEM" : "")
			+ (doctype.systemId ? " \"" + doctype.systemId + "\"" : "")
			+ ">";
	}

	// This function has technically been deprecated, but is present in all major browsers as of 2/12/14 and offers
	// the best perf for the UTF byte manipulation we need for truncation and byte size estimation.
	// DO NOT USE IT WITHOUT CHECKING IF IT EXISTS -- in case browser vendors actually remove them
	// ReSharper disable once InconsistentNaming
	declare function unescape(s: string): string;

	export function getByteSize(s: string) {
		if (unescape) {
			return unescape(encodeURIComponent(s)).length;
		} else {
			return getByteArray(s).length;
		}
	}

	export function truncateStringToByteSize(s: string, maxByteLength: number): string {
		let bytes: string[] = getByteArray(s);
		if (bytes.length <= maxByteLength) {
			return s;
		}

		bytes = bytes.slice(0, maxByteLength);
		let encoded = bytes.join("");
		while (encoded.length) {
			try {
				encoded = encoded.slice(0, -1);
				return decodeURIComponent(encoded);
			} catch (e) {
				// If the encoded string ends in a non-complete multibyte char, decode will throw an error
				return "";
			}
		}
	}

	export function getByteArray(s: string): string[] {
		return encodeURIComponent(s).match(/%..|./g) || [];
	}

	/**
	 * Gets the locale of the document
	 */
	export function getLocale(doc: Document): string {
		// window.navigator.userLanguage is defined for IE, and window.navigator.language is defined for other browsers
		let docLocale = (<HTMLElement>doc.getElementsByTagName("html")[0]).getAttribute("lang");
		return docLocale ? docLocale : (window.navigator.userLanguage || (<any>window.navigator).language);
	}

	/**
	 * Gets the name of the file from the Url. Right now we mainly
	 * support getting the name from PDF.
	 */
	export function getFileNameFromUrl(doc: Document): string {
		let urlAnchor = doc.createElement("a");
		urlAnchor.href = doc.URL;

		if (urlAnchor.pathname.match(new RegExp(".pdf$", "gi"))) {
			let filename = urlAnchor.pathname.match(/[^/]+$/g);
			if (filename) {
				return decodeURIComponent(filename.pop());
			}
		}
		return doc.title;
	}

	/**
	 * Find all non-whitespace text nodes under the provided root node
	 * Uses idea by: http://stackoverflow.com/a/10730777
	 */
	export function textNodesNoWhitespaceUnder(root: Node): Text[] {
		let a: Text[] = [];
		let walk = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
			acceptNode: function (node: Text) {
				// Logic to determine whether to accept, reject or skip node
				// In this case, only accept nodes that have content
				// other than whitespace
				if ( ! /^\s*$/.test(node.data) ) {
					return NodeFilter.FILTER_ACCEPT;
				}
			}
		}, false);

		let n: Node;
		while (n = walk.nextNode()) {
			a.push(n as Text);
		}

		return a;
	}

	/*
	 * Mimics augmentation API cleaning and ensuring that only ONML-compliant
	 * elements remain
	 */
	export function toOnml(doc: Document): Promise<void> {
		removeElementsNotSupportedInOnml(doc);
		domReplacer(doc, [Tags.iframe].join());
		getCleanDomOfCurrentPage(doc);
		convertRelativeUrlsToAbsolute(doc);
		removeAllStylesAndClasses(doc);
		return removeBlankImages(doc);
	}

	function removeAllStylesAndClasses(doc: Document): void {
		domReplacer(doc, "*", (oldNode, index) => {
			(<HTMLElement>oldNode).removeAttribute("style");
			(<HTMLElement>oldNode).removeAttribute("class");
			return oldNode;
		});
	}
}
