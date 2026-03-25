# Plan: Unified Clipper Window

## Context

The OneNote Web Clipper previously used two separate UI contexts: an injected iframe sidebar on the original page, and a separate renderer popup window for full-page screenshot capture. This created a jarring experience.

**Goal:** Merge the clipper UI into the renderer window so everything lives in one place.

## V1 — Implemented

### Layout
```
Window width: 1280 (content) + 322 (sidebar) = ~1602px
┌──────────────────────────────────┬──────────────┐
│                                  │              │
│  Content iframe (1280px)         │  Sidebar     │
│  pointer-events: none            │  (322px)     │
│                                  │              │
│  During capture: live render     │  Logo        │
│  (scrolling page)                │  Progress    │
│                                  │  "3 of 5"    │
│  After capture: scrollable       │  Cancel btn  │
│  preview image                   │              │
│                                  │  Save btn    │
│                                  │              │
└──────────────────────────────────┴──────────────┘
```

### What V1 Includes
- Branded sidebar with OneNote logo (`onenote_logo_clipper.png`)
- OneNote purple theme via `renderer.less` (uses `@OneNotePurple`, `@DarkBackgroundColor`, `@DarkHoverColor`)
- Localized progress text ("Capturing {0} of {1}...") via `fullPageStrings` in session storage
- Sidebar pixel cropping: `captureVisibleTab` captures full window, canvas only draws left content area
- Preview phase: iframe hides, scrollable image appears with Save/Close buttons
- Cancel closes window (port disconnect triggers cleanup)
- All i18n keys from existing `strings.json` + two new keys (`IncrementalProgress`, `Saving`)

### Files Modified (V1)
| File | Change |
|------|--------|
| `src/renderer.html` | Flexbox layout: content iframe + sidebar div, references `renderer.css` and logo |
| `src/styles/renderer.less` | NEW — LESS styles using OneNote brand colors |
| `src/scripts/renderer.ts` | Sidebar progress, capture cropping, preview phase, i18n string application |
| `src/scripts/contentCapture/fullPageScreenshotHelper.ts` | Passes `fullPageStrings` i18n map via session storage |
| `src/scripts/extensions/webExtensionBase/webExtensionWorker.ts` | Window width = content + sidebar, passes `totalViewports` |
| `src/strings.json` | New keys: `ScreenShot.IncrementalProgress`, `ScreenShot.Saving` |
| `gulpfile.js` | Compiles `renderer.less` alongside `clipper.less` |

---

## V2/V3 — Implemented: Full Clipper UI in Unified Window

### Design Principle
- **V2**: Post-auth UI (modes, save, region, section picker) in the renderer window
- **V3**: Self-contained sign-in — sign-in also moved into the renderer; no clipperInject.ts injection at all
- No Mithril.js — plain HTML/TS sidebar with port messages to the worker
- **Self-contained extraction** — Readability and bookmark metadata extracted directly in renderer from content-frame DOM, no round-trip to worker/clipper.tsx

### Flow (Current)

**No clipperInject.ts injection. No Mithril sidebar. Everything in the renderer window.**

