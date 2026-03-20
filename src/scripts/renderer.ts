import {Funnel} from "./logging/submodules/funnel";
import {LogMethods} from "./logging/submodules/logMethods";
import {Session} from "./logging/submodules/session";

// Renderer page script - connects to service worker via port
// and handles scroll/capture commands. Reads HTML directly from
// chrome.storage.session to avoid large data through message channels.
//
// Content is rendered inside an iframe for CSS isolation — the renderer's
// own styles (scrollbar hiding, overflow) don't interfere with the page's CSS.
let port = chrome.runtime.connect({ name: "renderer" });
let portDisconnected = false;
port.onDisconnect.addListener(() => { portDisconnected = true; });
function safeSend(msg: any) {
	if (!portDisconnected) {
		try { port.postMessage(msg); } catch (e) { portDisconnected = true; }
	}
}
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
let sectionPicker = document.getElementById("section-picker") as HTMLDivElement;
let sectionSelected = document.getElementById("section-selected") as HTMLDivElement;
let sectionListContainer = document.getElementById("section-list-container") as HTMLDivElement;
let sectionList = document.getElementById("section-list") as HTMLUListElement;
let selectedSectionId = "";
let sectionPickerOpen = false;

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
let feedbackLink = document.getElementById("feedback-link") as HTMLAnchorElement;
let signoutLink = document.getElementById("signout-link") as HTMLAnchorElement;

// Mode state
let currentMode = "fullpage";
let fullPageComplete = false;
let fullPageDataUrl = ""; // Cached full-page screenshot data URL for mode switching
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
	signOut: loc("WebClipper.Action.SignOut", "Sign out"),
	feedback: loc("WebClipper.Action.Feedback", "Feedback")
};

// --- Telemetry helpers ---
// Send telemetry via port to worker's logger using the same LogDataPackage format
function logFunnel(label: Funnel.Label) {
	safeSend({ action: "telemetry", data: { methodName: LogMethods.LogFunnel, methodArgs: [label] } });
}
function logSessionEnd(trigger: Session.EndTrigger) {
	safeSend({ action: "telemetry", data: { methodName: LogMethods.LogSessionEnd, methodArgs: [trigger] } });
}
function logSessionStart() {
	safeSend({ action: "telemetry", data: { methodName: LogMethods.LogSessionStart, methodArgs: [] } });
}

// Cancel button closes the window (port disconnect triggers cleanup in worker)
cancelBtn.addEventListener("click", () => { window.close(); });

// Apply localized strings to UI elements
sidebarTitle.textContent = strings.clipperTitle;
cancelBtn.textContent = strings.close;
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

// --- Section picker (custom dropdown with scrollable list) ---
function selectSection(id: string, label: string) {
	selectedSectionId = id;
	sectionSelected.textContent = label;
	sectionSelected.title = label;
	// Persist selection
	if (id) {
		let curSection = { path: label, section: { id: id, name: label } };
		try { localStorage.setItem("curSection", JSON.stringify(curSection)); } catch (e) { /* ignore */ }
	}
	closeSectionPicker();
	resetSaveState();
	capturePanel.style.display = (currentMode === "fullpage" && !fullPageComplete) ? "flex" : "none";
}

function toggleSectionPicker() {
	if (sectionPickerOpen) {
		closeSectionPicker();
	} else {
		openSectionPicker();
	}
}

function openSectionPicker() {
	sectionListContainer.style.display = "block";
	sectionPickerOpen = true;
	// Scroll selected item into view
	let sel = sectionList.querySelector(".section-item-selected");
	if (sel) { sel.scrollIntoView({ block: "nearest" }); }
}

function closeSectionPicker() {
	sectionListContainer.style.display = "none";
	sectionPickerOpen = false;
}

sectionSelected.addEventListener("click", toggleSectionPicker);
sectionSelected.addEventListener("keydown", (e) => {
	if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggleSectionPicker(); }
});
// Close dropdown when clicking outside
document.addEventListener("click", (e) => {
	if (sectionPickerOpen && !sectionPicker.contains(e.target as Node)) {
		closeSectionPicker();
	}
});

