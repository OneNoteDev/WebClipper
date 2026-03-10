# Plan: Unified Clipper Window

## Context

The OneNote Web Clipper previously used two separate UI contexts: an injected iframe sidebar on the original page, and a separate renderer popup window for full-page screenshot capture. This created a jarring experience.

**Goal:** Merge the clipper UI into the renderer window so everything lives in one place.

## V1 — Implemented (Current)

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

## V2 — Implemented: Full Post-Auth UI in Unified Window

### Design Principle
- **Sign-in stays in the existing injected sidebar** — one-time gate, rarely shown
- **Everything after sign-in moves to the unified window** — mode selection, preview, clip controls
- No Mithril.js migration — plain HTML/TS sidebar with port messages to the worker
- **Self-contained extraction** — Readability and bookmark metadata extracted directly in renderer from content-frame DOM, no round-trip to worker/clipper.tsx

### Flow (As Built)
```
1. User clicks extension button
   → Worker checks activeRendererWindowId — if set, focuses existing window and returns
   → Otherwise: injects clipperInject.ts into page

2a. Not signed in → sidebar shows SignInPanel (existing Mithril flow)
2b. Signed in → clipper.tsx checks localStorage isUserLoggedIn, calls hideUi
   → clipper.tsx starts fullPageScreenshotContent (stores HTML/CSS in session storage)
   → Worker opens renderer window, starts capture automatically (Full Page default)

3. Unified window opens
   → Left: content-frame (capture, DOM source) + preview-frame (article/bookmark) + preview-container (screenshot)
   → Right: sidebar with mode buttons, title/note/source fields, section dropdown, Cancel+Clip buttons, status panel

4. During capture: mode buttons disabled, Clip disabled, progress shown below buttons
   After capture: mode buttons enabled, Clip enabled, preview-container shows screenshot

5. User selects mode
   → Full Page: shows preview-container with stitched JPEG
   → Article: Readability runs on content-frame DOM clone, renders in preview-frame
   → Bookmark: extracts og:image/description from content-frame DOM, renders card in preview-frame
   → Region: disabled (not implemented)

6. User clicks Clip
   → lockSidebar() disables all inputs
   → Renderer sends { action: "save", title, annotation, mode, sectionId, contentHtml } via port
   → Worker reads access token from clipperData, builds multipart form, POSTs to OneNote API
   → Worker sends saveResult back with pageUrl or error details
   → Success: unlockSidebar(), Clip becomes "View in OneNote", Cancel stays
   → Error: unlockSidebar(), error message + expandable diagnostics below buttons
```

### Layout (V2 — As Built)
```
Window width: 1280 (content) + 322 (sidebar) = ~1602px
┌──────────────────────────────────┬──────────────────────┐
│                                  │ Logo  OneNote Clipper │
│  content-frame (capture)         │                      │
│  OR preview-frame (article/bkmk) │ [Full Page] selected │
│  OR preview-container (JPEG)     │ [Article]            │
│                                  │ [Bookmark]           │
│  pointer-events: none            │ [Region] disabled    │
│                                  │ ─────────────────    │
│                                  │ TITLE  [textarea]    │
│                                  │ NOTE   [textarea]    │
│                                  │ SOURCE url           │
│                                  │ SAVE TO [dropdown]   │
│                                  │                      │
│                                  │ [Cancel] [Clip]      │
│                                  │ progress/status/error│
└──────────────────────────────────┴──────────────────────┘
```

### Three Content Panels (Left Side)
- **content-frame** (`<iframe>`): Loads page HTML for capture. DOM also used as source for Readability and bookmark extraction. Visible during capture, hidden after.
- **preview-frame** (`<iframe>`): Article and bookmark HTML rendered via `document.write`. Hidden during full-page mode.
- **preview-container** (`<div>`): Scrollable JPEG preview image after capture. Hidden during article/bookmark modes.

### Sidebar Implementation
Plain HTML + TypeScript — no Mithril dependency:
- **Mode buttons**: 4 buttons with SVG icons. Full Page pre-selected. Article/Bookmark/Region disabled during capture, Region permanently disabled.
- **Title**: `<textarea>` pre-filled from page title (session storage), editable
- **Note**: `<textarea>` placeholder "Add a note..."
- **Source URL**: read-only display from session storage
- **Section picker**: `<select>` dropdown populated from `localStorage.notebooks` cache. Flattens notebook > section hierarchy including section groups. Selection persisted to `localStorage.curSection`.
- **Button row**: Cancel + Clip side by side (flex row). Clip disabled during capture and save.
- **Status panel**: Below buttons. Shows capture progress during screenshot, "Saving..." during API call, error + expandable diagnostics on failure.

### Save Flow (Worker Side)
Worker receives `{ action: "save" }` port message and:
1. Reads page URL from session storage
2. Gets access token from `clipperData.getValue("userInformation")` → `data.accessToken`
3. Builds OneNote page ONML: annotation → "Clipped from" citation → content (image MIME part for fullpage, HTML for article/bookmark)
4. Generates UTC offset timestamp matching `OneNotePage.formUtcOffsetString`
5. POSTs multipart form to `https://www.onenote.com/api/v1.0/me/notes/sections/{sectionId}/pages`
6. On success: parses `links.oneNoteWebUrl.href` from response, sends `saveResult` with `pageUrl`
7. On error: captures error message, status, X-CorrelationId, X-UserSessionId, date; sends as `saveResult`

