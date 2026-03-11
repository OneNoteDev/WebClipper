// Renderer page script - connects to service worker via port
// and handles scroll/capture commands. Reads HTML directly from
// chrome.storage.session to avoid large data through message channels.
//
// Content is rendered inside an iframe for CSS isolation — the renderer's
// own styles (scrollbar hiding, overflow) don't interfere with the page's CSS.
import {Readability} from "@mozilla/readability";

let port = chrome.runtime.connect({ name: "renderer" });
let iframe = document.getElementById("content-frame") as HTMLIFrameElement;
let previewFrame = document.getElementById("preview-frame") as HTMLIFrameElement;
let previewContainer = document.getElementById("preview-container") as HTMLDivElement;

// Sidebar elements
let statusText = document.getElementById("status-text") as HTMLDivElement;
let progressInfo = document.getElementById("progress-info") as HTMLDivElement;
let progressFill = document.getElementById("progress-bar-fill") as HTMLDivElement;
let cancelBtn = document.getElementById("cancel-btn") as HTMLButtonElement;
let saveBtn = document.getElementById("save-btn") as HTMLButtonElement;

// Mode panel elements
let capturePanel = document.getElementById("capture-panel") as HTMLDivElement;

// Metadata elements
let titleField = document.getElementById("title-field") as HTMLTextAreaElement;
let noteField = document.getElementById("note-field") as HTMLTextAreaElement;
let sourceUrl = document.getElementById("source-url") as HTMLDivElement;
let sectionDropdown = document.getElementById("section-dropdown") as HTMLSelectElement;

// Hidden canvas for incremental stitching — display:none keeps it out of captureVisibleTab
let stitchCanvas = document.createElement("canvas");
stitchCanvas.style.display = "none";
document.body.appendChild(stitchCanvas);
let stitchCtx: CanvasRenderingContext2D;
let stitchYOffset = 0;
let stitchDpr = 0;
let stitchViewportHeight = 0;
let stitchContentHeight = 0;
let sidebarCssWidth = 322;
let contentPixelWidth = 0; // set on first capture, excludes sidebar

let sidebarTitle = document.getElementById("sidebar-title") as HTMLSpanElement;
let userInfoDiv = document.getElementById("user-info") as HTMLDivElement;
let userEmailSpan = document.getElementById("user-email") as HTMLSpanElement;
let signoutLink = document.getElementById("signout-link") as HTMLAnchorElement;

// Mode state
let currentMode = "fullpage";
let fullPageComplete = false;
let saveDone = false;
let articleLoaded = false;
let cachedArticleHtml = ""; // Readability result, extracted lazily from content-frame DOM
let cachedBookmarkHtml = ""; // Bookmark card HTML, extracted lazily from content-frame DOM
let bookmarkLoaded = false;
let contentDocReady = false; // true once content-frame has loaded HTML

// --- Localization ---
// Read localized strings directly from localStorage (shared extension origin, populated by extensionBase)
// Falls back to bundled English defaults if not available
let locStrings: any = {};
try {
	let raw = localStorage.getItem("locStrings");
	if (raw) { locStrings = JSON.parse(raw); }
} catch (e) { /* ignore */ }

function loc(key: string, fallback: string): string {
	return (locStrings && locStrings[key]) || fallback;
}

let strings = {
	clipperTitle: loc("WebClipper.Label.OneNoteWebClipper", "OneNote Web Clipper"),
	capturing: loc("WebClipper.ClipType.ScreenShot.ProgressLabel", "Capturing page..."),
	cancel: loc("WebClipper.Action.Cancel", "Cancel"),
	close: loc("WebClipper.Action.CloseTheClipper", "Close"),
	captureComplete: "Capture complete",
	saveToOneNote: loc("WebClipper.Action.Clip", "Clip"),
	viewInOneNote: loc("WebClipper.Action.ViewInOneNote", "View in OneNote"),
	viewportProgress: loc("WebClipper.ClipType.ScreenShot.IncrementalProgress", "Capturing {0} of {1}..."),
	saving: loc("WebClipper.ClipType.ScreenShot.Saving", "Saving..."),
	modeFullPage: loc("WebClipper.ClipType.ScreenShot.Button", "Full Page"),
	modeArticle: loc("WebClipper.ClipType.Article.Button", "Article"),
	modeBookmark: loc("WebClipper.ClipType.Bookmark.Button", "Bookmark"),
	modeRegion: loc("WebClipper.ClipType.Region.Button", "Region"),
	titlePlaceholder: loc("WebClipper.Label.PageTitlePlaceholder", "Add a page title..."),
	notePlaceholder: loc("WebClipper.Label.AnnotationPlaceholder", "Add a note..."),
	sourceLabel: "Source",
	signOut: loc("WebClipper.Action.SignOut", "Sign out")
};

