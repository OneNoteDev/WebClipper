// 9/28/2016 - We need to go back and update sanitize-html to the latest .d.ts once
// they rename `sanitize` to `sanitizeHtml`, which is the name of the actually exported function
declare let sanitizeHtml;

// This private has technically been deprecated, but is present in all major browsers as of 2/12/14 and offers
// the best perf for the UTF byte manipulation we need for truncation and byte size estimation.
// DO NOT USE IT WITHOUT CHECKING IF IT EXISTS -- in case browser vendors actually remove them
// ReSharper disable once InconsistentNaming
declare function unescape(s: string): string;

import {Constants} from "../constants";
import {ObjectUtils} from "../objectUtils";
import {SupportedVideoDomains, VideoUtils} from "./videoUtils";

import {VideoExtractorFactory} from "./VideoExtractorFactory";

export interface EmbeddedVideoIFrameSrcs {
	srcAttribute: string;
	dataOriginalSrcAttribute: string;
}

/**
 * Dom specific Helper utility methods
 */
export class DomUtils {
	public static tags = {
		a: "a",
		b: "b",
		applet: "applet",
		article: "article",
		audio: "audio",
		base: "base",
		body: "body",
		br: "br",
		button: "button",
		canvas: "canvas",
		center: "center",
		cite: "cite",
		code: "code",
		del: "del",
		div: "div",
		em: "em",
		embed: "embed",
		figure: "figure",
		font: "font",
		h1: "h1",
		h2: "h2",
		h3: "h3",
		h4: "h4",
		h5: "h5",
		h6: "h6",
		head: "head",
		header: "header",
		hr: "hr",
		html: "html",
		i: "i",
		iframe: "iframe",
		img: "img",
		input: "input",
		li: "li",
		link: "link",
		main: "main",
		map: "map",
		menu: "menu",
		menuitem: "menuitem",
		meta: "meta",
		meter: "meter",
		noscript: "noscript",
		object: "object",
		ol: "ol",
		p: "p",
		pre: "pre",
		progress: "progress",
		script: "script",
		span: "span",
		source: "source",
		strike: "strike",
		strong: "strong",
		style: "style",
		sub: "sub",
		sup: "sup",
		svg: "svg",
		table: "table",
		td: "td",
		title: "title",
		tr: "tr",
		u: "u",
		ul: "ul",
		video: "video"
	};

	// See the OneNote Dev Center API Reference for a list of supported attributes and tags
	// https://dev.onenote.com/docs#/introduction/html-tag-support-for-pages
	protected static attributesAllowedByOnml: { [index: string]: string[] } = {
		"a": ["href", "name", "target"],
		"img": ["src"],
		"*": ["src", "background-color", "color", "font-family", "font-size", "data*", "alt", "height", "width", "style", "id", "type"]
	};

	protected static tableTags = [
		DomUtils.tags.table,
		DomUtils.tags.td,
		DomUtils.tags.tr
	];

	protected static markupTags = [
		DomUtils.tags.b,
		DomUtils.tags.em,
		DomUtils.tags.strong,
		DomUtils.tags.i,
		DomUtils.tags.u,
		DomUtils.tags.strike,
		DomUtils.tags.del,
		DomUtils.tags.sup,
		DomUtils.tags.sub,
		DomUtils.tags.cite,
		DomUtils.tags.font,
		DomUtils.tags.pre,
		DomUtils.tags.code
	];

	protected static htmlTags = [
		DomUtils.tags.html,
		DomUtils.tags.head,
		DomUtils.tags.title,
		DomUtils.tags.meta,
		DomUtils.tags.body,
		DomUtils.tags.div,
		DomUtils.tags.span,
		DomUtils.tags.article,
		DomUtils.tags.figure,
		DomUtils.tags.header,
		DomUtils.tags.main,
		DomUtils.tags.center,
		DomUtils.tags.iframe,
		DomUtils.tags.a,
		DomUtils.tags.p,
		DomUtils.tags.br,
		DomUtils.tags.h1,
		DomUtils.tags.h2,
		DomUtils.tags.h3,
		DomUtils.tags.h4,
		DomUtils.tags.h5,
		DomUtils.tags.h6,
		DomUtils.tags.ul,
		DomUtils.tags.ol,
		DomUtils.tags.li,
		DomUtils.tags.img,
		DomUtils.tags.object,
		DomUtils.tags.video
	];

