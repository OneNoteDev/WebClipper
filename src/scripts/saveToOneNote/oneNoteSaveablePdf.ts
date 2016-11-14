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
		return this.buckets.length;
	}

	public getBatch(index: number): Promise<OneNoteApi.BatchRequest[]> {
		const bucket = this.buckets[index];
		return this.pdf.getPageListAsDataUrls(bucket).then((dataUrls) => {
			return this.createBatchRequestBody(bucket, dataUrls);
		});
	}

	private createBatchRequestBody(pagesIndices: number[], dataUrls: string[]): OneNoteApi.BatchRequest[] {
		const sectionId = this.pageData.saveLocation;
		const apiRoot = "/api/v1.0/me/notes";
		const sectionPath = sectionId ? "/sections/" + sectionId : "";
		const url = apiRoot + sectionPath + "/pages";

		let batchRequests = [];
		for (let i = 0; i < pagesIndices.length; i++) {
			const title = this.pageData.titleText + ": Page " + (pagesIndices[i] + 1).toString();
			const dataUrl = dataUrls[i];

			let page = new OneNoteApi.OneNotePage(title, "", this.pageData.contentLocale);
			page.addOnml("<p><img src=\"" + dataUrl + "\" /></p>&nbsp;");

			const batchRequest = {
				httpMethod: "POST",
				uri: url,
				contentType: "text/html",
				content: page.getEntireOnml()
			} as OneNoteApi.BatchRequest;

			batchRequests.push(batchRequest);
		}

		return batchRequests;
	}
}