```
┌─────────────────────────────────────────────────────────────────────┐
│ 1. USER CLICKS EXTENSION BUTTON                                     │
│                                                                     │
│    Worker.closeAllFramesAndInvokeClipper()                          │
│      ├─ activeRendererWindowId set? → focus existing window, return │
│      └─ openRendererWindow()                                        │
│           ├─ clipperData.getValue("isUserLoggedIn")                 │
│           └─ launchRenderer(signedIn: boolean)                      │
└─────────────────────────────────────────────────────────────────────┘
                            │
              ┌─────────────┴─────────────┐
              ▼                           ▼
┌──────────────────────┐    ┌──────────────────────────────────┐
│ NOT SIGNED IN        │    │ SIGNED IN                        │
│                      │    │                                  │
│ Opens renderer window│    │ Opens renderer window            │
│ (no content capture) │    │ + injects contentCaptureInject.js│
│                      │    │   into original tab (parallel)   │
│ Renderer detects no  │    │                                  │
│ userInformation in   │    │ contentCaptureInject cleans DOM, │
│ localStorage         │    │ sends HTML, title, URL           │
│   → shows sign-in    │    │   → sendMessage to worker        │
│     overlay          │    │   → worker stores in             │
│                      │    │     chrome.storage.session        │
└──────┬───────────────┘    └──────────────┬───────────────────┘
       │                                   │
       ▼                                   ▼
┌──────────────────────┐    ┌──────────────────────────────────┐
│ 2. SIGN-IN FLOW      │    │ 3. CAPTURE FLOW                  │
│                      │    │                                  │
│ User clicks MSA or   │    │ Renderer port "ready"            │
│ OrgId button         │    │   → worker sends "loadContent"   │
│   → port: signIn     │    │     (after content captured)     │
│   → worker opens     │    │                                  │
│     OAuth popup via   │    │ Renderer loads HTML into iframe, │
│     windows.create    │    │ processes CSS, sends "dimensions"│
│   → webRequest detects│    │                                  │
│     redirect          │    │ Worker scroll-capture loop:      │
│   → updateUserInfoData│    │   scroll → captureVisibleTab     │
│   → port: signInResult│    │   → drawCapture → drawComplete   │
│                      │    │   → repeat until atBottom         │
│ Renderer hides overlay│    │   → finalize                     │
│ shows sidebar + iframe│    │                                  │
│ injects content       │    │ Renderer stitches JPEG on canvas,│
│ capture script        │    │ stores in session storage,       │
│   → proceeds to ──────┼───►│ enables mode buttons + sign-out  │
│     capture flow      │    │                                  │
└──────────────────────┘    └──────────────┬───────────────────┘
                                           │
                                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 4. MODE SELECTION                                                   │
│                                                                     │
│ Full Page: preview-container shows stitched JPEG (cached)           │
│ Article:  Readability on content-frame DOM clone → preview-frame    │
│ Bookmark: og:image/description from DOM → card in preview-frame     │
│ Region:   overlay injected on original tab → crosshair selection    │
│           → captureVisibleTab → canvas crop → multi-region support  │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 5. SAVE (CLIP)                                                      │
│                                                                     │
│ lockSidebar() — all controls + sign-out disabled                    │
│ Renderer → port: { action: "save", title, annotation, url, mode,   │
│                    sectionId, contentHtml }                         │
│ Worker reads accessToken from localStorage via offscreen            │
│ Worker builds multipart form (ONML + image MIME parts)              │
│ Worker POSTs to https://www.onenote.com/api/v1.0/.../pages         │
│ Worker → port: { action: "saveResult", success, pageUrl/error }     │
│                                                                     │
│ Success: Clip → "View in OneNote" link, Close stays                 │
│ Error: error message + expandable diagnostics (correlationId, date) │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 6. SIGN-OUT                                                         │
│                                                                     │
│ Renderer → port: { action: "signOut", authType }                    │
│ Worker: doSignOutAction (hits sign-out URL)                         │
│ Worker: clears userInformation, notebooks, curSection, isUserLoggedIn│
│ Worker → port: { action: "signOutComplete" }                        │
│ Renderer: full UI reset (clears DOM, caches, notebook dropdown)     │
│ Renderer: shows sign-in overlay (stays in same window)              │
│                                                                     │
│ User can sign in again as same or different user without closing    │
└─────────────────────────────────────────────────────────────────────┘

WINDOW LIFECYCLE:
  • Duplicate prevention: activeRendererWindowId check
  • Tab navigation: tabs.onUpdated closes renderer when source tab URL changes
  • Focus retention: blur handler re-focuses (disabled during sign-in + region)
  • Resize lock: resize handler + chrome.windows API reverts maximize
  • UI lock: sign-out + controls disabled during capture and save
  • Cleanup: port disconnect removes window + session storage keys

MESSAGE PROTOCOL (port — all renderer sends via safeSend() wrapper):
  Renderer → Worker: ready, dimensions, scrollResult, drawComplete,
                     finalizeComplete, save, startRegion, signIn, signOut,
                     telemetry, openFeedback
  Worker → Renderer: loadContent, scroll, initCanvas, drawCapture,
                     finalize, saveResult, regionCaptured, regionCancelled,
                     signInResult, signOutComplete

MESSAGE PROTOCOL (chrome.runtime.sendMessage — JSON strings):
  contentCaptureInject → Worker: contentCaptureComplete
  regionOverlay → Worker: regionSelected, regionCancelled
```

