import {ArrayUtils} from "../arrayUtils";

import {PdfDocument} from "../contentCapture/pdfDocument";

import {OneNoteSaveable} from "./oneNoteSaveable";

export class OneNoteSaveablePdf implements OneNoteSaveable {
	private static maxImagesPerPatchRequest = 15;

	private page: OneNoteApi.OneNotePage;
	private pdf: PdfDocument;
	private buckets: number[][];
	private pageData: any;

	constructor(page: OneNoteApi.OneNotePage, pdf: PdfDocument, pageIndexes?: number[], necessaryPdfOptions?: any) {
		this.page = page;
		this.pdf = pdf;
		this.buckets = ArrayUtils.partition(pageIndexes, OneNoteSaveablePdf.maxImagesPerPatchRequest);
		this.pageData = necessaryPdfOptions;
	}

	public getPage(): Promise<OneNoteApi.OneNotePage> {
		return Promise.resolve(this.page);
	}

	public getNumPages(): number {
		return 1;
	}

	public getPatch(index: number): Promise<OneNoteApi.Revision[]> {
		return this.pdf.getPageListAsDataUrls(this.buckets[index]).then(this.createPatchRequestBody);
	}

	private createPatchRequestBody(dataUrls: string[]): OneNoteApi.Revision[] {
		let requestBody = [];
		dataUrls.forEach((dataUrl) => {
			let content = "<p><img src=\"" + dataUrl + "\" /></p>&nbsp;";
			requestBody.push({
				target: "body",
				action: "append",
				content: content
			});
		});
		return requestBody;
	}

	public getNumPatches(): number {
		return this.buckets.length;
	}

	public getNumBatches(): number {
		return 0;
	}

	public getBatch(index: number): Promise<OneNoteApi.BatchRequest> {
		return Promise.resolve(undefined);
	}
}
