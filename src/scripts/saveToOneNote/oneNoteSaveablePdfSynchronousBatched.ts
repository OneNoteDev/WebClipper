import {StringUtils} from "../stringUtils";

import {PdfDocument} from "../contentCapture/pdfDocument";

import {OneNoteSaveable} from "./oneNoteSaveable";

export class OneNoteSaveablePdfSynchronousBatched implements OneNoteSaveable {
	private page: OneNoteApi.OneNotePage;
	private pdf: PdfDocument;
	private pageIndexes: number[];
	private contentLocale: string;
	private titleText: string;

	constructor(page: OneNoteApi.OneNotePage, pdf: PdfDocument, pageIndexes: number[], contentLocale: string, titleText: string) {
		this.page = page;
		this.pdf = pdf;
		this.pageIndexes = pageIndexes;
		this.contentLocale = contentLocale;
		this.titleText = titleText;
	}

	public getPage(index?: number): Promise<OneNoteApi.OneNotePage> {
		return this.pdf.getPageAsDataUrl(index).then((dataUrl) => {
			return this.createPage(dataUrl, index);
		});
	}

	private createPage(dataUrl: string, index: number): OneNoteApi.OneNotePage {
		const title = StringUtils.getBatchedPageTitle(this.titleText, index);
		let page = new OneNoteApi.OneNotePage(title, "", this.contentLocale);
		page.addOnml("<p><img src=\"" + dataUrl + "\" /></p>&nbsp;");
		return page;
	}

	public getNumPages(): number {
		return this.pageIndexes.length;
	}

	public getNumPatches(): number {
		return 0;
	}

	public getPatch(index: number): Promise<OneNoteApi.Revision[]> {
		return Promise.resolve(undefined);
	}

	public getNumBatches(): number {
		return 0;
	}

	public getBatch(index: number): Promise<OneNoteApi.BatchRequest[]> {
		return Promise.resolve(undefined);
	}
}
