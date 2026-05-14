import {Context} from "./logging/submodules/context";
import {Event} from "./logging/submodules/event";
import {Failure} from "./logging/submodules/failure";
import {Funnel} from "./logging/submodules/funnel";
import {LogMethods} from "./logging/submodules/logMethods";
import {PropertyName} from "./logging/submodules/propertyName";
import {Session} from "./logging/submodules/session";
import {Status} from "./logging/submodules/status";

import {tryOEmbed, sanitizeProviderHtml, OEmbedData} from "./contentCapture/oembedExtractor";

// Renderer page script - connects to service worker via port
// and handles scroll/capture commands. Content HTML arrives inline
// on the loadContent port message; images sent to worker via chunked
// port messages at save time (per-port isolation enables multi-window).
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
// Keep service worker alive while renderer is open (MV3 SW suspends after ~30s idle)
setInterval(function() { safeSend({ action: "keepalive" }); }, 25000);
// Auto-close after 5 minutes of inactivity (no mouse, keyboard, or focus)
let inactivityTimeoutMs = 5 * 60 * 1000;
let inactivityTimer = setTimeout(function() { window.close(); }, inactivityTimeoutMs);
function resetInactivityTimer() {
	clearTimeout(inactivityTimer);
	inactivityTimer = setTimeout(function() { window.close(); }, inactivityTimeoutMs);
}
document.addEventListener("mousemove", resetInactivityTimer);
document.addEventListener("mousedown", resetInactivityTimer);
document.addEventListener("keydown", resetInactivityTimer);
document.addEventListener("scroll", resetInactivityTimer, true);
window.addEventListener("focus", resetInactivityTimer);

let iframe = document.getElementById("content-frame") as HTMLIFrameElement;
let previewFrame = document.getElementById("preview-frame") as HTMLIFrameElement;
// Wrapper around preview-frame is the tab stop and keyboard-scroll target.
// The iframe itself is tabindex=-1 so Tab can't fall into article links —
// matching the legacy clipper's div-based preview behavior.
let previewFrameWrap = document.getElementById("preview-frame-wrap") as HTMLDivElement;
let previewContainer = document.getElementById("preview-container") as HTMLDivElement;
let previewArea = document.getElementById("preview-area") as HTMLDivElement;

// Arrow / Page / Home / End scrolling for the article preview iframe — driven
// from the wrapper div so the iframe's contentDocument never receives focus.
previewFrameWrap.addEventListener("keydown", function(e) {
	let win = previewFrame.contentWindow as any;
	if (!win) { return; }
	let pageStep = win.innerHeight - 40;
	let dy = 0;
	if (e.key === "ArrowDown") {
		dy = 40;
	} else if (e.key === "ArrowUp") {
		dy = -40;
	} else if (e.key === "PageDown" || e.key === " ") {
		dy = pageStep;
	} else if (e.key === "PageUp") {
		dy = -pageStep;
	} else if (e.key === "Home") {
		e.preventDefault(); win.scrollTo(0, 0); return;
	} else if (e.key === "End") {
		e.preventDefault(); win.scrollTo(0, win.document.body.scrollHeight); return;
	} else {
		return;
	}
	e.preventDefault();
	win.scrollBy(0, dy);
});

// Show rounded frame overlay on the preview area (applied after capture completes)
function showPreviewFrame() {
	previewArea.classList.add("preview-ready");
	unlockResize();
}

// Remove rounded frame overlay so content-frame is full-bleed during capture.
// Critical: if .preview-ready is set during captureVisibleTab, the 8px margin
// around content-frame bakes preview-area background into the screenshot.
function hidePreviewFrame() {
	previewArea.classList.remove("preview-ready");
}

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
// URL text lives in a child span so the sibling <svg> link icon survives
// textContent writes. Reads/writes go through this element.
let sourceUrlText = document.getElementById("source-url-text") as HTMLSpanElement;
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
let sidebarCssWidth = 321; // Matches Figma 242:4365 (320px content + 1px border)
let contentPixelWidth = 0; // set on first capture, excludes sidebar
let contentSrcX = 0; // source-x offset into captured viewport (sidebar width in RTL, 0 in LTR)

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
let cachedArticleHtml = ""; // Article preview HTML (Readability or oEmbed-preview shape)
let cachedOEmbedData: OEmbedData | null = null; // Raw oEmbed payload; if present, save path builds iframe-based HTML from this instead of cachedArticleHtml
let cachedOEmbedDescription = ""; // og:description (or fallback chain) from page DOM; oEmbed responses typically don't carry the full description
let cachedPageMetadata: { [key: string]: string } | null = null; // PageMetadata sent in save msg; worker emits each entry as a <meta> tag (matches V1 OneNotePage)
let cachedBookmarkHtml = ""; // Bookmark card HTML, extracted lazily from content-frame DOM
let bookmarkLoaded = false;
let contentDocReady = false; // true once content-frame has loaded HTML

// PDF state
let pdfMode = false;               // true when page is a PDF
let pdfDoc: any;                    // PDFDocumentProxy from pdf.js
let pdfPageCount = 0;
let pdfByteLength = 0;
let pdfBuffer: Uint8Array;          // raw bytes for attachment
let pdfAllPages = true;
let pdfSelectedRange = "";
let pdfAttach = true;
let pdfDistribute = false;
let pdfPagesRendered: boolean[] = []; // tracks which pages have been rendered to preview
let pdfPageDataUrls: string[] = [];   // cached data URLs for save
let pdfSourceUrl = "";
let pdfMaxAttachSize = 24900000;      // 24.9MB — matches Constants.Settings.maximumMimeSizeLimit

// PDF UI elements (populated in enterPdfMode)
let pdfOptionsPanel: HTMLDivElement;
let pdfRangeInput: HTMLInputElement;
let pdfRangeError: HTMLDivElement;
let pdfAttachCheckbox: HTMLInputElement;
let pdfAttachLabel: HTMLLabelElement;
let pdfAttachWarning: HTMLDivElement;
let pdfDistributeCheckbox: HTMLInputElement;

// Article header controls
let articleHeader = document.getElementById("article-header") as HTMLDivElement;
let highlightBtn = document.getElementById("highlight-btn") as HTMLButtonElement;
let sansSerifBtn = document.getElementById("sans-serif-btn") as HTMLButtonElement;
let serifBtn = document.getElementById("serif-btn") as HTMLButtonElement;
let fontDecreaseBtn = document.getElementById("font-decrease-btn") as HTMLButtonElement;
let fontIncreaseBtn = document.getElementById("font-increase-btn") as HTMLButtonElement;
let articleSerif = false;
let articleFontSize = 16;
let highlighterEnabled = false;
let textHighlighterInstance: any = undefined;
let articleWorkingHtml = ""; // Preserves highlights/edits across mode switches
let saveTimeoutId: any = 0; // Client-side save timeout (service worker setTimeout unreliable)

// --- Localization ---
// Read localized strings directly from localStorage (shared extension origin).
// Both writers (extensionBase.fetchAndStoreLocStrings at boot and CachedHttp's
// setTimeStampedValue per click) produce a TimeStampedData wrapper:
//   { data: { key: value, ... }, lastUpdated: <ms> }
// Falls back to bundled English defaults if not available.
let locStrings: any = {};
try {
	let raw = localStorage.getItem("locStrings");
	if (raw) {
		let parsed = JSON.parse(raw);
		locStrings = (parsed && parsed.data) || {};
	}
} catch (e) { /* ignore */ }

function loc(key: string, fallback: string): string {
	return (locStrings && locStrings[key]) || fallback;
}

// Set HTML lang + dir from stored locale (extensionBase stores navigator.language in localStorage.locale).
// RTL list mirrors legacy Rtl.isRtl: ISO 639-1 codes whose translations our string servers ship as RTL.
const RTL_LANGS = ["ar", "fa", "he", "sd", "ug", "ur"];
function isRtlLocale(locale: string): boolean {
	if (!locale) { return false; }
	let primary = locale.split("-")[0].split("_")[0].toLowerCase();
	return RTL_LANGS.indexOf(primary) >= 0;
}
try {
	let storedLocale = localStorage.getItem("displayLocaleOverride") || localStorage.getItem("locale");
	if (storedLocale) {
		document.documentElement.lang = storedLocale.replace(/_/g, "-");
		document.documentElement.dir = isRtlLocale(storedLocale) ? "rtl" : "ltr";
	}
} catch (e) { /* keep default "en" / ltr */ }

// Screen reader announcements via aria-live region
function announceToScreenReader(text: string) {
	let el = document.getElementById("aria-status");
	if (el) { el.textContent = ""; setTimeout(function() { if (el) { el.textContent = text; } }, 100); }
}

let strings = {
	clipperTitle: "OneNote Web Clipper",
	capturing: "", // no heading — progressInfo shows viewport progress directly
	cancel: loc("WebClipper.Action.Cancel", "Cancel"),
	close: loc("WebClipper.Action.CloseTheClipper", "Close"),
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
	sourceLabel: loc("WebClipper.Label.Source", "Source"),
	signOut: loc("WebClipper.Action.SignOut", "Sign out"),
	feedback: loc("WebClipper.Action.Feedback", "Feedback"),
	toggleHighlighter: loc("WebClipper.Accessibility.ScreenReader.ToggleHighlighterForArticleMode", "Toggle highlighter"),
	changeFontSansSerif: loc("WebClipper.Accessibility.ScreenReader.ChangeFontToSansSerif", "Change font to Sans-Serif"),
	changeFontSerif: loc("WebClipper.Accessibility.ScreenReader.ChangeFontToSerif", "Change font to Serif"),
	decreaseFontSize: loc("WebClipper.Accessibility.ScreenReader.DecreaseFontSize", "Decrease font size"),
	increaseFontSize: loc("WebClipper.Accessibility.ScreenReader.IncreaseFontSize", "Increase font size"),
	sansSerifLabel: loc("WebClipper.Preview.Header.SansSerifButtonLabel", "Sans-serif"),
	serifLabel: loc("WebClipper.Preview.Header.SerifButtonLabel", "Serif"),
	fontFamilySerif: loc("WebClipper.FontFamily.Preview.SerifDefault", "Georgia"),
	fontFamilySansSerif: loc("WebClipper.FontFamily.Preview.SansSerifDefault", "Verdana"),
	// PDF strings
	modePdf: loc("WebClipper.ClipType.Pdf.Button", "PDF"),
	pdfAllPages: loc("WebClipper.Label.PdfAllPagesRadioButton", "All pages"),
	pdfPageRange: loc("WebClipper.Preview.Header.PdfPageRangeRadioButtonLabel", "Page range"),
	pdfAttachFile: loc("WebClipper.Label.AttachPdfFile", "Attach PDF file"),
	pdfAttachSubtext: loc("WebClipper.Label.AttachPdfFileSubText", "(all pages)"),
	pdfTooLarge: loc("WebClipper.Label.PdfTooLargeToAttach", "PDF too large to attach"),
	pdfDistribute: loc("WebClipper.Label.PdfDistributePagesCheckbox", "New note for each PDF page"),
	pdfInvalidRange: loc("WebClipper.Popover.PdfInvalidPageRange", "Invalid range: {0}"),
	pdfProgress: loc("WebClipper.ClipType.Pdf.ProgressLabel", "Clipping PDF file..."),
	pdfProgressDelay: loc("WebClipper.ClipType.Pdf.ProgressLabelDelay", "PDFs can take a little while to upload. Still clipping."),
	pdfPageProgress: loc("WebClipper.ClipType.Pdf.IncrementalProgressMessage", "Clipping page {0} of {1}..."),
	pdfLoading: loc("WebClipper.ClipType.Pdf.Loading", "Loading PDF..."),
	page: loc("WebClipper.Label.Page", "Page")
};

// --- Telemetry helpers ---
// Send telemetry via port to worker's logger using the same LogDataPackage format.
// BaseEvent/PromiseEvent are constructed locally, then serialized as (category, eventData).
function logFunnel(label: Funnel.Label) {
	safeSend({ action: "telemetry", data: { methodName: LogMethods.LogFunnel, methodArgs: [label] } });
}
function logSessionEnd(trigger: Session.EndTrigger) {
	safeSend({ action: "telemetry", data: { methodName: LogMethods.LogSessionEnd, methodArgs: [trigger] } });
}
function logSessionStart() {
	safeSend({ action: "telemetry", data: { methodName: LogMethods.LogSessionStart, methodArgs: [] } });
}
function logTelemetryEvent(event: Event.BaseEvent) {
	event.stopTimer();
	safeSend({ action: "telemetry", data: { methodName: LogMethods.LogEvent, methodArgs: [event.getEventCategory(), event.getEventData()] } });
}
function logFailure(label: Failure.Label, failureType: Failure.Type, failureInfo?: any, id?: string) {
	safeSend({ action: "telemetry", data: { methodName: LogMethods.LogFailure, methodArgs: [label, failureType, failureInfo, id] } });
}
function logClickEvent(clickId: string) {
	safeSend({ action: "telemetry", data: { methodName: LogMethods.LogClickEvent, methodArgs: [clickId] } });
}
function setTelemetryContext(key: Context.Custom, value: string) {
	safeSend({ action: "telemetry", data: { methodName: LogMethods.SetContextProperty, methodArgs: [key, value] } });
}

// Track clip count for CloseClipper logic (only fire when 0 clips)
let clipSuccessCount = 0;
let originalTitle = ""; // set after page load to detect title modification

// Pending PromiseEvents — created at action start, completed on result
let pendingClipEvent: Event.PromiseEvent | undefined;
let pendingSignInEvent: Event.PromiseEvent | undefined;

// Global error handling — match legacy clipper.tsx UnhandledExceptionThrown
window.onerror = function(msg, file, line, col, error) {
	let errorStr = msg + " (" + (file || "") + ":" + (line || 0) + ":" + (col || 0) + ")";
	if (error && (error as any).stack) { errorStr += " at " + (error as any).stack; }
	logFailure(Failure.Label.UnhandledExceptionThrown, Failure.Type.Unexpected, { error: errorStr }, "Renderer");
};
window.onunhandledrejection = function(e: any) {
	let reason = e && e.reason ? (e.reason.message || String(e.reason)) : "Unknown rejection";
	logFailure(Failure.Label.UnhandledExceptionThrown, Failure.Type.Unexpected, { error: reason }, "Renderer");
};

// Cancel button closes the window (port disconnect triggers cleanup in worker)
cancelBtn.addEventListener("click", () => {
	fireCloseClipperIfNoClip("CloseButton");
	window.close();
});

// CloseClipper — only fires when user closes without any successful clip (abandonment)
function fireCloseClipperIfNoClip(closeReason: string) {
	if (clipSuccessCount > 0) { return; }
	let panelType = "ClipOptions"; // default
	if (!isSignedIn) {
		panelType = "SignInNeeded";
	} else if (saveDone) {
		panelType = "ClippingSuccess";
	}
	let evt = new Event.BaseEvent(Event.Label.CloseClipper);
	evt.setCustomProperty(PropertyName.Custom.CurrentPanel, panelType);
	evt.setCustomProperty(PropertyName.Custom.CloseReason, closeReason);
	logTelemetryEvent(evt);
}

