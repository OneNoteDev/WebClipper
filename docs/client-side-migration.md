# WebClipper Client-Side Migration

## Overview

This document tracks the experiment to remove server-side dependencies from the OneNote Web Clipper's content processing pipeline and replace them with client-side alternatives. The goal is a fully self-contained browser extension that does not rely on the OneNote augmentation/screenshot server APIs.

## Server APIs Removed

### 1. Augmentation API
- **Endpoint:** `onenote.com/onaugmentation/clipperextract/v1.0/`
- **Purpose:** Server-side article/recipe/product extraction using ML models
- **Replacement:** Mozilla Readability (`@mozilla/readability`, Apache 2.0 license)
- **Status:** Complete

### 2. Full Page Screenshot API (DomEnhancer)
- **Endpoint:** `onenote.com/onaugmentation/clipperDomEnhancer/v1.0/`
- **Purpose:** Server-side Puppeteer rendering of page DOM into full-page screenshots
- **Replacement:** Client-side renderer window with scroll-capture and canvas stitching
- **Status:** Functional, with known issues (see below)

---

## Change 1: Article Extraction with Readability.js

### What Changed
- `augmentationHelper.ts` — Rewrote `augmentPage()` to use `new Readability(doc).parse()` locally instead of POSTing to the server API
- Removed `makeAugmentationRequest()` method entirely
- Removed imports: `HttpWithRetries`, `OneNoteApiUtils`, `Settings`, `Constants` (URL refs)
- Added metadata mapping: Readability's `title`, `excerpt`, `byline`, `siteName`, `publishedTime` are stored in `PageMetadata`

