import {PdfDocument} from "../../scripts/contentCapture/pdfDocument";
import {ViewportDimensions} from "../../scripts/contentCapture/viewportDimensions";

import {pdfDataUrls} from "../clipperUI/components/previewViewer/pdfDataUrls";

export module MockPdfValues {
	export let pageDataUrls = pdfDataUrls;
	export let pageDataUrlsMap = {
		"0": pdfDataUrls[0],
		"1": pdfDataUrls[1],
		"2": pdfDataUrls[2]
	};
	export let dimensions = [{
		width: 1, height: 1
	}, {
		width: 2, height: 2
	}, {
		width: 3, height: 3
	}];
	export let byteLength = 5;
	export let data = new Uint8Array([10, 20, 30]);
}

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
		for (let i = 0; i < pageIndexes.length; i++) {
			dataUrls.push(this.pageDataUrls[pageIndexes[i]]);
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
		for (let i = 0; i < pageIndexes.length; i++) {
			dimensions.push(this.pageViewportDimensions[pageIndexes[i]]);
		}
		return Promise.resolve(dimensions);
	}

	public getPageViewportDimensions(pageIndex: number): Promise<ViewportDimensions> {
		return Promise.resolve(this.pageViewportDimensions[pageIndex]);
	}
}
