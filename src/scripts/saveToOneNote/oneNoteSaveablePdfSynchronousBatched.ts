import {StringUtils} from "../stringUtils";
import {ObjectUtils} from "../objectUtils";

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
	public getPage(index?: number): Promise<OneNoteApi.OneNotePage> {
		if (ObjectUtils.isNullOrUndefined(index) || index === 0) {
			// They are asking for the first page
			return Promise.resolve(this.page);
		}

		// Let's say a user wants to clip page range "2-4,7-9""
		// This gets converted to 2,3,4,7,8,9 and is then 0-indexed to 1,2,3,6,7,8
		// When a SynchronousBatchedPdf object is constructed, the array [1,2,3,6,7,8] gets converted
		// to: this.page: [1], this.pageIndexes: [2,3,6,7,8].
		// Therefore, getPage(0) must return this.page (INDEX 1), as done above
		// Then, getPage(1) must return [2], which corresponds to pageIndexes[1 - 1]  == pageIndexes[0]
		// We have to subtract 1 to account for the first page being removed from the pageIndexes array
		const pageNumber = this.pageIndexes[index - 1];
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
