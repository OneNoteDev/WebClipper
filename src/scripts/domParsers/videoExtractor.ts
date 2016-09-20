export interface VideoExtractor {
	getVideoIds(pageUrl: string, pageContent: string): string[];

	// We can use the video IDs to generate or retrieve src values that we can embed into our article preview
	getVideoSrcValues(pageUrl: string, pageContent: string): string[];

	createEmbeddedVideos(pageUrl: string, pageContent: string): HTMLIFrameElement[];
};
