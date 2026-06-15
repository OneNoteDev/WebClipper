# Copilot Instructions — OneNote Web Clipper

## Build & Run

```sh
npm install
npm run build          # compile + bundle + export to target/
npm run build:prod     # production build (minified, production settings)
npm run build-only     # compile + bundle without export
npm run lint           # ESLint (typescript-eslint) on src/**/*.{ts,tsx}
npm run clean          # remove build/ and target/
npm run watch          # incremental rebuild on file changes
```

There is no automated test runner in this repo currently (Chutzpah config exists but no `npm test` script). Verify changes by loading the extension from `target/chrome/` or `target/edge/` in a browser.

### Gulp flags

- `--production` — merge production settings overlay
- `--dogfood` — merge dogfood settings overlay
- `--nointernal` — skip internal-only telemetry/settings from sibling `WebClipper_Internal` repo
- `--nominify` — ship unminified Aria telemetry lib

## Architecture

### Extension model (Manifest V3, Chrome & Edge)

The clipper is a browser extension targeting Chrome and Edge (both Chromium-based). Key runtime components:

| Component | Entry point | Role |
|-----------|------------|------|
| Service worker | `chromeExtension.ts` / `edgeExtension.ts` | Background lifecycle, auth, tab management |
| Renderer window | `renderer.ts` + `renderer.html` | Popup UI that captures/previews content |
| Content scripts | `contentCaptureInject.ts`, `regionOverlay.ts`, `appendIsInstalledMarker.ts` | Injected into pages for DOM extraction and region selection |
| Offscreen document | `offscreen.ts` + `offscreen.html` | MV3 offscreen page for tasks needing DOM access from the worker |

Communication between service worker and renderer uses Chrome port messaging (`chrome.runtime.connect`). The `Communicator` class (`src/scripts/communicator/`) provides an RPC layer over message passing with function registration, callbacks, and `SmartValue` reactive state synchronization.

### Inheritance hierarchy for browser targets

```
ExtensionBase<TWorker, TTab, TTabIdentifier>  (abstract)
  └── ChromeExtension / EdgeExtension

ExtensionWorkerBase<TTab, TTabIdentifier>  (abstract)
  └── WebExtensionWorker (shared Chrome/Edge implementation)
```

Both Chrome and Edge share the `webExtensionBase/` implementation; browser-specific differences are isolated to manifest files and thin subclasses.

### Build pipeline (Gulp + esbuild)

1. **Compile** — TypeScript → `build/` (CommonJS via tsc)
2. **Bundle** — esbuild bundles each entry point into `build/bundles/` as browser IIFE
3. **Export** — Copies bundles, CSS, images, libs, manifests into `target/chrome/` and `target/edge/`

CSS is compiled from LESS (`src/styles/renderer.less`).

### Internal telemetry overlay

A sibling repo `WebClipper_Internal` can provide `*_internal.ts` files (copied in at build time with `_internal` suffix). These are excluded from linting in this repo. The internal overlay provides Aria/MSIT telemetry; the public repo ships a stub `logManager.ts`.

### Content capture (client-side)

All content processing is local — no server dependencies:
- **Article extraction** — Mozilla Readability (`@mozilla/readability`)
- **Full-page screenshot** — Scroll-capture in the renderer window with canvas stitching
- **PDF** — pdfjs-dist (legacy build, loaded via `pdfLoader.mjs`)
- **oEmbed** — `oembedExtractor.ts` fetches provider endpoints client-side

### Settings cascade

Settings are merged JSON files (last wins): `src/settings/default.json` → optional `production.json` / `dogfood.json` → internal overrides. At runtime, `Settings.getSetting(key)` reads from the merged `settings.json` in the build output.

## Code Conventions

- **Indentation:** Tabs (not spaces), enforced by ESLint
- **Quotes:** Double quotes for strings
- **Semicolons:** Required
- **Braces:** Always required (`curly` rule), 1TBS style
- **Variables:** `no-var` — use `let`/`const`
- **Equality:** Strict equality only (`eqeqeq`)
- **No console:** `no-console` rule — use the Logger abstraction instead
- **TypeScript target:** ES2022, CommonJS modules
- **File naming:** camelCase for `.ts`/`.tsx` files
- **Abstract base classes:** Heavy use of generics and abstract classes for cross-browser polymorphism (see `ExtensionBase`, `ExtensionWorkerBase`)
- **SmartValue pattern:** Observable values that auto-sync across message boundaries via the `Communicator` RPC layer
