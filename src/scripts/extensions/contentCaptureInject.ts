// Standalone content capture — reads page DOM and sends to worker.
// Injected by worker via chrome.scripting.executeScript.
// Messages are JSON strings (required by offscreen.ts message handler).
//
// DOM cleaning pipeline: master's DomUtils.getCleanDomOfCurrentPage baseline +
// enhancements for multi-viewport screenshot stitching:
//   clone → inlineHiddenElements → neutralizePositioning → flattenShadowDomSlots →
//   convertCanvasToImages → addBaseTag → addImageSizes → removeUnwantedItems
//   (removeStylesWithBase64, removeClipperElements + iframe filter,
//   removeUnwantedElements, removeUnwantedAttributes, removeUnsupportedHrefs) →
//   getDomString → resolveLazyImages

(function() {
	// --- Helpers ---

	function isLocalReferenceUrl(url: string): boolean {
		return !(url.indexOf("https://") === 0 || url.indexOf("http://") === 0);
	}

	// --- DOM cleaning (master DomUtils baseline) ---

	function cloneDocument(originalDoc: Document): Document {
		return originalDoc.cloneNode(true) as Document;
	}

	// --- Enhancements (not in master, run on clone before master steps) ---

	function inlineHiddenElements(doc: Document, originalDoc: Document): void {
		if (!originalDoc.body || !doc.body) { return; }
		let originalElements = originalDoc.body.querySelectorAll("*");
		let clonedElements = doc.body.querySelectorAll("*");
		let hiddenIndices: number[] = [];
		for (let i = 0; i < originalElements.length && i < clonedElements.length; i++) {
			let el = originalElements[i] as HTMLElement;
			if (el.style && el.style.display === "none") { continue; }
			try {
				let computed = window.getComputedStyle(el);
				if (computed.display === "none") { hiddenIndices.push(i); }
			} catch (e) { /* skip */ }
		}
		for (let i = 0; i < hiddenIndices.length; i++) {
			let el = clonedElements[hiddenIndices[i]] as HTMLElement;
			if (el && el.style) { el.style.setProperty("display", "none", "important"); }
		}
	}

	function neutralizePositioning(doc: Document, originalDoc: Document): void {
		if (!originalDoc.body || !doc.body) { return; }
		let originalElements = originalDoc.body.querySelectorAll("*");
		let clonedElements = doc.body.querySelectorAll("*");
		for (let i = 0; i < originalElements.length && i < clonedElements.length; i++) {
			try {
				let computed = window.getComputedStyle(originalElements[i]);
				let pos = computed.position;
				if (pos === "sticky") {
					(clonedElements[i] as HTMLElement).style.setProperty("position", "relative", "important");
				} else if (pos === "fixed") {
					(clonedElements[i] as HTMLElement).style.setProperty("position", "absolute", "important");
				}
			} catch (e) { /* skip */ }
		}
	}

	function flattenShadowDomSlots(doc: Document, originalDoc: Document): void {
		let templates = doc.querySelectorAll("template[shadowroot], template[shadowrootmode]");
		for (let i = 0; i < templates.length; i++) {
			if (templates[i].parentNode) { templates[i].parentNode.removeChild(templates[i]); }
		}
		let originalAll = originalDoc.body ? originalDoc.body.querySelectorAll("*") : [];
		let clonedAll = doc.body ? doc.body.querySelectorAll("*") : [];
		for (let i = 0; i < originalAll.length && i < clonedAll.length; i++) {
			let origEl = originalAll[i] as HTMLElement;
			if (origEl.shadowRoot) {
				let clonedEl = clonedAll[i] as HTMLElement;
				let slots = clonedEl.querySelectorAll('[slot]:not([slot="button"]):not([slot="trigger"])');
				for (let j = 0; j < slots.length; j++) {
					(slots[j] as HTMLElement).style.setProperty("display", "none", "important");
				}
			}
		}
	}

	function resolveLazyImages(html: string): string {
		return html.replace(/<img([^>]*?)>/gi, function(match: string, attrs: string) {
			if (/\ssrc\s*=\s*["'][^"']+["']/i.test(attrs) && !/\ssrc\s*=\s*["']data:/i.test(attrs)) {
				return match;
			}
			let lazySrc = "";
			let lazyMatch = attrs.match(/\sdata-(?:src|lazy-src|original)\s*=\s*["']([^"']+)["']/i);
			if (lazyMatch) { lazySrc = lazyMatch[1]; }
			if (lazySrc) {
				if (/\ssrc\s*=/i.test(attrs)) {
					attrs = attrs.replace(/\ssrc\s*=\s*["'][^"']*["']/i, ' src="' + lazySrc + '"');
				} else {
					attrs += ' src="' + lazySrc + '"';
				}
				return "<img" + attrs + ">";
			}
			return match;
		});
	}

	// --- Master DomUtils steps ---

	function convertCanvasElementsToImages(doc: Document, originalDoc: Document): void {
		let originalCanvases = originalDoc.querySelectorAll("canvas");
		let clonedCanvases = doc.querySelectorAll("canvas");
		for (let i = 0; i < originalCanvases.length && i < clonedCanvases.length; i++) {
			try {
				let img = doc.createElement("img");
				img.src = (originalCanvases[i] as HTMLCanvasElement).toDataURL();
				img.style.cssText = window.getComputedStyle(originalCanvases[i]).cssText;
				if (clonedCanvases[i].parentNode) {
					clonedCanvases[i].parentNode.replaceChild(img, clonedCanvases[i]);
				}
			} catch (e) { /* tainted canvas — skip */ }
		}
	}

	function addBaseTagIfNecessary(doc: Document, location: Location): void {
		if (!doc.head) {
			let headEl = doc.createElement("head");
			let htmlEl = doc.getElementsByTagName("html")[0] as HTMLHtmlElement;
			if (htmlEl) { htmlEl.insertBefore(headEl, htmlEl.children[0]); }
		}
		let bases = doc.head.querySelectorAll("base");
		if (bases.length === 0) {
			let baseUrl = location.href.split("#")[0].split("?")[0];
			baseUrl = baseUrl.substr(0, baseUrl.lastIndexOf("/") + 1);
			let baseTag = doc.createElement("base") as HTMLBaseElement;
			baseTag.href = baseUrl;
			doc.head.insertBefore(baseTag, doc.head.firstChild);
		}
	}

	function addImageSizeInformationToDom(doc: Document): void {
		let imgs = doc.getElementsByTagName("img");
		for (let i = 0; i < imgs.length; i++) {
			let img = imgs[i];
			if (!img.hasAttribute("data-height")) { img.setAttribute("data-height", img.height.toString()); }
			if (!img.hasAttribute("data-width")) { img.setAttribute("data-width", img.width.toString()); }
		}
	}

	// --- removeUnwantedItems sub-functions (master order) ---

	function removeStylesWithBase64EncodedBinaries(doc: Document): void {
		let styles = doc.querySelectorAll("style");
		for (let i = styles.length - 1; i >= 0; i--) {
			let text = (styles[i] as HTMLElement).innerHTML;
			if (text.indexOf("data:application") !== -1) {
				if (styles[i].parentNode) { styles[i].parentNode.removeChild(styles[i]); }
			}
		}
	}

	function removeClipperElements(doc: Document): void {
		// Remove clipper-injected elements by ID
		let clipperIds = ["clipperRootScript", "clipperUiFrame", "clipperExtFrame"];
		for (let j = 0; j < clipperIds.length; j++) {
			let el = doc.getElementById(clipperIds[j]);
			if (el && el.parentNode) { el.parentNode.removeChild(el); }
		}
		// Remove iframes that point to local (non-http/https) URLs
		let iframes = doc.querySelectorAll("iframe");
		for (let i = iframes.length - 1; i >= 0; i--) {
			let src = (iframes[i] as HTMLIFrameElement).src;
			if (isLocalReferenceUrl(src)) {
				if (iframes[i].parentNode) { iframes[i].parentNode.removeChild(iframes[i]); }
			}
		}
	}

	function removeUnwantedElements(doc: Document): void {
		let scripts = doc.querySelectorAll("script, noscript");
		for (let i = scripts.length - 1; i >= 0; i--) {
			if (scripts[i].parentNode) { scripts[i].parentNode.removeChild(scripts[i]); }
		}
	}

	function removeUnwantedAttributes(doc: Document): void {
		let images = doc.getElementsByTagName("IMG");
		for (let i = 0; i < images.length; i++) {
			let image = images[i] as HTMLImageElement;
			(image as any).srcset = undefined;
			image.removeAttribute("srcset");
		}
	}

	function removeUnsupportedHrefs(doc: Document): void {
		let links = doc.querySelectorAll("link");
		for (let i = links.length - 1; i >= 0; i--) {
			let href = (links[i] as HTMLLinkElement).href;
			if (isLocalReferenceUrl(href)) {
				if (links[i].parentNode) { links[i].parentNode.removeChild(links[i]); }
			}
		}
	}

	function removeUnwantedItems(doc: Document): void {
		removeStylesWithBase64EncodedBinaries(doc);
		removeClipperElements(doc);
		removeUnwantedElements(doc);
		removeUnwantedAttributes(doc);
		removeUnsupportedHrefs(doc);
	}

	// --- Serialization ---

	function getDoctype(doc: Document): string {
		let doctype = doc.doctype;
		if (!doctype) { return ""; }
		return "<!DOCTYPE "
			+ doctype.name
			+ (doctype.publicId ? " PUBLIC \"" + doctype.publicId + "\"" : "")
			+ (!doctype.publicId && doctype.systemId ? " SYSTEM" : "")
			+ (doctype.systemId ? " \"" + doctype.systemId + "\"" : "")
			+ ">";
	}

	function getDomString(doc: Document): string {
		return getDoctype(doc) + doc.documentElement.outerHTML;
	}

	// --- Main capture flow (matches DomUtils.getCleanDomOfCurrentPage) ---

	let doc = cloneDocument(document);
	inlineHiddenElements(doc, document);
	neutralizePositioning(doc, document);
	flattenShadowDomSlots(doc, document);
	convertCanvasElementsToImages(doc, document);
	addBaseTagIfNecessary(doc, document.location);
	addImageSizeInformationToDom(doc);
	removeUnwantedItems(doc);

	// Preserve the original page's computed body font-size on the clone.
	// CSS reset stylesheets (e.g., "body{font-size:75%}") may not get overridden
	// correctly in the renderer iframe due to stylesheet loading order differences.
	try {
		let bodyFontSize = window.getComputedStyle(document.body).fontSize;
		if (bodyFontSize && doc.body) {
			doc.body.style.setProperty("font-size", bodyFontSize, "important");
		}
	} catch (e) { /* skip */ }

	// --- PDF detection (mirrors domUtils.ts getPageContentType) ---
	function detectContentType(): string {
		let anchor = document.createElement("a");
		anchor.href = document.URL;
		if (/\.pdf$/i.test(anchor.pathname)) { return "pdf"; }
		let embedEl = document.querySelector("embed") as HTMLEmbedElement;
		if (embedEl && /application\/pdf/i.test((embedEl as any).type)) { return "pdf"; }
		if ((window as any).PDFJS) { return "pdf"; }
		return "html";
	}

	let contentType = detectContentType();
	let html = resolveLazyImages(getDomString(doc));

	chrome.runtime.sendMessage(JSON.stringify({
		action: "contentCaptureComplete",
		html: html,
		baseUrl: document.baseURI || document.URL,
		title: document.title || "",
		url: document.URL || "",
		contentType: contentType
	}));
})();
