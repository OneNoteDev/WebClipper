export interface VideoExtractor {
	getVideoIds(pageUrl: string, pageContent: string): string[];
	getVideoSrcValues(pageUrl: string, pageContent: string): string[];
	createEmbeddedVideos(pageUrl: string, pageContent: string): HTMLIFrameElement[];
};