// Cancel button closes the window (port disconnect triggers cleanup in worker)
cancelBtn.addEventListener("click", () => { window.close(); });

// Apply localized strings to UI elements
sidebarTitle.textContent = strings.clipperTitle;
cancelBtn.textContent = strings.cancel;
let modeMap: any = { fullpage: strings.modeFullPage, article: strings.modeArticle, bookmark: strings.modeBookmark, region: strings.modeRegion };
document.querySelectorAll(".mode-btn").forEach((btn) => {
	let mode = btn.getAttribute("data-mode");
	if (mode && modeMap[mode]) {
		let span = btn.querySelector("span");
		if (span) { span.textContent = modeMap[mode]; }
	}
});
titleField.placeholder = strings.titlePlaceholder;
noteField.placeholder = strings.notePlaceholder;
let sourceLabelEl = document.getElementById("source-label");
if (sourceLabelEl) { sourceLabelEl.textContent = strings.sourceLabel; }

// Load page title and URL from session storage (page-specific, still needs session)
chrome.storage.session.get(["fullPageStatusText", "fullPageTitle", "fullPageUrl"], (stored: any) => {
	document.title = strings.clipperTitle;
	if (stored && stored.fullPageTitle) { titleField.value = stored.fullPageTitle; }
	if (stored && stored.fullPageUrl) { sourceUrl.textContent = stored.fullPageUrl; sourceUrl.title = stored.fullPageUrl; }
});

// --- Section picker ---
// Reads cached notebooks from localStorage (shared extension origin, written by sectionPicker.tsx)
function populateSectionDropdown() {
	try {
		let notebooksJson = localStorage.getItem("notebooks");
		let curSectionJson = localStorage.getItem("curSection");
		if (!notebooksJson) {
			let opt = document.createElement("option");
			opt.textContent = "No notebooks available";
			opt.value = "";
			sectionDropdown.appendChild(opt);
			return;
		}
		let notebooks = JSON.parse(notebooksJson);
		let curSectionId = "";
		if (curSectionJson) {
			try {
				let cur = JSON.parse(curSectionJson);
				curSectionId = cur.section ? cur.section.id : "";
			} catch (e) { /* ignore */ }
		}
		sectionDropdown.innerHTML = "";
		flattenSections(notebooks, sectionDropdown, curSectionId);
	} catch (e) {
		let opt = document.createElement("option");
		opt.textContent = "Error loading notebooks";
		opt.value = "";
		sectionDropdown.appendChild(opt);
	}
}

function flattenSections(notebooks: any[], dropdown: HTMLSelectElement, selectedId: string) {
	for (let nb of notebooks) {
		if (nb.sections) {
			for (let sec of nb.sections) {
				let opt = document.createElement("option");
				opt.value = sec.id;
				opt.textContent = nb.name + " > " + sec.name;
				if (sec.id === selectedId) { opt.selected = true; }
				dropdown.appendChild(opt);
			}
		}
		// Handle section groups (nested)
		if (nb.sectionGroups) {
			flattenSectionGroups(nb.sectionGroups, nb.name, dropdown, selectedId);
		}
	}
}

function flattenSectionGroups(groups: any[], parentPath: string, dropdown: HTMLSelectElement, selectedId: string) {
	for (let group of groups) {
		let path = parentPath + " > " + group.name;
		if (group.sections) {
			for (let sec of group.sections) {
				let opt = document.createElement("option");
				opt.value = sec.id;
				opt.textContent = path + " > " + sec.name;
				if (sec.id === selectedId) { opt.selected = true; }
				dropdown.appendChild(opt);
			}
		}
		if (group.sectionGroups) {
			flattenSectionGroups(group.sectionGroups, path, dropdown, selectedId);
		}
	}
}

populateSectionDropdown();

// --- User info + sign-out ---
let userAuthType = "";
try {
	let userInfoRaw = localStorage.getItem("userInformation");
	if (userInfoRaw) {
		let userInfo = JSON.parse(userInfoRaw);
		if (userInfo && userInfo.data) {
			let email = userInfo.data.emailAddress || "";
			let name = userInfo.data.fullName || "";
			userAuthType = userInfo.data.authType || "";
			userEmailSpan.textContent = email || name || "";
			userEmailSpan.title = email || "";
		}
	}
	if (!userEmailSpan.textContent) {
		userInfoDiv.style.display = "none";
	}
} catch (e) {
	userInfoDiv.style.display = "none";
}
signoutLink.textContent = strings.signOut;
signoutLink.addEventListener("click", (e) => {
	e.preventDefault();
	port.postMessage({ action: "signOut", authType: userAuthType });
});