### Why Readability.js
- Apache 2.0 license (compatible with WebClipper's MIT license; repo already has Apache 2.0 deps like pdfjs-dist)
- Well-maintained by Mozilla, used in Firefox Reader View
- Produces clean article HTML similar to what the server API returned

### Other Related Changes
- `clipper.tsx` — Removed `UrlUtils.onWhitelistedDomain()` check that gated augmentation mode; FullPage is now the default clip mode
- `constants.ts` — Removed `augmentationApiUrl` constant
- `readability.d.ts` (new) — TypeScript type declarations for `@mozilla/readability`
- `package.json` — Added `@mozilla/readability` dependency
- `augmentationHelper_tests.ts` — Updated tests for new local implementation

---

## Change 2: Full Page Screenshot with Renderer Window

### Architecture

The server-side approach used Puppeteer to render sanitized HTML and produce a full-page screenshot. The client-side replacement mirrors this:

1. **Store HTML in `chrome.storage.session`** — The page's HTML content, base URL, and localized status text are written to session storage (avoids JSON serialization bottleneck with large payloads)
2. **Open a renderer popup window** — An extension page (`renderer.html`) is opened at the same position/size as the user's browser with `focused: true`. Width is capped at 1280px. Zoom is forced to 100% via `chrome.tabs.setZoom`. Title bar shows localized "Clipping Page" status text
3. **Port-based communication** — The renderer page connects to the service worker via `chrome.runtime.connect({ name: "renderer" })`. Commands (loadContent, scroll) are exchanged over this port
4. **Renderer loads content** — Reads HTML from `chrome.storage.session`, strips `<script>` tags, preserves `<style>`, `<link rel="stylesheet">`, and `<meta>` tags. Rewrites relative URLs (images, stylesheets, srcset) to absolute using `new URL(relative, baseUrl)` (CSP blocks `<base href>` on extension pages). Injects cached CSS as `<style>` blocks, fetches remaining cross-origin sheets via `fetch()`. Renders content inside an iframe for CSS isolation. Neutralizes fixed/sticky positioning after stylesheets load. User interaction blocked by transparent overlay div (`#interaction-shield`) + keyboard/wheel JS listeners
5. **Scroll-capture with incremental stitching** — The service worker tells the renderer to scroll to each viewport position, waits 500ms (Chrome's `MAX_CAPTURE_VISIBLE_TAB_CALLS_PER_SECOND` rate limit = 2/sec), then calls `captureVisibleTab()` to take a PNG screenshot (lossless). Each capture is sent back to the renderer via port for immediate drawing onto a hidden canvas (`display:none`, invisible to captureVisibleTab). Scroll stall detection stops capture when `scrollY` stops changing. Canvas height capped at pre-conversion `contentHeight` or 16,384px
6. **Finalize to Blob** — When capture is complete, the renderer trims the canvas to actual content height, converts to JPEG 90% via `canvas.toBlob()`, stores the single final data URL in `chrome.storage.session`. The helper reads this single image and converts to Blob via `fetch(dataUrl).then(r => r.blob())`
7. **Binary MIME part upload** — The Blob is sent as a binary MIME part in the multipart Graph API request (`<img src="name:FullPageImageXXXX" />`), eliminating ~33% base64 encoding overhead
8. **Cleanup** — Renderer window closed, session storage cleaned up (input keys by worker, output key by helper)

### Why This Architecture (Evolution)

The implementation went through many iterations:

| Attempt | Approach | Why It Failed |
|---------|----------|---------------|
| 1 | Scroll user's actual page + captureVisibleTab | Clipper UI visible in captures; visible scrolling was jarring; scrollbars in screenshots |
| 2 | Blob URL popup | Chrome blocks `executeScript` on blob URLs |
| 3 | about:blank popup | Not scriptable in Chrome |
| 4 | Extension page + executeScript | `scripting.executeScript` blocked on extension pages in MV3 |
| 5 | Extension page + port messaging | Works, but large HTML/base64 data broke JSON serialization |
| 6 | Port + chrome.storage.session | Works for all data sizes |
| 7 | Single tall window capture | OS constrains window height to screen dimensions |
| 8 | Off-screen window (`left: -9999`) | Chrome doesn't paint off-screen windows; blank captures |
| 9 | Renderer behind user window (`focused: false` + refocus) | Occluded window not painted; stalls until user exposes it |
| 10 | Full-screen overlay during capture | Flashing between overlay and page content; overlay appeared in screenshots |
| **Final** | **Focused renderer window with title bar status + binary Blob output** | **Current implementation** |

### Image Delivery: Base64 Data URL vs Binary MIME Part

The original implementation used base64-encoded data URLs embedded inline in the ONML body. This was switched to binary MIME parts:

| Aspect | Old (base64 data URL) | New (binary MIME part) |
|--------|----------------------|----------------------|
| Encoding | `canvas.toDataURL()` → base64 string | `canvas.toBlob()` → binary Blob |
| In ONML | `<img src="data:image/jpeg;base64,..." />` | `<img src="name:FullPageImageXXXX" />` |
| Multipart | All content in Presentation part | Separate binary MIME part |
| Size overhead | ~33% from base64 encoding | None (raw binary) |
| Preview | Data URL in `<img>` | `URL.createObjectURL(blob)` |

The `onenoteapi` library's `TypedFormData.asBlob()` already handles mixed string/ArrayBuffer content via the `Blob` constructor. We push the image Blob directly to `page.dataParts` following the same pattern as `addAttachment()`.

### Files Changed

| File | Change |
|------|--------|
| `src/renderer.html` | NEW — Extension page for offscreen rendering |
| `src/scripts/renderer.ts` | NEW — Renderer script: port communication, reads HTML from storage, iframe CSS isolation, incremental canvas stitching, interaction shield |
| `src/scripts/contentCapture/fullPageScreenshotHelper.ts` | REWRITTEN — Reads single final JPEG from session storage, converts to Blob |
| `src/scripts/extensions/webExtensionBase/webExtensionWorker.ts` | Added `takeFullPageScreenshot()` — renderer window creation, scroll-capture loop, sends captures to renderer for stitching |
| `src/scripts/extensions/extensionWorkerBase.ts` | Added abstract `takeFullPageScreenshot()` method + registered function key |
| `src/scripts/extensions/safari/safariWorker.ts` | Fallback: single viewport capture via `takeTabScreenshot()` |
| `src/scripts/extensions/bookmarklet/inlineWorker.ts` | Fallback: throws not-implemented |
| `src/scripts/extensions/chrome/manifest.json` | Added `storage` permission; `renderer.html` as web-accessible resource |
| `src/scripts/constants.ts` | Removed `fullPageScreenshotUrl`; added `takeFullPageScreenshot` function key |
| `src/scripts/saveToOneNote/oneNoteSaveableFactory.ts` | FullPage mode sends binary MIME part instead of base64 data URL |
| `src/scripts/clipperUI/components/previewViewer/fullPagePreview.tsx` | Preview uses `URL.createObjectURL(blob)` for image display |
| `src/scripts/clipperUI/clipper.tsx` | Passes `rawUrl` to `getFullPageScreenshot()` for base URL resolution |
| `gulpfile.js` | Added `bundleRenderer` task to build pipeline |

### Data Flow Diagram (Legacy — Pre-V3)

> **Note:** This diagram shows the original flow via clipper.tsx. As of V3 (self-contained sign-in),
> clipper.tsx is no longer injected. See `docs/unified-window-plan.md` for the current V3 flow diagram
> where the worker opens the renderer directly and `contentCaptureInject.ts` replaces the
> clipper.tsx → fullPageScreenshotHelper.ts chain.

```
[Legacy flow — kept for reference]

clipper.tsx                    extensionWorkerBase.ts           webExtensionWorker.ts
    |                                |                                |
    |-- getFullPageScreenshot() -->  |                                |
    |   (stores HTML + URL +         |                                |
    |    statusText + CSS cache      |                                |
    |    in session storage)         |                                |
    |                                |-- takeFullPageScreenshot() --> |
    |                                |                                |-- windows.create(renderer.html)
    ...                              ...                              ...
    [Save to OneNote]                |                                |
    |-- push Blob to page.dataParts  |                                |
    |-- multipart request with       |                                |
    |   binary MIME part             |                                |
```

### Current Data Flow (V3)
```
User clicks extension button
    → webExtensionWorker.openRendererWindow()
    → checks isUserLoggedIn via offscreen/localStorage
    → injects contentCaptureInject.js into original tab (if signed in)
    → opens renderer.html as popup window

contentCaptureInject.ts (content script on original tab)
    → reads document.documentElement.outerHTML + document.styleSheets
    → chrome.runtime.sendMessage(JSON.stringify({...})) to worker

Worker receives contentCaptureComplete
    → stores HTML/CSS/title/URL in chrome.storage.session
    → sends "loadContent" to renderer via port

Renderer loads content into iframe, sends "dimensions"
    → Worker runs scroll-capture loop (scroll → captureVisibleTab → drawCapture)
    → Renderer stitches on hidden canvas, finalizes to JPEG 95%
    → Stores fullPageFinalImage in session storage

User clicks Clip
    → Renderer sends "save" via port
    → Worker refreshes token (auth.updateUserInfoData)
    → Worker reads JPEG from session storage, builds multipart form
    → Worker POSTs to OneNote API, returns saveResult
```

---

## Key Decisions

| Decision | Rationale |
|----------|-----------|
| `@mozilla/readability` for article extraction | Apache 2.0, used by Firefox Reader View, well-maintained |
| FullPage as default clip mode | Augmentation is no longer server-gated; FullPage is more universally useful |
| Renderer popup window (not direct page scroll) | Avoids visible scrolling, scrollbar artifacts, and clipper UI in screenshots |
| `chrome.storage.session` as data bus | Port/communicator JSON serialization chokes on multi-MB base64 data; session storage used for HTML input and single final JPEG output |
| Port-based messaging (`runtime.connect`) | `scripting.executeScript` blocked on extension pages in MV3 |
| PNG capture, JPEG 90% final output, 1280px width cap | PNG captures are lossless; single JPEG encode at finalize; no double compression; 1280px balances fidelity vs size |
| Renderer-side incremental stitching | Each PNG capture sent to renderer via port (~1-3MB each, within port limits), drawn onto hidden canvas immediately; avoids storing N captures in session storage (was 4-8MB, now ~1-2MB for single final JPEG) |
| Scroll stall detection | Stops capturing when `scrollY` doesn't change between captures; handles inflated `scrollHeight` from fixed→absolute conversion |
| Content height cropping | Measures `scrollHeight` before position conversions; uses pre-conversion height to cap canvas, trimming blank space |
| Interaction shield overlay | Transparent `div` at max z-index blocks all mouse/touch/pointer; keyboard/wheel blocked via JS listeners |
| Binary Blob output (not base64) | Eliminates ~33% base64 encoding overhead; sent as binary MIME part per Graph API multipart spec |
| Title bar for status (not overlay) | Overlay caused flashing during capture; title bar is never part of captured content |
| `focused: true` for renderer window | `captureVisibleTab` requires the window to be painted; unfocused/occluded windows produce blank captures |
| Localized status text via storage | Renderer can't access clipper's Localization module; status text passed through `chrome.storage.session` |

---

## Known Issues / Remaining Work

### 1. CSS Fidelity (Implemented)
- **CSS caching:** `contentCaptureInject.ts` extracts CSS from `document.styleSheets` (CSSOM), sends to worker, stored in `chrome.storage.session`, injected by renderer as `<style>` blocks
- **Fetch fallback:** Cross-origin sheets (SecurityError on `cssRules`) are fetched directly by the renderer via `fetch()` — extension pages have `host_permissions: <all_urls>`
- **Iframe isolation:** Renderer uses `<iframe id="content-frame">` — page CSS and renderer styles never conflict
- **Position neutralization:** `fixed → absolute`, `sticky → static`, viewport-height `min-height` reset
- **Content height cropping:** `scrollHeight` measured before position conversions to avoid inflated canvas height
- **Files:** `contentCaptureInject.ts`, `renderer.ts`, `renderer.html`, `webExtensionWorker.ts`
- **Note:** V3 uses raw `document.documentElement.outerHTML` (not the cleaned DOM from `domUtils.ts`). Shadow DOM flattening, hidden element inlining, and canvas-to-image conversion are not applied — the renderer handles script stripping and URL rewriting directly.
- **Remaining:** Bottom void on some grid-layout sites; right-edge clipping on zero-margin pages; sticky element duplication

### 2. Renderer Window Visibility
- `captureVisibleTab` requires the window to be painted — occluded/off-screen windows produce blank captures
- Current approach: renderer opens focused at same position/size as user's browser, **stays open** for mode switching/editing/save
- Anti-maximize: `chrome.windows` API reverts maximized state; resize handler snaps back to original dimensions
- **Future improvement:** CDP via `chrome.debugger` would allow invisible capture but requires `debugger` permission (shows warning banner)

### 3. Capture Limits
- PNG captures sent individually to renderer via port (no session storage for intermediates)
- Canvas height capped at pre-conversion `contentHeight` or 16,384px (Chrome canvas dimension limit)
- Scroll stall detection stops capture when page can't scroll further
- Final JPEG 95% stored in session storage (~1-2MB); session storage only holds HTML + CSS cache + final image
- Very long pages get bottom truncated; OneNote API would likely reject larger images anyway

### 4. Right-Edge Content
- Renderer width capped at 1280px; wider content reflows via CSS overrides (`max-width: 100%` on images/tables, `pre-wrap` on code)
- Some layouts with explicit pixel widths may still clip
- CDP approach would allow `captureBeyondViewport` for true full-width capture

### 5. Test Infrastructure
- Tests use PhantomJS (deprecated, ES5-only) and were already failing before these changes
- Playwright migration discussed but deferred
- `augmentationHelper_tests.ts` and `fullPagePreview_tests.tsx` updated for new interfaces

### 6. Pre-existing Extension Errors
- `Uncaught TypeError: Cannot read properties of undefined (reading 'logFailure')` — communicator error handler fires before `Clipper.logger` is initialized
- `Could not establish connection. Receiving end does not exist.` — MV3 service worker lifecycle issue; port/message sent after worker suspension

---

## V3 Evolution: Self-Contained Sign-In

The original architecture (described above) required injecting `clipperInject.ts` into the page to show a Mithril-based sign-in sidebar and initiate content capture via `clipper.tsx → fullPageScreenshotHelper.ts`. This failed on pages with strict Content Security Policy (CSP blocks iframe injection).

V3 eliminates this dependency entirely:
- Worker opens the renderer window directly on button click (no `clipperInject.ts`)
- Renderer handles sign-in via MSA/OrgId overlay + OAuth popup
- Content capture via standalone `contentCaptureInject.ts` injected by `scripting.executeScript` (CSP-immune)
- Save with token refresh, telemetry, region capture, article/bookmark modes — all in the renderer
- Old sidebar (clipperInject.ts → clipper.tsx → Mithril) is dead code

See `docs/unified-window-plan.md` for the complete V3 architecture, flow diagram, and verification checklist.

---

## Build & Test

```sh
npm install
npm run build          # Compiles TS, bundles, exports to /target
```

Load the extension from `target/edge/OneNoteWebClipper/edgeextension/manifest/extension/` (Edge) or `target/chrome` (Chrome).

Gulp tasks: `bundleRenderer` (renderer.ts), `bundleRegionOverlay` (regionOverlay.ts), `bundleContentCaptureInject` (contentCaptureInject.ts) — all compiled and deployed to Chrome/Edge targets.
