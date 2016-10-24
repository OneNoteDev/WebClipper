/// <reference path="../../../node_modules/onenoteapi/target/oneNoteApi.d.ts" />

import {ArrayUtils} from "../arrayUtils";
import {Constants} from "../constants";
import {Settings} from "../settings";
import {StringUtils} from "../stringUtils";
import {Utils} from "../utils";

import {AugmentationModel} from "../contentCapture/augmentationHelper";
import {PdfScreenshotResult} from "../contentCapture/pdfScreenshotHelper";

import {DomUtils} from "../domParsers/domUtils";

import {Localization} from "../localization/localization";
import {PdfPreviewInfo} from "../previewInfo";

import * as Log from "../logging/log";

import {ClipperStorageKeys} from "../storage/clipperStorageKeys";

import {ClipMode} from "./clipMode";
import {Clipper} from "./frontEndGlobals";
import {ClipperState} from "./clipperState";
import {OneNoteApiUtils} from "./oneNoteApiUtils";
import {Status} from "./status";

import * as _ from "lodash";

export interface StartClipPackage {
	responsePackage: OneNoteApi.ResponsePackage<any>;
	annotationAdded: boolean;
}

export class SaveToOneNote {
	private static clipperState: ClipperState;

	// Used by PDF mode
	private static maxMimeSizeLimit = 24900000;
	private static maxImagesPerPatchRequest = 15;
	private static timeBeforeFirstPatch = 1000;
	private static timeBetweenPatchRequests = 5000;

	/**
	 * Checks for the 1) data result from creating a new page on clip, and 2) completion of the show ratings prompt calculation
	 */
	public static getClipSuccessStatus(clipperState: ClipperState): Status {
		if (clipperState.showRatingsPrompt && !Utils.isNullOrUndefined(clipperState.showRatingsPrompt.get()) && clipperState.oneNoteApiResult.data) {
			return Status.Succeeded;
		}
		return Status.InProgress;
	}

	public static startClip(clipperState: ClipperState): Promise<StartClipPackage | OneNoteApi.RequestError> {
		this.logPageModifications(clipperState);

		return new Promise<StartClipPackage | OneNoteApi.RequestError>((resolve, reject) => {
			this.clipperState = clipperState;

			let pageInfo = clipperState.pageInfo;
			let title = clipperState.previewGlobalInfo.previewTitleText;
			let page = new OneNoteApi.OneNotePage(title, "", pageInfo.contentLocale, this.getMetaData());

			let annotationAdded: boolean = this.addAnnotationToPage(page);

			let currentMode = clipperState.currentMode.get();
			if (currentMode !== ClipMode.Bookmark) {
				this.addClippedFromUrlToPage(page);
			}

			this.addPrimaryContentToPage(page, currentMode).then(() => {
				this.executeApiRequest(page, currentMode).then((responsePackage: OneNoteApi.ResponsePackage<any>) => {
					this.incrementClipSuccessCount(clipperState);
					resolve({ responsePackage: responsePackage, annotationAdded: annotationAdded });
				}, (error: OneNoteApi.RequestError) => {
					reject(error);
				});
			});
		});
	}

	/**
	 * Logs modifications made by the user to customize their clip. TODO: Split this up so that we only log options common
	 * across all modes (i.e., don't use "Not Applicable")
	 */
	private static logPageModifications(clipperState: ClipperState) {
		let isAugmentationMode = clipperState.currentMode.get() === ClipMode.Augmentation;
		let notApplicableText = "Not Applicable";

		let pageModificationsEvent = new Log.Event.BaseEvent(Log.Event.Label.PageModifications);
		pageModificationsEvent.setCustomProperty(Log.PropertyName.Custom.ClipMode, ClipMode[clipperState.currentMode.get()]);
		pageModificationsEvent.setCustomProperty(Log.PropertyName.Custom.AugmentationModel, isAugmentationMode ? AugmentationModel[clipperState.augmentationResult.data.ContentModel] : notApplicableText);
		pageModificationsEvent.setCustomProperty(Log.PropertyName.Custom.PageTitleModified, clipperState.pageInfo.contentTitle !== clipperState.previewGlobalInfo.previewTitleText);
		pageModificationsEvent.setCustomProperty(Log.PropertyName.Custom.FontSize, isAugmentationMode ? clipperState.previewGlobalInfo.fontSize : notApplicableText);
		pageModificationsEvent.setCustomProperty(Log.PropertyName.Custom.IsSerif, isAugmentationMode ? clipperState.previewGlobalInfo.serif : notApplicableText);

		if (isAugmentationMode) {
			let container = document.createElement("div");
			container.innerHTML = DomUtils.cleanHtml(clipperState.augmentationPreviewInfo.previewBodyHtml);
			let highlightedList = container.getElementsByClassName(Constants.Classes.highlighted);
			pageModificationsEvent.setCustomProperty(Log.PropertyName.Custom.ContainsAtLeastOneHighlight, highlightedList && highlightedList.length > 0);
		} else {
			pageModificationsEvent.setCustomProperty(Log.PropertyName.Custom.ContainsAtLeastOneHighlight, notApplicableText);
		}

		Clipper.logger.logEvent(pageModificationsEvent);
	}