function populateSectionDropdown() {
	sectionList.innerHTML = "";
	try {
		let notebooksJson = localStorage.getItem("notebooks");
		let curSectionJson = localStorage.getItem("curSection");
		if (!notebooksJson) {
			sectionSelected.textContent = "No notebooks available";
			selectedSectionId = "";
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
		flattenSections(notebooks, curSectionId);
		// If no section was selected, select the first one
		if (!selectedSectionId) {
			let first = sectionList.querySelector("li") as HTMLElement;
			if (first) {
				selectSection(first.getAttribute("data-id") || "", first.textContent || "");
			}
		}
	} catch (e) {
		sectionSelected.textContent = "Error loading notebooks";
		selectedSectionId = "";
	}
}

function flattenSections(notebooks: any[], preselectedId: string) {
	for (let nb of notebooks) {
		if (nb.sections) {
			for (let sec of nb.sections) {
				addSectionItem(sec.id, nb.name + " > " + sec.name, preselectedId);
			}
		}
		if (nb.sectionGroups) {
			flattenSectionGroups(nb.sectionGroups, nb.name, preselectedId);
		}
	}
}

function flattenSectionGroups(groups: any[], parentPath: string, preselectedId: string) {
	for (let group of groups) {
		let path = parentPath + " > " + group.name;
		if (group.sections) {
			for (let sec of group.sections) {
				addSectionItem(sec.id, path + " > " + sec.name, preselectedId);
			}
		}
		if (group.sectionGroups) {
			flattenSectionGroups(group.sectionGroups, path, preselectedId);
		}
	}
}

function addSectionItem(id: string, label: string, preselectedId: string) {
	let li = document.createElement("li");
	li.className = "section-item";
	li.setAttribute("data-id", id);
	li.textContent = label;
	li.title = label;
	if (id === preselectedId) {
		li.classList.add("section-item-selected");
		selectedSectionId = id;
		sectionSelected.textContent = label;
		sectionSelected.title = label;
	}
	li.addEventListener("click", () => {
		// Remove old selection
		let prev = sectionList.querySelector(".section-item-selected");
		if (prev) { prev.classList.remove("section-item-selected"); }
		li.classList.add("section-item-selected");
		selectSection(id, label);
	});
	sectionList.appendChild(li);
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
	// Hide feedback for MSA users (matches old sidebar behavior)
	if (userAuthType === "Msa") {
		feedbackLink.style.display = "none";
	}
} catch (e) {
	userInfoDiv.style.display = "none";
}
signoutLink.textContent = strings.signOut;
let feedbackLabel = document.getElementById("feedback-label");
if (feedbackLabel) { feedbackLabel.textContent = strings.feedback; }
signoutLink.addEventListener("click", (e) => {
	e.preventDefault();
	logFunnel(Funnel.Label.SignOut);
	logSessionEnd(Session.EndTrigger.SignOut);
	logSessionStart();
	safeSend({ action: "signOut", authType: userAuthType });
});

// --- Feedback link ---
feedbackLink.addEventListener("click", (e) => {
	e.preventDefault();
	safeSend({ action: "openFeedback", pageUrl: sourceUrl.textContent || "" });
});

// --- Sign-in state detection ---
let isSignedIn = false;
try {
	let uiRaw = localStorage.getItem("userInformation");
	if (uiRaw) {
		let ui = JSON.parse(uiRaw);
		isSignedIn = !!(ui && ui.data && ui.data.accessToken);
	}
} catch (e) { /* not signed in */ }

let signinOverlay = document.getElementById("signin-overlay") as HTMLDivElement;
let sidebarBody = document.getElementById("sidebar-body") as HTMLDivElement;
let signinError = document.getElementById("signin-error") as HTMLDivElement;
let signinProgress = document.getElementById("signin-progress") as HTMLDivElement;
let signinMsaBtn = document.getElementById("signin-msa-btn") as HTMLButtonElement;
let signinOrgIdBtn = document.getElementById("signin-orgid-btn") as HTMLButtonElement;

function showSignInPanel() {
	signinOverlay.style.display = "flex";
}

function hideSignInPanel() {
	signinOverlay.style.display = "none";
}

function showSignInProgress() {
	signinMsaBtn.disabled = true;
	signinOrgIdBtn.disabled = true;
	signinProgress.style.display = "block";
	signinError.style.display = "none";
}

function showSignInError(msg: string) {
	signinMsaBtn.disabled = false;
	signinOrgIdBtn.disabled = false;
	signinProgress.style.display = "none";
	signinError.textContent = msg;
	signinError.style.display = "block";
}

// Log renderer invocation
logFunnel(Funnel.Label.Invoke);
if (!isSignedIn) {
	showSignInPanel();
} else {
	logFunnel(Funnel.Label.AuthAlreadySignedIn);
}

// Sign-in button handlers
signinMsaBtn.addEventListener("click", () => {
	signingIn = true;
	logFunnel(Funnel.Label.AuthAttempted);
	showSignInProgress();
	safeSend({ action: "signIn", authType: "Msa" });
});
signinOrgIdBtn.addEventListener("click", () => {
	signingIn = true;
	logFunnel(Funnel.Label.AuthAttempted);
	showSignInProgress();
	safeSend({ action: "signIn", authType: "OrgId" });
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
		let previousSectionId = selectedSectionId;
		sectionList.innerHTML = "";
		selectedSectionId = "";
		flattenSections(freshNotebooks, previousSectionId);

		// If previously selected section no longer exists, select the first one
		if (!selectedSectionId) {
			let first = sectionList.querySelector("li") as HTMLElement;
			if (first) {
				selectSection(first.getAttribute("data-id") || "", first.textContent || "");
			}
		}
	} catch (e) {
		// Silently keep cached data
	}
}
fetchFreshNotebooks();

// Lock all interactive controls during initial capture — prevents race conditions
// (e.g., clicking sign-out mid-capture corrupts state)
document.querySelectorAll(".mode-btn").forEach((btn) => {
	if (btn.getAttribute("data-mode") !== "fullpage") {
		(btn as HTMLButtonElement).disabled = true;
		btn.classList.add("disabled");
	}
});
saveBtn.disabled = true;
signoutLink.style.pointerEvents = "none";
signoutLink.style.opacity = "0.4";
// Show initial capture progress
capturePanel.style.display = "flex";
statusText.textContent = strings.capturing;

// Section selection persistence is handled by selectSection() in the custom dropdown

// --- UI lock during clip/save ---

function lockSidebar() {
	// Disable all interactive elements during save round-trip
	document.querySelectorAll(".mode-btn").forEach((b) => { (b as HTMLButtonElement).disabled = true; });
	titleField.disabled = true;
	noteField.disabled = true;
	sectionPicker.classList.add("disabled");
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
	sectionPicker.classList.remove("disabled");
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
	cancelBtn.textContent = strings.close;
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
		// Restore full-page screenshot from cached data URL
		previewContainer.innerHTML = "";
		if (fullPageDataUrl) {
			let img = document.createElement("img");
			img.src = fullPageDataUrl;
			previewContainer.appendChild(img);
		}
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
	// Clone content-frame document — Readability mutates the DOM
	let iframeDoc = iframe.contentDocument;
	if (!iframeDoc || !iframeDoc.body) {
		showArticleError();
		return;
	}
	let docClone = iframeDoc.cloneNode(true) as Document;
	// Lazy-load Readability only when Article mode is used (~90KB saved from initial bundle)
	(import("@mozilla/readability") as any).then(function(mod: any) {
		let reader = new mod.Readability(docClone, { charThreshold: 100 });
		let article = reader.parse();

		if (article && article.content) {
			cachedArticleHtml = cleanArticleHtml(article.content);
			renderArticleHtml(cachedArticleHtml);
			articleLoaded = true;
			if (currentMode === "article") {
				saveBtn.disabled = false;
				saveBtn.textContent = strings.saveToOneNote;
			}
		} else {
			showArticleError();
		}
	})["catch"](function() {
		showArticleError();
	});
}

function showArticleError() {
	let errDoc = previewFrame.contentDocument;
	if (errDoc) {
		errDoc.open();
		errDoc.write("<!DOCTYPE html><html><head><style>body{font-family:Segoe UI,sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;color:#999;}</style></head><body><div>Article content not available for this page.</div></body></html>");
		errDoc.close();
	}
}

// Clean Readability output to match ONML (OneNote Markup Language) constraints,
// mirroring the old toOnml() pipeline: strip styles/classes, event handlers, and
// unsupported elements. Applied once at extraction time so both preview and save
// use the same cleaned HTML.
function cleanArticleHtml(html: string): string {
	var tempDoc = new DOMParser().parseFromString(html, "text/html");
	// Remove elements not supported in ONML
	var unsupported = tempDoc.querySelectorAll("applet, audio, button, canvas, embed, hr, input, link, map, menu, menuitem, meter, noscript, progress, script, source, style, svg, video");
	for (var i = unsupported.length - 1; i >= 0; i--) {
		if (unsupported[i].parentNode) { unsupported[i].parentNode.removeChild(unsupported[i]); }
	}
	// Strip all style and class attributes (page layout styles leak into preview/OneNote)
	var allEls = tempDoc.querySelectorAll("*");
	for (var i = 0; i < allEls.length; i++) {
		(allEls[i] as HTMLElement).removeAttribute("style");
		(allEls[i] as HTMLElement).removeAttribute("class");
	}
	return tempDoc.body ? tempDoc.body.innerHTML : html;
}

function renderArticleHtml(html: string) {
	let pDoc = previewFrame.contentDocument;
	if (!pDoc) { return; }
	// Wrap article HTML in a styled document matching OneNote page layout:
	// 624px content width + 20px left/right padding = 664px total (from @OneNotePageWidth)
	// Segoe UI font family matches the clipper's existing preview styling
	let articleCss = "body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 11pt; line-height: 1.6; "
		+ "max-width: 624px; margin: 24px 0; padding: 0 20px; color: #1a1a1a; margin-bottom: 16px; }"
		+ "img { max-width: 100%; height: auto; }"
		+ "a { color: #2e75b5; text-decoration: underline; pointer-events: none; cursor: default; }"
		+ "::-webkit-scrollbar{width:6px} ::-webkit-scrollbar-thumb{background:rgba(0,0,0,0.2);border-radius:3px} ::-webkit-scrollbar-track{background:transparent}"
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
	let bookmarkCss = "body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 11pt; line-height: 1.5; "
		+ "max-width: 624px; margin: 24px 0; padding: 0 20px; color: #1a1a1a; }"
		+ "a { color: #2e75b5; text-decoration: underline; pointer-events: none; cursor: default; }"
		+ "::-webkit-scrollbar{width:6px} ::-webkit-scrollbar-thumb{background:rgba(0,0,0,0.2);border-radius:3px} ::-webkit-scrollbar-track{background:transparent}"
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
	// Keep previewContainer visible (display:block) to hold flex space — sidebar stays right
	safeSend({ action: "startRegion" });
}

function switchToRegion() {
	resetSaveState();
	currentMode = "region";
	iframe.style.display = "none";
	previewFrame.style.display = "none";
	// Keep previewContainer visible (even if empty) so sidebar stays right in flex layout
	previewContainer.innerHTML = "";
	previewContainer.style.display = "block";
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
				// No regions left — stay in region mode, show just the add button
				renderRegionThumbnails();
				updateRegionSessionStorage();
				saveBtn.disabled = true;
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

	if (regionImages.length > 0) {
		saveBtn.disabled = false;
		saveBtn.textContent = strings.saveToOneNote;
	} else {
		saveBtn.disabled = true;
	}
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
		// Read HTML, base URL, cached stylesheets, and page metadata from session storage
		chrome.storage.session.get(["fullPageHtmlContent", "fullPageBaseUrl", "fullPageTitle", "fullPageUrl"], (stored: any) => {
			let rawHtml = stored && stored.fullPageHtmlContent ? stored.fullPageHtmlContent : "";
			let baseUrl = stored && stored.fullPageBaseUrl ? stored.fullPageBaseUrl : "";

			// Populate title and source URL (may not have been available on initial page load)
			if (stored && stored.fullPageTitle && !titleField.value) { titleField.value = stored.fullPageTitle; }
			if (stored && stored.fullPageUrl && !sourceUrl.textContent) { sourceUrl.textContent = stored.fullPageUrl; sourceUrl.title = stored.fullPageUrl; }

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

			// Fetch external stylesheets and inline them (browser fetches via absolute URLs)

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
			scrollbarStyle.textContent = "::-webkit-scrollbar{display:none}html{scrollbar-width:none;overflow-x:hidden!important}[hidden]{display:none!important}";
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
							el.style.setProperty("position", "absolute", "important");
						} else if (computed.position === "sticky") {
							el.style.setProperty("position", "static", "important");
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

					safeSend({
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
		safeSend({
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
					safeSend({ action: "drawComplete" });
					return;
				}
				if (srcH > remaining) {
					srcH = remaining;
				}

				stitchCtx.drawImage(img, 0, srcY, contentPixelWidth, srcH, 0, stitchYOffset, contentPixelWidth, srcH);
				stitchYOffset += srcH;
			}

			safeSend({ action: "drawComplete" });
		};
		img.onerror = function() {
			safeSend({ action: "drawComplete" });
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
				fullPageDataUrl = dataUrl; // Cache for mode switching
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

					// Re-enable mode buttons and sign-out now that capture is complete
					document.querySelectorAll(".mode-btn").forEach((b: Element) => {
						(b as HTMLButtonElement).disabled = false;
						b.classList.remove("disabled");
					});
					signoutLink.style.pointerEvents = "";
					signoutLink.style.opacity = "";

					safeSend({ action: "finalizeComplete" });
				});
			};
			reader.readAsDataURL(blob);
		}) as BlobCallback, "image/jpeg", 0.95);
	}

	if (message.action === "regionCaptured") {
		// Worker sends full tab screenshot + selection coords via port (same as drawCapture)
		let fullImg = new Image();
		fullImg.onload = () => {
			// Calculate effective DPR from actual image vs reported viewport
			// (captureVisibleTab may differ from window.devicePixelRatio on scaled displays)
			let dpr = message.dpr || 1;
			let sx = Math.round(message.x * dpr);
			let sy = Math.round(message.y * dpr);
			let sw = Math.round(message.width * dpr);
			let sh = Math.round(message.height * dpr);
			// Clamp to actual image bounds — prevents grabbing gray/empty pixels beyond content
			if (sx + sw > fullImg.naturalWidth) { sw = fullImg.naturalWidth - sx; }
			if (sy + sh > fullImg.naturalHeight) { sh = fullImg.naturalHeight - sy; }
			if (sw <= 0 || sh <= 0) { return; }
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
			var escapedDetail = escapeHtml(errorDetail);
			statusText.innerHTML = escapeHtml(loc("WebClipper.Error.GenericError", "Something went wrong. Please try clipping the page again."))
				+ "<details style=\"margin-top:8px;font-size:12px;\">"
				+ "<summary style=\"cursor:pointer;color:rgba(255,255,255,0.8);\">"
				+ escapeHtml(loc("WebClipper.Label.SignInUnsuccessfulMoreInformation", "More information"))
				+ " <button id=\"copy-diagnostics\" style=\"background:none;border:none;cursor:pointer;font-size:12px;padding:0;vertical-align:baseline;\">&#x1F4CB;</button>"
				+ "</summary>"
				+ "<pre id=\"error-detail-text\" style=\"margin-top:6px;font-size:11px;color:rgba(255,255,255,0.85);background:rgba(0,0,0,0.2);padding:8px;border-radius:3px;max-height:120px;overflow-y:auto;white-space:pre-wrap;word-break:break-all;\">"
				+ escapedDetail + "</pre>"
				+ "</details>";
			var copyBtn = document.getElementById("copy-diagnostics");
			if (copyBtn) {
				copyBtn.addEventListener("click", function(ev) {
					ev.stopPropagation();
					var pre = document.getElementById("error-detail-text");
					if (pre) {
						navigator.clipboard.writeText(pre.textContent || "").then(function() {
							copyBtn.style.color = "#69F0AE";
							copyBtn.textContent = "\u2713";
							setTimeout(function() { copyBtn.style.color = ""; copyBtn.innerHTML = "&#x1F4CB;"; }, 1500);
						});
					}
				});
			}
			saveBtn.textContent = strings.saveToOneNote;
			saveBtn.disabled = false;
		}
	}

	// --- Sign-in result from worker ---
	if (message.action === "signInResult") {
		signingIn = false;
		if (message.success) {
			logFunnel(Funnel.Label.AuthSignInCompleted);
			// Transition from sign-in to capture mode
			isSignedIn = true;
			hideSignInPanel();
			// Show iframe immediately so flex layout keeps sidebar on the right
			// (it'll be blank until loadContent arrives, but prevents sidebar snap-left)
			iframe.style.display = "block";
			// Update user info footer
			if (message.user) {
				userEmailSpan.textContent = message.user.email || message.user.name || "";
				userEmailSpan.title = message.user.email || "";
				userAuthType = message.user.authType || "";
				userInfoDiv.style.display = "";
				feedbackLink.style.display = (userAuthType === "Msa") ? "none" : "";
			}
			// Reset capture state for fresh capture
			fullPageComplete = false;
			fullPageDataUrl = "";
			articleLoaded = false;
			cachedArticleHtml = "";
			bookmarkLoaded = false;
			cachedBookmarkHtml = "";
			contentDocReady = false;
			// Populate section dropdown — delay slightly to ensure localStorage is written by offscreen
			populateSectionDropdown();
			setTimeout(fetchFreshNotebooks, 300);
			// Show capture progress — content capture + loadContent will follow from worker
			capturePanel.style.display = "flex";
			statusText.textContent = strings.capturing;
			saveBtn.disabled = true;
		} else {
			logFunnel(Funnel.Label.AuthSignInFailed);
			showSignInError(message.error || "Sign-in failed. Please try again.");
		}
	}

	// --- Sign-out complete from worker ---
	if (message.action === "signOutComplete") {
		isSignedIn = false;
		signingIn = false;
		// Reset sign-in panel state
		signinMsaBtn.disabled = false;
		signinOrgIdBtn.disabled = false;
		signinProgress.style.display = "none";
		signinError.style.display = "none";
		// Reset sidebar state fully — unlock all controls
		saveDone = false;
		fullPageComplete = false;
		fullPageDataUrl = "";
		articleLoaded = false;
		cachedArticleHtml = "";
		bookmarkLoaded = false;
		cachedBookmarkHtml = "";
		contentDocReady = false;
		regionImages.length = 0;
		currentMode = "fullpage";
		// Unlock sidebar (clears disabled state from lockSidebar during save)
		unlockSidebar();
		signoutLink.style.pointerEvents = "";
		signoutLink.style.opacity = "";
		userEmailSpan.textContent = "";
		userAuthType = "";
		userInfoDiv.style.display = "none";
		// Clear section dropdown and notebook cache so next user gets fresh data
		sectionList.innerHTML = "";
		selectedSectionId = "";
		sectionSelected.textContent = "";
		try {
			localStorage.removeItem("notebooks");
			localStorage.removeItem("curSection");
		} catch (e) { /* ignore */ }
		// Reset metadata fields
		titleField.value = "";
		noteField.value = "";
		sourceUrl.textContent = "";
		sourceUrl.title = "";
		// Clear stale capture content from DOM
		previewContainer.innerHTML = "";
		previewContainer.style.display = "none";
		iframe.style.display = "none";
		previewFrame.style.display = "none";
		capturePanel.style.display = "none";
		// Reset mode buttons to initial state (disabled until capture completes)
		document.querySelectorAll(".mode-btn").forEach((b) => {
			b.classList.remove("selected");
			(b as HTMLButtonElement).disabled = true;
			b.classList.add("disabled");
		});
		let fpBtn = document.querySelector('.mode-btn[data-mode="fullpage"]');
		if (fpBtn) { fpBtn.classList.add("selected"); }
		saveBtn.disabled = true;
		saveBtn.textContent = strings.saveToOneNote;
		saveBtn.onclick = null;
		cancelBtn.textContent = strings.close;
		// Show sign-in overlay
		showSignInPanel();
	}
});