### Layout
```
Window width: 1280 (content) + 322 (sidebar) = ~1602px
┌──────────────────────────────────┬──────────────────────┐
│                                  │ Logo  OneNote Clipper │
│  content-frame (capture)         │                      │
│  OR preview-frame (article/bkmk) │ [Full Page] selected │
│  OR preview-container (JPEG)     │ [Article]            │
│  OR region thumbnails + add btn  │ [Bookmark]           │
│                                  │ [Region]             │
│  pointer-events: none (capture)  │ ─────────────────    │
│  scrollbar visible (preview)     │ TITLE  [textarea]    │
│                                  │ NOTE   [textarea]    │
│                                  │ SOURCE url           │
│                                  │ SAVE TO [dropdown]   │
│                                  │                      │
│                                  │ [Cancel] [Clip]      │
│                                  │ progress/status/error│
│                                  │                      │
│                                  │ user@email | Sign out│
└──────────────────────────────────┴──────────────────────┘
```

### Three Content Panels (Left Side)
- **content-frame** (`<iframe>`): Loads page HTML for capture. DOM also used as source for Readability and bookmark extraction. Visible during capture, hidden after.
- **preview-frame** (`<iframe>`): Article and bookmark HTML rendered via `document.write`. Hidden during full-page/region mode.
- **preview-container** (`<div>`): Scrollable JPEG preview image after capture (full-page), OR region thumbnails with ×remove buttons and "+Add another region" button. Scrollbar visible. Hidden during article/bookmark modes.

### Sidebar Implementation
Plain HTML + TypeScript — no Mithril dependency:
- **Mode buttons**: 4 buttons with SVG icons. Full Page pre-selected. All modes disabled during capture, enabled after.
- **Title**: `<textarea>` pre-filled from page title (session storage), editable
- **Note**: `<textarea>` placeholder "Add a note..."
- **Source URL**: read-only display from session storage
- **Section picker**: `<select>` dropdown populated from `localStorage.notebooks` cache + auto-refreshed from OneNote API. Flattens notebook > section hierarchy including section groups. Selection persisted to `localStorage.curSection`. Token expiration check uses relative `accessTokenExpiration` with `lastUpdated` offset.
- **Button row**: Cancel + Clip side by side (flex row). Clip disabled during capture and save.
- **Status panel**: Below buttons. Shows capture progress during screenshot, "Saving..." during API call, error + expandable diagnostics on failure.
- **User info footer**: Pinned to bottom of sidebar (outside sidebar-body). Shows user email/name + "Sign out" link. Hidden if no user info available. Disabled during save lock.

### Region Capture
Standalone `regionOverlay.ts` injected directly into original tab via `scripting.executeScript`. No Mithril, no clipper.tsx reactivation.
- **Overlay**: Full-viewport div with crosshair cursor, canvas-based dark overlay with hole-punch selection
- **Instruction bar**: Centered pill at top with i18n instruction text + "Back (Esc)" button. Uses Shadow DOM for CSS isolation from page styles. Hides during drag, reappears on too-small selection. i18n strings passed from renderer → worker → `window.__regionStrings` injection before overlay script.
- **Selection**: Mouse drag draws rectangle. Min 5px. Esc/Back cancels (stays in region mode, shows thumbnails or "Add another region").
- **Message format**: JSON string via `chrome.runtime.sendMessage` (required by offscreen.ts message handler)
- **Capture**: Worker captures original tab as JPEG 95% via `captureVisibleTab`, sends full image + coords via port
- **Crop**: Renderer crops using canvas with DPR handling, converts to JPEG 95%
- **Multi-region**: `regionImages[]` array accumulates captures. Thumbnails with ×remove buttons and "+Add another region" button. Regions cached across mode switches within session. Each region stored as separate session storage key (`regionImage_0`, `regionImage_1`, ...) to avoid size limits.
- **Save**: Worker reads individual region keys, converts each to blob, builds ONML with one `<img>` per region separated by `&nbsp;`
- **Focus**: Renderer blur handler skips re-focus when `currentMode === "region"`. Worker focuses original tab's window via `tabs.get` + `windows.update`.