	// TODO: write a module test to make sure these tagsNotSupportedInOnml and the tags above have no intersection
	protected static tagsNotSupportedInOnml = [
		DomUtils.tags.applet,
		DomUtils.tags.audio,
		DomUtils.tags.button,
		DomUtils.tags.canvas,
		DomUtils.tags.embed,
		DomUtils.tags.hr,
		DomUtils.tags.input,
		DomUtils.tags.link,
		DomUtils.tags.map,
		DomUtils.tags.menu,
		DomUtils.tags.menuitem,
		DomUtils.tags.meter,
		DomUtils.tags.noscript,
		DomUtils.tags.progress,
		DomUtils.tags.script,
		DomUtils.tags.source,
		DomUtils.tags.style,
		DomUtils.tags.svg,
		DomUtils.tags.video
	];

	/**
	 * Given an HTML Document in string form, return an HTML Document in string form
	 * with the attributes and the content between the HTML tags scrubbed, while preserving
	 * document structure
	 */
	public static cleanHtml(contentInHtml: string): string {
		let allAttributes: string[] = [];
		for (let key in DomUtils.attributesAllowedByOnml) {
			if (DomUtils.attributesAllowedByOnml.hasOwnProperty(key)) {
				allAttributes = allAttributes.concat(DomUtils.attributesAllowedByOnml[key]);
			}
		}

		let tags = DomUtils.htmlTags.concat(DomUtils.markupTags).concat(DomUtils.tableTags);
		let sanitizedHtml = sanitizeHtml(contentInHtml, {
			allowedTags: tags,
			allowedAttributes: DomUtils.attributesAllowedByOnml,
			allowedSchemes: sanitizeHtml.defaults.allowedSchemes.concat(["data"]),
			allowedClasses: {
				"*": ["MainArticleContainer"]
			}
		});

		return sanitizedHtml;
	}

	/**
	 * Many extensions inject their own stylings into the page, and generally that isn't a problem. But,
	 * occasionally the styling includes a specific font, which can be very, very large. This method
	 * removes any base64 encoded binaries defined in any <style> tags.
	 */
	public static removeStylesWithBase64EncodedBinaries(doc: Document): void {
		DomUtils.domReplacer(doc, "style", (node: HTMLElement) => {
			return node.innerHTML.indexOf("data:application") !== -1 ? undefined : node;
		});
	}

	public static removeElementsNotSupportedInOnml(doc: Document): void {
		// For elements that cannot be converted into something equivalent in ONML, we remove them ...
		DomUtils.domReplacer(doc, DomUtils.tagsNotSupportedInOnml.join());

		let tagsToTurnIntoDiv = [DomUtils.tags.main, DomUtils.tags.article, DomUtils.tags.figure, DomUtils.tags.header, DomUtils.tags.center];

		// ... and for everything else, we replace them with an equivalent, preserving the inner HTML
		DomUtils.domReplacer(doc, tagsToTurnIntoDiv.join(), (node: HTMLElement) => {
			let div = document.createElement("div");
			div.innerHTML = DomUtils.cleanHtml(node.innerHTML);
			return div;
		});
	}