// --- Auto-fetch fresh notebooks (runs in background during capture) ---
async function fetchFreshNotebooks() {
	try {
		let userInfoRaw = localStorage.getItem("userInformation");
		if (!userInfoRaw) { return; }
		let userInfo = JSON.parse(userInfoRaw);
		let accessToken = userInfo && userInfo.data ? userInfo.data.accessToken : "";
		let lastUpdated = userInfo ? userInfo.lastUpdated : 0;
		let tokenExp = userInfo && userInfo.data ? userInfo.data.accessTokenExpiration : 0;
		if (!accessToken) { return; }
		// accessTokenExpiration is relative (seconds until expiry), not absolute
		// Matches CachedHttp.valueHasExpired: (lastUpdated + expiration*1000 - 180000) < Date.now()
		if (tokenExp && lastUpdated && (lastUpdated + tokenExp * 1000 - 180000) < Date.now()) { return; }

		let apiUrl = "https://www.onenote.com/api/v1.0/me/notes/notebooks"
			+ "?$expand=sections,sectionGroups($expand=sections,sectionGroups)";
		let response = await fetch(apiUrl, {
			headers: { "Authorization": "Bearer " + accessToken }
		});
		if (!response.ok) { return; }

		let data = await response.json();
		let freshNotebooks = data.value || [];

		// Compare with cached — only update if different
		let cachedJson = localStorage.getItem("notebooks") || "";
		let freshJson = JSON.stringify(freshNotebooks);
		if (freshJson === cachedJson) { return; }

		// Store fresh notebooks and repopulate dropdown
		localStorage.setItem("notebooks", freshJson);
		let previousSectionId = sectionDropdown.value;
		sectionDropdown.innerHTML = "";
		flattenSections(freshNotebooks, sectionDropdown, previousSectionId);

		// If previously selected section no longer exists, persist the new default
		if (sectionDropdown.value !== previousSectionId) {
			let selectedOption = sectionDropdown.options[sectionDropdown.selectedIndex];
			if (selectedOption && selectedOption.value) {
				let curSection = {
					path: selectedOption.textContent,
					section: { id: selectedOption.value, name: selectedOption.textContent }
				};
				localStorage.setItem("curSection", JSON.stringify(curSection));
			}
		}
	} catch (e) {
		// Silently keep cached data
	}
}
fetchFreshNotebooks();

// Disable non-fullpage mode buttons and Clip button until capture completes
document.querySelectorAll(".mode-btn").forEach((btn) => {
	if (btn.getAttribute("data-mode") !== "fullpage") {
		(btn as HTMLButtonElement).disabled = true;
		btn.classList.add("disabled");
	}
});
saveBtn.disabled = true;
// Show initial capture progress
capturePanel.style.display = "flex";
statusText.textContent = strings.capturing;

// Persist section selection change and reset save state
sectionDropdown.addEventListener("change", () => {
	let selectedOption = sectionDropdown.options[sectionDropdown.selectedIndex];
	if (selectedOption && selectedOption.value) {
		let curSection = { path: selectedOption.textContent, section: { id: selectedOption.value, name: selectedOption.textContent } };
		localStorage.setItem("curSection", JSON.stringify(curSection));
	}
	resetSaveState();
	capturePanel.style.display = (currentMode === "fullpage" && !fullPageComplete) ? "flex" : "none";
});

// --- UI lock during clip/save ---

function lockSidebar() {
	// Disable all interactive elements during save round-trip
	document.querySelectorAll(".mode-btn").forEach((b) => { (b as HTMLButtonElement).disabled = true; });
	titleField.disabled = true;
	noteField.disabled = true;
	sectionDropdown.disabled = true;
	cancelBtn.disabled = true;
	signoutLink.style.pointerEvents = "none";
	signoutLink.style.opacity = "0.4";
}

function unlockSidebar() {
	document.querySelectorAll(".mode-btn").forEach((b) => {
		if (fullPageComplete || b.getAttribute("data-mode") === "fullpage") {
			(b as HTMLButtonElement).disabled = false;
		}
	});
	titleField.disabled = false;
	noteField.disabled = false;
	sectionDropdown.disabled = false;
	cancelBtn.disabled = false;
	signoutLink.style.pointerEvents = "";
	signoutLink.style.opacity = "";
}

// --- Mode switching ---

function resetSaveState() {
	saveDone = false;
	saveBtn.onclick = null; // Clear any "View in OneNote" override
	saveBtn.textContent = strings.saveToOneNote;
	saveBtn.disabled = false;
	cancelBtn.textContent = strings.cancel;
	cancelBtn.disabled = false;
	// Reset capture panel
	capturePanel.style.display = "none";
	statusText.textContent = "";
	statusText.innerHTML = "";
	(document.getElementById("progress-bar-track") as HTMLElement).style.display = "";
	progressInfo.textContent = "";
}