### Sign-Out Flow
Message-based, stays in renderer window (V3):
1. Renderer: `safeSend({ action: "signOut", authType })`
2. Worker: `doSignOutAction(authType)` hits sign-out URL, `clipperData.removeKey()` for userInformation/curSection/notebooks/isUserLoggedIn
3. Worker → port: `{ action: "signOutComplete" }`
4. Renderer: full UI reset (clears DOM, caches, notebook dropdown)
5. Renderer: shows sign-in overlay (stays in same window, user can sign in again)

### Section Refresh
Auto-fetch on renderer open (runs in background during capture):
1. Reads access token from `localStorage.userInformation` (TimeStampedData format)
2. Checks token expiration: `(lastUpdated + accessTokenExpiration * 1000 - 180000) < Date.now()`
3. Fetches `https://www.onenote.com/api/v1.0/me/notes/notebooks?$expand=sections,sectionGroups($expand=sections,sectionGroups)`
4. Compares with cached — only updates dropdown if data changed
5. Preserves selected section if still exists in fresh data
6. Silently keeps cached data on failure

### Save Flow (Worker Side)
Worker receives `{ action: "save" }` port message and:
1. Reads page URL from session storage
2. Gets access token from `clipperData.getValue("userInformation")` → `data.accessToken`
3. Builds OneNote page ONML: annotation → "Clipped from" citation → content
   - Full Page: image MIME part from `fullPageFinalImage` session storage
   - Region: multiple image MIME parts from `regionImage_N` session storage keys
   - Article/Bookmark: HTML from `contentHtml` message field
4. Generates UTC offset timestamp matching `OneNotePage.formUtcOffsetString`
5. POSTs multipart form to `https://www.onenote.com/api/v1.0/me/notes/sections/{sectionId}/pages`
6. On success: parses `links.oneNoteWebUrl.href` from response, sends `saveResult` with `pageUrl`
7. On error: captures error message, status, X-CorrelationId, X-UserSessionId, date; sends as `saveResult`

### i18n
Renderer reads `localStorage.locStrings` directly (shared extension origin). Falls back to hardcoded English. No session storage dependency for strings (legacy `fullPageStrings` passthrough still exists in fullPageScreenshotHelper but unused).

### Window Lifecycle
- **Duplicate prevention**: `closeAllFramesAndInvokeClipper` override checks `activeRendererWindowId`
- **Tab navigation**: `tabs.onUpdated` listener closes renderer when source tab URL changes
- **Focus retention**: `blur` handler re-focuses renderer (disabled after save and during region capture)
- **Resize lock**: `resize` handler snaps back to original dimensions
- **Cleanup**: port disconnect (Cancel click or window close) triggers worker cleanup

### Files Modified (V2/V3)
| File | Change |
|------|--------|
| `src/renderer.html` | Two iframes + sidebar with mode buttons, metadata fields, button row, status panel, user-info footer |
| `src/styles/renderer.less` | Full sidebar styles, user-info footer, region thumbnails/buttons, preview scrollbar |
| `src/scripts/renderer.ts` | Mode switching, Readability, bookmark extraction, section picker + auto-refresh, region capture + multi-region, sign-out, save flow, UI lock, i18n |
| `src/scripts/extensions/webExtensionBase/webExtensionWorker.ts` | Save handler (fullpage/region/article/bookmark), sign-out handler, region overlay injection + message listener, duplicate window guard, tab nav listener |
| `src/scripts/extensions/regionOverlay.ts` | NEW — Standalone crosshair overlay for region selection on original tab |
| `src/scripts/contentCapture/fullPageScreenshotHelper.ts` | Passes pageTitle, legacy i18n strings |
| `src/scripts/clipperUI/clipper.tsx` | hideUi for signed-in users, post-sign-in transition, showSignInPanel handler, non-signed-in guard |
| `src/scripts/extensions/clipperInject.ts` | showUi handler (mirror of hideUi) |
| `src/scripts/constants.ts` | New keys: showUi, showSignInPanel, startRegionCapture, regionCaptureComplete, regionCaptureCancelled |
| `gulpfile.js` | Compiles + deploys regionOverlay.js to Chrome and Edge targets |

---

## Verification Checklist