	/**
	 * If augmentation mode was used, returns the augmentation results metadata;
	 * undefined otherwise.
	 */
	private static getMetaData() {
		if (this.clipperState.currentMode.get() === ClipMode.Augmentation &&
			this.clipperState.augmentationResult.data
			&& this.clipperState.augmentationResult.data.PageMetadata) {
			return this.clipperState.augmentationResult.data.PageMetadata;
		}
		return undefined;
	}

	/**
	 * If an annotation was specified, appends it to the given page; does nothing otherwise
	 */
	private static addAnnotationToPage(page: OneNoteApi.OneNotePage): boolean {
		let annotationAdded = this.clipperState.previewGlobalInfo.annotation && this.clipperState.previewGlobalInfo.annotation !== "";
		if (annotationAdded) {
			let annotationWithQuotes = '"' + this.clipperState.previewGlobalInfo.annotation + '"';
			let encodedAnnotation = page.escapeHtmlEntities(annotationWithQuotes);

			let formattedAnnotation = SaveToOneNote.createPostProcessessedHtml("<div>" + encodedAnnotation + "</div>");
			page.addOnml(formattedAnnotation.outerHTML);
		}

		return annotationAdded;
	}

	/**
	 * Appends the "Clipped from: <url>" text to the given page
	 */
	private static addClippedFromUrlToPage(page: OneNoteApi.OneNotePage): void {
		let sourceUrlCitation = Localization.getLocalizedString("WebClipper.FromCitation")
			.replace("{0}", '<a href="' + (this.clipperState.pageInfo.rawUrl) + '">' + this.clipperState.pageInfo.rawUrl + "</a>");

		let formattedCitation = SaveToOneNote.createPostProcessessedHtml(sourceUrlCitation);
		page.addOnml(formattedCitation.outerHTML);
	}

	/**
	 * Appends content to the page, depending on the clip mode and options that the user
	 * specified.
	 */
	private static addPrimaryContentToPage(page: OneNoteApi.OneNotePage, mode: ClipMode): Promise<any> {
		let clipperState = this.clipperState;

		return new Promise((resolve, reject) => {
			switch (clipperState.currentMode.get()) {
				default:
				case ClipMode.Pdf:
					this.addEnhancedUrlContentToPage(page).then(() => {
						resolve();
					});
					break;
				case ClipMode.FullPage:
					page.addHtml(clipperState.pageInfo.contentData);
					resolve();
					break;
				case ClipMode.Region:
					for (let regionDataUrl of clipperState.regionResult.data) {
						// TODO: The API currently does not correctly space paragraphs. We need to remove "&nbsp;" when its fixed.
						page.addOnml("<p><img src=\"" + regionDataUrl + "\" /></p>&nbsp;");
					}
					resolve();
					break;
				case ClipMode.Augmentation:
					let processedAugmentedContent = SaveToOneNote.createPostProcessessedHtml(this.clipperState.augmentationPreviewInfo.previewBodyHtml);
					page.addOnml(processedAugmentedContent.outerHTML);
					resolve();
					break;
				case ClipMode.Bookmark:
					let processedBookmarkContent = SaveToOneNote.createPostProcessessedHtml(this.clipperState.bookmarkPreviewInfo.previewBodyHtml);
					page.addOnml(processedBookmarkContent.outerHTML);
					resolve();
					break;
				case ClipMode.Selection:
					let processedSelectedContent = SaveToOneNote.createPostProcessessedHtml(this.clipperState.selectionPreviewInfo.previewBodyHtml);
					page.addOnml(processedSelectedContent.outerHTML);
					resolve();
					break;
			}
		});
	}

