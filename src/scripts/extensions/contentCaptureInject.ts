// Standalone content capture — reads page DOM and sends to worker.
// Injected by worker via chrome.scripting.executeScript.
// Messages are JSON strings (required by offscreen.ts message handler).
(function() {
	let html = document.documentElement.outerHTML;
	// Truncate to ~2MB (matches existing getCleanDomOfCurrentPage limit)
	let maxLen = 2097152;
	if (html.length > maxLen) { html = html.substring(0, maxLen); }

	// Extract external stylesheet CSS from CSSOM
	// (mirrors DomUtils.extractExternalStylesheets in domParsers/domUtils.ts)
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