function switchToFullPage() {
	resetSaveState();
	currentMode = "fullpage";
	previewFrame.style.display = "none";
	if (fullPageComplete) {
		iframe.style.display = "none";
		// Restore full-page screenshot from session storage (container may have been
		// cleared by region mode or other mode switches)
		previewContainer.innerHTML = "";
		chrome.storage.session.get(["fullPageFinalImage"], (stored: any) => {
			let dataUrl = stored && stored.fullPageFinalImage ? stored.fullPageFinalImage : "";
			if (dataUrl) {
				let img = document.createElement("img");
				img.src = dataUrl;
				previewContainer.appendChild(img);
			}
		});
		previewContainer.style.display = "block";
		capturePanel.style.display = "none";
	} else {
		iframe.style.display = "block";
		previewContainer.style.display = "none";
		capturePanel.style.display = "flex";
		statusText.textContent = strings.capturing;
		saveBtn.disabled = true;
	}
}

function switchToArticle() {
	resetSaveState();
	currentMode = "article";
	// Hide full-page content and preview
	iframe.style.display = "none";
	previewContainer.style.display = "none";
	capturePanel.style.display = "none";
	// Show preview frame
	previewFrame.style.display = "block";

	if (!articleLoaded) {
		loadArticleContent();
	} else {
		// Re-render — preview-frame may have been overwritten by another mode
		renderArticleHtml(cachedArticleHtml);
		saveBtn.disabled = false;
		saveBtn.textContent = strings.saveToOneNote;
	}
}

function loadArticleContent() {
	if (cachedArticleHtml) {
		// Already extracted — render immediately
		renderArticleHtml(cachedArticleHtml);
		articleLoaded = true;
		return;
	}

	if (contentDocReady) {
		// Content-frame DOM is ready — run Readability on it
		extractArticle();
		return;
	}

	// Content still loading — show loading message and retry when ready
	let loadingDoc = previewFrame.contentDocument;
	if (loadingDoc) {
		loadingDoc.open();
		loadingDoc.write("<!DOCTYPE html><html><head><style>body{font-family:Segoe UI,sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;color:#666;}</style></head><body><div>Loading article...</div></body></html>");
		loadingDoc.close();
	}
	let attempts = 0;
	let waitForContent = () => {
		if (contentDocReady) {
			extractArticle();
		} else if (++attempts < 20) {
			setTimeout(waitForContent, 500);
		} else {
			showArticleError();
		}
	};
	setTimeout(waitForContent, 500);
}

function extractArticle() {
	try {
		// Clone content-frame document — Readability mutates the DOM
		let iframeDoc = iframe.contentDocument;
		if (!iframeDoc || !iframeDoc.body) {
			showArticleError();
			return;
		}
		let docClone = iframeDoc.cloneNode(true) as Document;
		let reader = new Readability(docClone, { charThreshold: 100 });
		let article = reader.parse();

		if (article && article.content) {
			cachedArticleHtml = article.content;
			renderArticleHtml(cachedArticleHtml);
			articleLoaded = true;
			if (currentMode === "article") {
				saveBtn.disabled = false;
				saveBtn.textContent = strings.saveToOneNote;
			}
		} else {
			showArticleError();
		}
	} catch (e) {
		showArticleError();
	}
}

function showArticleError() {
	let errDoc = previewFrame.contentDocument;
	if (errDoc) {
		errDoc.open();
		errDoc.write("<!DOCTYPE html><html><head><style>body{font-family:Segoe UI,sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;color:#999;}</style></head><body><div>Article content not available for this page.</div></body></html>");
		errDoc.close();
	}
}

function renderArticleHtml(html: string) {
	let pDoc = previewFrame.contentDocument;
	if (!pDoc) { return; }
	// Wrap article HTML in a styled document for readable preview
	// Styles match the existing clipper article preview: Verdana 16px, OneNote heading colors
	let articleCss = "body { font-family: Verdana, sans-serif; font-size: 16px; line-height: 1.6; "
		+ "max-width: 684px; margin: 24px auto; padding: 0 20px 0 20px; color: #1a1a1a; }"
		+ "img { max-width: 100%; height: auto; }"
		+ "a { color: #2e75b5; text-decoration: underline; }"
		+ "h2 { font-size: 18px; color: rgb(46,117,181); }"
		+ "h3, h4, h5, h6 { color: rgb(91,155,213); margin-top: 14pt; margin-bottom: 14pt; }"
		+ "figure { margin-left: 0; }"
		+ "pre, code { background: #f5f5f5; padding: 2px 6px; border-radius: 3px; font-size: 14px; }"
		+ "pre { padding: 12px; overflow-x: auto; }"
		+ "blockquote { border-left: 3px solid rgb(46,117,181); margin-left: 0; padding-left: 16px; color: #555; }"
		+ "table { border-collapse: collapse; width: 100%; }"
		+ "td, th { border: 1px solid #ddd; padding: 8px; }";
	let fullHtml = "<!DOCTYPE html><html><head><style>" + articleCss + "</style></head><body>"
		+ html
		+ "</body></html>";
	pDoc.open();
	pDoc.write(fullHtml);
	pDoc.close();
}

