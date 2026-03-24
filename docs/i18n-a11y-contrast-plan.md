# Renderer UI: i18n, Accessibility & Contrast Fixes

## Context

The new renderer-based unified window (V3) replaces the old Mithril-based injected sidebar. While the new UI uses better semantic HTML (`<button>`, `<textarea>`, `<label>`), it regressed in three areas compared to the old UI:

1. **i18n** — ~15 hardcoded English strings that the old UI localized via `Localization.getLocalizedString()`
2. **Accessibility** — Lost ARIA state attributes, keyboard navigation, focus outlines, and aria-live regions
3. **Contrast** — Error text color `#ff6b6b` fails WCAG AA; region button border fails non-text contrast

The old UI's patterns are the blueprint — most string keys already exist in `strings.json`, and the ARIA patterns are well-documented in the old components.

### How i18n works in this extension

Strings are fetched from `https://www.onenote.com/strings?ids=WebClipper.&locale={locale}` at startup by `extensionBase.ts`, stored in `localStorage.locStrings`. The renderer reads them via `loc(key, fallback)`. The `strings.json` file in the repo is the **English fallback only** — actual translations for 60 locales come from the server. New keys added to `strings.json` will only have English until the server is updated, so **reuse existing keys wherever possible**.

### How locale is detected

`extensionBase.ts` line 133: `navigator.language || navigator.userLanguage` → stored in `localStorage.locale`. A user override is also supported via `localStorage.displayLocaleOverride`. The old UI only set `<html lang="en">` statically — never dynamically. RTL was handled by loading separate CSS files (`clipper-rtl.css`), not via `lang`/`dir` attributes.

## Files Modified

| File | Changes |
|------|---------|
| `src/renderer.html` | `lang` attr, ARIA roles/attributes, `for` associations, aria-live region |
| `src/scripts/renderer.ts` | Wire `loc()` to all remaining strings, dynamic `lang` attr, ARIA state management, keyboard nav, focus management, aria-live announcements |
| `src/styles/renderer.less` | Focus outlines, error color fix, region button contrast, sr-only class, high-contrast media query |

---

## Phase 1: i18n (mirror old `Localization.getLocalizedString()` via existing `loc()`)

### 1a. Wire sign-in panel to `loc()` in renderer.ts

Sign-in panel HTML strings (`signin-description`, `signin-msa-btn`, `signin-orgid-btn`, `signin-progress`) were never replaced by JS. Now wired to existing keys:

- `WebClipper.Label.SignInDescription` → sign-in description
- `WebClipper.Action.SigninMsa` → MSA button
- `WebClipper.Action.SigninOrgId` → OrgId button
- "Signing in..." kept as hardcoded English (no existing key, brief transient state)

### 1b. Wire field labels to `loc()`

- Note label → `WebClipper.Label.Annotation` ("Note")
- Save to label → `WebClipper.Label.ClipLocation` ("Location")
- Source label → kept as hardcoded "Source" (no old UI equivalent, new element)
- Title label → kept as hardcoded "Title" (old UI had no visible label, used placeholder only)

### 1c. Wire remaining hardcoded strings to `loc()`

| String | Key | Key status |
|--------|-----|-----------|
| `"Capture complete"` | — | **REMOVED** — dead code, never referenced |
| `"No notebooks available"` | `WebClipper.SectionPicker.NoNotebooksFound` | EXISTS (60 locales) |
| `"Error loading notebooks"` | `WebClipper.SectionPicker.NotebookLoadFailureMessage` | EXISTS (60 locales) |
| `"Loading article..."` | `WebClipper.Preview.LoadingMessage` | EXISTS (60 locales) |
| `"Article content not available..."` | `WebClipper.Preview.NoContentFound` | EXISTS (60 locales) |
| `"Unknown error"` | — | kept as-is (technical fallback) |
| `"Sign-in failed..."` | `WebClipper.Error.SignInUnsuccessful` | EXISTS (60 locales) |

### 1d. New keys in strings.json — ZERO

All meaningful strings wired to existing server-translated keys. Four strings remain English-only as acceptable fallbacks (Title, Source, Signing in..., Copy diagnostics aria-label).

---

## Phase 2: Contrast Fixes

### 2a. Error text color (CRITICAL — 3.8:1 → 5.3:1)

`.signin-error` color: `#ff6b6b` → `#ff9999` (~5.3:1 on `#56197c`, passes WCAG AA)

### 2b. Region add-button border (1.7:1 → 3.4:1)

Border: `#bbb` → `#999` (~3.4:1 on `#f3f2f1`, passes SC 1.4.11)
Text: `#666` → `#555` (~5.9:1, improvement)

### 2c. Focus outlines (mirroring old `@FocusOnPurpleBackground: #f8f8f8`)

- `#sidebar` interactive elements: `outline: solid 1px #f8f8f8 !important; outline-offset: 1px`
- Sign-in buttons: `outline-offset: 2px`
- High contrast mode: `outline: solid 2px Highlight !important; outline-offset: 2px !important`

---

## Phase 3: Accessibility — ARIA & Keyboard

### 3a. `<html lang>` attribute (WCAG 3.1.1 Level A)

Static `lang="en"` in HTML + dynamic override in JS reading `localStorage.locale` (or `displayLocaleOverride`). Converts `_` to `-` for BCP 47 (e.g., `zh_CN` → `zh-CN`).

