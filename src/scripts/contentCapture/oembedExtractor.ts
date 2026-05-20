/**
 * oEmbed-based article extraction for rich-media pages (video, slideshare,
 * soundcloud, etc.). When a page URL matches a known oEmbed provider, fetch
 * the provider's structured embed payload. Returns the raw response data so
 * the renderer can compose distinct HTML for preview (clean static thumbnail)
 * and save (iframe embed picked up by OneNote's page renderer).
 *
 * Provider list mirrors the canonical OneNote-supported set. Each entry is
 * { name, endpoint, hostPattern } where hostPattern is either a bare
 * hostname (matched as suffix), a "host/path" prefix, or a partial hostname
 * ending in "." (matched as prefix).
 *
 * Returns null on no-match or fetch failure; callers should fall back to
 * Readability.
 */

interface OEmbedProvider {
	name: string;
	endpoint: string;
	hostPattern: string;
}

export interface OEmbedData {
	type: string;                 // "video" | "photo" | "link" | "rich"
	html?: string;                // present for video / rich
	url?: string;                 // present for photo
	width?: number;
	height?: number;
	title?: string;
	author_name?: string;
	thumbnail_url?: string;
	provider_name?: string;
	pageUrl: string;              // echo of the page URL we matched against
}

// Provider set matches V1's video extractor support (YouTube + Vimeo).
// V1 also had KhanAcademy in its SupportedVideoDomains, but Khan Academy
// doesn't publish an oEmbed endpoint -- their V1 extractor was just
// scanning Khan Academy pages for embedded YouTube iframes, which our
// YouTube provider already covers when those iframes are present.
const PROVIDERS: OEmbedProvider[] = [
	{ name: "YouTube", endpoint: "https://www.youtube.com/oembed", hostPattern: "youtube.com" },
	{ name: "YouTube", endpoint: "https://www.youtube.com/oembed", hostPattern: "youtu.be" },
	{ name: "Vimeo", endpoint: "https://vimeo.com/api/oembed.json", hostPattern: "vimeo.com" },
];

function matchProvider(url: string): OEmbedProvider | null {
	let parsed: URL;
	try {
		parsed = new URL(url);
	} catch (e) {
		return null;
	}
	const host = parsed.hostname.toLowerCase();
	const hostAndPath = (host + parsed.pathname).toLowerCase();

	for (const provider of PROVIDERS) {
		const pattern = provider.hostPattern.toLowerCase();

		if (pattern.indexOf("/") !== -1) {
			if (hostAndPath === pattern
				|| hostAndPath.indexOf(pattern) === 0
				|| hostAndPath.indexOf("." + pattern) !== -1) {
				return provider;
			}
		} else if (pattern.charAt(pattern.length - 1) === ".") {
			if (host.indexOf(pattern) === 0) {
				return provider;
			}
		} else {
			if (host === pattern || host.indexOf("." + pattern) === host.length - pattern.length - 1) {
				return provider;
			}
		}
	}
	return null;
}

/**
 * Strip executable surfaces from provider-supplied HTML while preserving the
 * iframes/anchors/images that carry the actual embed. Belt-and-suspenders:
 * the renderer's preview iframe is sandboxed (allow-same-origin), and
 * OneNote sanitizes server-side on save.
 */
export function sanitizeProviderHtml(html: string): string {
	const doc = new DOMParser().parseFromString(html, "text/html");

	const removable = doc.querySelectorAll("script, object, embed, link, style, meta");
	for (let i = removable.length - 1; i >= 0; i--) {
		const el = removable[i];
		if (el.parentNode) { el.parentNode.removeChild(el); }
	}

	const all = doc.querySelectorAll("*");
	for (let i = 0; i < all.length; i++) {
		const el = all[i] as HTMLElement;
		const attrs = el.attributes;
		for (let j = attrs.length - 1; j >= 0; j--) {
			const name = attrs[j].name.toLowerCase();
			const value = attrs[j].value;
			if (name.indexOf("on") === 0) {
				el.removeAttribute(attrs[j].name);
			} else if ((name === "href" || name === "src") && /^\s*javascript:/i.test(value)) {
				el.removeAttribute(attrs[j].name);
			}
		}
	}

	return doc.body ? doc.body.innerHTML : "";
}

// Sync hostname check (no fetch). Used by the renderer to skip eager capture
// on YouTube/Vimeo and route directly to Article mode.
export function isOEmbedProviderUrl(pageUrl: string): boolean {
	return matchProvider(pageUrl) !== null;
}

/**
 * Entry point. Returns raw oEmbed response data on success, null on
 * no-match or any failure (caller should fall back to Readability).
 */
export async function tryOEmbed(pageUrl: string): Promise<OEmbedData | null> {
	if (!pageUrl) { return null; }

	const provider = matchProvider(pageUrl);
	if (!provider) { return null; }

	const endpoint = provider.endpoint
		+ "?url=" + encodeURIComponent(pageUrl)
		+ "&format=json&maxwidth=600";

	try {
		const resp = await fetch(endpoint);
		if (!resp.ok) { return null; }
		const data = await resp.json() as Partial<OEmbedData>;
		// Only video / rich / photo types produce embeddable content.
		// "link" type carries metadata only; let Readability handle the page text.
		if (data.type !== "video" && data.type !== "rich" && data.type !== "photo") {
			return null;
		}
		// Ensure provider_name is set even when the response omits it -- some
		// providers leave it blank but our match guarantees we know who it is.
		if (!data.provider_name) {
			data.provider_name = provider.name;
		}
		data.pageUrl = pageUrl;
		return data as OEmbedData;
	} catch (e) {
		return null;
	}
}
