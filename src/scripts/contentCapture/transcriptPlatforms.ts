// Centralized configuration of the video platforms that support transcript
// extraction. A single generic DOM scraper (injected by the service worker)
// is driven entirely by the selectors declared here, so supporting a new
// platform means adding one entry to PLATFORMS — no scraper or UI changes.

export interface TranscriptScrapeConfig {
	// Optional control to click first to reveal the transcript button
	// (e.g. the YouTube "...more" description expander).
	expandSelector?: string;
	// Button that opens the transcript panel.
	openSelector: string;
	// When true, skip clicking openSelector if it already reports
	// aria-expanded="true" (the panel is already open).
	respectAriaExpanded?: boolean;
	// Selector polled to detect that transcript line items have rendered,
	// and used to enumerate them.
	itemSelector: string;
	// Per-item selectors. timestamp/speaker are optional; text falls back to
	// the item's own text content when textSelector finds nothing.
	timestampSelector?: string;
	textSelector?: string;
	speakerSelector?: string;
	// Delays (ms) to wait after the expand / open clicks before polling.
	expandWaitMs?: number;
	openWaitMs?: number;
	// Set when the transcript panel is a virtualized list that only renders the
	// rows near the viewport (e.g. Fluent UI ms-List). The scraper then scrolls
	// the panel top-to-bottom, accumulating rows keyed by indexAttribute.
	virtualized?: boolean;
	// Attribute that uniquely and stably identifies a row across DOM recycling
	// (required when virtualized so rows are de-duplicated and ordered correctly).
	indexAttribute?: string;
}

export interface TranscriptPlatform {
	id: string;
	matches(url: URL): boolean;
	scrape: TranscriptScrapeConfig;
	// Builds a deep link into the source video at the given offset (seconds).
	buildTimestampUrl(url: URL, seconds: number): string;
	// Optional thumbnail image URL for the source video.
	getThumbnailUrl?(url: URL): string | null;
}

const youTube: TranscriptPlatform = {
	id: "youtube",
	matches(url: URL): boolean {
		let h = url.hostname.toLowerCase();
		return h === "www.youtube.com" || h === "youtube.com" || h === "m.youtube.com" || h === "youtu.be";
	},
	scrape: {
		expandSelector: "tp-yt-paper-button#expand.ytd-text-inline-expander",
		openSelector: "ytd-video-description-transcript-section-renderer button[aria-label=\"Show transcript\"]",
		itemSelector: "ytd-transcript-segment-renderer",
		timestampSelector: ".segment-timestamp, [class*=\"timestamp\"]",
		textSelector: ".segment-text, yt-formatted-string, [class*=\"text\"]",
		expandWaitMs: 500,
		openWaitMs: 500
	},
	buildTimestampUrl(url: URL, seconds: number): string {
		let u = new URL(url.toString());
		u.searchParams.set("t", seconds + "s");
		return u.toString();
	},
	getThumbnailUrl(url: URL): string | null {
		let id = url.searchParams.get("v") || (url.hostname.toLowerCase() === "youtu.be" ? url.pathname.slice(1) : "");
		return id ? "https://img.youtube.com/vi/" + encodeURIComponent(id) + "/hqdefault.jpg" : null;
	}
};

const microsoftStream: TranscriptPlatform = {
	id: "microsoftstream",
	matches(url: URL): boolean {
		let h = url.hostname.toLowerCase();
		let p = url.pathname.toLowerCase();
		return h.indexOf(".sharepoint.com") !== -1
			|| h.indexOf(".sharepoint-df.com") !== -1
			|| h.indexOf("stream.microsoft.com") !== -1
			|| p.indexOf("/stream.aspx") !== -1;
	},
	scrape: {
		openSelector: "button[aria-label=\"Transcript\"]",
		respectAriaExpanded: true,
		itemSelector: ".ms-List-cell[data-list-index]",
		timestampSelector: "[id^=\"Header-timestamp-\"]",
		textSelector: "[id^=\"sub-entry-\"]",
		speakerSelector: "[class*=\"itemDisplayName\"]",
		openWaitMs: 1000,
		virtualized: true,
		indexAttribute: "data-list-index"
	},
	buildTimestampUrl(url: URL, seconds: number): string {
		let u = new URL(url.toString());
		u.searchParams.set("startTime", String(seconds));
		return u.toString();
	}
};

const PLATFORMS: TranscriptPlatform[] = [youTube, microsoftStream];

// Context-menu documentUrlPatterns (Chrome match-pattern glob form) that mirror
// the host matchers above, so the "Clip Transcript" item only appears on video
// pages. Kept alongside the matchers so the two representations stay in sync.
export const TRANSCRIPT_DOCUMENT_URL_PATTERNS: string[] = [
	"*://*.youtube.com/watch*",
	"*://youtu.be/*",
	"*://*.sharepoint.com/*stream.aspx*",
	"*://*.sharepoint-df.com/*stream.aspx*",
	"*://*.stream.microsoft.com/*"
];

// Returns the platform configuration matching the given URL, or null when the
// URL is not a supported transcript source (or cannot be parsed).
export function getTranscriptPlatform(rawUrl: string): TranscriptPlatform | null {
	let url: URL;
	try {
		url = new URL(rawUrl);
	} catch (e) {
		return null;
	}
	for (let i = 0; i < PLATFORMS.length; i++) {
		if (PLATFORMS[i].matches(url)) {
			return PLATFORMS[i];
		}
	}
	return null;
}

export function isTranscriptSupported(rawUrl: string): boolean {
	return getTranscriptPlatform(rawUrl) !== null;
}
