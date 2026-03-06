// Renderer page script - connects to service worker via port
// and handles scroll/capture commands. Reads HTML directly from
// chrome.storage.session to avoid large data through message channels.
let port = chrome.runtime.connect({ name: "renderer" });

// Set title bar as status indicator — no overlay needed
chrome.storage.session.get(["fullPageStatusText"], (stored: any) => {
	document.title = stored && stored.fullPageStatusText ? stored.fullPageStatusText : "Capturing page...";
});

port.onMessage.addListener((message: any) => {
	if (message.action === "loadContent") {
		// Read HTML and base URL directly from session storage
		chrome.storage.session.get(["fullPageHtmlContent", "fullPageBaseUrl"], (stored: any) => {
			let rawHtml = stored && stored.fullPageHtmlContent ? stored.fullPageHtmlContent : "";
			let baseUrl = stored && stored.fullPageBaseUrl ? stored.fullPageBaseUrl : "";

			// Strip scripts only — keep iframes (some sites use them for content)
			let cleanHtml = rawHtml
				.replace(/<script[\s\S]*?<\/script>/gi, "")
				.replace(/<script[^>]*\/>/gi, "");

			// Parse into DOM to rewrite URLs and extract content
			let parser = new DOMParser();
			let doc = parser.parseFromString(cleanHtml, "text/html");

			// Rewrite relative URLs to absolute (CSP blocks <base href> on extension pages)
			if (baseUrl) {
				let resolveUrl = (relative: string): string => {
					try {
						return new URL(relative, baseUrl).href;
					} catch (e) {
						return relative;
					}
				};

				// Images
				let imgs = doc.querySelectorAll("img[src]");
				for (let i = 0; i < imgs.length; i++) {
					let src = imgs[i].getAttribute("src");
					if (src && src.indexOf("data:") !== 0 && src.indexOf("blob:") !== 0) {
						imgs[i].setAttribute("src", resolveUrl(src));
					}
				}

				// Stylesheets
				let links = doc.querySelectorAll('link[rel="stylesheet"][href]');
				for (let i = 0; i < links.length; i++) {
					let href = links[i].getAttribute("href");
					if (href) {
						links[i].setAttribute("href", resolveUrl(href));
					}
				}

				// Srcset attributes
				let srcsets = doc.querySelectorAll("[srcset]");
				for (let i = 0; i < srcsets.length; i++) {
					let srcset = srcsets[i].getAttribute("srcset");
					if (srcset) {
						let resolved = srcset.replace(/(\S+)(\s+\S+)?/g, (match, url, descriptor) => {
							if (url && url.indexOf("data:") !== 0 && url.indexOf("blob:") !== 0) {
								return resolveUrl(url) + (descriptor || "");
							}
							return match;
						});
						srcsets[i].setAttribute("srcset", resolved);
					}
				}

				// CSS url() in inline styles (background-image, content, etc.)
				let styledElements = doc.querySelectorAll("[style]");
				for (let i = 0; i < styledElements.length; i++) {
					let style = styledElements[i].getAttribute("style");
					if (style && style.indexOf("url(") !== -1) {
						let rewritten = style.replace(/url\(\s*(['"]?)([^)'"]+)\1\s*\)/g, (match, quote, urlVal) => {
							if (urlVal && urlVal.indexOf("data:") !== 0 && urlVal.indexOf("blob:") !== 0 && urlVal.indexOf("#") !== 0) {
								return "url(" + quote + resolveUrl(urlVal) + quote + ")";
							}
							return match;
						});
						styledElements[i].setAttribute("style", rewritten);
					}
				}

				// CSS url() in <style> blocks
				let styleBlocks = doc.querySelectorAll("style");
				for (let i = 0; i < styleBlocks.length; i++) {
					let cssText = styleBlocks[i].textContent;
					if (cssText && cssText.indexOf("url(") !== -1) {
						styleBlocks[i].textContent = cssText.replace(/url\(\s*(['"]?)([^)'"]+)\1\s*\)/g, (match, quote, urlVal) => {
							if (urlVal && urlVal.indexOf("data:") !== 0 && urlVal.indexOf("blob:") !== 0 && urlVal.indexOf("#") !== 0) {
								return "url(" + quote + resolveUrl(urlVal) + quote + ")";
							}
							return match;
						});
					}
				}
			}

			// Copy <html> and <body> attributes (classes, data-* for themes, etc.)
			let srcHtml = doc.documentElement;
			let srcBody = doc.body;
			for (let i = 0; i < srcHtml.attributes.length; i++) {
				let attr = srcHtml.attributes[i];
				document.documentElement.setAttribute(attr.name, attr.value);
			}
			for (let i = 0; i < srcBody.attributes.length; i++) {
				let attr = srcBody.attributes[i];
				document.body.setAttribute(attr.name, attr.value);
			}

			// Copy meta tags (color-scheme, viewport, etc.) and stylesheets
			let headElements = doc.querySelectorAll('link[rel="stylesheet"], style, meta');
			for (let i = 0; i < headElements.length; i++) {
				document.head.appendChild(headElements[i].cloneNode(true));
			}

			document.body.innerHTML = srcBody.innerHTML;

			// Wait for images and stylesheets to load before neutralizing positioning
			let imgs = document.querySelectorAll("img");
			let pending = 0;
			let resolved = false;

			let onReady = () => {
				if (resolved) { return; }
				resolved = true;

				// Neutralize fixed/sticky positioning AFTER stylesheets load
				// so getComputedStyle reflects the actual CSS rules.
				// Fixed → absolute: anchors at initial position, appears once (not repeated per viewport).
				// Sticky → static: removes stickiness, stays in document flow.
				let viewportH = window.innerHeight;
				let allElements = document.body.querySelectorAll("*");
				for (let i = 0; i < allElements.length; i++) {
					let el = allElements[i] as HTMLElement;
					let computed = window.getComputedStyle(el);
					if (computed.position === "fixed") {
						el.style.position = "absolute";
					} else if (computed.position === "sticky") {
						el.style.position = "static";
					}
					// Reset viewport-relative min-heights that create blank space
					let minH = parseInt(computed.minHeight, 10);
					if (minH >= viewportH) {
						el.style.minHeight = "auto";
					}
				}

				// Remove top padding/margin that sites add to compensate for fixed headers
				let bodyComputed = window.getComputedStyle(document.body);
				if (parseInt(bodyComputed.paddingTop, 10) > 0) {
					document.body.style.paddingTop = "0";
				}
				if (parseInt(bodyComputed.marginTop, 10) > 0) {
					document.body.style.marginTop = "0";
				}
				let htmlComputed = window.getComputedStyle(document.documentElement);
				if (parseInt(htmlComputed.paddingTop, 10) > 0) {
					document.documentElement.style.paddingTop = "0";
				}
				if (parseInt(htmlComputed.marginTop, 10) > 0) {
					document.documentElement.style.marginTop = "0";
				}

				port.postMessage({
					action: "dimensions",
					viewportHeight: window.innerHeight,
					pageHeight: document.documentElement.scrollHeight
				});
			};

			for (let i = 0; i < imgs.length; i++) {
				if (!imgs[i].complete) {
					pending++;
					imgs[i].onload = imgs[i].onerror = () => {
						pending--;
						if (pending <= 0) {
							setTimeout(onReady, 200);
						}
					};
				}
			}

			if (pending === 0) {
				// No pending images — wait briefly for stylesheets
				setTimeout(onReady, 500);
			}

			// Safety timeout — don't wait longer than 3 seconds
			setTimeout(onReady, 3000);
		});
	}

	if (message.action === "scroll") {
		window.scrollTo(0, message.scrollTo);
		port.postMessage({
			action: "scrollResult",
			scrollY: window.scrollY,
			pageHeight: document.documentElement.scrollHeight
		});
	}
});

// Block all user interaction
document.addEventListener("keydown", (e) => { e.preventDefault(); }, true);
document.addEventListener("mousedown", (e) => { e.preventDefault(); }, true);
document.addEventListener("wheel", (e) => { e.preventDefault(); }, { capture: true, passive: false } as any);

// Signal that the renderer is ready
port.postMessage({ action: "ready" });
