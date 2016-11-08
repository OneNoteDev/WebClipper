import {PromiseUtils} from "../promiseUtils";

export class OneNoteApiWithRetries implements OneNoteApi.IOneNoteApi {
	private api: OneNoteApi.IOneNoteApi;
	private maxRetries: number;

	constructor(api: OneNoteApi.IOneNoteApi, maxRetries: number = 3) {
		this.api = api;
		this.maxRetries = maxRetries;
	}

	public createNotebook(name: string): Promise<OneNoteApi.ResponsePackage<any>> {
		return PromiseUtils.execWithRetry(() => {
			return this.api.createNotebook(name);
		}, this.maxRetries);
	}

	public createPage(page: OneNoteApi.OneNotePage, sectionId?: string): Promise<OneNoteApi.ResponsePackage<any>> {
		return PromiseUtils.execWithRetry(() => {
			return this.api.createPage(page, sectionId);
		}, this.maxRetries);
	}

	public getPage(pageId: string): Promise<OneNoteApi.ResponsePackage<any>> {
		return PromiseUtils.execWithRetry(() => {
			return this.api.getPage(pageId);
		}, this.maxRetries);
	}

	public getPageContent(pageId: string): Promise<OneNoteApi.ResponsePackage<any>> {
		return PromiseUtils.execWithRetry(() => {
			return this.api.getPageContent(pageId);
		}, this.maxRetries);
	}

	public getPages(options: { top?: number, sectionId?: string }): Promise<OneNoteApi.ResponsePackage<any>> {
		return PromiseUtils.execWithRetry(() => {
			return this.api.getPages(options);
		}, this.maxRetries);
	}

	public updatePage(pageId: string, revisions: OneNoteApi.Revision[]): Promise<OneNoteApi.ResponsePackage<any>> {
		return PromiseUtils.execWithRetry(() => {
			return this.api.updatePage(pageId, revisions);
		}, this.maxRetries);
	}

	public createSection(notebookId: string, name: string): Promise<OneNoteApi.ResponsePackage<any>> {
		return PromiseUtils.execWithRetry(() => {
			return this.api.createSection(notebookId, name);
		}, this.maxRetries);
	}

	public getNotebooks(excludeReadOnlyNotebooks?: boolean): Promise<OneNoteApi.ResponsePackage<any>> {
		return PromiseUtils.execWithRetry(() => {
			return this.api.getNotebooks(excludeReadOnlyNotebooks);
		}, this.maxRetries);
	}

	public getNotebooksWithExpandedSections(expands?: number, excludeReadOnlyNotebooks?: boolean): Promise<OneNoteApi.ResponsePackage<any>> {
		return PromiseUtils.execWithRetry(() => {
			return this.api.getNotebooksWithExpandedSections(expands, excludeReadOnlyNotebooks);
		}, this.maxRetries);
	}

	public getNotebookByName(name: string): Promise<OneNoteApi.ResponsePackage<any>> {
		return PromiseUtils.execWithRetry(() => {
			return this.api.getNotebookByName(name);
		}, this.maxRetries);
	}

	public pagesSearch(query: string): Promise<OneNoteApi.ResponsePackage<any>> {
		return PromiseUtils.execWithRetry(() => {
			return this.api.pagesSearch(query);
		}, this.maxRetries);
	}
}
