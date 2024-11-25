import {PromiseUtils} from "../promiseUtils";
import {IOneNoteApi} from "../responsePackage";

export class OneNoteApiWithRetries implements OneNoteApi.IOneNoteApi {
	private api: IOneNoteApi;
	private maxRetries: number;

	constructor(api: IOneNoteApi, maxRetries = 3) {
		this.api = api;
		this.maxRetries = maxRetries;
	}

	public createNotebook(name: string): Promise<OneNoteApi.ResponsePackage<any>> {
		return new Promise<OneNoteApi.ResponsePackage<any>>((resolve, reject) => {
			let promiseWithRetries = PromiseUtils.execWithRetry(() => {
				return this.api.createNotebook(name);
			});
			promiseWithRetries.then((response) => {
				/**
				 * If the response has a parsedResponse property, then it is of type OneNoteApi.ResponsePackage<any>.
				 * Otherwise, it is of type OneNoteApi.RequestError.
				 */
				if ("parsedResponse" in response) {
					resolve(response);
				} else {
					reject(response);
				}
			}).catch((error) => {
				reject(error);
			});
		});
	}

	public createPage(page: OneNoteApi.OneNotePage, sectionId?: string): Promise<OneNoteApi.ResponsePackage<any>> {
		return new Promise<OneNoteApi.ResponsePackage<any>>((resolve, reject) => {
			let promiseWithRetries = PromiseUtils.execWithRetry(() => {
				return this.api.createPage(page, sectionId);
			});
			promiseWithRetries.then((response) => {
				if ("parsedResponse" in response) {
					resolve(response);
				} else {
					reject(response);
				}
			}).catch((error) => {
				reject(error);
			});
		});
	}

	// TODO: call this sendBatch or somethin to differentiate it
	public sendBatchRequest(batchRequest: OneNoteApi.BatchRequest): Promise<OneNoteApi.ResponsePackage<any>> {
		return new Promise<OneNoteApi.ResponsePackage<any>>((resolve, reject) => {
			let promiseWithRetries = PromiseUtils.execWithRetry(() => {
				return this.api.sendBatchRequest(batchRequest);
			});
			promiseWithRetries.then((response) => {
				if ("parsedResponse" in response) {
					resolve(response);
				} else {
					reject(response);
				}
			}).catch((error) => {
				reject(error);
			});
		});
	}

	public getPage(pageId: string): Promise<OneNoteApi.ResponsePackage<any>> {
		return new Promise<OneNoteApi.ResponsePackage<any>>((resolve, reject) => {
			let promiseWithRetries = PromiseUtils.execWithRetry(() => {
				return this.api.getPage(pageId);
			});
			promiseWithRetries.then((response) => {
				if ("parsedResponse" in response) {
					resolve(response);
				} else {
					reject(response);
				}
			}).catch((error) => {
				reject(error);
			});
		});
	}

	public getPageContent(pageId: string): Promise<OneNoteApi.ResponsePackage<any>> {
		return new Promise<OneNoteApi.ResponsePackage<any>>((resolve, reject) => {
			let promiseWithRetries = PromiseUtils.execWithRetry(() => {
				return this.api.getPageContent(pageId);
			});
			promiseWithRetries.then((response) => {
				if ("parsedResponse" in response) {
					resolve(response);
				} else {
					reject(response);
				}
			}).catch((error) => {
				reject(error);
			});
		});
	}

	public getPages(options: { top?: number, sectionId?: string }): Promise<OneNoteApi.ResponsePackage<any>> {
		return new Promise<OneNoteApi.ResponsePackage<any>>((resolve, reject) => {
			let promiseWithRetries = PromiseUtils.execWithRetry(() => {
				return this.api.getPages(options);
			});
			promiseWithRetries.then((response) => {
				if ("parsedResponse" in response) {
					resolve(response);
				} else {
					reject(response);
				}
			}).catch((error) => {
				reject(error);
			});
		});
	}

	public updatePage(pageId: string, revisions: OneNoteApi.Revision[]): Promise<OneNoteApi.ResponsePackage<any>> {
		return new Promise<OneNoteApi.ResponsePackage<any>>((resolve, reject) => {
			let promiseWithRetries = PromiseUtils.execWithRetry(() => {
				return this.api.updatePage(pageId, revisions);
			});
			promiseWithRetries.then((response) => {
				if ("parsedResponse" in response) {
					resolve(response);
				} else {
					reject(response);
				}
			}).catch((error) => {
				reject(error);
			});
		});
	}

	public createSection(notebookId: string, name: string): Promise<OneNoteApi.ResponsePackage<any>> {
		return new Promise<OneNoteApi.ResponsePackage<any>>((resolve, reject) => {
			let promiseWithRetries = PromiseUtils.execWithRetry(() => {
				return this.api.createSection(notebookId, name);
			});
			promiseWithRetries.then((response) => {
				if ("parsedResponse" in response) {
					resolve(response);
				} else {
					reject(response);
				}
			}).catch((error) => {
				reject(error);
			});
		});
	}

	public getNotebooks(excludeReadOnlyNotebooks?: boolean): Promise<OneNoteApi.ResponsePackage<any>> {
		return new Promise<OneNoteApi.ResponsePackage<any>>((resolve, reject) => {
			let promiseWithRetries = PromiseUtils.execWithRetry(() => {
				return this.api.getNotebooks(excludeReadOnlyNotebooks);
			});
			promiseWithRetries.then((response) => {
				if ("parsedResponse" in response) {
					resolve(response);
				} else {
					reject(response);
				}
			}).catch((error) => {
				reject(error);
			});
		});
	}

	public getNotebooksWithExpandedSections(expands?: number, excludeReadOnlyNotebooks?: boolean): Promise<OneNoteApi.ResponsePackage<any>> {
		return new Promise<OneNoteApi.ResponsePackage<any>>((resolve, reject) => {
			let promiseWithRetries = PromiseUtils.execWithRetry(() => {
				return this.api.getNotebooksWithExpandedSections(expands, excludeReadOnlyNotebooks);
			});
			promiseWithRetries.then((response) => {
				if ("parsedResponse" in response) {
					resolve(response);
				} else {
					reject(response);
				}
			}).catch((error) => {
				reject(error);
			});
		});
	}

	public getNotebookByName(name: string): Promise<OneNoteApi.ResponsePackage<any>> {
		return new Promise<OneNoteApi.ResponsePackage<any>>((resolve, reject) => {
			let promiseWithRetries = PromiseUtils.execWithRetry(() => {
				return this.api.getNotebookByName(name);
			});
			promiseWithRetries.then((response) => {
				if ("parsedResponse" in response) {
					resolve(response);
				} else {
					reject(response);
				}
			}).catch((error) => {
				reject(error);
			});
		});
	}

	public pagesSearch(query: string): Promise<OneNoteApi.ResponsePackage<any>> {
		return new Promise<OneNoteApi.ResponsePackage<any>>((resolve, reject) => {
			let promiseWithRetries = PromiseUtils.execWithRetry(() => {
				return this.api.pagesSearch(query);
			});
			promiseWithRetries.then((response) => {
				if ("parsedResponse" in response) {
					resolve(response);
				} else {
					reject(response);
				}
			}).catch((error) => {
				reject(error);
			});
		});
	}
}
