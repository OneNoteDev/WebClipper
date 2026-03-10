// Renderer page script - connects to service worker via port
// and handles scroll/capture commands. Reads HTML directly from
// chrome.storage.session to avoid large data through message channels.
//
// Content is rendered inside an iframe for CSS isolation — the renderer's
// own styles (scrollbar hiding, overflow) don't interfere with the page's CSS.
let port = chrome.runtime.connect({ name: "renderer" });
let iframe = document.getElementById("content-frame") as HTMLIFrameElement;

// Hidden canvas for incremental stitching — display:none keeps it out of captureVisibleTab
let stitchCanvas = document.createElement("canvas");
stitchCanvas.style.display = "none";
document.body.appendChild(stitchCanvas);
let stitchCtx: CanvasRenderingContext2D;
let stitchYOffset = 0;
let stitchDpr = 0;
let stitchViewportHeight = 0;
let stitchContentHeight = 0;

// Set title bar as status indicator — no overlay needed
chrome.storage.session.get(["fullPageStatusText"], (stored: any) => {
	document.title = stored && stored.fullPageStatusText ? stored.fullPageStatusText : "Capturing page...";
});

port.onMessage.addListener((message: any) => {
	if (message.action === "loadContent") {
		// Read HTML, base URL, and cached stylesheets from session storage
		chrome.storage.session.get(["fullPageHtmlContent", "fullPageBaseUrl", "fullPageStylesheets"], (stored: any) => {
			let rawHtml = stored && stored.fullPageHtmlContent ? stored.fullPageHtmlContent : "";
			let baseUrl = stored && stored.fullPageBaseUrl ? stored.fullPageBaseUrl : "";
			let cachedStylesheets: { [url: string]: { cssText: string; media: string } } = stored && stored.fullPageStylesheets ? stored.fullPageStylesheets : {};

			// Strip scripts only — keep iframes (some sites use them for content)
			let cleanHtml = rawHtml
				.replace(/<script[\s\S]*?<\/script>/gi, "")
				.replace(/<script[^>]*\/>/gi, "");

			// Parse into DOM to rewrite URLs and extract content
			let parser = new DOMParser();
			let doc = parser.parseFromString(cleanHtml, "text/html");

			// Remove script-related link tags that trigger CSP violations on extension pages
			let scriptLinks = doc.querySelectorAll('link[rel="preload"][as="script"], link[rel="modulepreload"], link[rel="prefetch"][as="script"]');
			for (let i = scriptLinks.length - 1; i >= 0; i--) {
				let parent = scriptLinks[i].parentNode;
				if (parent) {
					parent.removeChild(scriptLinks[i]);
				}
			}

			// Rewrite relative URLs to absolute
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

			// Replace <link rel="stylesheet"> tags with cached CSS from session storage
			let stylesheetLinks = doc.querySelectorAll('link[rel="stylesheet"]');
			for (let i = stylesheetLinks.length - 1; i >= 0; i--) {
				let link = stylesheetLinks[i] as HTMLLinkElement;
				let href = link.getAttribute("href");
				if (!href) { continue; }

				let resolvedHref: string;
				try {
					resolvedHref = baseUrl ? new URL(href, baseUrl).href : href;
				} catch (e) {
					continue;
				}

				if (cachedStylesheets[resolvedHref] && link.parentNode) {
					let styleEl = doc.createElement("style");
					styleEl.textContent = cachedStylesheets[resolvedHref].cssText;
					if (cachedStylesheets[resolvedHref].media) {
						styleEl.setAttribute("media", cachedStylesheets[resolvedHref].media);
					}
					link.parentNode.replaceChild(styleEl, link);
				}
			}

			// For remaining <link> tags without cached CSS, fetch directly
			let remainingLinks = doc.querySelectorAll('link[rel="stylesheet"]');
			let fetchPromises: Promise<void>[] = [];

			let resolveCssUrls = (cssText: string, sheetUrl: string): string => {
				return cssText.replace(/url\(\s*(['"]?)([^)'"]+)\1\s*\)/g, (match: string, quote: string, urlVal: string) => {
					if (!urlVal || urlVal.indexOf("data:") === 0 || urlVal.indexOf("blob:") === 0 || urlVal.indexOf("#") === 0) {
						return match;
					}
					try {
						return "url(" + quote + new URL(urlVal, sheetUrl).href + quote + ")";
					} catch (e) {
						return match;
					}
				});
			};

			for (let i = remainingLinks.length - 1; i >= 0; i--) {
				let link = remainingLinks[i] as HTMLLinkElement;
				let href = link.getAttribute("href");
				if (!href) { continue; }

				let absoluteHref: string;
				try {
					absoluteHref = baseUrl ? new URL(href, baseUrl).href : href;
				} catch (e) {
					continue;
				}

				if (absoluteHref.indexOf("http") !== 0) { continue; }

				let capturedLink = link;
				let capturedHref = absoluteHref;
				fetchPromises.push(
					fetch(capturedHref)
						.then(function(r) { return r.ok ? r.text() : ""; })
						.then(function(cssText) {
							if (cssText && capturedLink.parentNode) {
								cssText = resolveCssUrls(cssText, capturedHref);
								cssText = cssText.replace(/@import\s+(?:url\([^)]*\)|['"][^'"]*['"])[^;]*;?/gi, "");
								let styleEl = doc.createElement("style");
								styleEl.textContent = cssText;
								let media = capturedLink.getAttribute("media");
								if (media) {
									styleEl.setAttribute("media", media);
								}
								capturedLink.parentNode.replaceChild(styleEl, capturedLink);
							}
						})
						.catch(function() {})
				);
			}

			// Inject a scrollbar-hiding style into the captured document's head
			let scrollbarStyle = doc.createElement("style");
			scrollbarStyle.textContent = "::-webkit-scrollbar{display:none}html{scrollbar-width:none;overflow-x:hidden!important}";
			doc.head.appendChild(scrollbarStyle);

			// Wait for CSS fetches, then render into iframe
			let renderContent = function() {
				// Serialize the processed DOM to a complete HTML string
				let doctype = doc.doctype ? "<!DOCTYPE " + doc.doctype.name + ">" : "<!DOCTYPE html>";
				let fullHtml = doctype + doc.documentElement.outerHTML;

				// Write into the iframe — CSS isolation, no style conflicts
				let iframeDoc = iframe.contentDocument;
				iframeDoc.open();
				iframeDoc.write(fullHtml);
				iframeDoc.close();

				let iframeWin = iframe.contentWindow;

				// Wait for images to load before neutralizing positioning
				let iframeImgs = iframeDoc.querySelectorAll("img");
				let pending = 0;
				let resolved = false;

				let onReady = function() {
					if (resolved) { return; }
					resolved = true;

					let viewportH = iframeWin.innerHeight;
					let htmlEl = iframeDoc.documentElement;

					// Measure content height BEFORE position conversions inflate it
					let contentHeight = htmlEl.scrollHeight;

					// Neutralize fixed/sticky positioning AFTER stylesheets load
					let allElements = iframeDoc.body.querySelectorAll("*");
					for (let i = 0; i < allElements.length; i++) {
						let el = allElements[i] as HTMLElement;
						let computed = iframeWin.getComputedStyle(el);
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
					let bodyEl = iframeDoc.body;
					let bodyComputed = iframeWin.getComputedStyle(bodyEl);
					if (parseInt(bodyComputed.paddingTop, 10) > 0) { bodyEl.style.paddingTop = "0"; }
					if (parseInt(bodyComputed.marginTop, 10) > 0) { bodyEl.style.marginTop = "0"; }
					let htmlComputed = iframeWin.getComputedStyle(htmlEl);
					if (parseInt(htmlComputed.paddingTop, 10) > 0) { htmlEl.style.paddingTop = "0"; }
					if (parseInt(htmlComputed.marginTop, 10) > 0) { htmlEl.style.marginTop = "0"; }

					port.postMessage({
						action: "dimensions",
						viewportHeight: viewportH,
						pageHeight: htmlEl.scrollHeight,
						contentHeight: contentHeight
					});
				};

				for (let i = 0; i < iframeImgs.length; i++) {
					if (!iframeImgs[i].complete) {
						pending++;
						iframeImgs[i].onload = iframeImgs[i].onerror = function() {
							pending--;
							if (pending <= 0) {
								setTimeout(onReady, 200);
							}
						};
					}
				}

				if (pending === 0) {
					setTimeout(onReady, 500);
				}

				// Safety timeout
				setTimeout(onReady, 3000);
			};

			if (fetchPromises.length > 0) {
				Promise.race([
					Promise.all(fetchPromises),
					new Promise(function(resolve) { setTimeout(resolve, 5000); })
				]).then(renderContent);
			} else {
				renderContent();
			}
		});
	}

	if (message.action === "scroll") {
		let iframeWin = iframe.contentWindow;
		let iframeDoc = iframe.contentDocument;
		iframeWin.scrollTo(0, message.scrollTo);
		port.postMessage({
			action: "scrollResult",
			scrollY: iframeWin.scrollY,
			pageHeight: iframeDoc.documentElement.scrollHeight
		});
	}

	if (message.action === "initCanvas") {
		stitchViewportHeight = message.viewportHeight;
		stitchContentHeight = message.contentHeight;
		stitchYOffset = 0;
		stitchDpr = 0;
		// Canvas dimensions set on first drawCapture when we know image size
	}

	if (message.action === "drawCapture") {
		let img = new Image();
		img.onload = function() {
			let imgWidth = img.naturalWidth;
			let imgHeight = img.naturalHeight;

			if (message.index === 0) {
				// First capture: initialize canvas dimensions
				stitchDpr = imgHeight / stitchViewportHeight;
				let maxHeight = 16384;
				if (stitchContentHeight > 0) {
					maxHeight = Math.min(Math.round(stitchContentHeight * stitchDpr), 16384);
				}
				stitchCanvas.width = imgWidth;
				stitchCanvas.height = maxHeight;
				stitchCtx = stitchCanvas.getContext("2d") as CanvasRenderingContext2D;
				stitchCtx.imageSmoothingEnabled = false;
				stitchYOffset = 0;

				// Draw full first capture
				let drawH = Math.min(imgHeight, stitchCanvas.height);
				stitchCtx.drawImage(img, 0, 0, imgWidth, drawH, 0, 0, imgWidth, drawH);
				stitchYOffset = drawH;
			} else {
				// Calculate overlap: expected vs actual scroll position
				let expectedScroll = message.index * stitchViewportHeight;
				let overlapCss = expectedScroll - message.scrollY;
				let overlapPx = Math.round(overlapCss * stitchDpr);

				let srcY = 0;
				let srcH = imgHeight;
				if (overlapPx > 0 && overlapPx < imgHeight) {
					srcY = overlapPx;
					srcH = imgHeight - overlapPx;
				}

				// Cap at canvas height
				let remaining = stitchCanvas.height - stitchYOffset;
				if (remaining <= 0) {
					port.postMessage({ action: "drawComplete" });
					return;
				}
				if (srcH > remaining) {
					srcH = remaining;
				}

				stitchCtx.drawImage(img, 0, srcY, imgWidth, srcH, 0, stitchYOffset, imgWidth, srcH);
				stitchYOffset += srcH;
			}

			port.postMessage({ action: "drawComplete" });
		};
		img.onerror = function() {
			port.postMessage({ action: "drawComplete" });
		};
		img.src = message.dataUrl;
	}

	if (message.action === "finalize") {
		// Trim canvas if content was shorter than estimated
		if (stitchYOffset < stitchCanvas.height && stitchYOffset > 0) {
			let trimmed = document.createElement("canvas");
			trimmed.width = stitchCanvas.width;
			trimmed.height = stitchYOffset;
			let trimCtx = trimmed.getContext("2d") as CanvasRenderingContext2D;
			trimCtx.imageSmoothingEnabled = false;
			trimCtx.drawImage(stitchCanvas, 0, 0, stitchCanvas.width, stitchYOffset, 0, 0, stitchCanvas.width, stitchYOffset);
			stitchCanvas = trimmed;
		}

		// Convert to JPEG 95% data URL and store in session storage
		stitchCanvas.toBlob(((blob: Blob) => {
			let reader = new FileReader();
			reader.onloadend = function() {
				chrome.storage.session.set({ fullPageFinalImage: reader.result }, function() {
					port.postMessage({ action: "finalizeComplete" });
				});
			};
			reader.readAsDataURL(blob);
		}) as BlobCallback, "image/jpeg", 0.95);
	}
});

// Block keyboard and scroll — pointer events blocked by iframe pointer-events:none
document.addEventListener("keydown", (e) => { e.preventDefault(); }, true);
document.addEventListener("wheel", (e) => { e.preventDefault(); }, { capture: true, passive: false } as any);

// Prevent resize/maximize — snap back to original size
let origWidth = window.outerWidth;
let origHeight = window.outerHeight;
window.addEventListener("resize", () => {
	if (window.outerWidth !== origWidth || window.outerHeight !== origHeight) {
		window.resizeTo(origWidth, origHeight);
	}
});

// Signal that the renderer is ready
port.postMessage({ action: "ready" });