// Also fire CloseClipper on window close (X button, nav-away, inactivity)
window.addEventListener("beforeunload", () => {
	fireCloseClipperIfNoClip("CloseButton");
});

// Handle page navigation on original tab — worker detects URL change and notifies us
port.onMessage.addListener((msg: any) => {
	if (msg.action === "pageNavigated") { window.close(); }
});

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
// Mode button tooltips (matches old modeButton.tsx tooltip pattern)
let tooltipMap: any = {
	fullpage: loc("WebClipper.ClipType.ScreenShot.Button.Tooltip", "Take a screenshot of the whole page, just like you see it."),
	article: loc("WebClipper.ClipType.Button.Tooltip", "Clip just the {0} in an easy-to-read format.").replace("{0}", strings.modeArticle.toLowerCase()),
	bookmark: loc("WebClipper.ClipType.Bookmark.Button.Tooltip", "Clip just the title, thumbnail, synopsis, and link."),
	region: loc("WebClipper.ClipType.Region.Button.Tooltip", "Take a screenshot of the part of the page you'll select.")
};
document.querySelectorAll(".mode-btn").forEach((btn) => {
	let mode = btn.getAttribute("data-mode");
	if (mode && tooltipMap[mode]) { (btn as HTMLElement).title = tooltipMap[mode]; }
});
let sourceLabelEl = document.getElementById("source-label");
if (sourceLabelEl) { sourceLabelEl.textContent = strings.sourceLabel; }
// Field labels
let modeLabelEl = document.getElementById("mode-label");
if (modeLabelEl) { modeLabelEl.textContent = loc("WebClipper.Label.WhatToCapture", "What do you want to capture?"); }
let titleLabelEl = document.getElementById("title-label");
if (titleLabelEl) { titleLabelEl.textContent = loc("WebClipper.Label.PageTitle", "Title"); }
let noteLabelEl = document.getElementById("note-label");
if (noteLabelEl) { noteLabelEl.textContent = loc("WebClipper.Label.Annotation", "Note"); }
let sectionLabelEl = document.getElementById("section-label");
if (sectionLabelEl) { sectionLabelEl.textContent = loc("WebClipper.Label.ClipLocation", "Location"); }
// Sign-in panel
let signinDesc = document.getElementById("signin-description");
if (signinDesc) { signinDesc.textContent = loc("WebClipper.Label.SignInDescription", "Sign in to clip this page to OneNote"); }
let signinProgressEl = document.getElementById("signin-progress");
if (signinProgressEl) { signinProgressEl.textContent = loc("WebClipper.Label.SigningIn", "Signing in..."); }
// Article header i18n
highlightBtn.title = strings.toggleHighlighter;
highlightBtn.setAttribute("aria-label", strings.toggleHighlighter);
sansSerifBtn.textContent = strings.sansSerifLabel;
sansSerifBtn.title = strings.changeFontSansSerif;
sansSerifBtn.setAttribute("aria-label", strings.changeFontSansSerif);
serifBtn.textContent = strings.serifLabel;
serifBtn.title = strings.changeFontSerif;
serifBtn.setAttribute("aria-label", strings.changeFontSerif);
fontDecreaseBtn.title = strings.decreaseFontSize;
fontDecreaseBtn.setAttribute("aria-label", strings.decreaseFontSize);
fontIncreaseBtn.title = strings.increaseFontSize;
fontIncreaseBtn.setAttribute("aria-label", strings.increaseFontSize);
// Parse default font size from i18n
try {
	let defaultSize = parseInt(loc("WebClipper.FontSize.Preview.SansSerifDefault", "16px"), 10);
	if (defaultSize > 0) { articleFontSize = defaultSize; }
} catch (e) { /* keep default 16 */ }

// Document title is set unconditionally; the page title and source URL arrive
// in the loadContent port message and are populated there (no session-storage
// round trip needed).
document.title = strings.clipperTitle;

// --- Section picker (custom dropdown with scrollable list) ---
function selectSection(id: string, label: string) {
	logClickEvent("sectionComponent");
	selectedSectionId = id;
	sectionSelected.textContent = label;
	sectionSelected.title = label;
	// Persist selection
	if (id) {
		let curSection = { path: label, section: { id: id, name: label } };
		try { localStorage.setItem("curSection", JSON.stringify(curSection)); } catch (e) { /* ignore */ }
	}
	closeSectionPicker();
	// Clear success banner so user can re-clip to the new section
	// (but don't touch button state — that's managed by capture/save flow)
	let banner = document.getElementById("success-banner");
	if (banner) { banner.style.display = "none"; }
	let errBanner = document.getElementById("error-banner");
	if (errBanner) { errBanner.style.display = "none"; }
	saveDone = false;
}

function toggleSectionPicker() {
	if (sectionPickerOpen) {
		closeSectionPicker();
	} else {
		openSectionPicker();
	}
}

// position:fixed dropdown so it doesn't expand #sidebar-body's scrollHeight.
// Compute top/left/width from #section-selected's bounding rect each time the
// dropdown opens (rect changes on resize/scroll). Dynamically shrink max-height
// so the dropdown always fits between the trigger and the viewport bottom.
function positionSectionDropdown() {
	let rect = sectionSelected.getBoundingClientRect();
	let viewportHeight = window.innerHeight;
	let availableBelow = viewportHeight - rect.bottom - 8; // 8px viewport bottom margin
	let dropdownHeight = Math.max(120, Math.min(240, availableBelow));
	sectionListContainer.style.top = (rect.bottom + 2) + "px";
	sectionListContainer.style.left = rect.left + "px";
	sectionListContainer.style.width = rect.width + "px";
	sectionListContainer.style.maxHeight = dropdownHeight + "px";
}

function openSectionPicker() {
	positionSectionDropdown();
	sectionListContainer.style.display = "block";
	sectionPickerOpen = true;
	sectionSelected.setAttribute("aria-expanded", "true");
	// Scroll selected item into view and focus it
	let sel = sectionList.querySelector(".section-item-selected") as HTMLElement;
	if (sel) { sel.scrollIntoView({ block: "nearest" }); sel.focus(); }
}

function closeSectionPicker() {
	sectionListContainer.style.display = "none";
	sectionPickerOpen = false;
	sectionSelected.setAttribute("aria-expanded", "false");
}

// Reposition or close on viewport changes so the fixed dropdown doesn't drift.
window.addEventListener("resize", () => {
	if (sectionPickerOpen) { positionSectionDropdown(); }
});
// Close on sidebar scroll — the trigger moves but the fixed dropdown wouldn't,
// leaving them visually disconnected. Simpler to close than to reposition.
let sidebarBodyEl = document.getElementById("sidebar-body") as HTMLDivElement;
if (sidebarBodyEl) {
	sidebarBodyEl.addEventListener("scroll", () => {
		if (sectionPickerOpen) { closeSectionPicker(); }
	});
}

sectionSelected.addEventListener("click", () => {
	logClickEvent("sectionPickerLocationContainer");
	toggleSectionPicker();
});
sectionSelected.addEventListener("keydown", (e) => {
	if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggleSectionPicker(); } else if (e.key === "Escape" && sectionPickerOpen) { e.preventDefault(); closeSectionPicker(); } else if ((e.key === "ArrowDown" || e.key === "ArrowUp") && !sectionPickerOpen) { e.preventDefault(); openSectionPicker(); }
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
			sectionSelected.textContent = loc("WebClipper.SectionPicker.NoNotebooksFound", "No notebooks available");
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
		sectionSelected.textContent = loc("WebClipper.SectionPicker.NotebookLoadFailureMessage", "Error loading notebooks");
		selectedSectionId = "";
	}
}

function flattenSections(notebooks: any[], preselectedId: string) {
	for (let nb of notebooks) {
		addNotebookHeading(nb.name);
		if (nb.sections) {
			for (let sec of nb.sections) {
				addSectionItem(sec.id, sec.name, nb.name + " > " + sec.name, preselectedId, 1);
			}
		}
		if (nb.sectionGroups) {
			flattenSectionGroups(nb.sectionGroups, nb.name, preselectedId, 1);
		}
	}
}

function flattenSectionGroups(groups: any[], parentPath: string, preselectedId: string, depth: number) {
	for (let group of groups) {
		let path = parentPath + " > " + group.name;
		addGroupHeading(group.name, depth);
		if (group.sections) {
			for (let sec of group.sections) {
				addSectionItem(sec.id, sec.name, path + " > " + sec.name, preselectedId, depth + 1);
			}
		}
		if (group.sectionGroups) {
			flattenSectionGroups(group.sectionGroups, path, preselectedId, depth + 1);
		}
	}
}

// Walk to the next/previous visible row in the section list.
// Used by arrow-key handlers on both headings and items.
function focusAdjacentSectionRow(from: HTMLElement, dir: 1 | -1) {
	let cur = (dir === 1 ? from.nextElementSibling : from.previousElementSibling) as HTMLElement;
	while (cur) {
		if (cur.classList.contains("section-heading") || cur.classList.contains("section-item")) {
			if (cur.offsetParent) { cur.focus(); return; } // skip collapsed (display:none → offsetParent is undefined)
		}
		cur = (dir === 1 ? cur.nextElementSibling : cur.previousElementSibling) as HTMLElement;
	}
}

function makeCollapsibleHeading(li: HTMLLIElement, depth: number) {
	li.setAttribute("data-depth", "" + depth);
	// Reachable via arrow-key nav within the listbox; tab order is the dropdown trigger
	li.setAttribute("tabindex", "-1");
	li.setAttribute("role", "button");
	let arrow = document.createElement("img");
	arrow.className = "collapse-arrow";
	arrow.src = "images/arrow_down.png";
	arrow.alt = "";
	// Disclosure chevron sits at the leading edge of the heading (before icon
	// and label), matching standard tree-control convention. Direction-aware
	// flex layout puts it on the left in LTR and on the right in RTL.
	li.insertBefore(arrow, li.firstChild);
	li.setAttribute("aria-expanded", "true");
	let toggle = () => {
		let collapsed = li.classList.toggle("collapsed");
		li.setAttribute("aria-expanded", collapsed ? "false" : "true");
		arrow.src = collapsed ? "images/arrow_right.png" : "images/arrow_down.png";
		// Toggle visibility of sibling items until next heading at same or shallower depth
		let next = li.nextElementSibling as HTMLElement;
		while (next) {
			if (next.classList.contains("section-heading")) {
				let nextDepth = parseInt(next.getAttribute("data-depth") || "0", 10);
				if (nextDepth <= depth) { break; } // same or higher level — stop
			}
			next.style.display = collapsed ? "none" : "";
			next = next.nextElementSibling as HTMLElement;
		}
	};
	li.addEventListener("click", toggle);
	li.addEventListener("keydown", (e) => {
		if (e.key === "Enter" || e.key === " ") {
			e.preventDefault(); toggle();
		} else if (e.key === "ArrowDown") {
			e.preventDefault(); focusAdjacentSectionRow(li, 1);
		} else if (e.key === "ArrowUp") {
			e.preventDefault(); focusAdjacentSectionRow(li, -1);
		} else if (e.key === "Escape") {
			e.preventDefault(); closeSectionPicker(); sectionSelected.focus();
		}
	});
}

// Tree indent — depth 0 sits at the row's base padding; each deeper level
// shifts content over by one full "chevron + gap + icon + gap" stride so a
// child's icon column lines up with its parent's label column (matches the
// legacy onenotepicker hierarchy).
const ROW_INDENT_BASE = 12;
const ROW_INDENT_STEP = 36; // 10 chevron + 6 gap + 14 icon + 6 gap
function setRowIndent(li: HTMLElement, depth: number) {
	li.style.setProperty("padding-inline-start", (ROW_INDENT_BASE + depth * ROW_INDENT_STEP) + "px");
}

function addNotebookHeading(name: string) {
	let li = document.createElement("li");
	li.className = "section-heading notebook-heading";
	setRowIndent(li, 0);
	let img = document.createElement("img");
	img.src = "images/notebook.png";
	img.alt = "";
	li.appendChild(img);
	let span = document.createElement("span");
	span.textContent = name;
	li.appendChild(span);
	makeCollapsibleHeading(li, 0);
	sectionList.appendChild(li);
}

function addGroupHeading(name: string, depth: number) {
	let li = document.createElement("li");
	li.className = "section-heading group-heading";
	setRowIndent(li, depth);
	let img = document.createElement("img");
	img.src = "images/section_group.png";
	img.alt = "";
	li.appendChild(img);
	let span = document.createElement("span");
	span.textContent = name;
	li.appendChild(span);
	makeCollapsibleHeading(li, depth);
	sectionList.appendChild(li);
}

