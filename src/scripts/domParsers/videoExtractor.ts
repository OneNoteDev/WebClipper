export interface VideoExtractor {
	getVideoIds(pageUrl: string, pageContent: string): string[];
	getVideoSrcValues(pageUrl: string, pageContent: string): string[];
	createEmbeddedVideo(pageUrl: string, pageContent: string): HTMLIFrameElement[];
};
