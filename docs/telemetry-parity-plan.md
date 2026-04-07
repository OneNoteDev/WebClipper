# Telemetry Parity: Implementation Status

## Background

The new unified renderer window communicates telemetry to the worker via port messages (`{ action: "telemetry", data: LogDataPackage }`). The worker routes these to `this.logger` (an `AriaLoggerDecorator` in production builds) via `Log.parseAndLogDataPackage()`.

### Key findings during implementation

- **Build-time swap**: `gulpfile.js` replaces `logManager.ts` (stub) with `logManager_internal.ts` (Aria-enabled) when the internal file exists. The `enable_console_logging` localStorage flag only controls *additional* console output — Aria events always flow in production builds.
- **Aria SDK transport**: v2.8.2's `ajax()` method uses `fetch()` (not XHR), so it works in MV3 service workers.
- **ProductionRequirements gate**: `SessionLogger` queues ALL events until 8 context properties are set: `AppInfoId`, `AppInfoVersion`, `BrowserLanguage`, `ExtensionLifecycleId`, `ClipperType`, `DeviceInfoId`, `FlightInfo`, `InPrivateBrowsing`. Events only flush to Aria once all 8 exist. The new renderer bypassed the legacy i18n path that set `BrowserLanguage`, so events were silently queued forever. Fixed by setting `BrowserLanguage` + fallback `FlightInfo` in `WebExtensionWorker` constructor.
- **Version string**: `ExtensionBase.version` was hardcoded and drifted from manifest. Fixed: `getExtensionVersion()` now reads `chrome.runtime.getManifest().version` with static fallback. Four locations to keep in sync: `extensionBase.ts`, `edge/manifest.json`, `chrome/manifest.json`, `package.json`.

## Telemetry helpers in renderer.ts

```
logFunnel(label)           — Funnel events (user journey steps)
logTelemetryEvent(event)   — BaseEvent/PromiseEvent (stops timer, serializes)
logFailure(label, type, info, id) — Failure events
logClickEvent(clickId)     — Click tracking
setTelemetryContext(key, value) — Context properties (persist across events)
logSessionEnd(trigger)     — Session end
logSessionStart()          — Session start
```

## Context properties set by renderer

| Property | When set | Value |
|----------|---------|-------|
| `ContentType` | Renderer open (default FullPage) + mode switch | `"FullPage"`, `"Article"`, `"Bookmark"`, `"Region"` |
| `AuthType` | Sign-in button click + already-signed-in path | `"Msa"` or `"OrgId"` |
| `UserInfoId` | After sign-in succeeds + already-signed-in path | User CID string |

On sign-out, `AuthType` is reset to `"None"` and `UserInfoId` to `""` before the new session starts — prevents next sign-in's events from carrying the old user's identity.

## Events implemented

### Funnel events (user journey)
| Event | Trigger | Properties |
|-------|---------|------------|
| `Invoke` | Renderer opens | — |
| `AuthAlreadySignedIn` | User is pre-authenticated | — |
| `AuthAttempted` | Sign-in button click | — |
| `AuthSignInCompleted` | Sign-in succeeds | — |
| `AuthSignInFailed` | Sign-in fails | — |
| `ClipAttempted` | Save button click | — |
| `ViewInWac` | "View in OneNote" button click | — |
| `SignOut` | Sign-out link click | — |

### Lifecycle events
| Event | Type | Trigger | Properties |
|-------|------|---------|------------|
| `HandleSignInEvent` | PromiseEvent | Sign-in result | `CorrelationId`, `UserInformationReturned`, `SignInCancelled`, Status, FailureInfo |
| `UserInfoUpdated` | BaseEvent | After sign-in | `UserUpdateReason`, `LastUpdated` (UTC) |
| `CloseClipper` | BaseEvent | Cancel/close when clipCount===0 | `CurrentPanel`, `CloseReason` |
| `InvokeClipper` | BaseEvent | Extension button click (worker) | `InvokeSource`, `InvokeMode` |
| `HideClipperDueToSpaNavigate` | BaseEvent | Original tab URL changes (worker) | — |

