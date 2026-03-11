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
    → captureFullPageScreenshotContent() NOT called (non-signed-in guard)
    → No renderer window opens
2b. Signed in → clipper.tsx checks localStorage isUserLoggedIn, calls hideUi
    → Sets uiExpanded=false so toggleClipper re-invocation works correctly
    → clipper.tsx starts fullPageScreenshotContent (stores HTML/CSS in session storage)
    → Worker opens renderer window, starts capture automatically (Full Page default)

2c. Post-sign-in transition: clipper.tsx detects updateReason === SignInAttempt
    → Hides sidebar, starts capture → opens renderer (same as 2b)

3. Unified window opens
   → Left: content-frame (capture, DOM source) + preview-frame (article/bookmark) + preview-container (screenshot/region thumbnails)
   → Right: sidebar with mode buttons, title/note/source fields, section dropdown, Cancel+Clip buttons, status panel
   → Bottom of sidebar: user email + sign-out link (pinned footer)

4. During capture: mode buttons disabled, Clip disabled, progress shown below buttons
   After capture: mode buttons enabled, Clip enabled, preview-container shows screenshot
   Background: fetchFreshNotebooks() auto-fetches from OneNote API to update section dropdown

5. User selects mode
   → Full Page: shows preview-container with stitched JPEG
   → Article: Readability runs on content-frame DOM clone, renders in preview-frame
   → Bookmark: extracts og:image/description from content-frame DOM, renders card in preview-frame
   → Region: renderer hides, overlay injected on original tab, user draws selection(s)

6. User clicks Clip
   → lockSidebar() disables all inputs + sign-out link
   → Renderer sends { action: "save", title, annotation, mode, sectionId, contentHtml } via port
   → Worker reads access token from clipperData, builds multipart form, POSTs to OneNote API
   → Worker sends saveResult back with pageUrl or error details
   → Success: unlockSidebar(), Clip becomes "View in OneNote", Cancel stays
   → Error: unlockSidebar(), error message + expandable diagnostics below buttons

7. Sign-out: user clicks sign-out link in sidebar footer
   → Renderer sends { action: "signOut", authType } via port
   → Worker clears storage (userInformation, notebooks, curSection, isUserLoggedIn)
   → Worker closes renderer, calls uiCommunicator.showSignInPanel
   → clipper.tsx resets state via getSignOutState(), sets uiExpanded=true
   → clipper.tsx calls injectCommunicator.showUi → sidebar appears with sign-in panel
