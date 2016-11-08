import {Constants} from "../constants";
import {PromiseUtils} from "../promiseUtils";
import {Settings} from "../settings";

import {Clipper} from "../clipperUI/frontEndGlobals";

import {ClipperStorageKeys} from "../storage/clipperStorageKeys";

import * as Log from "../logging/log";

import {OneNoteApiWithLogging} from "./oneNoteApiWithLogging";
import {OneNoteSaveable} from "./oneNoteSaveable";

import * as _ from "lodash";

export interface SaveToOneNoteOptions {
	page: OneNoteSaveable;
	saveLocation?: string;
}

/**
 * Solely responsible for saving the user's OneNote pages
 */
export class SaveToOneNote {
	private static timeBeforeFirstPatch = 1000;
	private static timeBetweenPatchRequests = 7000;

	private accessToken: string;

	constructor(accessToken: string) {
		this.accessToken = accessToken;
	}

	public save(options: SaveToOneNoteOptions): Promise<OneNoteApi.ResponsePackage<any>> {
		return new Promise<OneNoteApi.ResponsePackage<any>>((resolve, reject) => {
			if (options.page.getNumPatches() > 0) {
				this.userHasPatchPermissions(options.saveLocation).then((hasPatchPermissions) => {
					this.saveWithoutCheckingPatchPermissions(options).then((ResponsePackage) => {
						resolve(ResponsePackage);
					});
				}).catch((error) => {
					reject(error);
				});
			} else {
				this.saveWithoutCheckingPatchPermissions(options).then((responsePackage) => {
					resolve(responsePackage);
				}).catch((error) => {
					reject(error);
				});
			}
		});
	}

	// TODO: does this work in the default notebook case?
	public userHasPatchPermissions(saveLocation: string): Promise<boolean> {
		return new Promise<any>((resolve) => {
			Clipper.getStoredValue(ClipperStorageKeys.hasPatchPermissions, (hasPermissions) => {
				// We have checked their permissions successfully in the past, or the user signed in on this device (with the latest scope)
				if (hasPermissions) {
					resolve(true);
				} else {
					// As of v3.2.9, we have added a new scope for MSA to allow for PATCHing, however currently-logged-in users will not have
					// this scope, so this call is a workaround to check for permissions, but is very unperformant. We need to investigate a
					// quicker way of doing this ... perhaps exposing an endpoint that we can use for this sole purpose.
					this.getApi().getPages({ top: 1, sectionId: saveLocation }).then(() => {
						Clipper.storeValue(ClipperStorageKeys.hasPatchPermissions, "true");
						resolve(true);
					}).catch((error) => {
						resolve(false);
					});
				}
			});
		});
	}

	public saveWithoutCheckingPatchPermissions(options: SaveToOneNoteOptions): Promise<OneNoteApi.ResponsePackage<any>> {
		return new Promise<OneNoteApi.ResponsePackage<any>>((resolve, reject) => {
			options.page.getPage().then((page) => {
				this.getApi().createPage(page).then((responsePackage) => {
					if (options.page.getNumPatches() > 0) {
						let pageId = responsePackage.parsedResponse.id;
						this.patch(pageId, options.page); // TODO incomplete
					} else {
						resolve(responsePackage);
					}
				}).catch((error) => {
					reject(error);
				});
			});
		});
	}

	public patch(pageId: string, saveable: OneNoteSaveable): Promise<any> {
		// As of 10/27/16, the page is not always ready when the 200 is returned, so we wait a bit, and then getPageContent with retries
		// When the getPageContent returns a 200, we start PATCHing the page.
		let timeBetweenPatchRequests = SaveToOneNote.timeBeforeFirstPatch;
		return Promise.all([
			_.range(saveable.getNumPatches()).reduce((chainedPromise, i) => {
				return chainedPromise = chainedPromise.then(() => {
					return new Promise((resolve, reject) => {
						// OneNote API returns 204 on a PATCH request when it receives it, but we have no way of telling when it actually
						// completes processing, so we add an artificial timeout before the next PATCH to try and ensure that they get
						// processed in the order that they were sent.

						// Parallelize the PATCH request intervals with the fetching of the next set of dataUrls
						let getRevisionsPromise = saveable.getPatch(i);
						let timeoutPromise = PromiseUtils.wait(timeBetweenPatchRequests);

						Promise.all([getRevisionsPromise, timeoutPromise]).then((values) => {
							let revisions = values[0] as OneNoteApi.Revision[];
							this.createOneNotePagePatchRequest(pageId, revisions).then(() => {
								timeBetweenPatchRequests = SaveToOneNote.timeBetweenPatchRequests;
								resolve();
							}).catch((error) => {
								reject(error);
							});
						});
					});
				});
			}, this.getOneNotePageContentWithRetries(pageId, 3) /* accumulator, i.e., the promise that gets executed first */)
		]);
	}

	private createOneNotePagePatchRequest(pageId: string, revisions: OneNoteApi.Revision[]): Promise<any> {
		let patchRequestEvent = new Log.Event.PromiseEvent(Log.Event.Label.PatchRequest);
		return new Promise<any>((resolve, reject) => {
			this.sendOneNotePagePatchRequestWithRetries(pageId, revisions, Constants.Settings.numRetriesPerPatchRequest).then((data) => {
				resolve(data);
			}, (err) => {
				patchRequestEvent.setStatus(Log.Status.Failed);
				patchRequestEvent.setFailureInfo({ error: err });
				reject(err);
			}).then(() => {
				Clipper.logger.logEvent(patchRequestEvent);
			});
		});
	}

	private sendOneNotePagePatchRequestWithRetries(pageId: string, revisions: OneNoteApi.Revision[], numRetries: number): Promise<any> {
		return this.getApi().updatePage(pageId, revisions).catch((error) => {
			if (numRetries >= 1) {
				return this.sendOneNotePagePatchRequestWithRetries(pageId, revisions, numRetries - 1);
			} else {
				return Promise.reject(error);
			}
		});
	}

	/**
	 * Checks to see if a given page exists with a certain number of retries. There is a delay
	 * between each retry.
	 */
	private getOneNotePageContentWithRetries(pageId: string, numRetries: number): Promise<any> {
		return this.getApi().getPageContent(pageId).catch((error1) => {
			// If the first call fails, we need to wait a couple of seconds before trying again
			if (numRetries >= 1) {
				return new Promise<any>((resolve, reject) => {
					setTimeout(() => {
						this.getOneNotePageContentWithRetries(pageId, numRetries - 1).then((response) => {
							resolve(response);
						}).catch((error2) => {
							reject(error2);
						});
					}, Constants.Settings.pdfCheckCreatePageInterval);
				});
			} else {
				return Promise.reject(error1);
			}
		});
	}

	// TODO create a class that wraps the api and is simply in charge of logging? We have SO MUCH LOGGING BOILERPLATE. Also we should shove the patch retry logic in there!
	private getApi(): OneNoteApi.IOneNoteApi {
		let headers: { [key: string]: string } = {};
		headers[Constants.HeaderValues.appIdKey] = Settings.getSetting("App_Id");
		headers[Constants.HeaderValues.userSessionIdKey] = Clipper.getUserSessionId();

		let bareApi = new OneNoteApi.OneNoteApi(this.accessToken, undefined /* timeout */, headers);
		return new OneNoteApiWithLogging(bareApi);
	}
}