// --- Bookmark mode ---

function switchToBookmark() {
	resetSaveState();
	currentMode = "bookmark";
	iframe.style.display = "none";
	previewContainer.style.display = "none";
	capturePanel.style.display = "none";
	previewFrame.style.display = "block";

	if (!bookmarkLoaded) {
		loadBookmarkContent();
	} else {
		renderBookmarkHtml(cachedBookmarkHtml);
		saveBtn.disabled = false;
		saveBtn.textContent = strings.saveToOneNote;
	}
}

function loadBookmarkContent() {
	if (contentDocReady) {
		extractBookmark();
		return;
	}
	// Content still loading — show loading and retry
	let loadingDoc = previewFrame.contentDocument;
	if (loadingDoc) {
		loadingDoc.open();
		loadingDoc.write("<!DOCTYPE html><html><head><style>body{font-family:Segoe UI,sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;color:#666;}</style></head><body><div>Loading bookmark...</div></body></html>");
		loadingDoc.close();
	}
	let attempts = 0;
	let waitForContent = () => {
		if (contentDocReady) {
			extractBookmark();
		} else if (++attempts < 20) {
			setTimeout(waitForContent, 500);
		}
	};
	setTimeout(waitForContent, 500);
}

function extractBookmark() {
	let iframeDoc = iframe.contentDocument;
	if (!iframeDoc) { return; }

	// Extract metadata from the content-frame DOM (same sources as BookmarkHelper)
	let pageTitle = titleField.value || iframeDoc.title || "";
	let pageUrl = sourceUrl.textContent || "";

	// Description: og:description → meta description → twitter:description
	let description = getMetaContent(iframeDoc, "og:description", "property")
		|| getMetaContent(iframeDoc, "description", "name")
		|| getMetaContent(iframeDoc, "twitter:description", "name")
		|| "";
	if (description.length > 140) {
		description = description.substring(0, 140) + "...";
	}

	// Thumbnail: og:image → twitter:image → first img on page
	let thumbnailSrc = getMetaContent(iframeDoc, "og:image", "property")
		|| getMetaContent(iframeDoc, "twitter:image:src", "name")
		|| getMetaContent(iframeDoc, "twitter:image", "name")
		|| "";
	if (!thumbnailSrc) {
		let firstImg = iframeDoc.querySelector("img[src]");
		if (firstImg) {
			let src = firstImg.getAttribute("src");
			if (src && src.indexOf("data:") !== 0) { thumbnailSrc = src; }
		}
	}

	// Build bookmark card HTML
	let thumbHtml = "";
	if (thumbnailSrc) {
		thumbHtml = "<td width=\"112\" style=\"padding-top:9px;vertical-align:top;\">"
			+ "<img src=\"" + escapeAttr(thumbnailSrc) + "\" width=\"112\" alt=\"thumbnail\" style=\"max-height:112px;object-fit:cover;\">"
			+ "</td>";
	}

	let titleHtml = "";
	if (pageTitle) {
		titleHtml = "<tr><td><h2 style=\"margin:0;margin-bottom:13px;\">" + escapeHtml(pageTitle) + "</h2></td></tr>";
	}

	let descHtml = "";
	if (description) {
		descHtml = "<tr><td style=\"word-wrap:break-word;\">" + escapeHtml(description) + "</td></tr>";
	}

	let urlStyle = "white-space:nowrap;overflow:hidden;text-overflow:ellipsis;padding:2px;";
	if (description) { urlStyle += "padding-bottom:13px;"; }

	let secondTdStyle = thumbnailSrc ? "padding-left:16px;" : "";

	cachedBookmarkHtml = "<table style=\"table-layout:auto;border-collapse:collapse;margin-bottom:24px;\">"
		+ "<tr style=\"vertical-align:top;\">"
		+ thumbHtml
		+ "<td style=\"" + secondTdStyle + "\"><table>"
		+ titleHtml
		+ "<tr><td style=\"" + urlStyle + "\"><a href=\"" + escapeAttr(pageUrl) + "\" target=\"_blank\" style=\"color:#2e75b5;\">" + escapeHtml(pageUrl) + "</a></td></tr>"
		+ descHtml
		+ "</table></td>"
		+ "</tr></table>";

	bookmarkLoaded = true;
	renderBookmarkHtml(cachedBookmarkHtml);
	if (currentMode === "bookmark") {
		saveBtn.disabled = false;
		saveBtn.textContent = strings.saveToOneNote;
	}
}

