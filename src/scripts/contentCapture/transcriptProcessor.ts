// Service-worker side transcript processing — fetches caption URLs returned by
// transcriptCaptureInject.ts and parses them into plain text entries.
//
// Supports:
//   - YouTube json3 format (events[].segs[].utf8)
//   - YouTube XML format (<text start="" dur="">...</text>)
//   - WebVTT (.vtt) format (used by Microsoft Stream / SharePoint)

export interface TranscriptEntry {
	startMs: number;
	durationMs: number;
	text: string;
}

/**
 * Fetch a caption URL and parse it into transcript entries.
 * Automatically detects format (json3, XML, or WebVTT) from the response.
 */
export async function fetchAndParseTranscript(captionUrl: string): Promise<TranscriptEntry[]> {
	let response = await fetch(captionUrl);
	if (!response.ok) {
		throw new Error(`Failed to fetch transcript: HTTP ${response.status}`);
	}

	let contentType = response.headers.get("content-type") || "";
	let body = await response.text();

	// Detect format
	if (captionUrl.indexOf("fmt=json3") !== -1 || contentType.indexOf("json") !== -1) {
		return parseJson3(body);
	} else if (body.trimStart().startsWith("WEBVTT") || captionUrl.indexOf(".vtt") !== -1) {
		return parseWebVTT(body);
	} else if (body.trimStart().startsWith("<?xml") || body.trimStart().startsWith("<transcript")) {
		return parseYouTubeXml(body);
	}

	// Fallback: try json3, then XML
	try {
		return parseJson3(body);
	} catch (e) {
		return parseYouTubeXml(body);
	}
}

/**
 * Parse YouTube json3 caption format.
 * Structure: { events: [{ tStartMs, dDurationMs, segs: [{ utf8 }] }] }
 */
function parseJson3(body: string): TranscriptEntry[] {
	let data = JSON.parse(body);
	let events: any[] = data.events || [];
	let entries: TranscriptEntry[] = [];

	for (let event of events) {
		if (!event.segs) { continue; }
		let text = event.segs.map((seg: any) => seg.utf8 || "").join("").trim();
		if (!text || text === "\n") { continue; }
		entries.push({
			startMs: event.tStartMs || 0,
			durationMs: event.dDurationMs || 0,
			text: text
		});
	}

	return entries;
}

/**
 * Parse YouTube XML caption format.
 * Structure: <transcript><text start="1.23" dur="2.34">Hello</text>...</transcript>
 */
function parseYouTubeXml(body: string): TranscriptEntry[] {
	let parser = new DOMParser();
	let doc = parser.parseFromString(body, "text/xml");
	let textElements = doc.querySelectorAll("text");
	let entries: TranscriptEntry[] = [];

	for (let i = 0; i < textElements.length; i++) {
		let el = textElements[i];
		let startSec = parseFloat(el.getAttribute("start") || "0");
		let durSec = parseFloat(el.getAttribute("dur") || "0");
		let text = decodeXmlEntities(el.textContent || "").trim();
		if (!text) { continue; }
		entries.push({
			startMs: Math.round(startSec * 1000),
			durationMs: Math.round(durSec * 1000),
			text: text
		});
	}

	return entries;
}

/**
 * Parse WebVTT format (used by Microsoft Stream / SharePoint).
 * Format:
 *   WEBVTT
 *
 *   00:00:01.000 --> 00:00:03.500
 *   Hello world
 */
function parseWebVTT(body: string): TranscriptEntry[] {
	let lines = body.split("\n");
	let entries: TranscriptEntry[] = [];
	let i = 0;

	// Skip header
	while (i < lines.length && !lines[i].includes("-->")) {
		i++;
	}

	while (i < lines.length) {
		let line = lines[i].trim();
		// Look for timestamp line: 00:00:01.000 --> 00:00:03.500
		let timestampMatch = line.match(/(\d{2}:\d{2}:\d{2}[.,]\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2}[.,]\d{3})/);
		if (timestampMatch) {
			let startMs = parseVttTimestamp(timestampMatch[1]);
			let endMs = parseVttTimestamp(timestampMatch[2]);
			i++;
			// Collect text lines until empty line or next timestamp
			let textLines: string[] = [];
			while (i < lines.length && lines[i].trim() !== "" && !lines[i].includes("-->")) {
				// Strip VTT tags like <c>, <v Speaker>, etc.
				let cleaned = lines[i].replace(/<[^>]+>/g, "").trim();
				if (cleaned) { textLines.push(cleaned); }
				i++;
			}
			let text = textLines.join(" ").trim();
			if (text) {
				entries.push({
					startMs: startMs,
					durationMs: endMs - startMs,
					text: text
				});
			}
		} else {
			i++;
		}
	}

	return entries;
}

function parseVttTimestamp(ts: string): number {
	// Format: HH:MM:SS.mmm or HH:MM:SS,mmm
	let parts = ts.replace(",", ".").split(":");
	let hours = parseInt(parts[0], 10);
	let minutes = parseInt(parts[1], 10);
	let secParts = parts[2].split(".");
	let seconds = parseInt(secParts[0], 10);
	let millis = parseInt(secParts[1] || "0", 10);
	return (hours * 3600 + minutes * 60 + seconds) * 1000 + millis;
}

function decodeXmlEntities(text: string): string {
	return text
		.replace(/&#39;/g, "'")
		.replace(/&quot;/g, "\"")
		.replace(/&amp;/g, "&")
		.replace(/&lt;/g, "<")
		.replace(/&gt;/g, ">")
		.replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
		.replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(parseInt(dec, 10)));
}

/**
 * Convert transcript entries to a plain-text string suitable for OneNote.
 * Groups consecutive entries into paragraphs based on timing gaps.
 */
export function transcriptToPlainText(entries: TranscriptEntry[], includeTimestamps = false): string {
	if (!entries || entries.length === 0) { return ""; }

	let lines: string[] = [];
	for (let entry of entries) {
		if (includeTimestamps) {
			let timestamp = formatTimestamp(entry.startMs);
			lines.push(`[${timestamp}] ${entry.text}`);
		} else {
			lines.push(entry.text);
		}
	}

	return lines.join("\n");
}

/**
 * Convert transcript entries to HTML for OneNote page creation.
 * Includes timestamps as a table or structured list.
 */
export function transcriptToHtml(entries: TranscriptEntry[], videoTitle?: string, videoUrl?: string): string {
	if (!entries || entries.length === 0) { return ""; }

	let html = "";
	if (videoTitle) {
		html += `<h2>${escapeHtml(videoTitle)}</h2>`;
	}
	if (videoUrl) {
		html += `<p><a href="${escapeHtml(videoUrl)}">${escapeHtml(videoUrl)}</a></p>`;
	}
	html += "<div class=\"transcript\">";
	for (let entry of entries) {
		let timestamp = formatTimestamp(entry.startMs);
		html += `<p><span class="timestamp" style="color:#666;font-size:0.85em;">[${escapeHtml(timestamp)}]</span> ${escapeHtml(entry.text)}</p>`;
	}
	html += "</div>";

	return html;
}

function formatTimestamp(ms: number): string {
	let totalSec = Math.floor(ms / 1000);
	let hours = Math.floor(totalSec / 3600);
	let minutes = Math.floor((totalSec % 3600) / 60);
	let seconds = totalSec % 60;
	if (hours > 0) {
		return `${hours}:${pad(minutes)}:${pad(seconds)}`;
	}
	return `${minutes}:${pad(seconds)}`;
}

function pad(n: number): string {
	return n < 10 ? "0" + n : String(n);
}

function escapeHtml(text: string): string {
	return text
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;");
}