// Save button triggers clip via port — includes title, annotation, mode, and content for OneNote page creation
saveBtn.addEventListener("click", () => {
	if (saveDone) { return; } // Post-save: "View in OneNote" onclick handles this
	logFunnel(Funnel.Label.ClipAttempted);
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
		url: sourceUrl.textContent || "",
		mode: currentMode,
		sectionId: selectedSectionId
	};
	// For article/bookmark, include the rendered HTML
	if (currentMode === "article" && cachedArticleHtml) {
		saveMsg.contentHtml = cachedArticleHtml;
	} else if (currentMode === "bookmark" && cachedBookmarkHtml) {
		saveMsg.contentHtml = cachedBookmarkHtml;
	}
	safeSend(saveMsg);
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
		// Check for maximized state — window.resizeTo is ignored when maximized
		// Use chrome.windows API to un-maximize first, then resize
		try {
			chrome.windows.getCurrent({}, (w: any) => {
				if (w && w.state === "maximized") {
					chrome.windows.update(w.id, { state: "normal", width: origWidth, height: origHeight });
				} else {
					window.resizeTo(origWidth, origHeight);
				}
			});
		} catch (e) {
			window.resizeTo(origWidth, origHeight);
		}
	}
});

// Keep renderer focused — re-focus when user tries to switch away
let signingIn = false; // Disable blur handler during sign-in popup
window.addEventListener("blur", () => {
	if (saveDone) { return; } // Don't fight focus after save (user may be viewing in OneNote)
	if (currentMode === "region") { return; } // Don't fight focus during region selection on original tab
	if (signingIn) { return; } // Don't fight focus during sign-in popup
	setTimeout(() => { window.focus(); }, 100);
});

// Signal that the renderer is ready
safeSend({ action: "ready" });
