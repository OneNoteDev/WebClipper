import {ViewportDimensions} from "./viewportDimensions";

/**
 * Adapter for implementations of pdf documents. All page numbers
 * are 0-based indexes.
 */
export interface PdfDocument {
	numPages(): number;
	getByteLength(): Promise<number>;
	getData(): Promise<Uint8Array>;
	getPageListAsDataUrls(pageIndexes: number[]): Promise<string[]>;
	getPageAsDataUrl(pageIndex: number): Promise<string>;
	getAllPageViewportDimensions(): Promise<ViewportDimensions[]>;
	getPageListViewportDimensions(pageIndexes: number[]): Promise<ViewportDimensions[]>;
	getPageViewportDimensions(pageIndex: number): Promise<ViewportDimensions>;
}