### V1 (Done)
- [x] Window opens at correct width (content + sidebar)
- [x] Sidebar shows OneNote branding and progress
- [x] Captures exclude sidebar pixels
- [x] Preview appears after capture
- [x] Cancel/Close works
- [x] All strings localized
- [x] LESS styles compiled and deployed

### V2/V3 (Done)
- [x] Mode buttons switch left panel content (Full Page, Article, Bookmark, Region)
- [x] Article mode: Readability extracts content directly from content-frame DOM
- [x] Bookmark mode: metadata card with og:image/description from DOM
- [x] Title editable, Note field, Source URL display
- [x] Custom section picker (ul/li dropdown) with scrollbar + auto-refresh from API
- [x] Clip saves to OneNote via direct fetch to API (multipart form)
- [x] Window stays open after capture for mode switching
- [x] Save includes annotation, "Clipped from" citation, timestamp
- [x] Post-save "View in OneNote" button with page URL from API response
- [x] Error display with expandable diagnostic info (correlation ID, date, status)
- [x] i18n from localStorage (locStrings) — no session storage dependency
- [x] Duplicate window prevention (focus existing on re-click)
- [x] Tab navigation detection closes renderer window
- [x] Modal-like focus (blur handler re-focuses renderer, disabled during sign-in + region)
- [x] UI lock during capture and save (all inputs + sign-out disabled)
- [x] Close + Clip side-by-side button row
- [x] Region capture: canvas-drawn crosshair overlay, overflow:hidden on root
- [x] Multi-region: thumbnails, ×remove, +add another, cached across mode switches
- [x] Region save: multiple images as separate MIME parts in ONML
- [x] Self-contained sign-in: MSA/OrgId overlay, OAuth popup, no clipperInject injection
- [x] Sign-out from renderer → shows sign-in overlay (stays in same window)
- [x] Sign-out cleanup: clears notebooks, section cache, stale capture data
- [x] Content capture via standalone contentCaptureInject.ts (master DomUtils pipeline + enhancements, no imports, no iframe injection)
- [x] Position neutralization with `!important` prevents sticky element duplication in stitched captures
- [x] Stylesheet caching removed — renderer fetches CSS directly via `<link>` tags
- [x] `[hidden]{display:none!important}` CSS override enforces HTML hidden attribute
- [x] `safeSend()` wrapper on all port.postMessage calls (handles disconnected port from devtools)
- [x] User info footer pinned to sidebar bottom
- [x] Preview container + sidebar-body scrollbars visible
- [x] Full-page preview restored from cached data URL when switching modes
- [x] Anti-maximize: chrome.windows API reverts maximized state
- [x] Article/bookmark preview: links disabled (pointer-events: none), consistent scrollbar
- [x] Feedback link in footer: smiley icon + i18n label, hidden for MSA users, opens MS Feedback Portal popup with context params (LogCategory, originalUrl, clipperId, usid, version, type). Per-session USID (cccccccc- prefix) sent as X-UserSessionId header in save API calls for log correlation.
- [x] Error diagnostics copy button: clipboard icon next to "More information", copies error text via navigator.clipboard.writeText

---

## Known Limitations

### Capture Quality
1. **Viewport width vs responsive breakpoints** — Content-frame renders at 1280px. Most sites (including MS Learn at 1088px breakpoint) render correctly, but sites with breakpoints above 1280px may lose sidebars or switch to mobile layout. CSS `zoom` doesn't affect media queries. Widening the cap is possible but creates wider images. A future approach could capture at the original tab viewport width and scale on save.
2. ~~Sticky element duplication~~ — Resolved. Position neutralization (`sticky → relative`, `fixed → absolute`) now uses `!important` via `setProperty()` in both `contentCaptureInject.ts` and `renderer.ts`, beating CSS utility classes like `.position-sticky{position:sticky!important}`. Hidden duplicate elements (e.g., MS Learn collapsible TOC) handled by `inlineHiddenElements` + `[hidden]{display:none!important}` CSS override.
3. ~~Bottom void on grid-layout sites~~ — Resolved. Canvas is trimmed to `stitchYOffset` (actual pixels drawn) during finalize, removing any trailing blank space.
4. **Right-edge clipping** — Pages with 0 margins may get content cut off at the right edge.
5. **Canvas height cap** — Maximum stitched canvas height is 16384px (browser limitation).
6. **Video/streaming embeds** — YouTube and other iframe-based video embeds show broken players in the content iframe (cross-origin restrictions, no JS execution). Server-side Puppeteer had the same limitation (showed "Unable to execute Javascript"). Left as-is to avoid accidentally stripping legitimate iframe content.
7. **Client-side rendered / Shadow DOM sites** — Sites that deliver a blank JavaScript shell and render all content client-side via web components (e.g., MSN.com rebuilt on Microsoft FAST framework) produce empty captures. `document.cloneNode(true)` cannot copy shadow root content per the DOM spec, so custom element shells clone as empty boxes. This is a **pre-existing limitation** — server-side Puppeteer also ran with `--disable-javascript` and would see the same blank shell. Affects both full-page screenshot and article extraction (Readability finds no content). Potential future mitigations: `Element.getHTML({ serializableShadowRoots: true })` API, manual shadow root traversal, or `document.body.innerText` fallback for article mode.

