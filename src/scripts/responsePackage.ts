export interface ResponsePackage<T> {
	parsedResponse: T;
	response: Response;
}

export interface IOneNoteApi {
	createNotebook(name: string): Promise<OneNoteApi.ResponsePackage<any> | OneNoteApi.RequestError>;
	createPage(page: OneNoteApi.OneNotePage, sectionId?: string): Promise<OneNoteApi.ResponsePackage<any> | OneNoteApi.RequestError>;
	sendBatchRequest(batchRequest: OneNoteApi.BatchRequest): Promise<OneNoteApi.ResponsePackage<any> | OneNoteApi.RequestError>;
	getPage(pageId: string): Promise<OneNoteApi.ResponsePackage<any> | OneNoteApi.RequestError>;
	getPageContent(pageId: string): Promise<OneNoteApi.ResponsePackage<any> | OneNoteApi.RequestError>;
	getPages(options: { top?: number, sectionId?: string }): Promise<OneNoteApi.ResponsePackage<any> | OneNoteApi.RequestError>;
	updatePage(pageId: string, revisions: OneNoteApi.Revision[]): Promise<OneNoteApi.ResponsePackage<any> | OneNoteApi.RequestError>;
	createSection(notebookId: string, name: string): Promise<OneNoteApi.ResponsePackage<any> | OneNoteApi.RequestError>;
	getNotebooks(excludeReadOnlyNotebooks?: boolean): Promise<OneNoteApi.ResponsePackage<any> | OneNoteApi.RequestError>;
	getNotebooksWithExpandedSections(expands?: number, excludeReadOnlyNotebooks?: boolean): Promise<OneNoteApi.ResponsePackage<any> | OneNoteApi.RequestError>;
	getNotebookByName(name: string): Promise<OneNoteApi.ResponsePackage<any> | OneNoteApi.RequestError>;
	pagesSearch(query: string): Promise<OneNoteApi.ResponsePackage<any> | OneNoteApi.RequestError>;
}

export class ErrorUtils {
	public static createRequestErrorObject(response: Response, errorType: OneNoteApi.RequestErrorType, timeout = 30000): Promise<OneNoteApi.RequestError> {
		return new Promise<OneNoteApi.RequestError>((resolve, reject) => {
			if (response === undefined) {
				reject();
			}

			response.text().then((responseText: string) => {
				resolve(createRequestErrorObjectInternal(response.status, responseText, response.headers, timeout, errorType));
			});
		});
	}
}

function createRequestErrorObjectInternal(status: number, responseText: string, responseHeaders: Headers, timeout: number, errorType: OneNoteApi.RequestErrorType): OneNoteApi.RequestError {
	let errorMessage = formatRequestErrorTypeAsString(errorType);
	if (errorType === OneNoteApi.RequestErrorType.NETWORK_ERROR) {
		// readyState doesn't exist on Response, so we can't use it here
	}
	if (errorType === OneNoteApi.RequestErrorType.REQUEST_TIMED_OUT) {
		status = 408;
	}
	let requestErrorObject: OneNoteApi.RequestError = {
		error: errorMessage,
		statusCode: status,
		responseHeaders: JSON.parse(responseHeaders.toString()),
		response: responseText
	};
	// add the timeout property iff
	// 1) timeout is greater than 0ms
	// 2) status code is not in the 2XX range
	if (timeout > 0 && !(status >= 200 && status < 300)) {
		requestErrorObject.timeout = timeout;
	}
	return requestErrorObject;
}

function formatRequestErrorTypeAsString(errorType: OneNoteApi.RequestErrorType): string {
	let errorTypeString = OneNoteApi.RequestErrorType[errorType];
	return errorTypeString.charAt(0).toUpperCase() + errorTypeString.replace(/_/g, " ").toLowerCase().slice(1);
}