### i18n
Renderer reads `localStorage.locStrings` directly (shared extension origin). Falls back to hardcoded English. No session storage dependency for strings (legacy `fullPageStrings` passthrough still exists in fullPageScreenshotHelper but unused).

### Window Lifecycle
- **Duplicate prevention**: `closeAllFramesAndInvokeClipper` override checks `activeRendererWindowId`
- **Tab navigation**: `tabs.onUpdated` listener closes renderer when source tab URL changes
- **Focus retention**: `blur` handler re-focuses renderer (disabled after save)
- **Resize lock**: `resize` handler snaps back to original dimensions
- **Cleanup**: port disconnect (Cancel click or window close) triggers worker cleanup

### Files Modified (V2)
| File | Change |
|------|--------|
| `src/renderer.html` | Two iframes + sidebar with mode buttons, metadata fields, button row, status panel |
| `src/styles/renderer.less` | Full sidebar styles: mode buttons, inputs, dropdown, button row, capture panel |
| `src/scripts/renderer.ts` | Mode switching, Readability, bookmark extraction, section picker, save flow, UI lock, i18n |
| `src/scripts/extensions/webExtensionBase/webExtensionWorker.ts` | Save handler, duplicate window guard, tab nav listener, cleanup fixes |
| `src/scripts/contentCapture/fullPageScreenshotHelper.ts` | Passes pageTitle, legacy i18n strings |
| `src/scripts/clipperUI/clipper.tsx` | hideUi for signed-in users, passes pageTitle to helper |
| `src/strings.json` | New key: `WebClipper.Label.SelectClipMode` |

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

### V2 (Implemented)
- [x] Mode buttons switch left panel content (Full Page, Article, Bookmark)
- [x] Article mode: Readability extracts content directly from content-frame DOM
- [x] Bookmark mode: metadata card with og:image/description from DOM
- [x] Title editable, Note field, Source URL display
- [x] Section picker from cached localStorage notebooks
- [x] Clip saves to OneNote via direct fetch to API (multipart form)
- [x] Injected sidebar auto-hides for signed-in users
- [x] Window stays open after capture for mode switching
- [x] Save includes annotation, "Clipped from" citation, timestamp
- [x] Post-save "View in OneNote" button with page URL from API response
- [x] Error display with expandable diagnostic info (correlation ID, date, status)
- [x] i18n from localStorage (locStrings) — no session storage dependency
- [x] Duplicate window prevention (focus existing on re-click)
- [x] Tab navigation detection closes renderer window
- [x] Modal-like focus (blur handler re-focuses renderer)
- [x] UI lock during save (all inputs disabled during API round-trip)
- [x] Cancel + Clip side-by-side button row
- [x] Mode buttons disabled during capture, Region button permanently disabled

---

## V2 Known Limitations

### Missing Features
1. **Region/crop mode** — Button visible but disabled. Requires hiding the renderer, injecting a crosshair overlay on the original tab, capturing the selected area, and sending it back. Complex coordination between renderer and content script.
2. **Sign-out mechanism** — No way to sign out from the unified window. The old sidebar's footer had sign-out. Need to add user info display + sign-out button to the renderer sidebar.
3. **Section list refresh** — Reads cached notebooks from localStorage (populated by old sectionPicker.tsx). No independent refresh from OneNote API. Cache may be stale if notebooks changed. Future: fetch fresh notebooks directly in the renderer using the access token.
4. **CSP-blocked pages** — Injecting clipperInject.ts on pages with strict CSP (e.g., Azure DevOps) causes console errors. The sidebar injection still runs before hideUi. Long-term fix: skip injection entirely for signed-in users, open renderer directly from worker.

### UI Polish (Deferred to V3)
5. **Horizontal toolbar layout** — Current sidebar takes 322px width. A top-bar + bottom-bar layout would eliminate the sidebar width tax, making the window narrower and giving content full width. Draft:
   ```
   ┌─────────────────────────────────────────────────────────┐
   │ Logo | Title [...] | Note [...] | Mode [v] dropdown     │ top bar
   ├─────────────────────────────────────────────────────────┤
   │                                                         │
   │  Preview / Screenshot (full width, no sidebar crop)     │ main area
   │                                                         │
   ├─────────────────────────────────────────────────────────┤
   │ Save to [dropdown]                [Cancel]  [Clip]      │ bottom bar
   └─────────────────────────────────────────────────────────┘
   ```
   Benefits: works on narrow screens, cleaner hierarchy, no sidebar pixel cropping needed during capture. Requires significant refactor of HTML/LESS/TS and capture pipeline.

### Technical Debt
6. **fullPageStrings in session storage** — The old i18n passthrough via `fullPageScreenshotHelper.ts` is still present but no longer used by the renderer (which reads from localStorage directly). Can be cleaned up.
7. **fullPageScreenshotHelper promise** — Never resolves after Phase 2f changes (window stays open). The old clipper.tsx waits on this promise indefinitely. Not harmful but untidy.
8. **Readability bundled in renderer** — Increases renderer.js bundle size. Could lazy-load on Article mode switch instead.
