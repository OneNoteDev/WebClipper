declare module "@mozilla/readability" {
	export class Readability {
		constructor(doc: Document, options?: {
			debug?: boolean;
			maxElemsToParse?: number;
			nbTopCandidates?: number;
			charThreshold?: number;
			classesToPreserve?: string[];
			keepClasses?: boolean;
		});
		parse(): {
			title: string;
			content: string;
			textContent: string;
			length: number;
			excerpt: string;
			byline: string;
			dir: string;
			siteName: string;
			lang: string;
			publishedTime: string;
		} | null;
	}

	export function isProbablyReaderable(doc: Document, options?: {
		minContentLength?: number;
		minScore?: number;
		visibilityChecker?: (node: Element) => boolean;
	}): boolean;
}