function getMetaContent(doc: Document, value: string, attr: string): string {
	let el = doc.querySelector("meta[" + attr + "=\"" + value + "\"]");
	return el ? el.getAttribute("content") || "" : "";
}

function escapeHtml(str: string): string {
	return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function escapeAttr(str: string): string {
	return str.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function renderBookmarkHtml(html: string) {
	let pDoc = previewFrame.contentDocument;
	if (!pDoc) { return; }
	let bookmarkCss = "body { font-family: Verdana, sans-serif; font-size: 16px; line-height: 1.5; "
		+ "max-width: 684px; margin: 24px auto; padding: 0 20px; color: #1a1a1a; }"
		+ "a { color: #2e75b5; text-decoration: underline; }"
		+ "h2 { font-size: 18px; color: rgb(46,117,181); font-weight: normal; }"
		+ "img { border-radius: 2px; }";
	let fullHtml = "<!DOCTYPE html><html><head><style>" + bookmarkCss + "</style></head><body>"
		+ html + "</body></html>";
	pDoc.open();
	pDoc.write(fullHtml);
	pDoc.close();
}

// --- Region mode ---

let regionImages: string[] = []; // Accumulated region captures

function startRegionCapture() {
	capturePanel.style.display = "flex";
	statusText.textContent = loc("WebClipper.ClipType.Region.ProgressLabel", "Select a region on the page...");
	saveBtn.disabled = true;
	previewContainer.style.display = "none";
	port.postMessage({ action: "startRegion" });
}

function switchToRegion() {
	resetSaveState();
	currentMode = "region";
	iframe.style.display = "none";
	previewFrame.style.display = "none";
	previewContainer.style.display = "none";
	// If we already have captured regions, show them instead of starting a new capture
	if (regionImages.length > 0) {
		renderRegionThumbnails();
	} else {
		startRegionCapture();
	}
}

function renderRegionThumbnails() {
	previewContainer.innerHTML = "";
	previewContainer.style.display = "block";
	capturePanel.style.display = "none";

	for (let i = 0; i < regionImages.length; i++) {
		let thumb = document.createElement("div");
		thumb.className = "region-thumb";
		let img = document.createElement("img");
		img.src = regionImages[i];
		let removeBtn = document.createElement("button");
		removeBtn.className = "region-remove-btn";
		removeBtn.textContent = "\u00D7"; // × symbol
		removeBtn.title = loc("WebClipper.Preview.RemoveSelectedRegion", "Remove");
		removeBtn.addEventListener("click", ((idx: number) => () => {
			regionImages.splice(idx, 1);
			if (regionImages.length === 0) {
				// No regions left — return to fullpage
				if (fullPageComplete) {
					document.querySelectorAll(".mode-btn").forEach((b) => b.classList.remove("selected"));
					let fpBtn = document.querySelector('.mode-btn[data-mode="fullpage"]');
					if (fpBtn) { fpBtn.classList.add("selected"); }
					switchToFullPage();
				} else {
					previewContainer.style.display = "none";
				}
			} else {
				renderRegionThumbnails();
				updateRegionSessionStorage();
			}
		})(i));
		thumb.appendChild(img);
		thumb.appendChild(removeBtn);
		previewContainer.appendChild(thumb);
	}

	// "Add Another Region" button
	let addBtn = document.createElement("button");
	addBtn.className = "region-add-btn";
	addBtn.textContent = "+ " + loc("WebClipper.Preview.Header.AddAnotherRegionButtonLabel", "Add another region");
	addBtn.addEventListener("click", () => {
		startRegionCapture();
	});
	previewContainer.appendChild(addBtn);

	saveBtn.disabled = false;
	saveBtn.textContent = strings.saveToOneNote;
}

function updateRegionSessionStorage() {
	// Store each region as a separate key to avoid session storage size limits
	// First clear any old region keys
	chrome.storage.session.get(null, (all: any) => {
		let keysToRemove = Object.keys(all).filter((k) => k.indexOf("regionImage_") === 0);
		if (keysToRemove.length > 0) {
			chrome.storage.session.remove(keysToRemove);
		}
		let toSet: any = { regionImageCount: regionImages.length };
		for (let i = 0; i < regionImages.length; i++) {
			toSet["regionImage_" + i] = regionImages[i];
		}
		chrome.storage.session.set(toSet);
	});
}

// Mode button click handlers
document.querySelectorAll(".mode-btn").forEach((btn) => {
	btn.addEventListener("click", () => {
		let mode = btn.getAttribute("data-mode");
		if (mode === currentMode) { return; }
		// Block mode switching during active capture — captureVisibleTab needs content-frame visible
		if (!fullPageComplete && mode !== "fullpage") { return; }

		// Update selected state visually
		document.querySelectorAll(".mode-btn").forEach((b) => b.classList.remove("selected"));
		btn.classList.add("selected");

		if (mode === "fullpage") {
			switchToFullPage();
		} else if (mode === "article") {
			switchToArticle();
		} else if (mode === "bookmark") {
			switchToBookmark();
		} else if (mode === "region") {
			switchToRegion();
		}
	});
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

				// DOM is now parsed — Readability can extract article content
				contentDocReady = true;

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
		contentPixelWidth = 0;
		statusText.textContent = strings.capturing;
	}

	if (message.action === "drawCapture") {
		// Update sidebar progress
		if (message.totalViewports) {
			let current = message.index + 1;
			let total = message.totalViewports;
			progressInfo.textContent = strings.viewportProgress.replace("{0}", current).replace("{1}", total);
			progressFill.style.width = Math.round((current / total) * 100) + "%";
		}

		let img = new Image();
		img.onload = function() {
			let imgWidth = img.naturalWidth;
			let imgHeight = img.naturalHeight;

			if (message.index === 0) {
				// First capture: initialize canvas dimensions
				stitchDpr = imgHeight / stitchViewportHeight;
				// Exclude sidebar pixels from the canvas — only keep content area
				contentPixelWidth = imgWidth - Math.round(sidebarCssWidth * stitchDpr);
				if (contentPixelWidth <= 0) { contentPixelWidth = imgWidth; }
				let maxHeight = 16384;
				if (stitchContentHeight > 0) {
					maxHeight = Math.min(Math.round(stitchContentHeight * stitchDpr), 16384);
				}
				stitchCanvas.width = contentPixelWidth;
				stitchCanvas.height = maxHeight;
				stitchCtx = stitchCanvas.getContext("2d") as CanvasRenderingContext2D;
				stitchCtx.imageSmoothingEnabled = false;
				stitchYOffset = 0;

				// Draw first capture (content area only, excluding sidebar)
				let drawH = Math.min(imgHeight, stitchCanvas.height);
				stitchCtx.drawImage(img, 0, 0, contentPixelWidth, drawH, 0, 0, contentPixelWidth, drawH);
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

				stitchCtx.drawImage(img, 0, srcY, contentPixelWidth, srcH, 0, stitchYOffset, contentPixelWidth, srcH);
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
				let dataUrl = reader.result as string;
				chrome.storage.session.set({ fullPageFinalImage: dataUrl }, function() {
					fullPageComplete = true;

					// Only update left panel if still viewing Full Page mode
					if (currentMode === "fullpage") {
						iframe.style.display = "none";
						previewContainer.style.display = "block";
						let previewImg = document.createElement("img");
						previewImg.src = dataUrl;
						previewContainer.appendChild(previewImg);
					} else {
						// Still create the preview image for later switching
						let previewImg = document.createElement("img");
						previewImg.src = dataUrl;
						previewContainer.appendChild(previewImg);
					}

					// Update sidebar to preview mode — hide progress, show Clip button
					capturePanel.style.display = "none";
					saveBtn.textContent = strings.saveToOneNote;
					saveBtn.disabled = false;

					// Re-enable mode buttons now that capture is complete
					document.querySelectorAll(".mode-btn").forEach((b: Element) => {
						(b as HTMLButtonElement).disabled = false;
						b.classList.remove("disabled");
					});

					port.postMessage({ action: "finalizeComplete" });
				});
			};
			reader.readAsDataURL(blob);
		}) as BlobCallback, "image/jpeg", 0.95);
	}

	if (message.action === "regionCaptured") {
		// Worker sends full tab screenshot + selection coords via port (same as drawCapture)
		let fullImg = new Image();
		fullImg.onload = () => {
			let dpr = message.dpr || 1;
			let sx = Math.round(message.x * dpr);
			let sy = Math.round(message.y * dpr);
			let sw = Math.round(message.width * dpr);
			let sh = Math.round(message.height * dpr);
			let cropCanvas = document.createElement("canvas");
			cropCanvas.width = sw;
			cropCanvas.height = sh;
			let cropCtx = cropCanvas.getContext("2d") as CanvasRenderingContext2D;
			cropCtx.drawImage(fullImg, sx, sy, sw, sh, 0, 0, sw, sh);
			let croppedUrl = cropCanvas.toDataURL("image/jpeg", 0.95);

			regionImages.push(croppedUrl);
			renderRegionThumbnails();
			updateRegionSessionStorage();
		};
		fullImg.src = message.dataUrl || "";
	}

	if (message.action === "regionCancelled") {
		if (fullPageComplete) {
			document.querySelectorAll(".mode-btn").forEach((b) => b.classList.remove("selected"));
			let fpBtn = document.querySelector('.mode-btn[data-mode="fullpage"]');
			if (fpBtn) { fpBtn.classList.add("selected"); }
			switchToFullPage();
		} else {
			capturePanel.style.display = "none";
		}
	}

	if (message.action === "saveResult") {
		if (message.success) {
			saveDone = true;
			unlockSidebar();
			capturePanel.style.display = "none";
			// Replace Clip with "View in OneNote", keep Cancel as Close
			if (message.pageUrl) {
				saveBtn.textContent = strings.viewInOneNote;
				saveBtn.disabled = false;
				saveBtn.onclick = () => { window.open(message.pageUrl, "_blank"); window.close(); };
			} else {
				saveBtn.textContent = strings.saveToOneNote;
				saveBtn.disabled = true;
			}
			cancelBtn.disabled = false;
		} else {
			unlockSidebar();
			let errorDetail = message.error || "Unknown error";
			capturePanel.style.display = "flex";
			progressInfo.textContent = "";
			progressFill.style.width = "0%";
			// Hide progress bar in error state — the track line looks like a separator
			(document.getElementById("progress-bar-track") as HTMLElement).style.display = "none";
			// Error message first, then expandable diagnostics
			statusText.innerHTML = escapeHtml(loc("WebClipper.Error.GenericError", "Something went wrong. Please try clipping the page again."))
				+ "<details style=\"margin-top:8px;font-size:12px;\">"
				+ "<summary style=\"cursor:pointer;color:rgba(255,255,255,0.8);\">" + escapeHtml(loc("WebClipper.Label.SignInUnsuccessfulMoreInformation", "More information")) + "</summary>"
				+ "<pre style=\"margin-top:6px;font-size:11px;color:rgba(255,255,255,0.85);background:rgba(0,0,0,0.2);padding:8px;border-radius:3px;max-height:120px;overflow-y:auto;white-space:pre-wrap;word-break:break-all;\">"
				+ escapeHtml(errorDetail) + "</pre></details>";
			saveBtn.textContent = strings.saveToOneNote;
			saveBtn.disabled = false;
		}
	}
});

