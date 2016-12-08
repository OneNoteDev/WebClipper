import {ArrayUtils} from "../arrayUtils";
import {StringUtils} from "../stringUtils";

import {PdfDocument} from "../contentCapture/pdfDocument";

import {OneNoteSaveable} from "./oneNoteSaveable";

export class OneNoteSaveablePdfBatched implements OneNoteSaveable {
	private static maxImagesPerPatchRequest = 15;

	private page: OneNoteApi.OneNotePage;
	private pdf: PdfDocument;
	private buckets: number[][];
	private contentLocale: string;
	private saveLocation: string;
	private titleText: string;

	constructor(page: OneNoteApi.OneNotePage, pdf: PdfDocument, pageIndexes: number[], contentLocale: string, saveLocation: string, titleText: string) {
		this.page = page;
		this.pdf = pdf;
		this.buckets = ArrayUtils.partition(pageIndexes, OneNoteSaveablePdfBatched.maxImagesPerPatchRequest);
		this.contentLocale = contentLocale;
		this.saveLocation = saveLocation;
		this.titleText = titleText;
	}

	public getPage(): Promise<OneNoteApi.OneNotePage> {
		return Promise.resolve(this.page);
	}

	public getNumPages(): number {
		return 1;
	}

	public getNumPatches(): number {
		return 0;
	}

	public getPatch(index: number): Promise<OneNoteApi.Revision[]> {
		return Promise.resolve(undefined);
	}

	public getNumBatches(): number {
		return this.buckets.length;
	}

	public getBatch(index: number): Promise<OneNoteApi.BatchRequest> {
		const bucket = this.buckets[index];
		return this.pdf.getPageListAsDataUrls(bucket).then((dataUrls) => {
			return this.createBatchRequest(bucket, dataUrls);
		});
	}

	private createBatchRequest(pagesIndices: number[], dataUrls: string[]): OneNoteApi.BatchRequest {
		const sectionId = this.saveLocation;
		const apiRoot = "/api/v1.0/me/notes";
		const sectionPath = sectionId ? "/sections/" + sectionId : "";
		const url = apiRoot + sectionPath + "/pages";

		let batchRequest = new OneNoteApi.BatchRequest();
		for (let i = 0; i < pagesIndices.length; i++) {
			const title = StringUtils.getBatchedPageTitle(this.titleText, pagesIndices[i]);
			const dataUrl = dataUrls[i];

			let page = new OneNoteApi.OneNotePage(title, "", this.contentLocale);
			page.addOnml("<p><img src=\"" + dataUrl + "\" /></p>&nbsp;");

			const batchRequestOperation = {
				httpMethod: "POST",
				uri: url,
				contentType: "text/html",
				content: page.getEntireOnml()
			} as OneNoteApi.BatchRequestOperation;

			batchRequest.addOperation(batchRequestOperation);
		}

		return batchRequest;
	}
}
