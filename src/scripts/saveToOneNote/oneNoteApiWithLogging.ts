import {Clipper} from "../clipperUI/frontEndGlobals";
import {OneNoteApiUtils} from "../clipperUI/OneNoteApiUtils";
import {Constants} from "../constants";
import * as Log from "../logging/log";
import {IOneNoteApi} from "./iOneNoteApi";
import RequestError = OneNoteApi.RequestError;

export class OneNoteApiWithLogging implements IOneNoteApi {
	private api: IOneNoteApi;

	constructor(api: IOneNoteApi) {
		this.api = api;
	}

	createNotebook(name: string) {
		return this.executeWithLogging(() => {
			return this.api.createNotebook(name);
		}, Log.Event.Label.CreateNotebook);
	}

	createPage(page: OneNoteApi.OneNotePage, sectionId?: string) {
		return this.executeWithLogging(() => {
			return this.api.createPage(page, sectionId);
		}, Log.Event.Label.CreatePage);
	}

	sendBatchRequest(batchRequest: OneNoteApi.BatchRequest) {
		return this.executeWithLogging(() => {
			return this.api.sendBatchRequest(batchRequest);
		}, Log.Event.Label.SendBatchRequest);
	}

	getPage(pageId: string) {
		return this.executeWithLogging(() => {
			return this.api.getPage(pageId);
		}, Log.Event.Label.GetPage);
	}

	getPageContent(pageId: string) {
		return this.executeWithLogging(() => {
			return this.api.getPageContent(pageId);
		}, Log.Event.Label.GetPageContent);
	}

	getPages(options: { top?: number, sectionId?: string }) {
		return this.executeWithLogging(() => {
			return this.api.getPages(options);
		}, Log.Event.Label.GetPages);
	}

	updatePage(pageId: string, revisions: OneNoteApi.Revision[]) {
		return this.executeWithLogging(() => {
			return this.api.updatePage(pageId, revisions);
		}, Log.Event.Label.UpdatePage);
	}

	createSection(notebookId: string, name: string) {
		return this.executeWithLogging(() => {
			return this.api.createSection(notebookId, name);
		}, Log.Event.Label.CreateSection);
	}

	getNotebooks(excludeReadOnlyNotebooks?: boolean) {
		return this.executeWithLogging(() => {
			return this.api.getNotebooks(excludeReadOnlyNotebooks);
		}, Log.Event.Label.GetNotebooks);
	}

	getNotebooksWithExpandedSections(expands?: number, excludeReadOnlyNotebooks?: boolean) {
		return this.executeWithLogging(() => {
			return this.api.getNotebooksWithExpandedSections(expands, excludeReadOnlyNotebooks);
		}, Log.Event.Label.GetNotebooks /* re-use same label as getNotebooks */);
	}

	getNotebookByName(name: string) {
		return this.executeWithLogging(() => {
			return this.api.getNotebookByName(name);
		}, Log.Event.Label.GetNotebookByName);
	}

	pagesSearch(query: string) {
		return this.executeWithLogging(() => {
			return this.api.pagesSearch(query);
		}, Log.Event.Label.PagesSearch);
	}

	private executeWithLogging(func: () => Promise<OneNoteApi.ResponsePackage<any> | RequestError>, eventLabel: Log.Event.Label): Promise<OneNoteApi.ResponsePackage<any>> {
		return new Promise<OneNoteApi.ResponsePackage<any>>((resolve, reject) => {
			let event = new Log.Event.PromiseEvent(eventLabel);
			let correlationId: string;
			return func().then((response: OneNoteApi.ResponsePackage<any>) => {
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