	/**
	 * Adds styling around the given HTML as an inline style to reflect the options the user selected
	 */
	private static createPostProcessessedHtml(html: string): HTMLElement {
		// Wrap the preview in in-line styling to persist the styling through the OneNote API
		let newPreviewBody = document.createElement("div");
		newPreviewBody.innerHTML = DomUtils.cleanHtml(html);

		let fontSize = this.clipperState.previewGlobalInfo.fontSize.toString() + "px";
		let fontFamilyString = (this.clipperState.previewGlobalInfo.serif) ? "WebClipper.FontFamily.Preview.SerifDefault" : "WebClipper.FontFamily.Preview.SansSerifDefault";
		let fontFamily = Localization.getLocalizedString(fontFamilyString);
		let fontStyleString = "font-size: " + fontSize + "; font-family: " + fontFamily + ";";

		newPreviewBody.setAttribute("style", fontStyleString);

		// Tables don't inherit styles on the outer div in OneNote API
		let tables = newPreviewBody.getElementsByTagName("TABLE");
		for (let i = 0; i < tables.length; i++) {
			let table = tables[i] as HTMLTableElement;
			table.setAttribute("style", fontStyleString);
		}

		this.stripUnwantedUIElements(newPreviewBody);
		return newPreviewBody;
	}

	/**
	 * Adds 1 to the value stored in StorageKeys.numSuccessfulClips and clipperState.numSuccessfulClips
	 */
	private static incrementClipSuccessCount(clipperState: ClipperState): void {
		let numSuccessfulClips: number = clipperState.numSuccessfulClips.get();

		numSuccessfulClips++;

		Clipper.storeValue(ClipperStorageKeys.numSuccessfulClips, numSuccessfulClips.toString());
		clipperState.numSuccessfulClips.set(numSuccessfulClips);
	}

	/**
	 * Strips out UI elements in the preview that we don't wish to persist to the API
	 */
	private static stripUnwantedUIElements(elem: HTMLElement) {
		// Getting a list of buttons and deleting them one-by-one does not work due to a weird index/dereference issue, so we do it this way
		while (true) {
			let deleteHighlightButton = elem.querySelector("." + Constants.Classes.deleteHighlightButton);
			if (!deleteHighlightButton) {
				break;
			}
			deleteHighlightButton.parentNode.removeChild(deleteHighlightButton);
		}
	}

	/**
	 * Adds the enhanced url content to the page. If it is still being retrieved, wait for it to finish first.
	 */
	private static addEnhancedUrlContentToPage(page: OneNoteApi.OneNotePage): Promise<any> {
		let clipperState = this.clipperState;

		return new Promise((resolve, reject) => {
			if (clipperState.pdfResult.status === Status.InProgress) {
				let waitOnBinaryBeforePdfClipEvent = new Log.Event.PromiseEvent(Log.Event.Label.WaitOnBinaryRequestBeforePdfClip);

				clipperState.pdfResult.data.subscribe((pdfResult: PdfScreenshotResult) => {
					Clipper.logger.logEvent(waitOnBinaryBeforePdfClipEvent);

					pdfResult.pdf.getData().then((buffer) => {
						this.addEnhancedUrlContentToPageHelper(page, buffer);
						resolve();
					});
				}, { times: 1, callOnSubscribe: false });
			} else {
				clipperState.pdfResult.data.get().pdf.getData().then((buffer) => {
					this.addEnhancedUrlContentToPageHelper(page, buffer);
					resolve();
				});
			}
		});
	}

	/**
	 * Appends the PDF attachment to the page if enabled by the user
	 */
	private static addEnhancedUrlContentToPageHelper(page: OneNoteApi.OneNotePage, arrayBuffer: ArrayBuffer) {
		this.logPdfOptions();

		// Attach PDF if applicable. Impose MIME size limit: https://msdn.microsoft.com/en-us/library/office/dn655137.aspx
		let rawUrl = this.clipperState.pageInfo.rawUrl;
		let mimePartName: string;
		if (this.clipperState.pdfResult.status === Status.Succeeded && arrayBuffer) {
			if (arrayBuffer.byteLength < this.maxMimeSizeLimit) {
				let attachmentName = Utils.getFileNameFromUrl(this.clipperState.pageInfo.rawUrl, "Original.pdf");
				if (this.clipperState.pdfPreviewInfo.shouldAttachPdf) {
					mimePartName = page.addAttachment(arrayBuffer, attachmentName);
				}
			}
		}
	}

