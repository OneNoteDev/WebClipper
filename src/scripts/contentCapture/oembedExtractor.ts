// oEmbed-based extraction for rich-media pages. Caller falls back to Readability on null.

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

// V1 parity: YouTube + Vimeo. (Khan Academy V1 entry scraped embedded YouTube iframes,
// which our YouTube provider already handles.)
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

// Strip executable surfaces from provider HTML; preserve iframes/anchors/images.
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

// Sync hostname check (no fetch).
export function isOEmbedProviderUrl(pageUrl: string): boolean {
	return matchProvider(pageUrl) !== null;
}

// Returns oEmbed payload, or null on no-match / fetch failure.
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
		// "link" type carries metadata only; let Readability handle it.
		if (data.type !== "video" && data.type !== "rich" && data.type !== "photo") {
			return null;
		}
		if (!data.provider_name) {
			data.provider_name = provider.name;
		}
		data.pageUrl = pageUrl;
		return data as OEmbedData;
	} catch (e) {
		return null;
	}
}