	public static domReplacer(doc: Document, querySelector: string, getReplacement: (oldNode: Node, index: number) => Node = () => undefined) {
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

	public static domReplacerAsync(doc: Document, querySelector: string, getReplacement: (oldNode: Node, index: number) => Promise<Node> = () => Promise.resolve(undefined)): Promise<void> {
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
	public static getPageContentType(doc: Document): OneNoteApi.ContentType {
		let anchor = doc.createElement("a");
		anchor.href = doc.URL;
		if (/\.pdf$/i.test(anchor.pathname)) {
			return OneNoteApi.ContentType.EnhancedUrl;
		}

		// Check if there's a PDF embed element. We cast the element to any because the type
		// property is not recognized in Typescript despite being part of the HTML5 standard.
		// Additionally, Edge does not seem to respect this standard as of 10/13/16.
		let embedElement = doc.querySelector("embed") as HTMLEmbedElement;
		if (embedElement && /application\/pdf/i.test((<any>embedElement).type)) {
			return OneNoteApi.ContentType.EnhancedUrl;
		}

		// Check if this was a PDF rendered with PDF.js. With PDF.js, the PDFJS object will be
		// added to the window object.
		if (window && (<any>window).PDFJS) {
			return OneNoteApi.ContentType.EnhancedUrl;
		}

		return OneNoteApi.ContentType.Html;
	}

	/**
	 * Return the best CanonicalUrl for the document
	 * Some sites mistakenly declare multiple canonical urls. Pick the shortest one.
	 * (Most canonical urls involve stripping away directory index, fragments, query
	 * variables etc. hence we pick the shortest one as it is likely to be correct.)
	 */
	public static fetchCanonicalUrl(doc: Document): string {
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
	 * Get a clone of the specified DOM, with our own UI and other unwanted tags removed, and as much CSS and canvas
	 * inlining as possible given the API's upload size limitation. This does not affect the document passed into the
	 * function.
	 *
	 * @returns The cleaned DOM
	 */
	public static getCleanDomOfCurrentPage(originalDoc: Document): string {
		let doc = DomUtils.cloneDocument(originalDoc);
		DomUtils.convertCanvasElementsToImages(doc, originalDoc);
		DomUtils.addBaseTagIfNecessary(doc, originalDoc.location);

		DomUtils.addImageSizeInformationToDom(doc);
		DomUtils.removeUnwantedItems(doc);

		let domString = DomUtils.getDomString(doc);
		return domString;
	}

	public static removeUnwantedItems(doc: Document): void {
		DomUtils.removeStylesWithBase64EncodedBinaries(doc);
		DomUtils.removeClipperElements(doc);
		DomUtils.removeUnwantedElements(doc);
		DomUtils.removeUnwantedAttributes(doc);
		DomUtils.removeUnsupportedHrefs(doc);
	}

	/**
	 * Adds any additional styling to the preview elements
	 */
	public static addPreviewContainerStyling(previewElement: HTMLElement) {
		// What this does is add a little extra padding after each of the paragraphs in an article. This
		// makes what we are saving into OneNote match what we see in the preview (which is how browsers
		// render the paragraph elements).
		previewElement.setAttribute("style", "margin-bottom: 16px");
	}

	protected static dataOriginalSrcAttribute = "data-original-src";

	/**
	 * Add embedded videos to the article preview where supported
	 */
	public static addEmbeddedVideosWhereSupported(previewElement: HTMLElement, pageContent: string, pageUrl: string): Promise<EmbeddedVideoIFrameSrcs[]> {
		let supportedDomain = VideoUtils.videoDomainIfSupported(pageUrl);
		if (!supportedDomain) {
			return Promise.resolve();
		}

		let iframes: HTMLIFrameElement[] = [];
		try {
			// Construct the appropriate videoExtractor based on the Domain we are on
			let domain = SupportedVideoDomains[supportedDomain];
			let extractor = VideoExtractorFactory.createVideoExtractor(domain);

			// If we are on a Domain that has a valid VideoExtractor, get the embedded videos
			// to render them later
			if (extractor) {
				iframes = iframes.concat(extractor.createEmbeddedVideosFromPage(pageUrl, pageContent));
			}
		} catch (e) {
			// if we end up here, we're unexpectedly broken
			// (e.g, vimeo schema updated, we say we're supporting a domain we don't actually, etc)
			return Promise.reject({ error: JSON.stringify({ doc: previewElement.outerHTML, pageContent: pageContent, message: e.message }) });
		}

		return Promise.resolve(DomUtils.addVideosToElement(previewElement, iframes));
	}

	/**
	 * Create base iframe with reasonable style properties for video embed in OneNote.
	 */
	public static createEmbedVideoIframe(): HTMLIFrameElement {
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
	private static addVideosToElement(previewElement: HTMLElement, iframeNodes: HTMLIFrameElement[]): EmbeddedVideoIFrameSrcs[] {
		if (ObjectUtils.isNullOrUndefined(previewElement) || ObjectUtils.isNullOrUndefined(iframeNodes) || iframeNodes.length === 0) {
			return;
		}

		let videoSrcUrls: EmbeddedVideoIFrameSrcs[] = [];

		let lastInsertedNode: Node;
		for (let node of iframeNodes) {
			if (ObjectUtils.isNullOrUndefined(node.src) || ObjectUtils.isNullOrUndefined(node.getAttribute(DomUtils.dataOriginalSrcAttribute))) {
				// iframe constructed without a src or data-original-src attribute (somehow)
				// invalid construction, but we want record of it happening
				videoSrcUrls.push({ srcAttribute: "", dataOriginalSrcAttribute: "" });
				continue;
			}

			lastInsertedNode = DomUtils.insertIFrame(previewElement, node, lastInsertedNode);
			lastInsertedNode = DomUtils.insertSpacer(previewElement, lastInsertedNode.nextSibling);

			videoSrcUrls.push({ srcAttribute: node.src, dataOriginalSrcAttribute: node.getAttribute(DomUtils.dataOriginalSrcAttribute) });
		}

		return videoSrcUrls;
	}

	/**
	 * Given an html element, insert a node at the top of it.
	 * If lastInsertedNode provided, insert the node within the html element
	 * but immediately after lastInsertedNode instead.
	 */
	private static insertIFrame(container: HTMLElement, newNode: Node, lastInsertedNode?: Node): Node {
		let referenceNode;
		if (ObjectUtils.isNullOrUndefined(lastInsertedNode)) {
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
	private static insertSpacer(container: HTMLElement, referenceNode: Node): Node {
		let spacerNode = document.createElement("br");
		return container.insertBefore(spacerNode, referenceNode);
	}

	/**
	 * Clones the document into a new document object
	 */
	public static cloneDocument(originalDoc: Document): Document {
		return originalDoc.cloneNode(true) as Document;
	}

	/**
	 * If the head doesn't contains a 'base' tag, then add one in case relative paths are used.
	 * If the location is not specified, the current document's location will be used.
	 */
	public static addBaseTagIfNecessary(doc: Document, location?: Location) {
		// Sometimes there is no head in the DOM e.g., pdfs in incognito mode
		if (!doc.head) {
			let headElement = doc.createElement(DomUtils.tags.head);
			let htmlElement = doc.getElementsByTagName(DomUtils.tags.html)[0] as HTMLHtmlElement;
			htmlElement.insertBefore(headElement, htmlElement.children[0]);
		}

		if (!location) {
			location = document.location;
		}

		let bases: NodeList = doc.head.getElementsByTagName(DomUtils.tags.base);
		if (bases.length === 0) {
			let baseUrl = location.href.split("#")[0].split("?")[0];
			baseUrl = baseUrl.substr(0, baseUrl.lastIndexOf("/") + 1);

			let baseTag: HTMLBaseElement = <HTMLBaseElement>doc.createElement(DomUtils.tags.base);
			baseTag.href = baseUrl;
			doc.head.insertBefore(baseTag, doc.head.firstChild);
		}
	}

	/**
	 * Remove blank images from the DOM. A blank image is defined as an image where all
	 * the pixels are either purely white or fully transparent.
	 */
	public static removeBlankImages(doc: Document): Promise<void> {
		return DomUtils.domReplacerAsync(doc, DomUtils.tags.img, (node: Node) => {
			return new Promise<Node>((resolve) => {
				let img: HTMLImageElement = <HTMLImageElement>node;

				// Just passing in the image node won't work as it won't render properly
				// and the algorithm will think every pixel is (0,0,0,0)
				let theImg = new Image();

				// In Firefox, a SecurityError is thrown if the image is not CORS-enabled
				theImg.crossOrigin = "anonymous";

				theImg.onload = () => {
					resolve(DomUtils.imageIsBlank(theImg) ? undefined : node);
				};
				// onload can return a non-200 in some weird cases, so we have to specify this
				theImg.onerror = () => {
					// Be forgiving, and assume the image is non-blank
					resolve(node);
				};

				// The request is kicked off as soon as the src is set, so it needs to happen last
				theImg.src = img.src || img.getAttribute("src");
			});
		});
	}

	/**
	 * Return true if every pixel in the image is either purely white or fully transparent;
	 * false otherwise. Assumes that the image is loaded already.
	 */
	public static imageIsBlank(img: HTMLImageElement) {
		if (img.width === 0 || img.height === 0) {
			return false;
		}

		let canvas = document.createElement("canvas") as HTMLCanvasElement;
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
	public static removeClipperElements(doc: Document) {
		DomUtils.domReplacer(doc, [
			"#" + Constants.Ids.clipperRootScript,
			"#" + Constants.Ids.clipperUiFrame,
			"#" + Constants.Ids.clipperExtFrame
		].join());

		// Remove iframes that point to local files
		DomUtils.domReplacer(doc, DomUtils.tags.iframe, (node: Node) => {
			let iframe: HTMLIFrameElement = <HTMLIFrameElement>node;
			let src = iframe.src;
			if (this.isLocalReferenceUrl(src)) {
				return undefined;
			}
			return iframe;
		});
	}

	/**
	 * Remove any references to URLs that won't work on another box (i.e. our servers)
	 */
	public static removeUnsupportedHrefs(doc: Document) {
		DomUtils.domReplacer(doc, DomUtils.tags.link, (node: Node) => {
			let linkElement: HTMLLinkElement = <HTMLLinkElement>node;
			let href = linkElement.href;

			if (this.isLocalReferenceUrl(href)) {
				return undefined;
			}

			return linkElement;
		});
	}

	/**
	 * Remove unwanted elements from the DOM entirely
	 */
	public static removeUnwantedElements(doc: Document) {
		DomUtils.domReplacer(doc, [DomUtils.tags.script, DomUtils.tags.noscript].join());
	}

	/**
	 * Remove unwanted attributes from the DOM's elements
	 */
	public static removeUnwantedAttributes(doc: Document) {
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
	public static convertRelativeUrlsToAbsolute(doc: Document) {
		DomUtils.domReplacer(doc, DomUtils.tags.img, (node: Node, index: number) => {
			let nodeAsImage = node as HTMLImageElement;

			// We don't use nodeAsImage.src as it returns undefined for relative urls
			let possiblyRelativeSrcAttr = (nodeAsImage.attributes as any).src;
			if (possiblyRelativeSrcAttr && possiblyRelativeSrcAttr.value) {
				nodeAsImage.src = DomUtils.toAbsoluteUrl(possiblyRelativeSrcAttr.value, location.origin);
				return nodeAsImage;
			}

			// This image has no src attribute. Assume it's rubbish!
			return undefined;
		});

		DomUtils.domReplacer(doc, DomUtils.tags.a, (node: Node, index: number) => {
			let nodeAsAnchor = node as HTMLAnchorElement;

			let possiblyRelativeSrcAttr = (nodeAsAnchor.attributes as any).href;
			if (possiblyRelativeSrcAttr && possiblyRelativeSrcAttr.value) {
				nodeAsAnchor.href = DomUtils.toAbsoluteUrl(possiblyRelativeSrcAttr.value, location.origin);
				return nodeAsAnchor;
			}

			// Despite the href not being present, it's best to keep the element
			return node;
		});
	}

	public static toAbsoluteUrl(url: string, base: string): string {
		if (!url || !base) {
			throw new Error("parameters must be non-empty, but was: " + url + ", " + base);
		}

		// Urls starting with "//" inherit the protocol from the rendering page, and the Clipper has a
		// protocol of chrome-extension, which is incorrect. We should manually add the protocol here
		if (/^\/\/[^\/]/.test(url)) {
			url = location.protocol + url;
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
	public static convertCanvasElementsToImages(doc: Document, originalDoc: Document) {
		// We need to get the canvas's data from the original DOM since the cloned DOM doesn't have it
		let originalCanvasElements: NodeList = originalDoc.querySelectorAll(DomUtils.tags.canvas);

		DomUtils.domReplacer(doc, DomUtils.tags.canvas, (node: Node, index: number) => {
			let originalCanvas = originalCanvasElements[index] as HTMLCanvasElement;
			if (!originalCanvas) {
				return undefined;
			}

			let image: HTMLImageElement = <HTMLImageElement>doc.createElement(DomUtils.tags.img);
			image.src = originalCanvas.toDataURL();
			image.style.cssText = window.getComputedStyle(originalCanvas).cssText;
			return image;
		});
	}

	/**
	 * Given a DOM, it will add image height and width information to all image tags
	 */
	public static addImageSizeInformationToDom(doc: Document) {
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
	public static getImageDataUrl(imageSrcUrl: string): Promise<string> {
		return new Promise<string>((resolve: (result: string) => void, reject: (error: OneNoteApi.GenericError) => void) => {
			if (ObjectUtils.isNullOrUndefined(imageSrcUrl) || imageSrcUrl === "") {
				reject({ error: "image source is undefined or empty" });
			}

			let image = new Image();
			// see https://developer.mozilla.org/en-US/docs/Web/HTML/CORS_enabled_image for why this is needed
			image.crossOrigin = "anonymous";

			image.onload = () => {
				let canvas = document.createElement(DomUtils.tags.canvas) as HTMLCanvasElement;
				canvas.width = image.naturalWidth;
				canvas.height = image.naturalHeight;

				canvas.getContext("2d").drawImage(image, 0, 0);

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

			image.onerror = (ev: Event) => {
				let erroredImg: HTMLImageElement = ev.currentTarget as HTMLImageElement;
				let erroredImgSrc: string;
				if (!ObjectUtils.isNullOrUndefined(erroredImg)) {
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

	public static maxBytesForMediaTypes: number = 2097152 - 500; // Settings.Instance.Apis_MediaTypesHandledInMemoryMaxRequestLength - 500 byte buffer for the request padding.

	/**
	 * If a high-quality image is too big for the request, then switch to JPEG and step down
	 */
	public static adjustImageQualityIfNecessary(canvas: HTMLCanvasElement, dataUrl: string, quality = 1, qualityStep = 0.1): string {
		let stepDownCount = 0;
		while (quality > 0 && dataUrl.length > DomUtils.maxBytesForMediaTypes) {
			dataUrl = canvas.toDataURL("image/jpeg", quality);
			quality -= qualityStep;
			stepDownCount++;
		}

		return dataUrl;
	}

	/**
	 * Returns a string representing the entire document
	 */
	public static getDomString(doc: Document): string {
		return DomUtils.getDoctype(doc) + doc.documentElement.outerHTML;
	}

	/**
	 * Returns the document represented by the dom string.
	 * If title is provided, the title attribute will be populated in the head element.
	 */
	public static getDocumentFromDomString(domString: string, title?: string): Document {
		let doc = document.implementation.createHTMLDocument(title);
		doc.documentElement.innerHTML = domString;

		return doc;
	}

	/**
	 * Return the DOCTYPE defined in the file
	 */
	public static getDoctype(doc: Document): string {
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

	public static getByteSize(s: string) {
		if (unescape) {
			return unescape(encodeURIComponent(s)).length;
		} else {
			return DomUtils.getByteArray(s).length;
		}
	}

	public static truncateStringToByteSize(s: string, maxByteLength: number): string {
		let bytes: string[] = DomUtils.getByteArray(s);
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

	public static getByteArray(s: string): string[] {
		return encodeURIComponent(s).match(/%..|./g) || [];
	}

	/**
	 * Gets the locale of the document
	 */
	public static getLocale(doc: Document): string {
		// window.navigator.userLanguage is defined for IE, and window.navigator.language is defined for other browsers
		let docLocale = (<HTMLElement>doc.getElementsByTagName("html")[0]).getAttribute("lang");
		return docLocale ? docLocale : window.navigator.language || (<any>window.navigator).userLanguage;
	}

	/**
	 * Gets the name of the file from the Url. Right now we mainly
	 * support getting the name from PDF.
	 */
	public static getFileNameFromUrl(doc: Document): string {
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
	public static textNodesNoWhitespaceUnder(root: Node): Text[] {
		let a: Text[] = [];
		let walk: TreeWalker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
			acceptNode: (node: Text) => {
				// Logic to determine whether to accept, reject or skip node
				// In this case, only accept nodes that have content
				// other than whitespace
				if ( ! /^\s*$/.test(node.data) ) {
					return NodeFilter.FILTER_ACCEPT;
				}
			}
		}, false);

		let n: Node = walk.nextNode();
		while (n) {
			a.push(n as Text);
			n = walk.nextNode();
		}

		return a;
	}

	public static removeEventListenerAttributes(doc: Document): void {
		// See: https://en.wikipedia.org/wiki/DOM_events
		let attributesToRemove = [
			"onclick",
			"ondblclick",
			"onmousedown",
			"onmouseup",
			"onmouseover",
			"onmousemove",
			"onmouseout",
			"ondragstart",
			"ondrag",
			"ondragenter",
			"ondragleave",
			"ondragover",
			"ondrop",
			"ondragend",
			"onkeydown",
			"onkeypress",
			"onkeyup",
			"onload",
			"onunload",
			"onabort",
			"onerror",
			"onresize",
			"onscroll",
			"onselect",
			"onchange",
			"onsubmit",
			"onreset",
			"onfocus",
			"onblur"
		];

		for (let i = 0; i < attributesToRemove.length; i++) {
			let elements = doc.querySelectorAll("[" + attributesToRemove[i] + "]");
			for (let j = 0; j < elements.length; j++) {
				elements[j].removeAttribute(attributesToRemove[i]);
			}
		}
	}

	/*
	 * Mimics augmentation API cleaning and ensuring that only ONML-compliant
	 * elements remain
	 */
	public static toOnml(doc: Document): Promise<void> {
		DomUtils.removeElementsNotSupportedInOnml(doc);
		DomUtils.removeDisallowedIframes(doc);
		DomUtils.removeUnwantedItems(doc);
		DomUtils.convertRelativeUrlsToAbsolute(doc);
		DomUtils.removeAllStylesAndClasses(doc);
		DomUtils.removeEventListenerAttributes(doc);
		return DomUtils.removeBlankImages(doc);
	}

	public static removeDisallowedIframes(doc: Document) {
		// We also detect if the iframe is a video, and we ensure that we have
		// the correct attribute set so that ONApi recognizes it
		DomUtils.domReplacer(doc, DomUtils.tags.iframe, (node) => {
			let src = (node as HTMLIFrameElement).src;
			let supportedDomain = VideoUtils.videoDomainIfSupported(src);
			if (!supportedDomain) {
				return undefined;
			}

			let domain = SupportedVideoDomains[supportedDomain];
			let extractor = VideoExtractorFactory.createVideoExtractor(domain);
			return extractor.createEmbeddedVideoFromUrl(src);
		});
	}

	private static removeAllStylesAndClasses(doc: Document): void {
		DomUtils.domReplacer(doc, "*", (oldNode, index) => {
			(<HTMLElement>oldNode).removeAttribute("style");
			(<HTMLElement>oldNode).removeAttribute("class");
			return oldNode;
		});
	}

	private static isScrolledIntoPartialView(el: HTMLElement): boolean {
		let elemTop = el.getBoundingClientRect().top;
		let elemBottom = el.getBoundingClientRect().bottom;

		let isVisible = elemTop < window.innerHeight && elemBottom >= 0;
		return isVisible;
	}

	public static getScrollPercent(elem: Element, asDecimalValue = false) {
		if (!elem) {
			return 0;
		}

		let scrollValue: number = (elem.scrollTop * 1.0) / (elem.scrollHeight - elem.clientHeight);

		if (asDecimalValue) {
			return scrollValue;
		}

		return scrollValue * 100;
	}

	private static isLocalReferenceUrl(url: string): Boolean {
		return !(url.indexOf("https://") === 0 || url.indexOf("http://") === 0);
	}
}
