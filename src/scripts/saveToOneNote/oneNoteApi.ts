import {IOneNoteApi} from "./iOneNoteApi";

export class BaseOneNoteApi extends OneNoteApi.OneNoteApi implements IOneNoteApi {
	createNotebook(name: string): Promise<OneNoteApi.ResponsePackage<any> | OneNoteApi.RequestError> {
		return super.createNotebook(name);
	}

	createPage(page: OneNoteApi.OneNotePage, sectionId?: string): Promise<OneNoteApi.ResponsePackage<any> | OneNoteApi.RequestError> {
		return super.createPage(page, sectionId);
	}

	getPage(pageId: string): Promise<OneNoteApi.ResponsePackage<any> | OneNoteApi.RequestError> {
		return super.getPage(pageId);
	}

	getPageContent(pageId: string): Promise<OneNoteApi.ResponsePackage<any> | OneNoteApi.RequestError> {
		return super.getPageContent(pageId);
	}

	getPages(options: { top?: number; sectionId?: string }): Promise<OneNoteApi.ResponsePackage<any> | OneNoteApi.RequestError> {
		return super.getPages(options);
	}

	updatePage(pageId: string, revisions: OneNoteApi.Revision[]): Promise<OneNoteApi.ResponsePackage<any> | OneNoteApi.RequestError> {
		return super.updatePage(pageId, revisions);
	}

	createSection(notebookId: string, name: string): Promise<OneNoteApi.ResponsePackage<any> | OneNoteApi.RequestError> {
		return super.createSection(notebookId, name);
	}

	getNotebooks(excludeReadOnlyNotebooks?: boolean): Promise<OneNoteApi.ResponsePackage<any> | OneNoteApi.RequestError> {
		return super.getNotebooks(excludeReadOnlyNotebooks);
	}

	getNotebooksWithExpandedSections(expands?: number, excludeReadOnlyNotebooks?: boolean): Promise<OneNoteApi.ResponsePackage<any> | OneNoteApi.RequestError> {
		return super.getNotebooksWithExpandedSections(expands, excludeReadOnlyNotebooks);
	}

	getNotebookByName(name: string): Promise<OneNoteApi.ResponsePackage<any> | OneNoteApi.RequestError> {
		return super.getNotebookByName(name);
	}

	pagesSearch(query: string): Promise<OneNoteApi.ResponsePackage<any> | OneNoteApi.RequestError> {
		return super.pagesSearch(query);
	}

	sendBatchRequest(batchRequest: OneNoteApi.BatchRequest): Promise<OneNoteApi.ResponsePackage<any> | OneNoteApi.RequestError> {
		return super.sendBatchRequest(batchRequest);
	}

}