### 3b. Mode buttons — ARIA state

- Container: `role="listbox"` with localized `aria-label`
- Buttons: `role="option"`, `aria-selected`, `aria-posinset`, `aria-setsize`
- Mirrors old `modeButton.tsx` pattern exactly

### 3c. Mode buttons — arrow key navigation

Arrow Up/Down/Left/Right + Home/End navigation between mode buttons. Mirrors old `enableAriaInvoke()` from `componentBase.ts`.

### 3d. Section picker — ARIA combobox

- Trigger: `role="combobox"`, `aria-haspopup="listbox"`, `aria-expanded`
- List items: `role="option"`, `aria-selected`
- Escape to close, arrow keys to navigate

### 3e. Label `for` associations

- `<label for="title-field">` and `<label for="note-field">`
- `aria-labelledby` on source-url and section-selected (non-input elements)

### 3f. aria-live regions

- `<div id="aria-status" class="sr-only" aria-live="polite" aria-atomic="true">`
- `announceToScreenReader()` helper for: capture start/complete, mode change, save start/success/error, sign-in error

### 3g. Sign-in focus management

Focus first sign-in button on overlay show; focus first mode button on overlay hide.

### 3h. Copy diagnostics button

`aria-label="Copy diagnostic information"` (hardcoded English — technical label).

### 3i. Sign-out disabled state

Replace `pointer-events: none` + opacity with `aria-disabled="true"` + `tabindex="-1"` (accessible to keyboard/screen readers).

---

## RTL Support Assessment (Deferred — Separate Effort)

**How old UI handled RTL:**
- `localeSpecificTasks.ts` calls `Rtl.isRtl(locale)` (checks `ar, fa, he, sd, ug, ur`)
- Loads `clipper-rtl.css` / `sectionPicker-rtl.css` instead of LTR versions
- `styledFrameFactory.ts` flips iframe position (`left: 0` instead of `right: 0`)

**Locale override:** No UI exists for switching locale. `localStorage.displayLocaleOverride` is a developer/testing mechanism only (set via console).

**What RTL would need for the renderer (estimated ~50-80 LESS lines + testing):**
1. Detect RTL locale and set `dir="rtl"` on `<html>`
2. Convert `renderer.less` to CSS logical properties (`margin-inline-start/end`, etc.)
3. Flip: sidebar position, section picker arrow, user-info alignment, feedback icon margin
4. Test with at least one RTL locale (ar or he)

**Why defer:** RTL affects layout fundamentals. Best done as a dedicated pass.

---

## Implementation Order

1. **Phase 2a** — Error contrast fix (LESS)
2. **Phase 1a–1c** — i18n wiring (renderer.ts only, reuse existing keys)
3. **Phase 2b–2c** — Remaining contrast + focus outlines (LESS)
4. **Phase 3a** — `<html lang>` + dynamic locale (HTML + TS)
5. **Phase 3e** — Label `for` associations (HTML)
6. **Phase 3b–3c** — Mode button ARIA + arrow keys (TS)
7. **Phase 3d** — Section picker ARIA (HTML + TS)
8. **Phase 3f** — aria-live regions (HTML + LESS + TS)
9. **Phase 3g–3i** — Focus management, copy button label, signout disabled state (TS)

---

## Verification

1. **Build**: `npm run build` — check for TS compilation errors
2. **Edge target**: Verify `renderer.js` and `renderer.css` in target output
3. **Manual testing in Edge** (verified):
   - Sign-in panel: localized text appears
   - Mode buttons: arrow key navigation, `aria-checked` updates in devtools
   - Section picker: `aria-expanded` toggles, Escape closes, arrow keys navigate items
   - Save error: `#ff9999` error text readable
   - Tab order: mode buttons → title → note → section → Clip → Cancel → feedback → sign out (wraps)
   - Focus outlines: `2px solid #f8f8f8` visible on all sidebar controls
   - Focus management: Cancel focused during capture → Full Page button after capture → sign-in button on overlay
4. **No functional regressions**: Capture, save, region, article, bookmark modes all work
5. **Screen reader testing** (implemented but unable to verify):
   - ARIA roles, states, and aria-live announcements are implemented
   - Accessibility tree verified correct via `edge://accessibility` — all nodes present with proper roles
   - **Platform blocker**: Edge does not activate accessibility API flags (`Native`, `Web`, `Screen reader`) for extension popup windows opened via `chrome.windows.create`. The `edge://accessibility` page shows `Screen reader: disabled` for the renderer window while normal tabs show `Screen reader: true`. This prevents NVDA and Narrator from reading web content in the popup — they only see window chrome (minimize/maximize/close)
   - Blur handler was removed to avoid conflicting with screen reader focus management
   - Keydown handler allows navigation keys (arrows, Tab, Escape, Home/End, PageUp/PageDown) and modifier combos to pass through for screen reader compatibility
   - **NVDA + Edge testing context**: NVDA 2025.3.3 was tested with Edge but was not reliably speaking web content even on normal webpages. The official OneNote Web Clipper from the Edge extension store also does not speak with NVDA — its injected sidebar is equally silent. This suggests the NVDA + Edge combination has broader compatibility issues beyond our extension's popup window architecture.
   - **Needs further testing** on a setup where NVDA + Edge works reliably for normal web content, or with Chrome, or with an alternative window architecture (e.g., opening renderer as a regular tab instead of popup type)
