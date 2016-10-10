/// <reference path="../../../node_modules/onenoteapi/target/oneNoteApi.d.ts" />

import {Constants} from "../constants";
import {Settings} from "../settings";
import {Utils} from "../utils";

import {AugmentationModel} from "../contentCapture/augmentationHelper";
import {PdfScreenshotResult} from "../contentCapture/pdfScreenshotHelper";

import {DomUtils} from "../domParsers/domUtils";

import {Localization} from "../localization/localization";

import * as Log from "../logging/log";

import {ClipperStorageKeys} from "../storage/clipperStorageKeys";

import {ClipMode} from "./clipMode";
import {Clipper} from "./frontEndGlobals";
import {ClipperState} from "./clipperState";
import {OneNoteApiUtils} from "./oneNoteApiUtils";
import {Status} from "./status";

export interface StartClipPackage {
	responsePackage: OneNoteApi.ResponsePackage<any>;
	annotationAdded: boolean;
}

export class SaveToOneNote {
	// Shared across various helper methods
	private static clipperState: ClipperState;
	private static maxMimeSizeLimit = 24900000;

	public static startClip(clipperState: ClipperState): Promise<StartClipPackage | OneNoteApi.RequestError> {
		this.logPageModifications(clipperState);

		return new Promise<StartClipPackage | OneNoteApi.RequestError>((resolve, reject) => {
			this.clipperState = clipperState;

			let pageInfo = clipperState.pageInfo;
			let title = clipperState.previewGlobalInfo.previewTitleText;
			let page = new OneNoteApi.OneNotePage(title, "", pageInfo.contentLocale, this.getMetaData());

			let annotationAdded: boolean = this.addAnnotationToPage(page);

			if (clipperState.currentMode.get() !== ClipMode.Bookmark) {
				this.addClippedFromUrlToPage(page);
			}

			this.addPrimaryContentToPage(page, clipperState.currentMode.get()).then(() => {
				this.createNewPage(page).then((responsePackage: OneNoteApi.ResponsePackage<any>) => {
					this.incrementClipSuccessCount(clipperState);
					resolve({ responsePackage: responsePackage, annotationAdded: annotationAdded });
				}, (error: OneNoteApi.RequestError) => {
					reject(error);
				});
			});
		});
	}

	/**
	 * Checks for the 1) data result from creating a new page on clip, and 2) completion of the show ratings prompt calculation
	 */
	public static getClipSuccessStatus(clipperState: ClipperState): Status {
		if (clipperState.showRatingsPrompt && !Utils.isNullOrUndefined(clipperState.showRatingsPrompt.get()) && clipperState.oneNoteApiResult.data) {
			return Status.Succeeded;
		}

		return Status.InProgress;
	}

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

	private static getMetaData() {
		if (this.clipperState.currentMode.get() === ClipMode.Augmentation &&
			this.clipperState.augmentationResult.data
			&& this.clipperState.augmentationResult.data.PageMetadata) {
			return this.clipperState.augmentationResult.data.PageMetadata;
		}
		return undefined;
	}

	// Adds the annotation if there is one
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

	// Adds the clipped URL citation
	private static addClippedFromUrlToPage(page: OneNoteApi.OneNotePage): void {
		let sourceUrlCitation = Localization.getLocalizedString("WebClipper.FromCitation")
			.replace("{0}", '<a href="' + (this.clipperState.pageInfo.rawUrl) + '">' + this.clipperState.pageInfo.rawUrl + "</a>");

		let formattedCitation = SaveToOneNote.createPostProcessessedHtml(sourceUrlCitation);
		page.addOnml(formattedCitation.outerHTML);
	}

	// Adds the primary page content to the page, which may be async or not
	private static addPrimaryContentToPage(page: OneNoteApi.OneNotePage, mode: ClipMode): Promise<any> {
		let clipperState = this.clipperState;

		return new Promise((resolve, reject) => {
			switch (clipperState.currentMode.get()) {
				default:
				case ClipMode.FullPage:
					if (clipperState.pageInfo.contentType === OneNoteApi.ContentType.EnhancedUrl) {
						this.addEnhancedUrlContentToPage(page).then(() => {
							resolve();
						});
					} else {
						page.addHtml(clipperState.pageInfo.contentData);
						resolve();
					}
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

	// Adds 1 to the value stored in StorageKeys.numSuccessfulClips and clipperState.numSuccessfulClips
	private static incrementClipSuccessCount(clipperState: ClipperState): void {
		let numSuccessfulClips: number = clipperState.numSuccessfulClips.get();

		numSuccessfulClips++;

		Clipper.storeValue(ClipperStorageKeys.numSuccessfulClips, numSuccessfulClips.toString());
		clipperState.numSuccessfulClips.set(numSuccessfulClips);
	}

	// Strips out UI elements that we don't wish to persist to the API
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

	// Adds the enhanced url content to the page. If it is still being retrieved, wait for it to finish first.
	private static addEnhancedUrlContentToPage(page: OneNoteApi.OneNotePage): Promise<any> {
		let clipperState = this.clipperState;

		return new Promise((resolve, reject) => {
			if (clipperState.pdfResult.status === Status.InProgress) {
				let waitOnBinaryBeforePdfClipEvent = new Log.Event.PromiseEvent(Log.Event.Label.WaitOnBinaryRequestBeforePdfClip);

				clipperState.pdfResult.data.subscribe((pdfResult: PdfScreenshotResult) => {
					Clipper.logger.logEvent(waitOnBinaryBeforePdfClipEvent);

					this.addEnhancedUrlContentToPageHelper(page, pdfResult.arrayBuffer);
					resolve();
				}, { times: 1, callOnSubscribe: false });
			} else {
				this.addEnhancedUrlContentToPageHelper(page, clipperState.pdfResult.data.get().arrayBuffer);
				resolve();
			}
		});
	}

	// Adds the given binary to the page if it is below the MIME size limit, then adds it as an image
	private static addEnhancedUrlContentToPageHelper(page: OneNoteApi.OneNotePage, arrayBuffer: ArrayBuffer) {
		// Impose MIME size limit: https://msdn.microsoft.com/en-us/library/office/dn655137.aspx
		if (this.clipperState.pdfResult.status === Status.Succeeded && arrayBuffer) {
			if (arrayBuffer.byteLength < this.maxMimeSizeLimit) {
				let attachmentName = Utils.getFileNameFromUrl(this.clipperState.pageInfo.rawUrl, "Original.pdf");
				page.addAttachment(arrayBuffer, attachmentName);
			}
		}
		page.addObjectUrlAsImage(this.clipperState.pageInfo.rawUrl);
	}

	// POST the page to OneNote API
	private static createNewPage(page: OneNoteApi.OneNotePage): Promise<any> {
		let headers: { [key: string]: string } = {};
		headers[Constants.HeaderValues.appIdKey] = Settings.getSetting("App_Id");
		headers[Constants.HeaderValues.userSessionIdKey] = Clipper.getUserSessionId();
		let oneNoteApi = new OneNoteApi.OneNoteApi(this.clipperState.userResult.data.user.accessToken, undefined /* timeout */, headers);
		return oneNoteApi.createPage(page, this.clipperState.saveLocation);
	}
}