### ~~Missing Features~~ Implemented
6. ~~**Self-contained sign-in**~~ — Implemented. Worker opens renderer directly on button click (no clipperInject.ts injection). Renderer checks `localStorage.userInformation` — shows MSA/OrgId sign-in overlay when not signed in. Sign-in via port messages, OAuth popup via `chrome.windows.create`, `auth.updateUserInfoData` on redirect. Content capture via standalone `contentCaptureInject.ts` (injected by worker via `scripting.executeScript`). Sign-out stays in renderer (shows sign-in overlay, clears storage). Custom section picker with scrollable `<ul>/<li>` dropdown. UI locked during capture to prevent race conditions. Region overlay selection border drawn on canvas (no separate div). Old injected sidebar (clipperInject.ts → clipper.tsx → Mithril) is now dead code.

### UI Polish (Deferred)
7. **Toolbar layout redesign** — Current sidebar takes 322px width. A top-bar + bottom-bar layout would eliminate the sidebar width tax, making the window narrower and giving content full width.

### Technical Debt
8. ~~fullPageStrings in session storage~~ — Resolved. Removed legacy i18n passthrough from fullPageScreenshotHelper.ts. Renderer reads from localStorage directly.
9. ~~fullPageScreenshotHelper promise~~ — Resolved. Promise now resolves on `finalizeComplete` with `{ success: true, format: "jpeg", cssWidth }`. Session storage cleanup runs correctly; `fullPageFinalImage` kept for save flow, cleaned up on window close.
10. ~~Save URL from session storage~~ — Resolved. URL now passed via port message (`message.url`) instead of session storage. All save parameters (title, url, annotation, mode, sectionId, contentHtml) come from the port message. Only `fullPageFinalImage` and `regionImage_N` keys remain in session storage (too large for port messages).
11. **Readability bundled in renderer** — Dynamic import pattern added but browserify converts to synchronous require (no code-splitting). True lazy-loading requires bundler upgrade (webpack, rollup, esbuild).
12. **ES target compatibility** — Project targets old ES version. `String.startsWith()` not available, must use `indexOf`. Silent build failures if modern APIs are used.
13. **chrome.runtime.sendMessage format** — offscreen.ts does `JSON.parse(message)` on ALL incoming messages. New scripts sending via `chrome.runtime.sendMessage` must use `JSON.stringify(...)` not plain objects.

### Telemetry
14. **Renderer telemetry** — Renderer sends funnel events via port `{ action: "telemetry", data: LogDataPackage }`. Worker routes to `this.logger` via `Log.parseAndLogDataPackage()`. Uses imported enums: `Funnel.Label`, `LogMethods`, `Session.EndTrigger`.
15. **Console output requires flag** — `LogManager.createExtLogger()` returns a `StubSessionLogger` (no-op) unless `enable_console_logging` is `"true"` in localStorage. To enable: open any extension page console (renderer, offscreen) and run `localStorage.setItem("enable_console_logging", "true")`, then reload extension. Logs appear in the **service worker console** (edge://extensions → Inspect service worker), not in the renderer or page console.
16. **No external telemetry endpoint** — All logging goes to `console.log()` via `ConsoleLoggerDecorator → WebConsole`. No HTTP POST, no Application Insights, no Aria SDK. The decorator pattern allows plugging in a real backend later.
