export interface VideoExtractor {
	// Our 3 Domains all have the concept of a "VideoId" embedded somewhere in the page
	getVideoIds(pageUrl: string, pageContent: string): string[];

	// We can use the video ideas to generate or retrieve src values that we can embed into our article preview
	getVideoSrcValues(pageUrl: string, pageContent: string): string[];
	
	createEmbeddedVideos(pageUrl: string, pageContent: string): HTMLIFrameElement[];
};
