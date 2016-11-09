import {Constants} from "../constants";
import {PromiseUtils} from "../promiseUtils";
import {Settings} from "../settings";

import {Clipper} from "../clipperUI/frontEndGlobals";

import {ClipperStorageKeys} from "../storage/clipperStorageKeys";

import * as Log from "../logging/log";

import {OneNoteApiWithLogging} from "./oneNoteApiWithLogging";
import {OneNoteApiWithRetries} from "./oneNoteApiWithRetries";
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

	/**
	 * Saves a page (and if necessary, appends PATCHES) to OneNote
	 */
	public save(options: SaveToOneNoteOptions): Promise<OneNoteApi.ResponsePackage<any>> {
		return new Promise<OneNoteApi.ResponsePackage<any>>((resolve, reject) => {
			if (options.page.getNumPatches() > 0) {
				this.rejectIfNoPatchPermissions(options.saveLocation).then(() => {
					this.saveWithoutCheckingPatchPermissions(options).then((responsePackage) => {
						resolve(responsePackage);
					}, (error) => {
						reject(error);
					});
				}, (error) => {
					reject(error);
				});
			} else {
				this.saveWithoutCheckingPatchPermissions(options).then((responsePackage) => {
					resolve(responsePackage);
				}, (error) => {
					reject(error);
				});
			}
		});
	}

	// TODO: does this work in the default notebook case?
	public rejectIfNoPatchPermissions(saveLocation: string): Promise<void> {
		return new Promise<void>((resolve, reject) => {
			Clipper.getStoredValue(ClipperStorageKeys.hasPatchPermissions, (hasPermissions) => {
				// We have checked their permissions successfully in the past, or the user signed in on this device (with the latest scope)
				if (hasPermissions) {
					resolve();
				} else {
					// As of v3.2.9, we have added a new scope for MSA to allow for PATCHing, however currently-logged-in users will not have
					// this scope, so this call is a workaround to check for permissions, but is very unperformant. We need to investigate a
					// quicker way of doing this ... perhaps exposing an endpoint that we can use for this sole purpose.
					this.getApi().getPages({ top: 1, sectionId: saveLocation }).then(() => {
						Clipper.storeValue(ClipperStorageKeys.hasPatchPermissions, "true");
						resolve();
					}).catch((error) => {
						reject(error);
					});
				}
			});
		});
	}

	public saveWithoutCheckingPatchPermissions(options: SaveToOneNoteOptions): Promise<OneNoteApi.ResponsePackage<any>> {
		return new Promise<OneNoteApi.ResponsePackage<any>>((resolve, reject) => {
			options.page.getPage().then((page) => {
				this.getApi().createPage(page, options.saveLocation).then((responsePackage) => {
					if (options.page.getNumPatches() > 0) {
						let pageId = responsePackage.parsedResponse.id;
						this.patch(pageId, options.page).then(() => {
							resolve(responsePackage);
						});
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
							this.getApi().updatePage(pageId, revisions).then(() => {
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

	/**
	 * Checks to see if a given page exists
	 */
	private getOneNotePageContentWithRetries(pageId: string, numRetries: number): Promise<any> {
		// TODO numRetries not being used
		return this.getApi().getPageContent(pageId);
	}

	private getApi(): OneNoteApi.IOneNoteApi {
		let headers: { [key: string]: string } = {};
		headers[Constants.HeaderValues.appIdKey] = Settings.getSetting("App_Id");
		headers[Constants.HeaderValues.userSessionIdKey] = Clipper.getUserSessionId();

		let api = new OneNoteApi.OneNoteApi(this.accessToken, undefined /* timeout */, headers);
		let apiWithRetries = new OneNoteApiWithRetries(api);
		return new OneNoteApiWithLogging(apiWithRetries);
	}
}
