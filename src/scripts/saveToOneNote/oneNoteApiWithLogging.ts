import {Constants} from "../constants";

import {Clipper} from "../clipperUI/frontEndGlobals";
import {OneNoteApiUtils} from "../clipperUI/OneNoteApiUtils";

import * as Log from "../logging/log";

export class OneNoteApiWithLogging implements OneNoteApi.IOneNoteApi {
	private api: OneNoteApi.IOneNoteApi;

	constructor(api: OneNoteApi.IOneNoteApi) {
		this.api = api;
	}

	public createNotebook(name: string): Promise<OneNoteApi.ResponsePackage<any>> {
		return this.executeWithLogging(() => {
			return this.api.createNotebook(name);
		}, Log.Event.Label.CreateNotebook);
	}

	public createPage(page: OneNoteApi.OneNotePage, sectionId?: string): Promise<OneNoteApi.ResponsePackage<any>> {
		return this.executeWithLogging(() => {
			return this.api.createPage(page, sectionId);
		}, Log.Event.Label.CreatePage);
	}

	public sendBatchRequest(batchRequest: OneNoteApi.BatchRequest): Promise<OneNoteApi.ResponsePackage<any>> {
		return this.executeWithLogging(() => {
			return this.api.sendBatchRequest(batchRequest);
		}, Log.Event.Label.SendBatchRequest);
	}

	public getPage(pageId: string): Promise<OneNoteApi.ResponsePackage<any>> {
		return this.executeWithLogging(() => {
			return this.api.getPage(pageId);
		}, Log.Event.Label.GetPage);
	}

	public getPageContent(pageId: string): Promise<OneNoteApi.ResponsePackage<any>> {
		return this.executeWithLogging(() => {
			return this.api.getPageContent(pageId);
		}, Log.Event.Label.GetPageContent);
	}

	public getPages(options: { top?: number, sectionId?: string }): Promise<OneNoteApi.ResponsePackage<any>> {
		return this.executeWithLogging(() => {
			return this.api.getPages(options);
		}, Log.Event.Label.GetPages);
	}

	public updatePage(pageId: string, revisions: OneNoteApi.Revision[]): Promise<OneNoteApi.ResponsePackage<any>> {
		return this.executeWithLogging(() => {
			return this.api.updatePage(pageId, revisions);
		}, Log.Event.Label.UpdatePage);
	}

	public createSection(notebookId: string, name: string): Promise<OneNoteApi.ResponsePackage<any>> {
		return this.executeWithLogging(() => {
			return this.api.createSection(notebookId, name);
		}, Log.Event.Label.CreateSection);
	}

	public getNotebooks(excludeReadOnlyNotebooks?: boolean): Promise<OneNoteApi.ResponsePackage<any>> {
		return this.executeWithLogging(() => {
			return this.api.getNotebooks(excludeReadOnlyNotebooks);
		}, Log.Event.Label.GetNotebooks);
	}

	public getNotebooksWithExpandedSections(expands?: number, excludeReadOnlyNotebooks?: boolean): Promise<OneNoteApi.ResponsePackage<any>> {
		return this.executeWithLogging(() => {
			return this.api.getNotebooksWithExpandedSections(expands, excludeReadOnlyNotebooks);
		}, Log.Event.Label.GetNotebooks /* re-use same label as getNotebooks */);
	}

	public getNotebookByName(name: string): Promise<OneNoteApi.ResponsePackage<any>> {
		return this.executeWithLogging(() => {
			return this.api.getNotebookByName(name);
		}, Log.Event.Label.GetNotebookByName);
	}

	public pagesSearch(query: string): Promise<OneNoteApi.ResponsePackage<any>> {
		return this.executeWithLogging(() => {
			return this.api.pagesSearch(query);
		}, Log.Event.Label.PagesSearch);
	}

	private executeWithLogging(func: () => Promise<OneNoteApi.ResponsePackage<any>>, eventLabel: Log.Event.Label): Promise<OneNoteApi.ResponsePackage<any>> {
		return new Promise<OneNoteApi.ResponsePackage<any>>((resolve, reject) => {
			let event = new Log.Event.PromiseEvent(eventLabel);
			let correlationId: string;
			return func().then((response) => {
				event.setCustomProperty(Log.PropertyName.Custom.CorrelationId, response.request.getResponseHeader(Constants.HeaderValues.correlationId));
				resolve(response);
			}, (error: OneNoteApi.RequestError) => {
				OneNoteApiUtils.logOneNoteApiRequestError(event, error);
				reject(error);
			}).then(() => {
				Clipper.logger.logEvent(event);
			});
		});
	}
}
