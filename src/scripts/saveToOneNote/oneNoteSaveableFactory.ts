import {Constants} from "../constants";
import {StringUtils} from "../stringUtils";
import {UrlUtils} from "../urlUtils";

import {ClipMode} from "../clipperUI/clipMode";
import {ClipperState} from "../clipperUI/clipperState";

import {DomUtils} from "../domParsers/domUtils";

import {Localization} from "../localization/localization";

import {OneNoteSaveable} from "./oneNoteSaveable";
import {OneNoteSaveablePage} from "./oneNoteSaveablePage";
import {OneNoteSaveablePdf} from "./oneNoteSaveablePdf";
import {OneNoteSaveablePdfBatched} from "./OneNoteSaveablePdfBatched";

import * as _ from "lodash";

export class OneNoteSaveableFactory {
	private static maxImagesPerPatchRequest = 15;

	public static getSaveable(clipperState: ClipperState): Promise<OneNoteSaveable> {
		return new Promise<OneNoteSaveable>((resolve) => {
			let page = OneNoteSaveableFactory.getInitialPage(clipperState);
			OneNoteSaveableFactory.addAnnotation(page, clipperState);
			OneNoteSaveableFactory.addClippedFromUrlToPage(page, clipperState);
			OneNoteSaveableFactory.addPrimaryContent(page, clipperState).then(() => {
				resolve(OneNoteSaveableFactory.pageToSaveable(page, clipperState));
			});
		});
	}

	private static getInitialPage(clipperState: ClipperState): OneNoteApi.OneNotePage {
		return new OneNoteApi.OneNotePage(
			clipperState.previewGlobalInfo.previewTitleText,
			"",
			clipperState.pageInfo.contentLocale,
			OneNoteSaveableFactory.getMetaData(clipperState)
		);
	}

	private static getMetaData(clipperState: ClipperState): { [key: string]: string } {
		if (clipperState.currentMode.get() === ClipMode.Augmentation &&
			clipperState.augmentationResult.data
			&& clipperState.augmentationResult.data.PageMetadata) {
			return clipperState.augmentationResult.data.PageMetadata;
		}
		return undefined;
	}

	private static addAnnotation(page: OneNoteApi.OneNotePage, clipperState: ClipperState) {
		let annotation = clipperState.previewGlobalInfo.annotation;
		if (annotation && annotation.length > 0) {
			let annotationWithQuotes = '"' + annotation + '"';
			let encodedAnnotation = page.escapeHtmlEntities(annotationWithQuotes);

			let formattedAnnotation = OneNoteSaveableFactory.createPostProcessessedHtml("<div>" + encodedAnnotation + "</div>", clipperState);
			page.addOnml(formattedAnnotation.outerHTML);
		}
	}

	private static createPostProcessessedHtml(html: string, clipperState: ClipperState): HTMLElement {
		// Wrap the preview in in-line styling to persist the styling through the OneNote API
		let newPreviewBody = document.createElement("div");
		newPreviewBody.innerHTML = DomUtils.cleanHtml(html);

		let fontSize = clipperState.previewGlobalInfo.fontSize.toString() + "px";
		let fontFamilyString = clipperState.previewGlobalInfo.serif ? "WebClipper.FontFamily.Preview.SerifDefault" : "WebClipper.FontFamily.Preview.SansSerifDefault";
		let fontFamily = Localization.getLocalizedString(fontFamilyString);
		let fontStyleString = "font-size: " + fontSize + "; font-family: " + fontFamily + ";";

		newPreviewBody.setAttribute("style", fontStyleString);

		// Tables don't inherit styles on the outer div in OneNote API
		let tables = newPreviewBody.getElementsByTagName("table");
		for (let i = 0; i < tables.length; i++) {
			let table = tables[i] as HTMLTableElement;
			table.setAttribute("style", fontStyleString);
		}

		this.stripUnwantedUIElements(newPreviewBody);
		return newPreviewBody;
	}

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