// Save button triggers clip via port — includes title, annotation, mode, and content for OneNote page creation
saveBtn.addEventListener("click", () => {
	if (saveDone) { return; } // Post-save: "View in OneNote" onclick handles this
	lockSidebar();
	saveBtn.disabled = true;
	saveBtn.textContent = strings.saving;
	// Show saving status below the buttons
	capturePanel.style.display = "flex";
	statusText.textContent = strings.saving;
	progressInfo.textContent = "";
	let saveMsg: any = {
		action: "save",
		title: titleField.value,
		annotation: noteField.value,
		mode: currentMode,
		sectionId: sectionDropdown.value
	};
	// For article/bookmark, include the rendered HTML
	if (currentMode === "article" && cachedArticleHtml) {
		saveMsg.contentHtml = cachedArticleHtml;
	} else if (currentMode === "bookmark" && cachedBookmarkHtml) {
		saveMsg.contentHtml = cachedBookmarkHtml;
	}
	port.postMessage(saveMsg);
});

// Block keyboard and scroll on non-interactive elements — sidebar inputs stay usable
document.addEventListener("keydown", (e) => {
	let tag = (e.target as HTMLElement).tagName;
	if (tag !== "TEXTAREA" && tag !== "INPUT" && tag !== "BUTTON") {
		e.preventDefault();
	}
}, true);
document.addEventListener("wheel", (e) => {
	// Allow scrolling in preview container, preview frame, and sidebar body
	let target = e.target as HTMLElement;
	if (target.closest("#preview-container") || target.closest("#sidebar-body")) {
		return;
	}
	e.preventDefault();
}, { capture: true, passive: false } as any);

// Prevent resize/maximize — snap back to original size
let origWidth = window.outerWidth;
let origHeight = window.outerHeight;
window.addEventListener("resize", () => {
	if (window.outerWidth !== origWidth || window.outerHeight !== origHeight) {
		window.resizeTo(origWidth, origHeight);
	}
});

// Keep renderer focused — re-focus when user tries to switch away
window.addEventListener("blur", () => {
	if (saveDone) { return; } // Don't fight focus after save (user may be viewing in OneNote)
	if (currentMode === "region") { return; } // Don't fight focus during region selection on original tab
	setTimeout(() => { window.focus(); }, 100);
});

// Signal that the renderer is ready
port.postMessage({ action: "ready" });
