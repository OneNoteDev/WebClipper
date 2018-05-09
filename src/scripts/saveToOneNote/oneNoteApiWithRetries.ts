import {PromiseUtils} from "../promiseUtils";
import {IOneNoteApi} from "./iOneNoteApi";

export class OneNoteApiWithRetries implements IOneNoteApi{
	private api: IOneNoteApi;
	private maxRetries: number;

	constructor(api: IOneNoteApi, maxRetries = 3) {
		this.api = api;
		this.maxRetries = maxRetries;
	}

	public createNotebook(name: string) {
		return PromiseUtils.execWithRetry(() => {
			return this.api.createNotebook(name);
		});
	}

	public createPage(page: OneNoteApi.OneNotePage, sectionId?: string) {
		return PromiseUtils.execWithRetry(() => {
			return this.api.createPage(page, sectionId);
		});
	}

	// TODO: call this sendBatch or somethin to differentiate it
	public sendBatchRequest(batchRequest: OneNoteApi.BatchRequest) {
		return PromiseUtils.execWithRetry(() => {
			return this.api.sendBatchRequest(batchRequest);
		});
	}

	public getPage(pageId: string) {
		return PromiseUtils.execWithRetry(() => {
			return this.api.getPage(pageId);
		});
	}

	public getPageContent(pageId: string) {
		return PromiseUtils.execWithRetry(() => {
			return this.api.getPageContent(pageId);
		});
	}

	public getPages(options: { top?: number, sectionId?: string }) {
		return PromiseUtils.execWithRetry(() => {
			return this.api.getPages(options);
		});
	}

	public updatePage(pageId: string, revisions: OneNoteApi.Revision[]) {
		return PromiseUtils.execWithRetry(() => {
			return this.api.updatePage(pageId, revisions);
		});
	}

	public createSection(notebookId: string, name: string) {
		return PromiseUtils.execWithRetry(() => {
			return this.api.createSection(notebookId, name);
		});
	}

	public getNotebooks(excludeReadOnlyNotebooks?: boolean) {
		return PromiseUtils.execWithRetry(() => {
			return this.api.getNotebooks(excludeReadOnlyNotebooks);
		});
	}

	public getNotebooksWithExpandedSections(expands?: number, excludeReadOnlyNotebooks?: boolean) {
		return PromiseUtils.execWithRetry(() => {
			return this.api.getNotebooksWithExpandedSections(expands, excludeReadOnlyNotebooks);
		});
	}

	public getNotebookByName(name: string) {
		return PromiseUtils.execWithRetry(() => {
			return this.api.getNotebookByName(name);
		});
	}

	public pagesSearch(query: string) {
		return PromiseUtils.execWithRetry(() => {
			return this.api.pagesSearch(query);
		});
	}
}