	private static addClippedFromUrlToPage(page: OneNoteApi.OneNotePage, clipperState: ClipperState) {
		if (clipperState.currentMode.get() !== ClipMode.Bookmark) {
			let sourceUrlCitation = Localization.getLocalizedString("WebClipper.FromCitation")
			.replace("{0}", '<a href="' + (clipperState.pageInfo.rawUrl) + '">' + clipperState.pageInfo.rawUrl + "</a>");

			let formattedCitation = OneNoteSaveableFactory.createPostProcessessedHtml(sourceUrlCitation, clipperState);
			page.addOnml(formattedCitation.outerHTML);
		}
	}

	private static addPrimaryContent(page: OneNoteApi.OneNotePage, clipperState: ClipperState): Promise<any> {
		switch (clipperState.currentMode.get()) {
			default:
			case ClipMode.Pdf:
				if (clipperState.pdfPreviewInfo.shouldAttachPdf && clipperState.pdfResult.data.get().byteLength < Constants.Settings.maximumMimeSizeLimit) {
					return OneNoteSaveableFactory.addPdfAttachment(page, clipperState);
				}
				break;
			case ClipMode.FullPage:
				page.addHtml(clipperState.pageInfo.contentData);
				break;
			case ClipMode.Region:
				for (let regionDataUrl of clipperState.regionResult.data) {
					// TODO: The API currently does not correctly space paragraphs. We need to remove "&nbsp;" when its fixed.
					page.addOnml("<p><img src=\"" + regionDataUrl + "\" /></p>&nbsp;");
				}
				break;
			case ClipMode.Augmentation:
				let processedAugmentedContent = OneNoteSaveableFactory.createPostProcessessedHtml(clipperState.augmentationPreviewInfo.previewBodyHtml, clipperState);
				page.addOnml(processedAugmentedContent.outerHTML);
				break;
			case ClipMode.Bookmark:
				let processedBookmarkContent = OneNoteSaveableFactory.createPostProcessessedHtml(clipperState.bookmarkPreviewInfo.previewBodyHtml, clipperState);
				page.addOnml(processedBookmarkContent.outerHTML);
				break;
			case ClipMode.Selection:
				let processedSelectedContent = OneNoteSaveableFactory.createPostProcessessedHtml(clipperState.selectionPreviewInfo.previewBodyHtml, clipperState);
				page.addOnml(processedSelectedContent.outerHTML);
				break;
		}
		return Promise.resolve();
	}

	private static addPdfAttachment(page: OneNoteApi.OneNotePage, clipperState: ClipperState): Promise<any> {
		return clipperState.pdfResult.data.get().pdf.getData().then((buffer) => {
			if (buffer) {
				let attachmentName = UrlUtils.getFileNameFromUrl(clipperState.pageInfo.rawUrl, "Original.pdf");
				page.addAttachment(buffer, attachmentName);
			}
			return Promise.resolve();
		});
	}

	private static pageToSaveable(page: OneNoteApi.OneNotePage, clipperState: ClipperState): OneNoteSaveable {
		if (clipperState.currentMode.get() === ClipMode.Pdf) {
			let pdf = clipperState.pdfResult.data.get().pdf;
			let pageIndexes: number[] = clipperState.pdfPreviewInfo.allPages ?
				_.range(pdf.numPages()) :
				StringUtils.parsePageRange(clipperState.pdfPreviewInfo.selectedPageRange, pdf.numPages()).map(value => value - 1);
			
			// great, now we have all the page ranges
			// But instead of a page, we want to return a big ol' BATCH request
			if (clipperState.pdfPreviewInfo.shouldDistributePages) {
				console.log("batch it up");
				return new OneNoteSaveablePdfBatched(page, pdf, pageIndexes, clipperState.pageInfo.contentLocale, clipperState.saveLocation, clipperState.previewGlobalInfo.previewTitleText);
			} else {
				return new OneNoteSaveablePdf(page, pdf, pageIndexes);
			}
		}
		return new OneNoteSaveablePage(page);
	}
}
