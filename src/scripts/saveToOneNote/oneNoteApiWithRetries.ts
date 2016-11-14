import {PromiseUtils} from "../promiseUtils";

export class OneNoteApiWithRetries implements OneNoteApi.IOneNoteApi {
	private api: OneNoteApi.IOneNoteApi;
	private maxRetries: number;

	constructor(api: OneNoteApi.IOneNoteApi, maxRetries = 3) {
		this.api = api;
		this.maxRetries = maxRetries;
	}

	public createNotebook(name: string): Promise<OneNoteApi.ResponsePackage<any>> {
		return PromiseUtils.execWithRetry(() => {
			return this.api.createNotebook(name);
		});
	}

	public createPage(page: OneNoteApi.OneNotePage, sectionId?: string): Promise<OneNoteApi.ResponsePackage<any>> {
		return PromiseUtils.execWithRetry(() => {
			return this.api.createPage(page, sectionId);
		});
	}

	public batchRequests(batchRequests: OneNoteApi.BatchRequest[]): Promise<OneNoteApi.ResponsePackage<any>> {
		return PromiseUtils.execWithRetry(() => {
			return this.api.batchRequests(batchRequests);
		});
	}

	public getPage(pageId: string): Promise<OneNoteApi.ResponsePackage<any>> {
		return PromiseUtils.execWithRetry(() => {
			return this.api.getPage(pageId);
		});
	}

	public getPageContent(pageId: string): Promise<OneNoteApi.ResponsePackage<any>> {
		return PromiseUtils.execWithRetry(() => {
			return this.api.getPageContent(pageId);
		});
	}

	public getPages(options: { top?: number, sectionId?: string }): Promise<OneNoteApi.ResponsePackage<any>> {
		return PromiseUtils.execWithRetry(() => {
			return this.api.getPages(options);
		});
	}

	public updatePage(pageId: string, revisions: OneNoteApi.Revision[]): Promise<OneNoteApi.ResponsePackage<any>> {
		return PromiseUtils.execWithRetry(() => {
			return this.api.updatePage(pageId, revisions);
		});
	}

	public createSection(notebookId: string, name: string): Promise<OneNoteApi.ResponsePackage<any>> {
		return PromiseUtils.execWithRetry(() => {
			return this.api.createSection(notebookId, name);
		});
	}

	public getNotebooks(excludeReadOnlyNotebooks?: boolean): Promise<OneNoteApi.ResponsePackage<any>> {
		return PromiseUtils.execWithRetry(() => {
			return this.api.getNotebooks(excludeReadOnlyNotebooks);
		});
	}

	public getNotebooksWithExpandedSections(expands?: number, excludeReadOnlyNotebooks?: boolean): Promise<OneNoteApi.ResponsePackage<any>> {
		return PromiseUtils.execWithRetry(() => {
			return this.api.getNotebooksWithExpandedSections(expands, excludeReadOnlyNotebooks);
		});
	}

	public getNotebookByName(name: string): Promise<OneNoteApi.ResponsePackage<any>> {
		return PromiseUtils.execWithRetry(() => {
			return this.api.getNotebookByName(name);
		});
	}

	public pagesSearch(query: string): Promise<OneNoteApi.ResponsePackage<any>> {
		return PromiseUtils.execWithRetry(() => {
			return this.api.pagesSearch(query);
		});
	}
}