	private static getAllPdfPageIndexesToBeSent(): number[] {
		if (this.clipperState.pdfPreviewInfo.allPages) {
			return _.range(this.clipperState.pdfResult.data.get().viewportDimensions.length);
		}
		return StringUtils.parsePageRange(this.clipperState.pdfPreviewInfo.selectedPageRange).map((indexFromOne) => indexFromOne - 1);
	}

	// private static getDataUrlsForPageIndexes(indexes: number[]): string[] {
	// 	return this.clipperState.pdfResult.data.get().dataUrls.filter((value, index) => indexes.indexOf(index) >= 0);
	// }

	// Note this is called only after we finish waiting on the pdf request
	private static logPdfOptions() {
		let clipPdfEvent = new Log.Event.BaseEvent(Log.Event.Label.ClipPdfOptions);

		let pdfInfo = this.clipperState.pdfPreviewInfo;
		clipPdfEvent.setCustomProperty(Log.PropertyName.Custom.PdfAllPagesClipped, pdfInfo.allPages);
		clipPdfEvent.setCustomProperty(Log.PropertyName.Custom.PdfAttachmentClipped, pdfInfo.shouldAttachPdf);
		clipPdfEvent.setCustomProperty(Log.PropertyName.Custom.PdfIsLocalFile, this.clipperState.pageInfo.rawUrl.indexOf("file:///") === 0);

		let totalPageCount = this.clipperState.pdfResult.data.get().viewportDimensions.length;
		clipPdfEvent.setCustomProperty(Log.PropertyName.Custom.PdfFileSelectedPageCount, Math.min(totalPageCount, StringUtils.countPageRange(pdfInfo.selectedPageRange)));
		clipPdfEvent.setCustomProperty(Log.PropertyName.Custom.PdfFileTotalPageCount, totalPageCount);

		Clipper.logger.logEvent(clipPdfEvent);
	}

	/**
	 * Executes the request(s) needed to save the clip to OneNote
	 */
	private static executeApiRequest(page: OneNoteApi.OneNotePage, clipMode: ClipMode): Promise<any> {
		if (clipMode === ClipMode.Pdf) {
			return SaveToOneNote.patchPdfPages(page);
		}

		let saveLocation = SaveToOneNote.clipperState.saveLocation;
		return SaveToOneNote.getApiInstance().createPage(page, saveLocation);
	}

	/**
	 * Starting from the 31st PDF page, divides the remaining PDF pages as evenly as possible, where each
	 * group has <= 30 pages, and then chains them all to be sent to OneNote as PATCH requests. Simply
	 * resolves if there are no PDF pages to PATCH.
	 */
	private static patchPdfPages(page: OneNoteApi.OneNotePage): Promise<any> {
		let clipperState = SaveToOneNote.clipperState;
		let previewOptions = clipperState.pdfPreviewInfo;
		let pdfDocumentProxy = clipperState.pdfResult.data.get().pdf;

		let indexesToBePatched = SaveToOneNote.getAllPdfPageIndexesToBeSent();
		if (indexesToBePatched.length === 0) {
			return new Promise<any>((resolve) => { resolve(); });
		}

		console.log(ArrayUtils.partition(indexesToBePatched, SaveToOneNote.maxImagesPerPatchRequest));
		let indexesToBePatchedRanges = ArrayUtils.partition(indexesToBePatched, SaveToOneNote.maxImagesPerPatchRequest);
		// let dataUrlRanges = ArrayUtils.partition(indexesToBePatched, SaveToOneNote.maxImagesPerPatchRequest)
			// .map((partition) => partition.map((index) => this.clipperState.pdfResult.data.get().dataUrls[index]));
		// All that exists in pdfResult is pdfDocumentProxy

		// TODO this assumes that we don't fail any of the responses!
		return SaveToOneNote.createNewPage(page, ClipMode.Pdf).then((postPageResponse /* should also be a onenote response */) => {
			let pageId = postPageResponse.parsedResponse.id;

			// As of 10/21/16, the page sometimes does not exist after the 200 is returned, so we wait a bit
			let timeBetweenPatchRequests = SaveToOneNote.timeBeforeFirstPatch;
			return Promise.all([postPageResponse,
				indexesToBePatchedRanges.reduce((chainedPromise, currentRange) => {
					return chainedPromise = chainedPromise.then((returnValueOfPreviousPromise /* should be a onenote response */) => {
						return new Promise((resolve) => {
							// OneNote API returns 204 on a PATCH request when it receives it, but we have no way of telling when it actually
							// completes processing, so we add an artificial timeout before the next PATCH to try and ensure that they get
							// processed in the order that they were sent.
							setTimeout(() => {
								SaveToOneNote.createOneNotePagePatchRequest(pageId, pdfDocumentProxy, currentRange).then(() => {
									timeBetweenPatchRequests = SaveToOneNote.timeBetweenPatchRequests;
									resolve();
								});
							}, timeBetweenPatchRequests);
						});
					});
				}, SaveToOneNote.getPage(pageId))
			]);
		});
	}

