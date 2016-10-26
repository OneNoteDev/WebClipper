import {ArrayUtils} from "../arrayUtils";

import {PdfDocument} from "./pdfDocument";
import {ViewportDimensions} from "./viewportDimensions";

import * as _ from "lodash";

export class PdfJsDocument implements PdfDocument {
	private pdf: PDFDocumentProxy;

	constructor(pdf: PDFDocumentProxy) {
		this.pdf = pdf;
	}

	public numPages(): number {
		return this.pdf.numPages;
	}

	public getByteLength(): Promise<number> {
		return new Promise<number>((resolve) => {
			this.getData().then((buffer) => {
				resolve(buffer.length);
			});
		});
	}

	public getData(): Promise<Uint8Array> {
		return new Promise<Uint8Array>((resolve) => {
			this.pdf.getData().then((buffer) => {
				resolve(buffer);
			});
		});
	}

	public getPageListAsDataUrls(pageIndexes: number[]): Promise<string[]> {
		let dataUrls: string[] = new Array(pageIndexes.length);
		return new Promise((resolve) => {
			for (let i = 0; i < pageIndexes.length; i++) {
				this.getPageAsDataUrl(pageIndexes[i]).then((dataUrl) => {
					dataUrls[i] = dataUrl;
					if (ArrayUtils.isArrayComplete(dataUrls)) {
						resolve(dataUrls);
					}
				});
			}
		});
	}

	public getPageAsDataUrl(pageIndex: number): Promise<string> {
		return new Promise<string>((resolve) => {
			// In pdf.js, indexes start at 1
			this.pdf.getPage(pageIndex + 1).then((page) => {
				let viewport = page.getViewport(1 /* scale */);
				let canvas = document.createElement("canvas") as HTMLCanvasElement;
				let context = canvas.getContext("2d");
				canvas.height = viewport.height;
				canvas.width = viewport.width;

				let renderContext = {
					canvasContext: context,
					viewport: viewport
				};

				page.render(renderContext).then(() => {
					resolve(canvas.toDataURL());
				});
			});
		});
	}

	public getAllPageViewportDimensions(): Promise<ViewportDimensions[]> {
		let allPageIndexes = _.range(this.numPages());
		return this.getPageListViewportDimensions(allPageIndexes);
	}

	public getPageListViewportDimensions(pageIndexes: number[]): Promise<ViewportDimensions[]> {
		let dimensions: ViewportDimensions[] = new Array(pageIndexes.length);
		return new Promise((resolve) => {
			for (let i = 0; i < pageIndexes.length; i++) {
				this.getPageViewportDimensions(pageIndexes[i]).then((dimension) => {
					dimensions[i] = dimension;
					if (ArrayUtils.isArrayComplete(dimensions)) {
						resolve(dimensions);
					}
				});
			}
		});
	}

	public getPageViewportDimensions(pageIndex: number): Promise<ViewportDimensions> {
		return new Promise((resolve) => {
			// In pdf.js, indexes start at 1
			this.pdf.getPage(pageIndex + 1).then((page) => {
				let viewport = page.getViewport(1 /* scale */);
				resolve({
					height: viewport.height,
					width: viewport.width
				});
			});
		});
	}
}
