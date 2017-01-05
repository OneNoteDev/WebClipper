import {MockPdfValues} from "./mockPdfValues";

import {PdfDocument} from "../../scripts/contentCapture/pdfDocument";
import {ViewportDimensions} from "../../scripts/contentCapture/viewportDimensions";

export class MockPdfDocument {
	// There are 3 urls
	private pageDataUrls: string[] = MockPdfValues.pageDataUrls;
	private pageViewportDimensions: ViewportDimensions[] = MockPdfValues.dimensions;

	public numPages(): number {
		return MockPdfValues.pageDataUrls.length;
	}

	public getByteLength(): Promise<number> {
		return Promise.resolve(MockPdfValues.byteLength);
	}

	public getData(): Promise<Uint8Array> {
		return Promise.resolve(MockPdfValues.data);
	}

	public getPageListAsDataUrls(pageIndexes: number[]): Promise<string[]> {
		let dataUrls: string[] = [];
		for (let pageIndex of pageIndexes) {
			dataUrls.push(this.pageDataUrls[pageIndex]);
		}
		return Promise.resolve(dataUrls);
	}

	public getPageAsDataUrl(pageIndex: number): Promise<string> {
		return Promise.resolve(this.pageDataUrls[pageIndex]);
	}

	public getAllPageViewportDimensions(): Promise<ViewportDimensions[]> {
		return Promise.resolve(this.pageViewportDimensions);
	}

	public getPageListViewportDimensions(pageIndexes: number[]): Promise<ViewportDimensions[]> {
		let dimensions: ViewportDimensions[] = [];
		for (let pageIndex of pageIndexes) {
			dimensions.push(this.pageViewportDimensions[pageIndex]);
		}
		return Promise.resolve(dimensions);
	}

	public getPageViewportDimensions(pageIndex: number): Promise<ViewportDimensions> {
		return Promise.resolve(this.pageViewportDimensions[pageIndex]);
	}
}