	/**
	 * Given an array of dataUrls and the pageId, creates and sends the request to append the pages to the specified
	 * page with the images
	 */
	private static createOneNotePagePatchRequest(pageId: string, pdf: PDFDocumentProxy, pageRange: number[]): Promise<any> {
		return SaveToOneNote.getDataUrlsForPdfPageRange(pdf, pageRange).then((dataUrls) => {
			let revisions = SaveToOneNote.createPatchRequestBody(dataUrls);
			return SaveToOneNote.getApiInstance().updatePage(pageId, revisions);
		});
	}

	/**
	 * Creates the PATCH request body as ONML with the given image dataUrls
	 */
	private static createPatchRequestBody(dataUrls: string[]): OneNoteApi.Revision[] {
		let requestBody = [];
		dataUrls.forEach((dataUrl) => {
			let content = "<p><img src=\"" + dataUrl + "\" /></p>&nbsp;";
			requestBody.push({
				target: "body",
				action: "append",
				content: content
			});
		});
		return requestBody;
	}

	/**
	 * Sends a GET request for the specified pageId
	 */
	private static getPage(pageId: string): Promise<any> {
		return SaveToOneNote.getApiInstance().getPage(pageId);
	}

	/**
	 * POST the page to OneNote API
	 */
	private static createNewPage(page: OneNoteApi.OneNotePage, clipMode: ClipMode): Promise<any> {
		let saveLocation = SaveToOneNote.clipperState.saveLocation;
		return SaveToOneNote.getApiInstance().createPage(page, saveLocation);
	}

	/**
	 * Gets the instance of the API based on the current user's authorization token
	 */
	private static getApiInstance(): OneNoteApi.OneNoteApi {
		let headers: { [key: string]: string } = {};
		headers[Constants.HeaderValues.appIdKey] = Settings.getSetting("App_Id");
		headers[Constants.HeaderValues.userSessionIdKey] = Clipper.getUserSessionId();
		return new OneNoteApi.OneNoteApi(SaveToOneNote.clipperState.userResult.data.user.accessToken, undefined /* timeout */, headers);
	}

	private static getDataUrlsForPdfPageRange(pdf: PDFDocumentProxy, range: number[]): Promise<string[]> {
		let numPages = range.length;
		let dataUrls = new Array(numPages);
		return new Promise<string[]>((resolve) => {
			for (let i = 0; i < numPages; i++) {
				let currentPage = range[i];
				// Pages start at index 1
				pdf.getPage(currentPage + 1).then((page) => {
					let viewport = page.getViewport(1 /* scale */);
					let canvas = document.createElement("canvas") as HTMLCanvasElement;
					let context = canvas.getContext("2d");
					canvas.height = viewport.height;
					canvas.width = viewport.width;

					let renderContext = {
						canvasContext: context,
						viewport: viewport
					};

					// Rendering is async so results may come back in any order
					page.render(renderContext).then(() => {
						dataUrls[i] = canvas.toDataURL();
						if (ArrayUtils.isArrayComplete(dataUrls)) {
							// getBinaryEvent.stopTimer();
							// getBinaryEvent.setCustomProperty(Log.PropertyName.Custom.AverageProcessingDurationPerPage, getBinaryEvent.getDuration() / pdf.numPages);
							// Clipper.logger.logEvent(getBinaryEvent);
							resolve(dataUrls);
						}
					});
				});
			}
		});
	}
}
