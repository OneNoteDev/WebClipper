/**
 * Represents content that can be saved to OneNote, in the form of a page
 * and 0 or more PATCH revisions. Getting OneNoteApi objects through this interface
 * is done through promises to allow for flexibility of using async or synchronous
 * operations.
 */
export interface OneNoteSaveable {
	getPage(index?: number): Promise<OneNoteApi.OneNotePage>;
	getNumPages(): number;
	getPatch(index: number): Promise<OneNoteApi.Revision[]>;
	getNumPatches(): number;
	getBatch(index: number): Promise<OneNoteApi.BatchRequest>;
	getNumBatches(): number;
}
