export interface IOneNoteApi {
	createNotebook(name: string): Promise<OneNoteApi.ResponsePackage<any> | OneNoteApi.RequestError>;

	createPage(page: OneNoteApi.OneNotePage, sectionId?: string): Promise<OneNoteApi.ResponsePackage<any> | OneNoteApi.RequestError>;

	getPage(pageId: string): Promise<OneNoteApi.ResponsePackage<any> | OneNoteApi.RequestError>;

	getPageContent(pageId: string): Promise<OneNoteApi.ResponsePackage<any> | OneNoteApi.RequestError>;

	getPages(options: { top?: number; sectionId?: string }): Promise<OneNoteApi.ResponsePackage<any> | OneNoteApi.RequestError>;

	updatePage(pageId: string, revisions: OneNoteApi.Revision[]): Promise<OneNoteApi.ResponsePackage<any> | OneNoteApi.RequestError>;

	createSection(notebookId: string, name: string): Promise<OneNoteApi.ResponsePackage<any> | OneNoteApi.RequestError>;

	getNotebooks(excludeReadOnlyNotebooks?: boolean): Promise<OneNoteApi.ResponsePackage<any> | OneNoteApi.RequestError>;

	getNotebooksWithExpandedSections(expands?: number, excludeReadOnlyNotebooks?: boolean): Promise<OneNoteApi.ResponsePackage<any> | OneNoteApi.RequestError>;

	getNotebookByName(name: string): Promise<OneNoteApi.ResponsePackage<any> | OneNoteApi.RequestError>;

	pagesSearch(query: string): Promise<OneNoteApi.ResponsePackage<any> | OneNoteApi.RequestError>;

	sendBatchRequest(batchRequest: OneNoteApi.BatchRequest): Promise<OneNoteApi.ResponsePackage<any> | OneNoteApi.RequestError>;
}
