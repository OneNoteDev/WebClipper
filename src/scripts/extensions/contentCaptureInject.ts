// Standalone content capture — reads page DOM and sends to worker.
// Injected by worker via chrome.scripting.executeScript.
// Messages are JSON strings (required by offscreen.ts message handler).
//
// DOM cleaning functions extracted from DomUtils.getCleanDomOfCurrentPage to avoid
// importing the full DomUtils module (which pulls in Constants, ObjectUtils, VideoUtils).
// These run in the content script context with access to the live page DOM.

(function() {
	// --- DOM cleaning (extracted from DomUtils) ---

	function cloneDocument(originalDoc: Document): Document {
		return originalDoc.cloneNode(true) as Document;
	}

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

	function addBaseTagIfNecessary(doc: Document): void {
		if (!doc.head) {
			let headEl = doc.createElement("head");
			let htmlEl = doc.getElementsByTagName("html")[0] as HTMLHtmlElement;
			if (htmlEl) { htmlEl.insertBefore(headEl, htmlEl.children[0]); }
		}
		let bases = doc.head.querySelectorAll("base");
		if (bases.length === 0) {
			let baseUrl = document.location.href.split("#")[0].split("?")[0];
			baseUrl = baseUrl.substr(0, baseUrl.lastIndexOf("/") + 1);
			let baseTag = doc.createElement("base") as HTMLBaseElement;
			baseTag.href = baseUrl;
			doc.head.insertBefore(baseTag, doc.head.firstChild);
		}
	}

	function addImageSizeInformation(doc: Document): void {
		let imgs = doc.getElementsByTagName("img");
		for (let i = 0; i < imgs.length; i++) {
			let img = imgs[i];
			if (!img.hasAttribute("data-height")) { img.setAttribute("data-height", img.height.toString()); }
			if (!img.hasAttribute("data-width")) { img.setAttribute("data-width", img.width.toString()); }
		}
	}

	function removeUnwantedItems(doc: Document): void {
		// Remove script and noscript elements
		let scripts = doc.querySelectorAll("script, noscript");
		for (let i = scripts.length - 1; i >= 0; i--) {
			if (scripts[i].parentNode) { scripts[i].parentNode.removeChild(scripts[i]); }
		}
		// Remove clipper-injected elements (legacy — may not exist in V3 flow)
		let clipperIds = ["clipperRootScript", "clipperUiFrame", "clipperExtFrame"];
		for (let j = 0; j < clipperIds.length; j++) {
			let el = doc.getElementById(clipperIds[j]);
			if (el && el.parentNode) { el.parentNode.removeChild(el); }
		}
		// Remove links with non-web schemes (chrome-extension://, file://, etc.)
		let links = doc.querySelectorAll("link");
		for (let i = links.length - 1; i >= 0; i--) {
			let href = links[i].getAttribute("href") || "";
			if (href.length === 0) { continue; }
			// Keep http, https, protocol-relative, and relative paths
			if (href.indexOf("http://") === 0 || href.indexOf("https://") === 0 || href.indexOf("//") === 0) { continue; }
			if (href.indexOf("/") === 0 || href.indexOf(".") === 0 || /^[a-zA-Z0-9]/.test(href)) {
				// Relative path or filename — keep
				if (href.indexOf(":") === -1 || href.indexOf(":") > 5) { continue; }
			}
			// Non-web scheme — remove
			if (links[i].parentNode) { links[i].parentNode.removeChild(links[i]); }
		}
		// Remove base64-encoded binary styles (large, cause issues)
		let styles = doc.querySelectorAll("style");
		for (let i = styles.length - 1; i >= 0; i--) {
			let text = styles[i].textContent || "";
			if (text.indexOf("data:application/") !== -1 || text.indexOf("data:font/") !== -1) {
				if (styles[i].parentNode) { styles[i].parentNode.removeChild(styles[i]); }
			}
		}
		// Remove srcset from images — forces browser to use src only (matches old DomUtils behavior)
		let imgs = doc.getElementsByTagName("img");
		for (let i = 0; i < imgs.length; i++) {
			imgs[i].removeAttribute("srcset");
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

	// --- Main capture flow ---

	// Clone and clean the DOM (same pipeline as old clipperInject.ts → DomUtils)
	let doc = cloneDocument(document);
	inlineHiddenElements(doc, document);
	flattenShadowDomSlots(doc, document);
	convertCanvasElementsToImages(doc, document);
	addBaseTagIfNecessary(doc);
	addImageSizeInformation(doc);
	removeUnwantedItems(doc);

	// Serialize to HTML string
	let doctype = doc.doctype ? "<!DOCTYPE " + doc.doctype.name + ">" : "<!DOCTYPE html>";
	let html = doctype + doc.documentElement.outerHTML;

	// Resolve lazy-loaded images (data-src → src) on the serialized HTML
	html = resolveLazyImages(html);

	// Extract external stylesheet CSS from CSSOM
	let sheets: { [url: string]: { cssText: string; media: string } } = {};
	try {
		for (let i = 0; i < document.styleSheets.length; i++) {
			let s = document.styleSheets[i] as CSSStyleSheet;
			if (!s.href) { continue; }
			try {
				let rules = s.cssRules;
				if (!rules || rules.length === 0) { continue; }
				let css = "";
				for (let j = 0; j < rules.length; j++) { css += rules[j].cssText + "\n"; }
				sheets[s.href] = { cssText: css, media: s.media ? s.media.mediaText : "" };
			} catch (e) { /* cross-origin — skip */ }
		}
	} catch (e) { /* ignore */ }

	chrome.runtime.sendMessage(JSON.stringify({
		action: "contentCaptureComplete",
		html: html,
		baseUrl: document.baseURI || document.URL,
		title: document.title || "",
		url: document.URL || "",
		sheets: Object.keys(sheets).length > 0 ? sheets : undefined
	}));
})();
