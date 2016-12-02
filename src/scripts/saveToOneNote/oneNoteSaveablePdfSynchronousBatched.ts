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

	/**
	 * @index starts at 0 and refers to the pages already in the saveable, NOT THE PAGE OF THE PDF ITSELF
	 */
	public getPage(index: number): Promise<OneNoteApi.OneNotePage> {
		if (!index || index === 0) {
			// They are asking for the first page
			return Promise.resolve(this.page);
		}

		const pageNumber = this.pageIndexes[index];
		return this.pdf.getPageAsDataUrl(pageNumber).then((dataUrl) => {
			return this.createPage(dataUrl, pageNumber);
		});
	}

	private createPage(dataUrl: string, pageNumber: number): OneNoteApi.OneNotePage {
		const title = StringUtils.getBatchedPageTitle(this.titleText, pageNumber);
		let page = new OneNoteApi.OneNotePage(title, "", this.contentLocale);
		page.addOnml("<p><img src=\"" + dataUrl + "\" /></p>&nbsp;");
		return page;
	}

	public getNumPages(): number {
		// Add 1 to account for the initial page
		return this.pageIndexes.length + 1;
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