function addSectionItem(id: string, displayName: string, fullPath: string, preselectedId: string, depth: number) {
	let li = document.createElement("li");
	li.className = "section-item";
	li.setAttribute("data-id", id);
	li.setAttribute("role", "option");
	li.setAttribute("tabindex", "-1");
	setRowIndent(li, depth);
	let img = document.createElement("img");
	img.src = "images/section.png";
	img.alt = "";
	li.appendChild(img);
	let span = document.createElement("span");
	span.textContent = displayName;
	li.appendChild(span);
	li.title = fullPath;
	if (id === preselectedId) {
		li.classList.add("section-item-selected");
		li.setAttribute("aria-selected", "true");
		selectedSectionId = id;
		sectionSelected.textContent = fullPath;
		sectionSelected.title = fullPath;
	} else {
		li.setAttribute("aria-selected", "false");
	}
	li.addEventListener("click", () => {
		let prev = sectionList.querySelector(".section-item-selected");
		if (prev) { prev.classList.remove("section-item-selected"); prev.setAttribute("aria-selected", "false"); }
		li.classList.add("section-item-selected");
		li.setAttribute("aria-selected", "true");
		selectSection(id, fullPath);
	});
	// Keyboard navigation — arrow keys walk all rows (headings + items),
	// skipping collapsed ones. Headings are activated via Enter/Space (toggle).
	li.addEventListener("keydown", (e) => {
		if (e.key === "ArrowDown") {
			e.preventDefault(); focusAdjacentSectionRow(li, 1);
		} else if (e.key === "ArrowUp") {
			e.preventDefault(); focusAdjacentSectionRow(li, -1);
		} else if (e.key === "Enter" || e.key === " ") {
			e.preventDefault(); li.click();
		} else if (e.key === "Escape") {
			e.preventDefault(); closeSectionPicker(); sectionSelected.focus();
		}
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
	// Clear user context before new session — prevents next sign-in events from carrying old user's identity
	setTelemetryContext(Context.Custom.AuthType, "None");
	setTelemetryContext(Context.Custom.UserInfoId, "");
	logSessionStart();
	safeSend({ action: "signOut", authType: userAuthType });
});

// --- Feedback link ---
feedbackLink.addEventListener("click", (e) => {
	e.preventDefault();
	safeSend({ action: "openFeedback", pageUrl: sourceUrlText.textContent || "" });
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
signinMsaBtn.textContent = loc("WebClipper.Action.SigninMsa", "Sign in with a Microsoft account");
signinOrgIdBtn.textContent = loc("WebClipper.Action.SigninOrgId", "Sign in with a work or school account");

function showSignInPanel() {
	signinOverlay.style.display = "flex";
	// Focus first sign-in button for keyboard/screen reader users
	setTimeout(function() { signinMsaBtn.focus(); }, 100);
}

function hideSignInPanel() {
	signinOverlay.style.display = "none";
	// Move focus to first mode button
	let firstModeBtn = document.querySelector(".mode-btn") as HTMLElement;
	if (firstModeBtn) { setTimeout(function() { firstModeBtn.focus(); }, 100); }
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
setTelemetryContext(Context.Custom.ContentType, "FullPage");
if (!isSignedIn) {
	showSignInPanel();
} else {
	logFunnel(Funnel.Label.AuthAlreadySignedIn);
	// Set context properties from cached user info (sign-in already happened in a prior session)
	if (userAuthType) { setTelemetryContext(Context.Custom.AuthType, userAuthType); }
	try {
		let uiRaw = localStorage.getItem("userInformation");
		if (uiRaw) {
			let ui = JSON.parse(uiRaw);
			if (ui && ui.data && ui.data.cid) { setTelemetryContext(Context.Custom.UserInfoId, ui.data.cid); }
		}
	} catch (e) { /* ignore */ }
}

// Sign-in button handlers
signinMsaBtn.addEventListener("click", () => {
	signingIn = true;
	setTelemetryContext(Context.Custom.AuthType, "Msa");
	logFunnel(Funnel.Label.AuthAttempted);
	pendingSignInEvent = new Event.PromiseEvent(Event.Label.HandleSignInEvent);
	showSignInProgress();
	safeSend({ action: "signIn", authType: "Msa" });
});
signinOrgIdBtn.addEventListener("click", () => {
	signingIn = true;
	setTelemetryContext(Context.Custom.AuthType, "OrgId");
	logFunnel(Funnel.Label.AuthAttempted);
	pendingSignInEvent = new Event.PromiseEvent(Event.Label.HandleSignInEvent);
	showSignInProgress();
	safeSend({ action: "signIn", authType: "OrgId" });
});

// --- Auto-fetch fresh notebooks (runs in background during capture) ---
async function fetchFreshNotebooks() {
	let getNotebooksEvent = new Event.PromiseEvent(Event.Label.GetNotebooks);
	try {
		let userInfoRaw = localStorage.getItem("userInformation");
		if (!userInfoRaw) { return; }
		let userInfo = JSON.parse(userInfoRaw);
		let accessToken = userInfo && userInfo.data ? userInfo.data.accessToken : "";
		if (!accessToken) { return; }
		// Don't skip on token expiry — try the fetch anyway. The API will return 401 if
		// truly expired, and we silently keep cached data. Skipping here caused stale
		// notebook lists (newly created sections wouldn't appear).

		let apiUrl = "https://www.onenote.com/api/v1.0/me/notes/notebooks"
			+ "?$expand=sections,sectionGroups($expand=sections,sectionGroups($expand=sections,sectionGroups($expand=sections,sectionGroups)))";
		let response = await fetch(apiUrl, {
			headers: { "Authorization": "Bearer " + accessToken }
		});
		if (!response.ok) {
			getNotebooksEvent.setStatus(Status.Failed);
			getNotebooksEvent.setFailureInfo({ error: "HTTP " + response.status });
			logTelemetryEvent(getNotebooksEvent);
			return;
		}

		let data = await response.json();
		let freshNotebooks = data.value || [];

		// Compare with cached — only update if different
		let cachedJson = localStorage.getItem("notebooks") || "";
		let freshJson = JSON.stringify(freshNotebooks);
		if (freshJson === cachedJson) {
			getNotebooksEvent.setStatus(Status.Succeeded);
			getNotebooksEvent.setCustomProperty(PropertyName.Custom.CurrentSectionStillExists, true);
			logTelemetryEvent(getNotebooksEvent);
			return;
		}

		// Store fresh notebooks and repopulate dropdown
		localStorage.setItem("notebooks", freshJson);
		let previousSectionId = selectedSectionId;
		sectionList.innerHTML = "";
		selectedSectionId = "";
		flattenSections(freshNotebooks, previousSectionId);

		// If previously selected section no longer exists, select the first one
		let sectionStillExists = !!selectedSectionId;
		if (!selectedSectionId) {
			let first = sectionList.querySelector("li") as HTMLElement;
			if (first) {
				selectSection(first.getAttribute("data-id") || "", first.textContent || "");
			}
		}
		getNotebooksEvent.setStatus(Status.Succeeded);
		getNotebooksEvent.setCustomProperty(PropertyName.Custom.CurrentSectionStillExists, sectionStillExists);
		logTelemetryEvent(getNotebooksEvent);
	} catch (e) {
		// Silently keep cached data
		getNotebooksEvent.setStatus(Status.Failed);
		getNotebooksEvent.setFailureInfo({ error: (e as any).message || String(e) });
		logTelemetryEvent(getNotebooksEvent);
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
disableSignout();
// Show initial capture progress (bar hidden until first drawCapture with viewport counts)
capturePanel.style.display = "flex";
statusText.textContent = strings.capturing;
announceToScreenReader(strings.capturing);
(document.getElementById("progress-bar-track") as HTMLElement).style.display = "none";
// During capture, Cancel is the only actionable control — focus it
if (isSignedIn) { setTimeout(function() { cancelBtn.focus(); }, 100); }

// Section selection persistence is handled by selectSection() in the custom dropdown

// --- Accessible signout disable/enable ---
function disableSignout() {
	signoutLink.style.pointerEvents = "none";
	signoutLink.style.opacity = "0.4";
	signoutLink.setAttribute("aria-disabled", "true");
	signoutLink.setAttribute("tabindex", "-1");
}
function enableSignout() {
	signoutLink.style.pointerEvents = "";
	signoutLink.style.opacity = "";
	signoutLink.removeAttribute("aria-disabled");
	signoutLink.removeAttribute("tabindex");
}

// --- UI lock during clip/save ---

function lockSidebar() {
	// Disable all interactive elements during save round-trip
	document.querySelectorAll(".mode-btn").forEach((b) => { (b as HTMLButtonElement).disabled = true; });
	titleField.disabled = true;
	noteField.disabled = true;
	sectionPicker.classList.add("disabled");
	cancelBtn.disabled = true;
	disableSignout();
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
	enableSignout();
}

// --- Mode switching ---

function resetSaveState() {
	saveDone = false;
	saveBtn.onclick = undefined;
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
	// Hide success / error banners
	let successBanner = document.getElementById("success-banner");
	if (successBanner) { successBanner.style.display = "none"; }
	let errBanner = document.getElementById("error-banner");
	if (errBanner) { errBanner.style.display = "none"; }
}

// Save article working state (highlights, edits) before switching away
function saveArticleWorkingState() {
	if (currentMode === "article") {
		let pDoc = previewFrame.contentDocument;
		if (pDoc && pDoc.body) { articleWorkingHtml = pDoc.body.innerHTML; }
	}
}

function switchToFullPage() {
	saveArticleWorkingState();
	resetSaveState();
	currentMode = "fullpage";
	previewFrameWrap.style.display = "none";
	articleHeader.style.display = "none";
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
	// Show preview frame and article header
	previewFrameWrap.style.display = "flex";
	articleHeader.style.display = "flex";

	if (!articleLoaded) {
		loadArticleContent();
	} else {
		// Re-render — use working HTML (preserves highlights) or clean cached HTML
		renderArticleHtml(articleWorkingHtml || cachedArticleHtml);
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
		loadingDoc.write("<!DOCTYPE html><html><head><style>body{font-family:Segoe UI,sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;color:#666;}</style></head><body><div>" + escapeHtml(loc("WebClipper.Preview.LoadingMessage", "Loading article...")) + "</div></body></html>");
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
	// For known oEmbed providers (YouTube, Vimeo, Slideshare, etc.), prefer the
	// provider's structured embed payload over Readability's text extraction --
	// Readability strips iframes, so video pages would otherwise lose the player.
	// Falls back to Readability on no-match or fetch failure.
	let pageUrl = sourceUrlText.textContent || "";
	tryOEmbed(pageUrl).then(function(data) {
		if (data) {
			cachedOEmbedData = data;
			// Description from page DOM -- oEmbed responses typically don't include
			// the long description (YouTube's e.g. carries only title/author). Same
			// og:description / description / twitter:description fallback chain
			// bookmark mode uses.
			let iframeDoc = iframe.contentDocument;
			let description = "";
			if (iframeDoc) {
				description = getMetaContent(iframeDoc, "og:description", "property")
					|| getMetaContent(iframeDoc, "description", "name")
					|| getMetaContent(iframeDoc, "twitter:description", "name")
					|| "";
			}
			cachedOEmbedDescription = description;
			cachedArticleHtml = composeOEmbedForPreview(data, description);
			cachedPageMetadata = buildPageMetadataForOEmbed(data, description);
			renderArticleHtml(cachedArticleHtml);
			articleLoaded = true;
			if (currentMode === "article") {
				saveBtn.disabled = false;
				saveBtn.textContent = strings.saveToOneNote;
			}
			return;
		}
		extractArticleViaReadability();
	});
}

// Preview rendering for oEmbed responses: a static thumbnail with title /
// author / provider attribution and the page description. We avoid
// rendering the provider's iframe here because the sandboxed preview-frame
// blocks the embedded player's JS, which would surface a broken "Unable
// to execute JavaScript" UI. The iframe still flows through to save --
// OneNote isn't sandboxed.
function composeOEmbedForPreview(data: OEmbedData, pageDescription: string): string {
	let html = "<div style=\"margin-bottom:16px;\">";
	if (data.thumbnail_url) {
		// For video/rich types the save path emits a 600x338 (16:9) iframe;
		// lock the preview thumbnail to the same frame so the visual size
		// matches what the user will see on the saved OneNote page. For
		// photo type the photo itself is the content, so use natural aspect.
		let isFramed = data.type === "video" || data.type === "rich";
		let containerStyle = isFramed
			? "position:relative; display:block; width:100%; max-width:600px; aspect-ratio:600/338; background:#000;"
			: "position:relative; display:inline-block; max-width:100%;";
		let imgStyle = isFramed
			? "display:block; width:100%; height:100%; object-fit:cover;"
			: "display:block; max-width:600px; width:100%; height:auto;";
		html += "<div style=\"" + containerStyle + "\">";
		html += "<img src=\"" + escapeAttr(data.thumbnail_url) + "\""
			+ " style=\"" + imgStyle + "\""
			+ " alt=\"" + escapeAttr(data.title || "") + "\" />";
		if (data.type === "video") {
			// Play-glyph overlay -- pure CSS, no text, so no i18n surface
			html += "<div style=\""
				+ "position:absolute; top:50%; left:50%; transform:translate(-50%,-50%);"
				+ "width:72px; height:72px; border-radius:50%;"
				+ "background:rgba(0,0,0,0.65); pointer-events:none;"
				+ "display:flex; align-items:center; justify-content:center;"
				+ "color:white; font-size:32px; line-height:1; padding-left:6px;"
				+ "\">&#9654;</div>";
		}
		html += "</div>";
	}
	if (data.title) {
		html += "<h3 style=\"margin:12px 0 4px;\">" + escapeHtml(data.title) + "</h3>";
	}
	let metaLine: string[] = [];
	if (data.author_name) { metaLine.push(escapeHtml(data.author_name)); }
	if (data.provider_name) { metaLine.push(escapeHtml(data.provider_name)); }
	if (metaLine.length) {
		html += "<div style=\"color:#666; font-size:14px;\">" + metaLine.join(" · ") + "</div>";
	}
	if (pageDescription) {
		html += "<div style=\"margin-top:12px; color:#333; font-size:14px; line-height:1.5;\">"
			+ escapeHtml(pageDescription) + "</div>";
	}
	html += "</div>";
	return html;
}

// Save-side composition: emit the actual provider iframe (sanitized) so
// OneNote's page renderer recognizes and embeds the video player. Title,
// author and description render below the iframe as a simple caption.
// Adds `data-original-src` to every iframe (the marker OneNote's renderer
// uses to recognize video embeds, matching V1's YouTubeVideoExtractor
// behavior) and normalizes iframe dimensions to V1's 600x338 for visual
// parity with the legacy clipper output.
function composeOEmbedForSave(data: OEmbedData, pageDescription: string): string {
	let body = "";
	if (data.type === "photo" && data.url) {
		body = "<img src=\"" + escapeAttr(data.url) + "\""
			+ (data.width ? " width=\"" + data.width + "\"" : "")
			+ (data.height ? " height=\"" + data.height + "\"" : "")
			+ " data-original-src=\"" + escapeAttr(data.pageUrl) + "\" />";
	} else if (data.html) {
		body = normalizeProviderIframe(sanitizeProviderHtml(data.html), data.pageUrl);
	} else {
		return "";
	}
	let caption = "";
	if (data.title) { caption += "<h3>" + escapeHtml(data.title) + "</h3>"; }
	if (data.author_name) { caption += "<div>" + escapeHtml(data.author_name) + "</div>"; }
	if (pageDescription) { caption += "<div>" + escapeHtml(pageDescription) + "</div>"; }
	return "<div style=\"margin-bottom: 16px\">"
		+ body
		+ (caption ? "<br>" + caption : "")
		+ "</div>";
}

function normalizeProviderIframe(html: string, pageUrl: string): string {
	let parsed = new DOMParser().parseFromString(html, "text/html");
	let iframes = parsed.getElementsByTagName("iframe");
	for (let i = 0; i < iframes.length; i++) {
		// data-original-src is the marker OneNote's renderer looks for to
		// recognize and render a video embed on the saved page.
		iframes[i].setAttribute("data-original-src", pageUrl);
		// Match V1 dimensions for consistent presentation in OneNote.
		iframes[i].setAttribute("width", "600");
		iframes[i].setAttribute("height", "338");
	}
	return parsed.body ? parsed.body.innerHTML : html;
}

// PageMetadata for oEmbed-extracted pages -- mirrors V1 server-side
// `PageMetadata.AutoPageTags*` plus oEmbed-sourced descriptive fields.
// Worker iterates the map and emits one <meta> per entry (V1 OneNotePage
// behavior).
function buildPageMetadataForOEmbed(data: OEmbedData, pageDescription: string): { [key: string]: string } {
	let meta: { [key: string]: string } = {
		AutoPageTagsCodes: "Article",
		AutoPageTags: "Article"
	};
	if (data.title) { meta.title = data.title; }
	if (data.author_name) { meta.author = data.author_name; }
	if (data.provider_name) { meta.siteName = data.provider_name; }
	if (pageDescription) { meta.description = pageDescription; }
	return meta;
}

// PageMetadata for Readability-extracted articles -- matches V1
// augmentationHelper's local metadata population (title/excerpt/byline/
// siteName/publishedTime) plus the AutoPageTags markers.
function buildPageMetadataForReadability(article: any): { [key: string]: string } {
	let meta: { [key: string]: string } = {
		AutoPageTagsCodes: "Article",
		AutoPageTags: "Article"
	};
	if (article.title) { meta.title = article.title; }
	if (article.excerpt) { meta.description = article.excerpt; }
	if (article.byline) { meta.author = article.byline; }
	if (article.siteName) { meta.siteName = article.siteName; }
	if (article.publishedTime) { meta.publishedTime = article.publishedTime; }
	return meta;
}

function extractArticleViaReadability() {
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
			cachedOEmbedData = null;
			cachedPageMetadata = buildPageMetadataForReadability(article);
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
		errDoc.write("<!DOCTYPE html><html><head><style>body{font-family:Segoe UI,sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;color:#999;}</style></head><body><div>" + escapeHtml(loc("WebClipper.Preview.NoContentFound", "Article content not available for this page.")) + "</div></body></html>");
		errDoc.close();
	}
}

// Clean Readability output to match ONML (OneNote Markup Language) constraints,
// mirroring the old toOnml() pipeline: strip styles/classes, event handlers, and
// unsupported elements. Applied once at extraction time so both preview and save
// use the same cleaned HTML.
function cleanArticleHtml(html: string): string {
	let tempDoc = new DOMParser().parseFromString(html, "text/html");
	// Remove elements not supported in ONML
	let unsupported = tempDoc.querySelectorAll("applet, audio, button, canvas, embed, hr, input, link, map, menu, menuitem, meter, noscript, progress, script, source, style, svg, video");
	for (let i = unsupported.length - 1; i >= 0; i--) {
		if (unsupported[i].parentNode) { unsupported[i].parentNode.removeChild(unsupported[i]); }
	}
	// Strip all style and class attributes (page layout styles leak into preview/OneNote)
	let allEls = tempDoc.querySelectorAll("*");
	for (let j = 0; j < allEls.length; j++) {
		(allEls[j] as HTMLElement).removeAttribute("style");
		(allEls[j] as HTMLElement).removeAttribute("class");
	}
	return tempDoc.body ? tempDoc.body.innerHTML : html;
}

function renderArticleHtml(html: string) {
	let pDoc = previewFrame.contentDocument;
	if (!pDoc) { return; }
	// Wrap article HTML in a styled document matching OneNote page layout:
	// 624px content width + 20px left/right padding = 664px total (from @OneNotePageWidth)
	let fontFamily = articleSerif ? strings.fontFamilySerif : strings.fontFamilySansSerif;
	let fontSize = articleFontSize + "px";
	let articleCss = "body { font-family: " + fontFamily + ", 'Segoe UI', sans-serif; font-size: " + fontSize + "; line-height: 1.6; "
		+ "max-width: 624px; margin: 24px 0; padding: 0 20px; color: #1a1a1a; margin-bottom: 16px; }"
		+ "img { max-width: 100%; height: auto; }"
		// pointer-events:none + cursor:default prevent click navigation in the
		// preview iframe (matches bookmark mode). Without this, clicking a link
		// in the rendered article navigates the iframe away from the captured
		// content, breaking save/highlight flows. Text selection still works
		// because the selection range covers the link without the link itself
		// receiving the mouse event.
		+ "a { color: #2e75b5; text-decoration: underline; pointer-events: none; cursor: default; }"
		+ "::-webkit-scrollbar{width:6px} ::-webkit-scrollbar-thumb{background:rgba(0,0,0,0.2);border-radius:3px} ::-webkit-scrollbar-track{background:transparent}"
		+ "h2 { font-size: 18px; color: rgb(46,117,181); }"
		+ "h3, h4, h5, h6 { color: rgb(91,155,213); margin-top: 14pt; margin-bottom: 14pt; }"
		+ "figure { margin-inline-start: 0; }"
		+ "pre, code { background: #f5f5f5; padding: 2px 6px; border-radius: 3px; font-size: 14px; }"
		// Wrap long lines instead of horizontal scroll — OneNote doesn't preserve
		// scrollbars in saved pages, so showing one in preview is misleading.
		// !important + overflow-wrap:anywhere defeat inline styles from Readability
		// output and unbreakable tokens (long URLs, paths) in code samples.
		+ "pre, pre code { white-space: pre-wrap !important; overflow-wrap: anywhere !important; word-break: break-word !important; overflow-x: hidden !important; }"
		+ "pre { padding: 12px; }"
		+ "blockquote { border-inline-start: 3px solid rgb(46,117,181); margin-inline-start: 0; padding-inline-start: 16px; color: #555; }"
		+ "table { border-collapse: collapse; width: 100%; }"
		+ "td, th { border: 1px solid #ddd; padding: 8px; }"
		+ ".highlighted { background: #fefe56; }"
		+ ".highlight-anchor { position: relative; display: inline-block; }"
		+ ".delete-highlight { position: absolute; top: -8px; inset-inline-start: -8px; z-index: 10; "
		+ "width: 18px; height: 18px; border-radius: 50%; background: #e74c3c; color: #fff; "
		+ "font-size: 12px; line-height: 18px; text-align: center; cursor: pointer; }"
		+ ".delete-highlight:hover { background: #c0392b; }";

	let fullHtml = "<!DOCTYPE html><html><head><style>" + articleCss + "</style></head><body>"
		+ html
		+ "</body></html>";
	pDoc.open();
	pDoc.write(fullHtml);
	pDoc.close();
	// Re-initialize highlighter if enabled, including custom cursor
	if (highlighterEnabled) {
		initHighlighter();
		if (pDoc && pDoc.body) {
			let curUrl = chrome.runtime.getURL("images/editoroptions/highlight_cursor.cur");
			pDoc.body.style.cursor = "url('" + curUrl + "') 16 16, text";
		}
	}
}

// --- Article header controls ---

function applyArticleFont() {
	let pDoc = previewFrame.contentDocument;
	if (!pDoc || !pDoc.body) { return; }
	let fontFamily = articleSerif ? strings.fontFamilySerif : strings.fontFamilySansSerif;
	pDoc.body.style.fontFamily = fontFamily + ", 'Segoe UI', sans-serif";
}

function applyArticleFontSize() {
	let pDoc = previewFrame.contentDocument;
	if (!pDoc || !pDoc.body) { return; }
	pDoc.body.style.fontSize = articleFontSize + "px";
}

function initHighlighter() {
	// TextHighlighter loads as a regular parent-window script (renderer.html),
	// not injected into preview-frame -- the iframe is sandboxed with
	// allow-same-origin only (no allow-scripts), so script execution inside
	// it is blocked. Same-origin permits the parent's TextHighlighter to
	// operate directly on the iframe's body/selection/events, which is
	// how pdf.js also runs in this codebase (parent context, manipulating
	// child DOM). The library is constructed against `pDoc.body` and uses
	// `el.ownerDocument.defaultView` internally for selection-completion
	// event binding (small patch applied to the vendored textHighlighter.js
	// to route those bindings through the el-relative window helper instead
	// of bare `window`).
	createHighlighterInstance();
}

function createHighlighterInstance() {
	let pDoc = previewFrame.contentDocument;
	let highlighterCtor = (window as any).TextHighlighter;
	if (!highlighterCtor || !pDoc || !pDoc.body) { return; }
	textHighlighterInstance = new highlighterCtor(pDoc.body, {
		color: "#fefe56",
		highlightedClass: "highlighted",
		enabled: true,
		onAfterHighlight: function(_range: any, highlights: HTMLElement[]) {
			// Add delete button to first span of each new highlight group
			if (highlights && highlights.length > 0) {
				addHighlightDeleteButton(highlights[0], pDoc);
			}
		}
	});
	// Listen for clicks on delete buttons
	pDoc.body.addEventListener("click", function(e: MouseEvent) {
		let target = e.target as HTMLElement;
		if (target && target.classList && target.classList.contains("delete-highlight")) {
			e.stopPropagation();
			let ts = target.getAttribute("data-timestamp");
			// Remove the delete button itself first
			if (target.parentNode) { target.parentNode.removeChild(target); }
			// Unwrap all highlight spans with this timestamp
			if (ts && pDoc) {
				let spans = pDoc.querySelectorAll(".highlighted[data-timestamp=\"" + ts + "\"]");
				for (let i = spans.length - 1; i >= 0; i--) {
					let span = spans[i] as HTMLElement;
					let parent = span.parentNode;
					while (span.firstChild) {
						if (parent) { parent.insertBefore(span.firstChild, span); }
					}
					if (parent) { parent.removeChild(span); }
				}
			}
		}
	});
}

function addHighlightDeleteButton(firstSpan: HTMLElement, doc: Document) {
	if (!firstSpan || !doc) { return; }
	let ts = firstSpan.getAttribute("data-timestamp");
	if (!ts) { return; }
	// Don't add if already exists
	if (doc.querySelector(".delete-highlight[data-timestamp=\"" + ts + "\"]")) { return; }
	// Make the first span a positioning anchor for the absolute delete button
	firstSpan.classList.add("highlight-anchor");
	let btn = doc.createElement("span");
	btn.className = "delete-highlight";
	btn.setAttribute("data-timestamp", ts);
	btn.setAttribute("role", "button");
	btn.setAttribute("aria-label", loc("WebClipper.Preview.RemoveSelectedRegion", "Remove"));
	btn.title = loc("WebClipper.Preview.RemoveSelectedRegion", "Remove");
	btn.textContent = "\u00D7";
	firstSpan.appendChild(btn);
}

function destroyHighlighter() {
	if (textHighlighterInstance) {
		textHighlighterInstance.disable();
		textHighlighterInstance = undefined;
	}
}

// Font family toggle
sansSerifBtn.addEventListener("click", () => {
	if (!articleSerif) { return; }
	articleSerif = false;
	sansSerifBtn.classList.add("active");
	sansSerifBtn.setAttribute("aria-pressed", "true");
	serifBtn.classList.remove("active");
	serifBtn.setAttribute("aria-pressed", "false");
	applyArticleFont();
	announceToScreenReader(strings.changeFontSansSerif);
});
serifBtn.addEventListener("click", () => {
	if (articleSerif) { return; }
	articleSerif = true;
	serifBtn.classList.add("active");
	serifBtn.setAttribute("aria-pressed", "true");
	sansSerifBtn.classList.remove("active");
	sansSerifBtn.setAttribute("aria-pressed", "false");
	applyArticleFont();
	announceToScreenReader(strings.changeFontSerif);
});

// Font size +/-
fontDecreaseBtn.addEventListener("click", () => {
	if (articleFontSize <= 8) { return; }
	articleFontSize -= 2;
	applyArticleFontSize();
	announceToScreenReader(strings.decreaseFontSize);
});
fontIncreaseBtn.addEventListener("click", () => {
	if (articleFontSize >= 72) { return; }
	articleFontSize += 2;
	applyArticleFontSize();
	announceToScreenReader(strings.increaseFontSize);
});

// Highlighter toggle
highlightBtn.addEventListener("click", () => {
	highlighterEnabled = !highlighterEnabled;
	let imgEl = highlightBtn.querySelector("img") as HTMLImageElement;
	let pDoc = previewFrame.contentDocument;
	if (highlighterEnabled) {
		highlightBtn.classList.add("active");
		highlightBtn.setAttribute("aria-pressed", "true");
		if (imgEl) { imgEl.src = "images/editoroptions/highlight_tool_on.svg"; }
		initHighlighter();
		if (pDoc && pDoc.body) {
			let curUrl = chrome.runtime.getURL("images/editoroptions/highlight_cursor.cur");
			pDoc.body.style.cursor = "url('" + curUrl + "') 16 16, text";
		}
	} else {
		highlightBtn.classList.remove("active");
		highlightBtn.setAttribute("aria-pressed", "false");
		if (imgEl) { imgEl.src = "images/editoroptions/highlight_tool_off.svg"; }
		destroyHighlighter();
		if (pDoc && pDoc.body) { pDoc.body.style.cursor = ""; }
	}
	announceToScreenReader(strings.toggleHighlighter);
});

// --- Bookmark mode ---

function switchToBookmark() {
	saveArticleWorkingState();
	resetSaveState();
	currentMode = "bookmark";
	iframe.style.display = "none";
	previewContainer.style.display = "none";
	capturePanel.style.display = "none";
	previewFrameWrap.style.display = "flex";
	articleHeader.style.display = "none";
	if (pdfOptionsPanel) { pdfOptionsPanel.style.display = "none"; }

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
	let pageUrl = sourceUrlText.textContent || "";

	// Description: og:description → meta description → twitter:description → keywords → article:tag → page text
	// (matches legacy BookmarkHelper fallback chain)
	let description = getMetaContent(iframeDoc, "og:description", "property")
		|| getMetaContent(iframeDoc, "description", "name")
		|| getMetaContent(iframeDoc, "twitter:description", "name")
		|| getMetaContent(iframeDoc, "keywords", "name")
		|| getMetaContent(iframeDoc, "article:tag", "property")
		|| "";
	// Last resort: grab visible text from the page body (matches legacy getTextOnPage)
	if (!description && iframeDoc.body) {
		let walker = iframeDoc.createTreeWalker(iframeDoc.body, NodeFilter.SHOW_TEXT, null);
		let words: string[] = [];
		let node: Node | null;
		while ((node = walker.nextNode()) && words.length < 50) {
			let text = (node.textContent || "").trim();
			if (text) {
				let nodeWords = text.split(/\s+/);
				for (let i = 0; i < nodeWords.length && words.length < 50; i++) {
					words.push(nodeWords[i]);
				}
			}
		}
		description = words.join(" ");
	}
	if (description.length > 140) {
		description = description.substring(0, 140) + "...";
	}

	// Thumbnail: og:image → twitter:image → link rel="image_src" → link rel="icon" → first img
	let thumbnailSrc = getMetaContent(iframeDoc, "og:image", "property")
		|| getMetaContent(iframeDoc, "twitter:image:src", "name")
		|| getMetaContent(iframeDoc, "twitter:image", "name")
		|| getLinkHref(iframeDoc, "image_src")
		|| getLinkHref(iframeDoc, "icon")
		|| "";
	if (!thumbnailSrc) {
		let firstImg = iframeDoc.querySelector("img[src]");
		if (firstImg) {
			let src = firstImg.getAttribute("src");
			if (src && src.indexOf("data:") !== 0) { thumbnailSrc = src; }
		}
	}

	// Convert thumbnail to base64 data URL (OneNote API can't fetch external URLs)
	// HTML structure matches legacy BookmarkHelper + createPostProcessessedHtml exactly:
	// - Outer div + tables get fontStyleString (tables don't inherit from div in OneNote API)
	// - No table-layout/border-collapse on outer table (legacy didn't have them)
	// - Thumbnail <td> has only padding-top:9px (no vertical-align, no object-fit)
	// - <img> has id="bookmarkThumbnail", no inline style (legacy pattern)
	let buildBookmark = (resolvedThumbSrc: string) => {
		let thumbHtml = "";
		if (resolvedThumbSrc) {
			thumbHtml = "<td width=\"112\" style=\"padding-top:9px;\">"
				+ "<img id=\"bookmarkThumbnail\" src=\"" + escapeAttr(resolvedThumbSrc) + "\" alt=\"thumbnail\" width=\"112\" />"
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

		let secondTdStyle = resolvedThumbSrc ? "padding-left:16px;" : "";

		let bmFontStyle = "font-size: 16px; font-family: Verdana;";
		cachedBookmarkHtml = "<div style=\"" + bmFontStyle + "\">"
			+ "<table style=\"" + bmFontStyle + "\">"
			+ "<tr style=\"vertical-align:top;\">"
			+ thumbHtml
			+ "<td style=\"" + secondTdStyle + "\"><table style=\"" + bmFontStyle + "\">"
			+ titleHtml
			+ "<tr><td style=\"" + urlStyle + "\"><a href=\"" + escapeAttr(pageUrl) + "\" target=\"_blank\">" + escapeHtml(pageUrl) + "</a></td></tr>"
			+ descHtml
			+ "</table></td>"
			+ "</tr></table></div>";

		bookmarkLoaded = true;
		renderBookmarkHtml(cachedBookmarkHtml);
		if (currentMode === "bookmark") {
			saveBtn.disabled = false;
			saveBtn.textContent = strings.saveToOneNote;
		}
	};

	if (thumbnailSrc && thumbnailSrc.indexOf("data:") !== 0) {
		// Fetch image and convert to base64 data URL (matches legacy BookmarkHelper → DomUtils.getImageDataUrl)
		imageToDataUrl(thumbnailSrc, (dataUrl: string) => {
			buildBookmark(dataUrl || thumbnailSrc); // fall back to raw URL if conversion fails
		});
	} else {
		buildBookmark(thumbnailSrc);
	}
}

// Fetch an image URL and convert to base64 data URL via canvas
// (OneNote API can't fetch external URLs — matches legacy DomUtils.getImageDataUrl).
// Initial encode is PNG (lossless, ideal for icons/logos). For oversized
// photos (e.g. YouTube's 1280x720 og:image at maxresdefault.jpg) PNG can
// exceed the OneNote API per-MIME-part limit and the save POST returns 400
// "Maximum request size exceeded" -- fall back to JPEG and step quality
// down until the encoded size fits. Matches legacy
// DomUtils.adjustImageQualityIfNecessary behavior.
function imageToDataUrl(url: string, callback: (dataUrl: string) => void) {
	let img = new Image();
	img.crossOrigin = "anonymous";
	img.onload = () => {
		try {
			let canvas = document.createElement("canvas");
			canvas.width = img.naturalWidth;
			canvas.height = img.naturalHeight;
			(canvas.getContext("2d") as CanvasRenderingContext2D).drawImage(img, 0, 0);
			let dataUrl = canvas.toDataURL("image/png");
			callback(adjustImageQualityIfNecessary(canvas, dataUrl));
		} catch (e) {
			callback(""); // tainted canvas or other error — fall back
		}
	};
	img.onerror = () => { callback(""); };
	img.src = url;
}

// OneNote API per-MIME-part limit (matches legacy
// Settings.Instance.Apis_MediaTypesHandledInMemoryMaxRequestLength) minus a
// small padding for the request envelope.
const MAX_BYTES_FOR_MEDIA_TYPES = 2097152 - 500;

function adjustImageQualityIfNecessary(canvas: HTMLCanvasElement, dataUrl: string): string {
	let quality = 1.0;
	while (quality > 0 && dataUrl.length > MAX_BYTES_FOR_MEDIA_TYPES) {
		dataUrl = canvas.toDataURL("image/jpeg", quality);
		quality -= 0.1;
	}
	return dataUrl;
}

function getMetaContent(doc: Document, value: string, attr: string): string {
	let el = doc.querySelector("meta[" + attr + "=\"" + value + "\"]");
	return el ? el.getAttribute("content") || "" : "";
}

function getLinkHref(doc: Document, relValue: string): string {
	let el = doc.querySelector("link[rel~=\"" + relValue + "\"]");
	return el ? el.getAttribute("href") || "" : "";
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
		+ "img { border-radius: 2px; }"
		// Preview-only: constrain bookmark to body width.
		// table-layout:fixed + width:100% on outer table respects max-width:624px on body.
		// Thumbnail <td> keeps its explicit width="112" via CSS min-width.
		+ "body > div > table { table-layout: fixed; width: 100%; }"
		+ "body > div > table td[width] { width: 112px; min-width: 112px; }"
		+ "body > div > table td > table { width: 100%; table-layout: fixed; }";
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
	safeSend({
		action: "startRegion",
		regionStrings: {
			instruction: loc("WebClipper.Label.RegionSelectionMouseInstruction", "Drag a selection with the mouse, and then release to capture."),
			keyboardInstruction: loc("WebClipper.Label.RegionSelectionKeyboardInstruction", "To select with the keyboard, press the arrow keys, and then press Enter."),
			back: loc("WebClipper.Action.BackToHome", "Back"),
			canvasLabel: loc("WebClipper.Accessibility.ScreenReader.RegionSelectionCanvas", "Selection canvas"),
			selectionStarted: loc("WebClipper.Accessibility.ScreenReader.SelectionStarted", "Selection started"),
			selectionComplete: loc("WebClipper.Accessibility.ScreenReader.SelectionComplete", "Selection complete"),
			up: loc("WebClipper.Accessibility.ScreenReader.Up", "Up"),
			down: loc("WebClipper.Accessibility.ScreenReader.Down", "Down"),
			left: loc("WebClipper.Accessibility.ScreenReader.Left", "Left"),
			right: loc("WebClipper.Accessibility.ScreenReader.Right", "Right")
		}
	});
}

function switchToRegion() {
	saveArticleWorkingState();
	resetSaveState();
	currentMode = "region";
	iframe.style.display = "none";
	previewFrameWrap.style.display = "none";
	articleHeader.style.display = "none";
	if (pdfOptionsPanel) { pdfOptionsPanel.style.display = "none"; }
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
		removeBtn.textContent = loc("WebClipper.Action.Discard", "Discard"); // icon injected via CSS ::before
		removeBtn.title = loc("WebClipper.Preview.RemoveSelectedRegion", "Remove");
		removeBtn.addEventListener("click", ((idx: number) => () => {
			regionImages.splice(idx, 1);
			if (regionImages.length === 0) {
				// No regions left — stay in region mode, show just the add button
				renderRegionThumbnails();

				saveBtn.disabled = true;
			} else {
				renderRegionThumbnails();

			}
		})(i));
		// Per Figma: Discard button sits ABOVE the image (stacked), not an overlay
		let imgWrap = document.createElement("div");
		imgWrap.className = "region-image-wrap";
		imgWrap.appendChild(img);
		thumb.appendChild(removeBtn);
		thumb.appendChild(imgWrap);
		previewContainer.appendChild(thumb);
	}

	// "Add Another Region" button
	let addBtn = document.createElement("button");
	addBtn.className = "region-add-btn";
	addBtn.textContent = loc("WebClipper.Preview.Header.AddAnotherRegionButtonLabel", "Add another region"); // + icon rendered via CSS ::before
	addBtn.addEventListener("click", () => {
		startRegionCapture();
	});
	previewContainer.appendChild(addBtn);
	// Add a spacer below the button so it sits in the upper half of the preview area
	let spacer = document.createElement("div");
	spacer.style.height = Math.max(0, Math.round(previewContainer.clientHeight * 0.55)) + "px";
	spacer.style.flexShrink = "0";
	previewContainer.appendChild(spacer);
	// Scroll the add button to the top of the preview area so it's prominently visible
	setTimeout(() => { addBtn.scrollIntoView({ behavior: "smooth", block: "start" }); }, 100);

	if (regionImages.length > 0) {
		saveBtn.disabled = false;
		saveBtn.textContent = strings.saveToOneNote;
	} else {
		saveBtn.disabled = true;
	}
}

// --- PDF mode functions ---

// Inline page range parser (mirrors StringUtils.parsePageRange from legacy clipper)
function parsePageRange(text: string, maxRange: number): { ok: boolean; pages: number[]; error: string } {
	if (!text || !text.trim()) { return { ok: false, pages: [], error: "" }; }
	let splitText = text.trim().split(",");
	let range: number[] = [];
	for (let i = 0; i < splitText.length; i++) {
		let cur = splitText[i].trim();
		if (cur === "") { continue; }
		if (/^\d+$/.test(cur)) {
			let digit = parseInt(cur, 10);
			if (digit === 0 || digit > maxRange) { return { ok: false, pages: [], error: cur }; }
			range.push(digit);
		} else {
			let matches = /^(\d+)\s*-\s*(\d+)$/.exec(cur);
			if (!matches) { return { ok: false, pages: [], error: cur }; }
			let lhs = parseInt(matches[1], 10);
			let rhs = parseInt(matches[2], 10);
			if (lhs >= rhs || lhs === 0 || rhs === 0 || rhs > maxRange) { return { ok: false, pages: [], error: cur }; }
			for (let n = lhs; n <= rhs; n++) { range.push(n); }
		}
	}
	// Sort and deduplicate
	let seen: { [k: number]: boolean } = {};
	let unique: number[] = [];
	range.sort(function(a, b) { return a - b; });
	for (let i = 0; i < range.length; i++) {
		if (!seen[range[i]]) { seen[range[i]] = true; unique.push(range[i]); }
	}
	if (unique.length === 0) { return { ok: false, pages: [], error: text }; }
	return { ok: true, pages: unique, error: "" };
}

// Get 0-indexed page indices based on current selection
function getPdfSelectedIndices(): number[] {
	if (pdfAllPages) {
		let all: number[] = [];
		for (let i = 0; i < pdfPageCount; i++) { all.push(i); }
		return all;
	}
	let result = parsePageRange(pdfSelectedRange, pdfPageCount);
	if (!result.ok) { return []; }
	return result.pages.map(function(p) { return p - 1; });
}

// Render a single PDF page to a data URL via canvas (scale=2 for quality, matching legacy)
function renderPdfPage(pageIndex: number): Promise<string> {
	if (pdfPageDataUrls[pageIndex]) { return Promise.resolve(pdfPageDataUrls[pageIndex]); }
	return new Promise(function(resolve) {
		pdfDoc.getPage(pageIndex + 1).then(function(page: any) {
			let viewport = page.getViewport(2);
			let canvas = document.createElement("canvas");
			canvas.width = viewport.width;
			canvas.height = viewport.height;
			let ctx = canvas.getContext("2d");
			page.render({ canvasContext: ctx, viewport: viewport }).then(function() {
				let dataUrl = canvas.toDataURL();
				pdfPageDataUrls[pageIndex] = dataUrl;
				resolve(dataUrl);
			});
		});
	});
}

// Render pages into preview-container with lazy loading
let pdfInitialPageLoad = 3;

function renderPdfPagesInPreview(startIndex: number, count: number) {
	for (let i = startIndex; i < Math.min(startIndex + count, pdfPageCount); i++) {
		if (pdfPagesRendered[i]) { continue; }
		pdfPagesRendered[i] = true;
		let idx = i;
		let wrapper = document.createElement("div");
		wrapper.className = "pdf-page-wrapper";
		wrapper.id = "pdf-page-" + idx;
		wrapper.setAttribute("aria-label", strings.page + " " + (idx + 1));
		let placeholder = document.createElement("div");
		placeholder.className = "pdf-loading-indicator";
		placeholder.textContent = strings.page + " " + (idx + 1) + "...";
		wrapper.appendChild(placeholder);
		// Page number overlay
		let pageNum = document.createElement("div");
		pageNum.className = "pdf-page-number";
		pageNum.textContent = (idx + 1) + " / " + pdfPageCount;
		wrapper.appendChild(pageNum);
		// Insert in order
		let inserted = false;
		let existing = previewContainer.querySelectorAll(".pdf-page-wrapper");
		for (let j = 0; j < existing.length; j++) {
			let existingIdx = parseInt(existing[j].id.replace("pdf-page-", ""), 10);
			if (existingIdx > idx) {
				previewContainer.insertBefore(wrapper, existing[j]);
				inserted = true;
				break;
			}
		}
		if (!inserted) { previewContainer.appendChild(wrapper); }

		renderPdfPage(idx).then(function(dataUrl) {
			let img = document.createElement("img");
			img.className = "pdf-page-img";
			img.src = dataUrl;
			img.alt = strings.page + " " + (idx + 1);
			let w = document.getElementById("pdf-page-" + idx);
			if (w) {
				let ph = w.querySelector(".pdf-loading-indicator");
				if (ph) { w.removeChild(ph); }
				w.insertBefore(img, w.firstChild);
			}
		});
	}
}

function setupPdfPreviewLazyLoad() {
	previewContainer.addEventListener("scroll", function() {
		// Lazy-load pages near visible area
		let scrollTop = previewContainer.scrollTop;
		let containerH = previewContainer.clientHeight;
		let wrappers = previewContainer.querySelectorAll(".pdf-page-wrapper");
		for (let i = 0; i < wrappers.length; i++) {
			let w = wrappers[i] as HTMLElement;
			let top = w.offsetTop - scrollTop;
			if (top < containerH + 200 && top + w.offsetHeight > -200) {
				// This page is near viewport — render adjacent pages
				let pageIdx = parseInt(w.id.replace("pdf-page-", ""), 10);
				renderPdfPagesInPreview(Math.max(0, pageIdx - 1), 3);
			}
		}
	});
}

function switchToPdf() {
	currentMode = "pdf";
	// Show preview-container, hide others
	iframe.style.display = "none";
	previewFrameWrap.style.display = "none";
	articleHeader.style.display = "none";
	previewContainer.style.display = "block";
	// Show PDF options panel
	pdfOptionsPanel.style.display = "block";
	// Clear success banner
	let banner = document.getElementById("success-banner");
	if (banner) { banner.style.display = "none"; }
	let errBanner = document.getElementById("error-banner");
	if (errBanner) { errBanner.style.display = "none"; }
	saveDone = false;
	// Re-render PDF pages (preview-container may have region thumbnails from region mode)
	if (pdfDoc) {
		previewContainer.innerHTML = "";
		pdfPagesRendered = new Array(pdfPageCount);
		renderPdfPagesInPreview(0, pdfInitialPageLoad);
		setupPdfPreviewLazyLoad();
		updatePdfPageSelection();
	}
	saveBtn.disabled = !pdfDoc;
	saveBtn.textContent = strings.saveToOneNote;
}

function enterPdfMode(url: string) {
	pdfMode = true;
	pdfSourceUrl = url;

	// Ensure title is populated — PDF pages often have empty document.title
	// Legacy behavior: use filename from URL (with .pdf extension), fall back to document.title then URL
	if (!titleField.value || titleField.value === url) {
		let pdfTitle = getPdfFileName(url);
		if (pdfTitle && pdfTitle !== "Original.pdf") {
			titleField.value = pdfTitle;
		} else if (!titleField.value) {
			titleField.value = url;
		}
		originalTitle = titleField.value;
	}

	// Grab PDF UI elements
	pdfOptionsPanel = document.getElementById("pdf-options") as HTMLDivElement;
	pdfRangeInput = document.getElementById("pdf-range-input") as HTMLInputElement;
	pdfRangeError = document.getElementById("pdf-range-error") as HTMLDivElement;
	pdfAttachCheckbox = document.getElementById("pdf-attach-checkbox") as HTMLInputElement;
	pdfAttachLabel = document.getElementById("pdf-attach-label") as HTMLLabelElement;
	pdfAttachWarning = document.getElementById("pdf-attach-warning") as HTMLDivElement;
	pdfDistributeCheckbox = document.getElementById("pdf-distribute-checkbox") as HTMLInputElement;

	// i18n — update PDF UI text from localized strings
	let pdfBtn = document.querySelector('.mode-btn[data-mode="pdf"]');
	if (pdfBtn) {
		let span = pdfBtn.querySelector("span");
		if (span) { span.textContent = strings.modePdf; }
	}
	let radioLabels = document.querySelectorAll("#pdf-page-selection .pdf-radio-label span");
	if (radioLabels.length >= 2) {
		radioLabels[0].textContent = strings.pdfAllPages;
		radioLabels[1].textContent = strings.pdfPageRange;
	}
	pdfRangeInput.setAttribute("aria-label", strings.pdfPageRange);
	let checkLabels = document.querySelectorAll("#pdf-checkboxes .pdf-checkbox-label span");
	if (checkLabels.length >= 3) {
		checkLabels[0].textContent = strings.pdfAttachFile;
		checkLabels[1].textContent = strings.pdfAttachSubtext;
		checkLabels[2].textContent = strings.pdfDistribute;
	}
	pdfAttachWarning.textContent = strings.pdfTooLarge;

	// Hide non-PDF mode buttons, show PDF + Region + Bookmark, enable them (they start disabled during capture)
	document.querySelectorAll(".mode-btn").forEach(function(btn) {
		let mode = btn.getAttribute("data-mode");
		if (mode === "pdf") {
			(btn as HTMLElement).style.display = "";
			(btn as HTMLButtonElement).disabled = false;
			btn.classList.remove("disabled");
			btn.classList.add("selected");
			btn.setAttribute("aria-pressed", "true");
		} else if (mode === "region" || mode === "bookmark") {
			(btn as HTMLElement).style.display = "";
			(btn as HTMLButtonElement).disabled = false;
			btn.classList.remove("disabled");
			btn.classList.remove("selected");
			btn.setAttribute("aria-pressed", "false");
		} else {
			(btn as HTMLElement).style.display = "none";
		}
	});
	enableSignout();

	// Show PDF options, hide capture panel
	pdfOptionsPanel.style.display = "block";
	capturePanel.style.display = "none";

	// Set mode to PDF
	currentMode = "pdf";
	fullPageComplete = true; // allow mode switching to bookmark
	showPreviewFrame();

	// Show preview container for PDF pages
	iframe.style.display = "none";
	previewFrameWrap.style.display = "none";
	articleHeader.style.display = "none";
	previewContainer.style.display = "block";
	previewContainer.innerHTML = "";

	// Show loading indicator
	let loadingDiv = document.createElement("div");
	loadingDiv.className = "pdf-loading-indicator";
	loadingDiv.id = "pdf-initial-loading";
	loadingDiv.textContent = strings.pdfLoading;
	loadingDiv.setAttribute("role", "status");
	loadingDiv.setAttribute("aria-live", "polite");
	previewContainer.appendChild(loadingDiv);
	announceToScreenReader(strings.pdfLoading);

	// Enable save button
	saveBtn.disabled = false;
	saveBtn.textContent = strings.saveToOneNote;

	// Set up PDF radio/checkbox handlers
	setupPdfOptions();

	// Fetch and parse PDF
	loadPdf(url);

	// Telemetry: set content type context
	setTelemetryContext(Context.Custom.ContentType, "Pdf");
}

function setupPdfOptions() {
	let radios = document.querySelectorAll('input[name="pdf-pages"]') as NodeListOf<HTMLInputElement>;
	// Helper — select a radio by value and sync related UI state
	let selectRadio = function(value: string) {
		radios.forEach(function(r) {
			r.checked = (r.value === value);
			// Native <input type="radio"> conveys checked state — no need for aria-checked
		});
		pdfAllPages = value === "all";
		// Use readonly (not disabled) so the input stays focusable/clickable, and appears visually muted via CSS
		if (pdfAllPages) {
			pdfRangeInput.setAttribute("readonly", "");
			pdfRangeError.style.display = "none";
		} else {
			pdfRangeInput.removeAttribute("readonly");
			validatePageRange();
		}
		updatePdfPageSelection();
	};
	radios.forEach(function(radio) {
		radio.addEventListener("change", function() { selectRadio(radio.value); });
	});

	// Clicking or focusing the range input auto-switches to "Page range" mode
	let activateRangeMode = function() {
		if (pdfAllPages) {
			selectRadio("range");
			// Give focus after switching so the user can start typing immediately
			setTimeout(function() { pdfRangeInput.focus(); }, 0);
		}
	};
	pdfRangeInput.addEventListener("mousedown", activateRangeMode);
	pdfRangeInput.addEventListener("focus", activateRangeMode);

	pdfRangeInput.addEventListener("input", function() {
		pdfSelectedRange = pdfRangeInput.value;
		validatePageRange();
		updatePdfPageSelection();
	});

	pdfAttachCheckbox.addEventListener("change", function() {
		pdfAttach = pdfAttachCheckbox.checked;
	});

	pdfDistributeCheckbox.addEventListener("change", function() {
		pdfDistribute = pdfDistributeCheckbox.checked;
	});
}

// Update preview to gray out unselected pages (matches legacy opacity:0.3 behavior)
function updatePdfPageSelection() {
	let selectedIndices = getPdfSelectedIndices();
	let selectedSet: { [k: number]: boolean } = {};
	for (let i = 0; i < selectedIndices.length; i++) { selectedSet[selectedIndices[i]] = true; }
	let wrappers = previewContainer.querySelectorAll(".pdf-page-wrapper");
	for (let i = 0; i < wrappers.length; i++) {
		let pageIdx = parseInt(wrappers[i].id.replace("pdf-page-", ""), 10);
		let img = wrappers[i].querySelector(".pdf-page-img");
		if (img) {
			if (pdfAllPages || selectedSet[pageIdx]) {
				img.classList.remove("unselected");
			} else {
				img.classList.add("unselected");
			}
		}
	}
}

function validatePageRange() {
	if (pdfAllPages || !pdfSelectedRange.trim()) {
		pdfRangeError.style.display = "none";
		return true;
	}
	let result = parsePageRange(pdfSelectedRange, pdfPageCount);
	if (!result.ok) {
		pdfRangeError.textContent = strings.pdfInvalidRange.replace("{0}", result.error);
		pdfRangeError.style.display = "";
		return false;
	}
	pdfRangeError.style.display = "none";
	return true;
}

function loadPdf(url: string) {
	let isLocal = url.indexOf("file:///") === 0;

	let processPdf = function(source: any, byteLen?: number) {
		// PDFJS.getDocument returns a PDFDocumentLoadingTask with .then(ok, err) but no .catch
		(window as any).PDFJS.getDocument(source).then(function(pdf: any) {
			pdfDoc = pdf;
			pdfPageCount = pdf.numPages;
			pdfPagesRendered = new Array(pdfPageCount);
			pdfPageDataUrls = new Array(pdfPageCount);

			if (byteLen) {
				pdfByteLength = byteLen;
			} else {
				// For local files, get byte length from pdf.js
				pdf.getData().then(function(data: Uint8Array) {
					pdfByteLength = data.length;
					pdfBuffer = data;
					updateAttachCheckbox();
				});
			}

			// Remove loading indicator
			let loadEl = document.getElementById("pdf-initial-loading");
			if (loadEl && loadEl.parentNode) { loadEl.parentNode.removeChild(loadEl); }

			// Render initial pages
			renderPdfPagesInPreview(0, pdfInitialPageLoad);
			setupPdfPreviewLazyLoad();

			announceToScreenReader(strings.modePdf + " — " + pdfPageCount + " " + strings.page + (pdfPageCount !== 1 ? "s" : ""));
		}, function(err: any) {
			if (isLocal) {
				showLocalPdfBlockedPanel();
			} else {
				showPdfError("Failed to load PDF: " + (err.message || "Unknown error"));
				saveBtn.disabled = true;
			}
		});
	};

	if (isLocal) {
		// Pass file:// URL directly to PDFJS — works if extension has file access permission
		processPdf(url);
	} else {
		fetch(url).then(function(response) {
			if (!response.ok) {
				showPdfError("Failed to fetch PDF: " + response.status);
				return;
			}
			return response.arrayBuffer();
		}).then(function(arrayBuffer) {
			if (!arrayBuffer) { return; }
			pdfByteLength = arrayBuffer.byteLength;
			pdfBuffer = new Uint8Array(arrayBuffer);
			updateAttachCheckbox();
			processPdf(pdfBuffer, arrayBuffer.byteLength);
		}).catch(function(err) {
			showPdfError("Network error loading PDF: " + (err.message || "Unknown"));
		});
	}
}

function updateAttachCheckbox() {
	if (pdfByteLength > pdfMaxAttachSize) {
		pdfAttachCheckbox.checked = false;
		pdfAttachCheckbox.disabled = true;
		pdfAttach = false;
		pdfAttachLabel.classList.add("disabled");
		pdfAttachWarning.style.display = "";
	}
}

// Show local file permission panel in preview area (used by both worker-blocked and PDFJS-blocked paths).
// Idempotent: file:/// PDFs typically trigger BOTH paths — the worker's executeScript fails (no file URL
// permission) and the renderer's PDFJS fetch then also fails for the same reason. Without this guard the
// panel was rendered twice.
function showLocalPdfBlockedPanel() {
	if (document.getElementById("pdf-blocked-panel")) { return; }
	let loadEl = document.getElementById("pdf-initial-loading");
	if (loadEl && loadEl.parentNode) { loadEl.parentNode.removeChild(loadEl); }
	let panel = document.createElement("div");
	panel.id = "pdf-blocked-panel";
	panel.setAttribute("role", "alert");
	panel.style.cssText = "padding:32px 24px;text-align:center;color:#444;font-family:Segoe UI,sans-serif;";
	let title = document.createElement("div");
	title.style.cssText = "font-size:15px;font-weight:600;margin-bottom:12px;color:#333;";
	title.textContent = loc("WebClipper.ClipType.Pdf.AskPermissionToClipLocalFile",
		"We need your permission to clip PDF files stored on your computer");
	let instructions = document.createElement("div");
	instructions.style.cssText = "font-size:13px;line-height:1.6;color:#555;";
	instructions.textContent = loc("WebClipper.ClipType.Pdf.InstructionsForClippingLocalFiles",
		"Right-click the OneNote Web Clipper icon in the toolbar and choose \"Manage Extension\". Then enable \"Allow access to file URLs.\"");
	panel.appendChild(title);
	panel.appendChild(instructions);
	previewContainer.appendChild(panel);
	saveBtn.disabled = true;
	announceToScreenReader(title.textContent);
}

function showPdfError(msg: string) {
	let loadEl = document.getElementById("pdf-initial-loading");
	if (loadEl) {
		loadEl.textContent = msg;
		loadEl.setAttribute("role", "alert");
	}
	announceToScreenReader(msg);
}

// Extract filename from URL for PDF attachment (matches legacy UrlUtils.getFileNameFromUrl)
function getPdfFileName(url: string): string {
	try {
		let pathname = new URL(url).pathname;
		let parts = pathname.split("/");
		let last = parts[parts.length - 1];
		if (last && last.indexOf(".") !== -1) {
			return decodeURIComponent(last);
		}
	} catch (e) { /* ignore */ }
	return "Original.pdf";
}

// Generate bookmark HTML for PDF pages (no og: tags in PDF viewer DOM)
// Matches the structure and styling of extractBookmark() / legacy bookmarkPreview.tsx
function generatePdfBookmarkHtml(title: string, url: string): string {
	let safeTitle = escapeHtml(title);
	let safeUrl = escapeAttr(url);
	let displayUrl = escapeHtml(url);
	let fontStyle = "font-size: 16px; font-family: Verdana;";
	let urlStyle = "white-space:nowrap;overflow:hidden;text-overflow:ellipsis;padding:2px;";
	return "<div style=\"" + fontStyle + "\">"
		+ "<table style=\"" + fontStyle + "\">"
		+ "<tr style=\"vertical-align:top;\">"
		+ "<td><table style=\"" + fontStyle + "\">"
		+ "<tr><td><h2 style=\"margin:0;margin-bottom:13px;\">" + safeTitle + "</h2></td></tr>"
		+ "<tr><td style=\"" + urlStyle + "\"><a href=\"" + safeUrl + "\" target=\"_blank\">" + displayUrl + "</a></td></tr>"
		+ "</table></td>"
		+ "</tr></table></div>";
}

// Mode button click handlers + ARIA (aria-pressed in toolbar, arrow keys)
let modeButtonNodeList = document.querySelectorAll(".mode-btn");
let modeButtons: HTMLButtonElement[] = [];
for (let i = 0; i < modeButtonNodeList.length; i++) { modeButtons.push(modeButtonNodeList[i] as HTMLButtonElement); }
modeButtons.forEach((btn, idx) => {
	// Arrow key navigation (mirrors old enableAriaInvoke: ArrowUp/Down/Left/Right + Home/End)
	btn.addEventListener("keydown", (e) => {
		let target = -1;
		if (e.key === "ArrowDown" || e.key === "ArrowRight") { target = idx + 1; } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") { target = idx - 1; } else if (e.key === "Home") { target = 0; } else if (e.key === "End") { target = modeButtons.length - 1; }
		if (target >= 0 && target < modeButtons.length && !modeButtons[target].disabled) {
			e.preventDefault();
			modeButtons[target].focus();
		}
	});
	btn.addEventListener("click", () => {
		let mode = btn.getAttribute("data-mode");
		if (mode === currentMode) { return; }
		// Block mode switching during active capture — captureVisibleTab needs content-frame visible
		if (!fullPageComplete && mode !== "fullpage") { return; }

		// Update selected state visually + ARIA
		document.querySelectorAll(".mode-btn").forEach((b) => {
			b.classList.remove("selected");
			b.setAttribute("aria-pressed", "false");
		});
		btn.classList.add("selected");
		btn.setAttribute("aria-pressed", "true");

		// Click event — match legacy componentBase.ts logClickEvent(element.id)
		let modeClickIds: { [key: string]: string } = { fullpage: "fullPageButton", article: "augmentationButton", bookmark: "bookmarkButton", region: "regionButton", pdf: "pdfButton" };
		logClickEvent(modeClickIds[mode as string] || mode as string);

		if (mode === "fullpage") {
			switchToFullPage();
			setTelemetryContext(Context.Custom.ContentType, "FullPage");
		} else if (mode === "article") {
			switchToArticle();
			setTelemetryContext(Context.Custom.ContentType, "Article");
		} else if (mode === "bookmark") {
			// For PDF pages, generate bookmark from title/URL since DOM has no og: tags
			if (pdfMode && !cachedBookmarkHtml) {
				cachedBookmarkHtml = generatePdfBookmarkHtml(titleField.value || originalTitle, sourceUrlText.textContent || pdfSourceUrl);
				bookmarkLoaded = true;
			}
			switchToBookmark();
			setTelemetryContext(Context.Custom.ContentType, "Bookmark");
		} else if (mode === "region") {
			switchToRegion();
			setTelemetryContext(Context.Custom.ContentType, "Region");
		} else if (mode === "pdf") {
			switchToPdf();
			setTelemetryContext(Context.Custom.ContentType, "Pdf");
		}
		// Announce mode change to screen readers
		let modeLabel = btn.querySelector("span");
		if (modeLabel) { announceToScreenReader(modeLabel.textContent || ""); }
	});
});

port.onMessage.addListener((message: any) => {
	if (message.action === "loadContent") {
		// Page payload arrives inline on the loadContent port message — html,
		// baseUrl, title, url, contentType, plus the localFileNotAllowed flag.
		let rawHtml: string = message.html || "";
		let baseUrl: string = message.baseUrl || "";
		let pageTitle: string = message.title || "";
		let pageUrl: string = message.url || "";
		let contentType: string = message.contentType || "html";

		// Populate title and source URL (may not have been available on initial page load)
		if (pageTitle && !titleField.value) { titleField.value = pageTitle; }
		if (pageUrl && !sourceUrlText.textContent) { sourceUrlText.textContent = pageUrl; sourceUrl.title = pageUrl; }
		if (pageTitle) { originalTitle = pageTitle; }

		{
			// Local file not allowed — show helpful permission message in preview area
			if (message.localFileNotAllowed) {
				enterPdfMode(pageUrl);
				showLocalPdfBlockedPanel();
				return;
			}

			// PDF content type — enter PDF mode instead of normal capture flow
			if (contentType === "pdf") {
				enterPdfMode(pageUrl);
				return;
			}

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
		}
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
		// Remove the rounded frame overlay so content-frame is full-bleed during capture.
		// If left on, captureVisibleTab bakes the 8px preview-area gap into the screenshot.
		hidePreviewFrame();
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
			(document.getElementById("progress-bar-track") as HTMLElement).style.display = "";
			let current = message.index + 1;
			let total = message.totalViewports;
			progressInfo.textContent = strings.viewportProgress.replace("{0}", current).replace("{1}", total);
			let pct = Math.round((current / total) * 100);
			progressFill.style.width = pct + "%";
			progressFill.setAttribute("aria-valuenow", "" + pct);
		}

		let img = new Image();
		img.onload = function() {
			let imgWidth = img.naturalWidth;
			let imgHeight = img.naturalHeight;

			if (message.index === 0) {
				// First capture: initialize canvas dimensions
				stitchDpr = imgHeight / stitchViewportHeight;
				// Exclude sidebar pixels from the canvas — only keep content area.
				// In RTL the sidebar sits on the left of the viewport, so the
				// source-x offset shifts past it; LTR reads from x=0.
				let sidebarPx = Math.round(sidebarCssWidth * stitchDpr);
				contentPixelWidth = imgWidth - sidebarPx;
				if (contentPixelWidth <= 0) { contentPixelWidth = imgWidth; sidebarPx = 0; }
				contentSrcX = document.documentElement.dir === "rtl" ? sidebarPx : 0;
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
				stitchCtx.drawImage(img, contentSrcX, 0, contentPixelWidth, drawH, 0, 0, contentPixelWidth, drawH);
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

				stitchCtx.drawImage(img, contentSrcX, srcY, contentPixelWidth, srcH, 0, stitchYOffset, contentPixelWidth, srcH);
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

		// Convert to JPEG 95% data URL — kept in page variable (no session storage)
		stitchCanvas.toBlob(((blob: Blob) => {
			let reader = new FileReader();
			reader.onloadend = function() {
				let dataUrl = reader.result as string;
				fullPageDataUrl = dataUrl; // Cache for mode switching and save
				fullPageComplete = true;
				showPreviewFrame();

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
					enableSignout();
					announceToScreenReader(loc("WebClipper.Label.ClipSuccessful", "Capture complete"));
					// Set initial focus on Full Page mode button after capture
					let fpModeBtn = document.querySelector('.mode-btn[data-mode="fullpage"]') as HTMLElement;
					if (fpModeBtn) { setTimeout(function() { fpModeBtn.focus(); }, 100); }

					safeSend({ action: "finalizeComplete" });
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

			// RegionSelectionCapturing — match legacy regionSelector.tsx
			let capEvent = new Event.BaseEvent(Event.Label.RegionSelectionCapturing);
			capEvent.setCustomProperty(PropertyName.Custom.Width, message.width);
			capEvent.setCustomProperty(PropertyName.Custom.Height, message.height);
			logTelemetryEvent(capEvent);

			// RegionSelectionProcessing — match legacy (canvas dimensions + DPI)
			let procEvent = new Event.BaseEvent(Event.Label.RegionSelectionProcessing);
			procEvent.setCustomProperty(PropertyName.Custom.Width, cropCanvas.width);
			procEvent.setCustomProperty(PropertyName.Custom.Height, cropCanvas.height);
			procEvent.setCustomProperty(PropertyName.Custom.IsHighDpiScreen, (window.devicePixelRatio || 1) > 1);
			logTelemetryEvent(procEvent);

			regionImages.push(croppedUrl);
			renderRegionThumbnails();
		};
		fullImg.src = message.dataUrl || "";
	}

	if (message.action === "regionCancelled") {
		capturePanel.style.display = "none";
		if (regionImages.length === 0) {
			// Matches legacy clipper behavior: cancelling a fresh region selection
			// snaps back to the page's default mode — Full Page on web pages,
			// PDF Document on PDF pages (Full Page mode is hidden in PDF flow).
			// Focus stays on the Region mode button so the user can re-enter
			// region mode immediately.
			let fallbackMode = pdfMode ? "pdf" : "fullpage";
			document.querySelectorAll(".mode-btn").forEach((b) => {
				b.classList.remove("selected");
				b.setAttribute("aria-pressed", "false");
			});
			let fallbackBtn = document.querySelector('.mode-btn[data-mode="' + fallbackMode + '"]');
			if (fallbackBtn) { fallbackBtn.classList.add("selected"); fallbackBtn.setAttribute("aria-pressed", "true"); }
			if (pdfMode) {
				switchToPdf();
				setTelemetryContext(Context.Custom.ContentType, "Pdf");
			} else {
				switchToFullPage();
				setTelemetryContext(Context.Custom.ContentType, "FullPage");
			}
			let regionBtn = document.querySelector('.mode-btn[data-mode="region"]') as HTMLElement;
			if (regionBtn) { setTimeout(function() { regionBtn.focus(); }, 0); }
		} else {
			// User cancelled mid-add but already has captures — stay in region mode
			// so they can save what they have or add another region.
			renderRegionThumbnails();
		}
	}

	if (message.action === "saveProgress") {
		// Distributed PDF save progress
		let cur = message.current || 0;
		let total = message.total || 0;
		if (total > 0) {
			progressInfo.textContent = strings.pdfPageProgress.replace("{0}", "" + cur).replace("{1}", "" + total);
			let pct = Math.round((cur / total) * 100);
			progressFill.style.width = pct + "%";
			progressFill.setAttribute("aria-valuenow", "" + pct);
			(document.getElementById("progress-bar-track") as HTMLElement).style.display = "";
			announceToScreenReader(strings.pdfPageProgress.replace("{0}", "" + cur).replace("{1}", "" + total));
		}
	}

	if (message.action === "saveResult") {
		if (saveTimeoutId) { clearTimeout(saveTimeoutId); saveTimeoutId = 0; }
		// ClipToOneNoteAction — timer started at save button click
		let clipActionEvent = pendingClipEvent || new Event.PromiseEvent(Event.Label.ClipToOneNoteAction);
		pendingClipEvent = undefined;
		if (message.correlationId) {
			clipActionEvent.setCustomProperty(PropertyName.Custom.CorrelationId, message.correlationId);
		}
		if (message.success) {
			clipActionEvent.setStatus(Status.Succeeded);
			clipSuccessCount++;
		} else {
			clipActionEvent.setStatus(Status.Failed);
			if (message.error) { clipActionEvent.setFailureInfo({ error: message.error }); }
		}
		logTelemetryEvent(clipActionEvent);

		if (message.success) {
			saveDone = true;
			unlockSidebar();
			capturePanel.style.display = "none";
			// Keep Clip button ready for re-clip
			saveBtn.textContent = strings.saveToOneNote;
			saveBtn.disabled = false;
			saveBtn.onclick = undefined;
			cancelBtn.disabled = false;
			// Show success inline alert with title + description + optional "View in OneNote" button
			let successBanner = document.getElementById("success-banner") as HTMLDivElement;
			let successText = document.getElementById("success-text") as HTMLSpanElement;
			let successDescription = document.getElementById("success-description") as HTMLParagraphElement;
			let viewLink = document.getElementById("view-onenote-link") as HTMLButtonElement;
			successText.textContent = loc("WebClipper.Label.ClipSuccessTitle", "Saved to your notebook");
			successDescription.textContent = loc("WebClipper.Label.ClipSuccessDescription",
				"You can access and continue working on it anytime from your notebook.");
			if (message.pageUrl) {
				viewLink.textContent = strings.viewInOneNote;
				viewLink.style.display = "block";
				viewLink.onclick = function() {
					logFunnel(Funnel.Label.ViewInWac);
					window.open(message.pageUrl, "_blank");
					window.close();
				};
			} else {
				viewLink.style.display = "none";
				viewLink.onclick = null; // tslint:disable-line:no-null-keyword
				logFailure(Failure.Label.OnLaunchOneNoteButton, Failure.Type.Unexpected,
					{ error: "Page created but missing pageUrl in save response" });
			}
			successBanner.style.display = "block";
			// role="status" on successBanner auto-announces; no manual aria-live needed
			// Restore focus + visible indicator on Clip button. While save was in flight the
			// button was disabled, which drops focus and the :focus-visible promotion. A fresh
			// programmatic focus brings both back so keyboard users see where they are.
			setTimeout(function() { saveBtn.focus(); }, 0);
		} else {
			unlockSidebar();
			let errorDetail = message.error || "Unknown error";
			// Hide capture panel + progress bar — show inline error banner instead
			capturePanel.style.display = "none";
			(document.getElementById("progress-bar-track") as HTMLElement).style.display = "";
			progressInfo.textContent = "";
			progressFill.style.width = "0%";
			statusText.innerHTML = "";

			let errorBanner = document.getElementById("error-banner") as HTMLDivElement;
			let errorTitle = document.getElementById("error-title") as HTMLSpanElement;
			let errorDescription = document.getElementById("error-description") as HTMLParagraphElement;
			let copyBtn = document.getElementById("copy-diagnostics") as HTMLButtonElement;
			let copyLabel = document.getElementById("copy-diagnostics-label") as HTMLSpanElement;

			errorTitle.textContent = loc("WebClipper.Label.ClipErrorTitle", "Couldn't save to your notebook");
			errorDescription.textContent = loc("WebClipper.Label.ClipErrorDescription",
				"Something went wrong while saving your clip. Try saving your clip again.");
			if (errorDetail && errorDetail !== "Unknown error") {
				let copyLabelText = "Copy diagnostic info";
				copyLabel.textContent = copyLabelText;
				copyBtn.style.display = "";
				copyBtn.onclick = function(ev) {
					ev.stopPropagation();
					navigator.clipboard.writeText(errorDetail).then(function() {
						copyLabel.textContent = "✓ Copied";
						copyBtn.classList.add("copied");
						setTimeout(function() {
							copyLabel.textContent = copyLabelText;
							copyBtn.classList.remove("copied");
						}, 1500);
					});
				};
			} else if (copyBtn) {
				copyBtn.style.display = "none";
				copyBtn.onclick = undefined;
			}
			errorBanner.style.display = "block";
			// role="alert" on errorBanner auto-announces; no manual aria-live needed
			saveBtn.textContent = strings.saveToOneNote;
			saveBtn.disabled = false;
		}
	}

	// --- Sign-in result from worker ---
	if (message.action === "signInResult") {
		signingIn = false;
		// HandleSignInEvent — timer started at sign-in button click
		let signInEvent = pendingSignInEvent || new Event.PromiseEvent(Event.Label.HandleSignInEvent);
		pendingSignInEvent = undefined;
		if (message.correlationId) {
			signInEvent.setCustomProperty(PropertyName.Custom.CorrelationId, message.correlationId);
		}
		signInEvent.setCustomProperty(PropertyName.Custom.UserInformationReturned, !!message.success);
		signInEvent.setCustomProperty(PropertyName.Custom.SignInCancelled, !message.success && !message.error);

		if (message.success) {
			signInEvent.setStatus(Status.Succeeded);
			logTelemetryEvent(signInEvent);
			logFunnel(Funnel.Label.AuthSignInCompleted);
			// Transition from sign-in to capture mode
			isSignedIn = true;
			hideSignInPanel();
			// Show iframe immediately so flex layout keeps sidebar on the right
			// (it'll be blank until loadContent arrives, but prevents sidebar snap-left)
			iframe.style.display = "block";
			// Update user info footer + set telemetry context
			if (message.user) {
				userEmailSpan.textContent = message.user.email || message.user.name || "";
				userEmailSpan.title = message.user.email || "";
				userAuthType = message.user.authType || "";
				userInfoDiv.style.display = "";
				feedbackLink.style.display = (userAuthType === "Msa") ? "none" : "";
				// Context properties — match legacy clipper.tsx
				setTelemetryContext(Context.Custom.AuthType, userAuthType);
				if (message.user.cid) { setTelemetryContext(Context.Custom.UserInfoId, message.user.cid); }
				// UserInfoUpdated event — match legacy clipperStateUtilities.ts
				let uiuEvent = new Event.BaseEvent(Event.Label.UserInfoUpdated);
				uiuEvent.setCustomProperty(PropertyName.Custom.UserUpdateReason, "SignInAttempt");
				uiuEvent.setCustomProperty(PropertyName.Custom.LastUpdated, new Date().toUTCString());
				logTelemetryEvent(uiuEvent);
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
			signInEvent.setStatus(Status.Failed);
			if (message.error) { signInEvent.setFailureInfo({ error: message.error }); }
			logTelemetryEvent(signInEvent);
			logFunnel(Funnel.Label.AuthSignInFailed);
			if (message.cancelled) {
				// User-initiated cancellation: legacy clipper showed no banner here.
				// Just reset the sign-in panel buttons so they can try again.
				signinMsaBtn.disabled = false;
				signinOrgIdBtn.disabled = false;
				signinProgress.style.display = "none";
				signinError.style.display = "none";
			} else {
				showSignInError(message.error || loc("WebClipper.Error.SignInUnsuccessful", "Sign-in failed. Please try again."));
			}
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
		enableSignout();
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
		sourceUrlText.textContent = "";
		sourceUrl.title = "";
		// Clear stale capture content from DOM
		hidePreviewFrame(); // remove rounded frame so next capture isn't masked
		previewContainer.innerHTML = "";
		previewContainer.style.display = "none";
		iframe.style.display = "none";
		previewFrameWrap.style.display = "none";
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
		saveBtn.onclick = undefined;
		cancelBtn.textContent = strings.cancel;
		// Show sign-in overlay
		showSignInPanel();
	}
});

// Save button triggers clip via port — includes title, annotation, mode, and content for OneNote page creation
saveBtn.addEventListener("click", () => {
	// Clear previous success / error state if re-clipping
	saveDone = false;
	let prevBanner = document.getElementById("success-banner");
	if (prevBanner) { prevBanner.style.display = "none"; }
	let prevErrBanner = document.getElementById("error-banner");
	if (prevErrBanner) { prevErrBanner.style.display = "none"; }
	logFunnel(Funnel.Label.ClipAttempted);
	pendingClipEvent = new Event.PromiseEvent(Event.Label.ClipToOneNoteAction);

	// ClipCommonOptions — match legacy saveToOneNoteLogger.ts
	// ClipMode uses legacy enum names: FullPage, Augmentation (not Article), Bookmark, Region
	let clipModeMap: { [key: string]: string } = { fullpage: "FullPage", article: "Augmentation", bookmark: "Bookmark", region: "Region", pdf: "Pdf" };
	let clipCommonEvent = new Event.BaseEvent(Event.Label.ClipCommonOptions);
	clipCommonEvent.setCustomProperty(PropertyName.Custom.ClipMode, clipModeMap[currentMode] || currentMode);
	clipCommonEvent.setCustomProperty(PropertyName.Custom.PageTitleModified, titleField.value !== originalTitle);
	clipCommonEvent.setCustomProperty(PropertyName.Custom.AnnotationAdded, noteField.value.length > 0);
	logTelemetryEvent(clipCommonEvent);

	// ClipRegionOptions — match legacy (only in region mode)
	if (currentMode === "region") {
		let clipRegionEvent = new Event.BaseEvent(Event.Label.ClipRegionOptions);
		clipRegionEvent.setCustomProperty(PropertyName.Custom.NumRegions, regionImages.length);
		logTelemetryEvent(clipRegionEvent);
	}

	// ClipPdfOptions + PdfByteMetadata — match legacy saveToOneNoteLogger
	if (currentMode === "pdf" && pdfDoc) {
		let pdfOptEvent = new Event.BaseEvent(Event.Label.ClipPdfOptions);
		pdfOptEvent.setCustomProperty(PropertyName.Custom.PdfAllPagesClipped, pdfAllPages);
		pdfOptEvent.setCustomProperty(PropertyName.Custom.PdfAttachmentClipped, pdfAttach && pdfByteLength <= pdfMaxAttachSize);
		pdfOptEvent.setCustomProperty(PropertyName.Custom.PdfIsLocalFile, (sourceUrlText.textContent || "").indexOf("file:///") === 0);
		pdfOptEvent.setCustomProperty(PropertyName.Custom.PdfIsBatched, pdfDistribute);
		let selectedCount = pdfAllPages ? pdfPageCount : getPdfSelectedIndices().length;
		pdfOptEvent.setCustomProperty(PropertyName.Custom.PdfFileSelectedPageCount, selectedCount);
		pdfOptEvent.setCustomProperty(PropertyName.Custom.PdfFileTotalPageCount, pdfPageCount);
		logTelemetryEvent(pdfOptEvent);

		let byteEvent = new Event.BaseEvent(Event.Label.PdfByteMetadata);
		byteEvent.setCustomProperty(PropertyName.Custom.ByteLength, pdfByteLength);
		byteEvent.setCustomProperty(PropertyName.Custom.BytesPerPdfPage, pdfPageCount > 0 ? Math.round(pdfByteLength / pdfPageCount) : 0);
		logTelemetryEvent(byteEvent);
	}

	lockSidebar();
	saveBtn.disabled = true;
	// Keep the "Clip" label — the "Saving..." status text below the progress bar conveys state
	// (previous "Saving..." on the button was duplicative with the label)
	// Show saving status below the buttons
	capturePanel.style.display = "flex";
	statusText.textContent = strings.saving;
	progressInfo.textContent = "";
	announceToScreenReader(strings.saving);
	// Client-side 30s timeout — service worker setTimeout is unreliable (SW goes inactive)
	if (saveTimeoutId) { clearTimeout(saveTimeoutId); }
	saveTimeoutId = setTimeout(function() {
		if (!saveDone) {
			unlockSidebar();
			capturePanel.style.display = "flex";
			progressInfo.textContent = "";
			(document.getElementById("progress-bar-track") as HTMLElement).style.display = "none";
			statusText.innerHTML = escapeHtml(loc("WebClipper.Error.GenericError", "Something went wrong. Please try clipping the page again."))
				+ "<div style=\"margin-top:6px;font-size:11px;opacity:0.7;\">Request timed out (30s)</div>";
			saveBtn.textContent = strings.saveToOneNote;
			saveBtn.disabled = false;
			announceToScreenReader(loc("WebClipper.Error.GenericError", "Something went wrong."));
		}
	}, 30000);
	let saveMsg: any = {
		action: "save",
		title: titleField.value,
		annotation: noteField.value,
		url: sourceUrlText.textContent || "",
		mode: currentMode,
		sectionId: selectedSectionId
	};
	// For full page, send the actual CSS width of the captured image
	if (currentMode === "fullpage" && contentPixelWidth > 0 && stitchDpr > 0) {
		saveMsg.imageWidth = Math.round(contentPixelWidth / stitchDpr);
	}

	// --- Chunked save protocol: send metadata first, then image chunks ---
	if (currentMode === "fullpage") {
		saveMsg.saveImageCount = 1;
		safeSend(saveMsg);
		safeSend({ action: "saveImage", index: 0, dataUrl: fullPageDataUrl });
	} else if (currentMode === "region") {
		saveMsg.saveImageCount = regionImages.length;
		safeSend(saveMsg);
		for (let i = 0; i < regionImages.length; i++) {
			safeSend({ action: "saveImage", index: i, dataUrl: regionImages[i] });
		}
	} else if (currentMode === "article") {
		let articleBody = "";
		let oembedSnap = cachedOEmbedData;
		if (oembedSnap) {
			// oEmbed-source: save uses provider iframe (preview only showed
			// thumbnail since sandboxed iframes can't run the player).
			articleBody = composeOEmbedForSave(oembedSnap, cachedOEmbedDescription);
		} else {
			let pDoc = previewFrame.contentDocument;
			if (pDoc && pDoc.body && pDoc.body.querySelector(".highlighted")) {
				let clone = pDoc.body.cloneNode(true) as HTMLElement;
				let delBtns = clone.querySelectorAll(".delete-highlight");
				for (let i = delBtns.length - 1; i >= 0; i--) {
					if (delBtns[i].parentNode) { delBtns[i].parentNode.removeChild(delBtns[i]); }
				}
				articleBody = clone.innerHTML;
			} else {
				articleBody = cachedArticleHtml;
			}
		}
		let fontFamily = articleSerif ? strings.fontFamilySerif : strings.fontFamilySansSerif;
		let fontStyle = "font-size: " + articleFontSize + "px; font-family: " + fontFamily + ";";
		saveMsg.contentHtml = "<div style=\"" + fontStyle + "\">" + articleBody + "</div>";
		if (cachedPageMetadata) { saveMsg.pageMetadata = cachedPageMetadata; }
		saveMsg.saveImageCount = 0;
		safeSend(saveMsg);
	} else if (currentMode === "bookmark") {
		saveMsg.contentHtml = cachedBookmarkHtml || "";
		saveMsg.saveImageCount = 0;
		safeSend(saveMsg);
	} else if (currentMode === "pdf") {
		// Validate page range before saving
		if (!pdfAllPages && !validatePageRange()) {
			unlockSidebar();
			saveBtn.disabled = false;
			saveBtn.textContent = strings.saveToOneNote;
			capturePanel.style.display = "none";
			return;
		}
		let indices = getPdfSelectedIndices();
		if (indices.length === 0) {
			unlockSidebar();
			saveBtn.disabled = false;
			saveBtn.textContent = strings.saveToOneNote;
			capturePanel.style.display = "none";
			return;
		}
		statusText.textContent = strings.pdfProgress;
		announceToScreenReader(strings.pdfProgress);
		// Extend timeout for large PDFs
		if (saveTimeoutId) { clearTimeout(saveTimeoutId); }
		let pdfTimeoutMs = Math.max(30000, indices.length * 5000 + 30000);
		saveTimeoutId = setTimeout(function() {
			if (!saveDone) {
				unlockSidebar();
				capturePanel.style.display = "flex";
				progressInfo.textContent = "";
				(document.getElementById("progress-bar-track") as HTMLElement).style.display = "none";
				statusText.innerHTML = escapeHtml(loc("WebClipper.Error.GenericError", "Something went wrong. Please try clipping the page again."))
					+ "<div style=\"margin-top:6px;font-size:11px;opacity:0.7;\">Request timed out</div>";
				saveBtn.textContent = strings.saveToOneNote;
				saveBtn.disabled = false;
				announceToScreenReader(loc("WebClipper.Error.GenericError", "Something went wrong."));
			}
		}, pdfTimeoutMs);
		// Render selected pages then send via chunked protocol
		let renderPromises: Promise<string>[] = [];
		for (let i = 0; i < indices.length; i++) {
			renderPromises.push(renderPdfPage(indices[i]));
		}
		let wantAttach = pdfAttach && pdfBuffer && pdfByteLength <= pdfMaxAttachSize;
		Promise.all(renderPromises).then(function(dataUrls) {
			saveMsg.pdfPageCount = dataUrls.length;
			saveMsg.pdfAttach = !!wantAttach;
			saveMsg.pdfDistribute = pdfDistribute;
			saveMsg.pdfAttachName = getPdfFileName(sourceUrlText.textContent || pdfSourceUrl);
			saveMsg.pdfTotalPages = pdfPageCount;
			saveMsg.pageLabel = strings.page;
			saveMsg.pdfPageNumbers = indices.map(function(idx) { return idx + 1; });
			saveMsg.saveImageCount = dataUrls.length;
			saveMsg.saveAttachment = !!wantAttach;
			safeSend(saveMsg);
			// Stream image chunks
			for (let i = 0; i < dataUrls.length; i++) {
				safeSend({ action: "saveImage", index: i, dataUrl: dataUrls[i] });
			}
			// Stream attachment if enabled
			if (wantAttach) {
				let binary = "";
				for (let i = 0; i < pdfBuffer.length; i++) {
					binary += String.fromCharCode(pdfBuffer[i]);
				}
				safeSend({ action: "saveAttachment", dataUrl: "data:application/pdf;base64," + btoa(binary) });
			}
		});
	} else {
		saveMsg.saveImageCount = 0;
		safeSend(saveMsg);
	}
});

// Block keyboard on non-interactive elements — but allow keys needed by screen readers
// NVDA Browse mode uses arrow keys to navigate the virtual buffer; blocking them prevents NVDA from reading content
document.addEventListener("keydown", (e) => {
	// Allow navigation keys (Tab, Escape, arrows) — screen readers need these
	if (e.key === "Tab" || e.key === "Escape"
		|| e.key === "ArrowUp" || e.key === "ArrowDown" || e.key === "ArrowLeft" || e.key === "ArrowRight"
		|| e.key === "Home" || e.key === "End" || e.key === "PageUp" || e.key === "PageDown") {
		return;
	}
	// Allow keyboard on interactive elements (inputs, buttons, links, tabindex items)
	let target = e.target as HTMLElement;
	if (target.tagName === "TEXTAREA" || target.tagName === "INPUT" || target.tagName === "BUTTON"
		|| target.tagName === "A" || target.tagName === "SELECT"
		|| target.hasAttribute("tabindex") || target.getAttribute("role") === "option") {
		return;
	}
	// Allow modifier key combinations (NVDA uses Insert+key, Narrator uses CapsLock+key)
	if (e.altKey || e.ctrlKey || e.metaKey) { return; }
	e.preventDefault();
}, true);
document.addEventListener("wheel", (e) => {
	// Allow scrolling in preview container, preview frame, and sidebar body
	let target = e.target as HTMLElement;
	if (target.closest("#preview-container") || target.closest("#sidebar-body")) {
		return;
	}
	e.preventDefault();
}, { capture: true, passive: false } as any);

// --- Window resize handling ---
// During capture: lock size (captureVisibleTab needs consistent viewport).
// After capture: allow free resizing with minimum enforced via chrome.windows.update.
let resizeLocked = true; // locked until fullPageComplete or PDF mode
let captureWidth = window.outerWidth;
let captureHeight = window.outerHeight;
let resizing = false;
let minWidth = 1000;  // sidebar(322) + 678px content area
let minHeight = 600;

// chrome.windows.create sets the OUTER width, but our content sizing math
// (sidebar 321 + content N) targets the INNER viewport. On Windows popup
// windows the OS chrome (border, scrollbar reservation) eats ~16 CSS px
// from the inner viewport, which the user observed as captured content
// being 1008px instead of the requested 1024px. Compensate once at boot
// by enlarging the outer width by the measured chrome delta so the inner
// viewport ends up matching what the worker originally requested.
(function compensateForOsWindowChrome() {
	let chromeDelta = window.outerWidth - window.innerWidth;
	if (chromeDelta <= 0) { return; }
	try {
		chrome.windows.getCurrent({}, function(w: any) {
			if (!w || !w.id || !w.width) { return; }
			let newOuter = w.width + chromeDelta;
			captureWidth = newOuter; // update lock target before the resize so the resize handler doesn't fight us
			chrome.windows.update(w.id, { width: newOuter });
		});
	} catch (e) { /* best-effort — capture still works at the slightly-narrower size */ }
})();

function unlockResize() {
	resizeLocked = false;
}

window.addEventListener("resize", () => {
	if (resizing) { return; }

	if (resizeLocked) {
		// During capture — snap back to original size
		// Tolerance of 2px prevents infinite loops on macOS (DPI rounding)
		let dw = Math.abs(window.outerWidth - captureWidth);
		let dh = Math.abs(window.outerHeight - captureHeight);
		if (dw <= 2 && dh <= 2) { return; }
		resizing = true;
		try {
			chrome.windows.getCurrent({}, (w: any) => {
				if (w && w.state === "maximized") {
					chrome.windows.update(w.id, { state: "normal", width: captureWidth, height: captureHeight }, () => { resizing = false; });
				} else {
					window.resizeTo(captureWidth, captureHeight);
					setTimeout(() => { resizing = false; }, 200);
				}
			});
		} catch (e) {
			window.resizeTo(captureWidth, captureHeight);
			setTimeout(() => { resizing = false; }, 200);
		}
		return;
	}

	// After capture — enforce minimum size via chrome.windows.update
	// (window.resizeTo doesn't reliably work in Chrome popup windows)
	let w = window.outerWidth;
	let h = window.outerHeight;
	if (w < minWidth || h < minHeight) {
		resizing = true;
		try {
			chrome.windows.getCurrent({}, (win: any) => {
				if (win) {
					chrome.windows.update(win.id, {
						width: Math.max(w, minWidth),
						height: Math.max(h, minHeight)
					}, () => { resizing = false; });
				} else {
					resizing = false;
				}
			});
		} catch (e) {
			resizing = false;
		}
	}
});

// Modal-like focus: renderer opens focused (chrome.windows.create with focused:true).
// No blur re-focus — it fought Alt+Tab, sign-in popups, and required multiple guard
// flags (saveDone, region, signingIn). Content area has pointer-events:none and iframes
// have tabindex="-1", so no functional need for aggressive focus stealing.
// Note: screen reader testing found Edge disables accessibility API flags for extension
// popup windows (edge://accessibility shows Screen reader:disabled), so SR compat was
// not the primary reason for removal — but keeping it removed avoids future conflicts.
let signingIn = false; // Used by sign-in flow

// Signal that the renderer is ready
safeSend({ action: "ready" });
