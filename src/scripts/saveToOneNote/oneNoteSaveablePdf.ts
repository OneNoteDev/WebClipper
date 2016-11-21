import {ArrayUtils} from "../arrayUtils";

import {PdfDocument} from "../contentCapture/pdfDocument";

import {OneNoteSaveable} from "./oneNoteSaveable";

export class OneNoteSaveablePdf implements OneNoteSaveable {
	private static maxImagesPerPatchRequest = 15;

	private page: OneNoteApi.OneNotePage;
	private pdf: PdfDocument;
	private buckets: number[][];

	constructor(page: OneNoteApi.OneNotePage, pdf: PdfDocument, pageIndexes?: number[]) {
		this.page = page;
		this.pdf = pdf;
		this.buckets = ArrayUtils.partition(pageIndexes, OneNoteSaveablePdf.maxImagesPerPatchRequest);
	}

	public getPage(): Promise<OneNoteApi.OneNotePage> {
		return Promise.resolve(this.page);
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
}