### Clip events
| Event | Type | Trigger | Properties |
|-------|------|---------|------------|
| `ClipToOneNoteAction` | PromiseEvent | Save result (timer from save click) | `CorrelationId`, Status, FailureInfo |
| `ClipCommonOptions` | BaseEvent | Save button click | `ClipMode` (FullPage/Augmentation/Bookmark/Region), `PageTitleModified`, `AnnotationAdded` |
| `ClipRegionOptions` | BaseEvent | Save in region mode | `NumRegions` |

### Region events
| Event | Type | Trigger | Properties |
|-------|------|---------|------------|
| `RegionSelectionCapturing` | BaseEvent | Region capture complete | `Width`, `Height` |
| `RegionSelectionProcessing` | BaseEvent | Region image processed | `Width`, `Height`, `IsHighDpiScreen` |

### Section picker events
| Event | Type | Trigger | Properties |
|-------|------|---------|------------|
| `GetNotebooks` | PromiseEvent | Notebook fetch | `CurrentSectionStillExists`, Status, FailureInfo |
| Click: `sectionPickerLocationContainer` | Click | Dropdown opened | — |
| Click: `sectionComponent` | Click | Section selected | — |

### Mode button clicks
| Click ID | Trigger |
|----------|---------|
| `fullPageButton` | Full Page mode selected |
| `augmentationButton` | Article mode selected |
| `bookmarkButton` | Bookmark mode selected |
| `regionButton` | Region mode selected |

### Error handling
| Event | Trigger | Properties |
|-------|---------|------------|
| `UnhandledExceptionThrown` | `window.onerror` / `unhandledrejection` | `{ error: "msg (file:line:col) at stack" }`, id: `"Renderer"` |
| `OnLaunchOneNoteButton` | View in OneNote URL missing | `{ error: "..." }` |
| `RegionSelectionProcessing` failure | Region capture error | `{ error: "..." }` |

### PromiseEvent timer notes
`ClipToOneNoteAction` and `HandleSignInEvent` are created at action start (save click / sign-in click) and completed on result, so `Duration` reflects actual wait time. `GetNotebooks` is created at fetch start.

## Events NOT migrated (legacy-only)

| Event | Reason |
|-------|--------|
| `ClearNoOpTracker` | No NoOp tracker in new renderer |
| `LocalFilesNotAllowedPanelShown` | PDF not yet in new UI |
| `SetDoNotPromptRatings`, `SetIsRatingsPromptLogicExecutedInEdge`, `ShouldShowRatingsPrompt` | Ratings not in new UI |
| `ClosePageNavTooltip` | PageNav fires independently |
| `OrphanedWebClippersDueToExtensionRefresh` | Different lifecycle |
| `DebugFeedback` | Legacy debug panel |
| `CompressRegionSelection`, `RegionSelectionLoading` | Different flow |
| `ClipPdfOptions`, `PdfByteMetadata`, `ClipSelectionOptions` | PDF/Selection modes not yet in new UI |
| `ClipAugmentationOptions` | Legacy article model — `ClipCommonOptions` covers this |
| `InvokeWhatsNew`, `InvokeTooltip` | Fire through PageNav system independently |

## Navigation-away detection

Worker listens on `tabs.onUpdated` for URL changes on the original tab while the renderer is open. On change:
1. Logs `HideClipperDueToSpaNavigate` event (matches legacy)
2. Sends `{ action: "pageNavigated" }` to renderer via port
3. Renderer closes the window

Listener is cleaned up on port disconnect.

## How to debug telemetry

1. **Console logging**: In any extension page console (e.g., renderer F12), run `localStorage.setItem("enable_console_logging", "true")`, then reload extension. Events appear in service worker console.
2. **Network tab**: Open SW DevTools → Network → filter `aria`. POST requests to `browser.pipe.aria.microsoft.com/Collector/3.0/` contain Bond-binary payloads.
3. **Aria token**: `build/settings.json` has the dev sandbox token. Production token is injected during release build via `--production` flag which merges `src/settings/production.json` + `src/settings_internal/production.json`.