```

### Layout (V2)
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
- **Selection**: Mouse drag draws rectangle. Min 5px. Esc cancels.
- **Message format**: JSON string via `chrome.runtime.sendMessage` (required by offscreen.ts message handler)
- **Capture**: Worker captures original tab as JPEG 95% via `captureVisibleTab`, sends full image + coords via port
- **Crop**: Renderer crops using canvas with DPR handling, converts to JPEG 95%
- **Multi-region**: `regionImages[]` array accumulates captures. Thumbnails with ×remove buttons and "+Add another region" button. Regions cached across mode switches within session. Each region stored as separate session storage key (`regionImage_0`, `regionImage_1`, ...) to avoid size limits.
- **Save**: Worker reads individual region keys, converts each to blob, builds ONML with one `<img>` per region separated by `&nbsp;`
- **Focus**: Renderer blur handler skips re-focus when `currentMode === "region"`. Worker focuses original tab's window via `tabs.get` + `windows.update`.

### Sign-Out Flow
Message-based, no re-injection:
1. Renderer: `port.postMessage({ action: "signOut", authType })`
2. Worker: `doSignOutAction(authType)` hits sign-out URL, `clipperData.removeKey()` for userInformation/curSection/notebooks/isUserLoggedIn
3. Worker: `windows.remove(renderWindowId)` closes renderer
4. Worker: `uiCommunicator.callRemoteFunction(showSignInPanel)` → clipper.tsx
5. clipper.tsx: `getSignOutState()` resets Mithril state, `uiExpanded = true`, `injectCommunicator.showUi` shows iframe
6. Old sidebar appears with sign-in panel

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

### Files Modified (V2 + V2.5)
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

### V2 (Done)
- [x] Mode buttons switch left panel content (Full Page, Article, Bookmark, Region)
- [x] Article mode: Readability extracts content directly from content-frame DOM
- [x] Bookmark mode: metadata card with og:image/description from DOM
- [x] Title editable, Note field, Source URL display
- [x] Section picker from cached localStorage notebooks + auto-refresh from API
- [x] Clip saves to OneNote via direct fetch to API (multipart form)
- [x] Injected sidebar auto-hides for signed-in users
- [x] Window stays open after capture for mode switching
- [x] Save includes annotation, "Clipped from" citation, timestamp
- [x] Post-save "View in OneNote" button with page URL from API response
- [x] Error display with expandable diagnostic info (correlation ID, date, status)
- [x] i18n from localStorage (locStrings) — no session storage dependency
- [x] Duplicate window prevention (focus existing on re-click)
- [x] Tab navigation detection closes renderer window
- [x] Modal-like focus (blur handler re-focuses renderer, disabled during region capture)
- [x] UI lock during save (all inputs + sign-out disabled during API round-trip)
- [x] Cancel + Clip side-by-side button row
- [x] Region capture with crosshair overlay on original tab
- [x] Multi-region: thumbnails, ×remove, +add another, cached across mode switches
- [x] Region save: multiple images as separate MIME parts in ONML
- [x] Sign-out from renderer sidebar footer → returns to sign-in panel
- [x] Post-sign-in auto-transition: hide sidebar → start capture → open renderer
- [x] Non-signed-in guard: no renderer for unauthenticated users
- [x] User info footer pinned to sidebar bottom
- [x] Preview container scrollbar visible
- [x] Full-page preview restored from session storage when switching back from region mode

---

## Known Limitations

### Capture Quality
1. **Viewport width vs responsive breakpoints** — Content-frame renders at 1280px, which causes some sites (e.g., MS Learn) to hide their left navigation sidebar due to CSS media query breakpoints. Widening the viewport was attempted but CSS `zoom` doesn't affect media queries, and removing the 1280px cap created other issues (wider images, sticky element duplication). Needs a different approach — possibly capturing the original tab viewport width and scaling the final image on save.
2. **Sticky element duplication** — `position: sticky → static` neutralization causes sidebar/TOC elements to render at their natural DOM position AND duplicate when the page grid spans the full height. `sticky → relative` was tried but didn't resolve it. Needs smarter per-element analysis or hiding known duplicate patterns.
3. ~~Bottom void on grid-layout sites~~ — Resolved. Canvas is trimmed to `stitchYOffset` (actual pixels drawn) during finalize, removing any trailing blank space.
4. **Right-edge clipping** — Pages with 0 margins may get content cut off at the right edge.
5. **Canvas height cap** — Maximum stitched canvas height is 16384px (browser limitation).

### ~~Missing Features~~ Implemented
6. ~~**Self-contained sign-in**~~ — Implemented. Worker opens renderer directly on button click (no clipperInject.ts injection). Renderer checks `localStorage.userInformation` — shows MSA/OrgId sign-in overlay when not signed in. Sign-in via port messages, OAuth popup via `chrome.windows.create`, `auth.updateUserInfoData` on redirect. Content capture via standalone `contentCaptureInject.ts` (injected by worker via `scripting.executeScript`). Sign-out stays in renderer (shows sign-in overlay, clears storage). Custom section picker with scrollable `<ul>/<li>` dropdown. UI locked during capture to prevent race conditions. Region overlay selection border drawn on canvas (no separate div). Old injected sidebar (clipperInject.ts → clipper.tsx → Mithril) is now dead code.

### UI Polish (Deferred)
7. **V3 toolbar layout** — Current sidebar takes 322px width. A top-bar + bottom-bar layout would eliminate the sidebar width tax, making the window narrower and giving content full width.

### Technical Debt
8. ~~fullPageStrings in session storage~~ — Resolved. Removed legacy i18n passthrough from fullPageScreenshotHelper.ts. Renderer reads from localStorage directly.
9. ~~fullPageScreenshotHelper promise~~ — Resolved. Promise now resolves on `finalizeComplete` with `{ success: true, format: "jpeg", cssWidth }`. Session storage cleanup runs correctly; `fullPageFinalImage` kept for save flow, cleaned up on window close.
10. ~~Save URL from session storage~~ — Resolved. URL now passed via port message (`message.url`) instead of session storage. All save parameters (title, url, annotation, mode, sectionId, contentHtml) come from the port message. Only `fullPageFinalImage` and `regionImage_N` keys remain in session storage (too large for port messages).
11. **Readability bundled in renderer** — Dynamic import pattern added but browserify converts to synchronous require (no code-splitting). True lazy-loading requires bundler upgrade (webpack, rollup, esbuild).
12. **ES target compatibility** — Project targets old ES version. `String.startsWith()` not available, must use `indexOf`. Silent build failures if modern APIs are used.
13. **chrome.runtime.sendMessage format** — offscreen.ts does `JSON.parse(message)` on ALL incoming messages. New scripts sending via `chrome.runtime.sendMessage` must use `JSON.stringify(...)` not plain objects.
