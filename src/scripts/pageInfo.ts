/**
 * Data object that represents the page we want to clip
 */
export interface PageInfo {
	canonicalUrl: string;
	contentData: string;
	contentLocale: string;
	contentTitle: string;
	contentType: OneNoteApi.ContentType;
	rawUrl: string;
}
