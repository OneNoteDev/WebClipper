import {Constants} from "../constants";
import {OperationResult} from "../operationResult";
import {StringUtils} from "../stringUtils";
import {UrlUtils} from "../urlUtils";

import {ClipMode} from "../clipperUI/clipMode";
import {ClipperState} from "../clipperUI/clipperState";
import {Status} from "../clipperUI/status";

import {DomUtils} from "../domParsers/domUtils";

import {Localization} from "../localization/localization";

import {OneNoteSaveable} from "./oneNoteSaveable";
import {OneNoteSaveablePage} from "./oneNoteSaveablePage";
import {OneNoteSaveablePdf} from "./oneNoteSaveablePdf";
import {OneNoteSaveablePdfBatched} from "./OneNoteSaveablePdfBatched";

import * as _ from "lodash";

export class OneNoteSaveableFactory {
	private static maxImagesPerPatchRequest = 15;
	private clipperState: ClipperState;

	constructor(clipperState: ClipperState) {
		this.clipperState = clipperState;
	}

	public getSaveable(): Promise<OneNoteSaveable> {
		let page = this.getInitialPage();
		this.addAnnotation(page);
		this.addClippedFromUrlToPage(page);
		return this.addPrimaryContent(page).then(() => {
			return this.pageToSaveable(page);
		});
	}

	private getInitialPage(): OneNoteApi.OneNotePage {
		let title = this.clipperState.previewGlobalInfo.previewTitleText;

		if (this.clipperState.currentMode.get() === ClipMode.Pdf && this.clipperState.pdfPreviewInfo.shouldDistributePages) {
			const firstPageIndex = this.getPageIndicesToSendInPdfMode()[0];
			title = StringUtils.getBatchedPageTitle(title, firstPageIndex);
		}

		return new OneNoteApi.OneNotePage(
			title,
			"",
			this.clipperState.pageInfo.contentLocale,
			this.getMetaData()
		);
	}

	private getMetaData(): { [key: string]: string } {
		if (this.clipperState.currentMode.get() === ClipMode.Augmentation &&
			this.clipperState.augmentationResult.data &&
			this.clipperState.augmentationResult.data.PageMetadata) {
			return this.clipperState.augmentationResult.data.PageMetadata;
		}
		return undefined;
	}

	private addAnnotation(page: OneNoteApi.OneNotePage) {
		let annotation = this.clipperState.previewGlobalInfo.annotation;
		if (annotation && annotation.length > 0) {
			let annotationWithQuotes = '"' + annotation + '"';
			let encodedAnnotation = page.escapeHtmlEntities(annotationWithQuotes);

			let formattedAnnotation = this.createPostProcessessedHtml("<div>" + encodedAnnotation + "</div>");
			page.addOnml(formattedAnnotation.outerHTML);
		}
	}

	private createPostProcessessedHtml(html: string): HTMLElement {
		// Wrap the preview in in-line styling to persist the styling through the OneNote API
		let newPreviewBody = document.createElement("div");
		newPreviewBody.innerHTML = DomUtils.cleanHtml(html);

		let fontSize = this.clipperState.previewGlobalInfo.fontSize.toString() + "px";
		let fontFamilyString = this.clipperState.previewGlobalInfo.serif ? "WebClipper.FontFamily.Preview.SerifDefault" : "WebClipper.FontFamily.Preview.SansSerifDefault";
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

	private stripUnwantedUIElements(elem: HTMLElement) {
		// Getting a list of buttons and deleting them one-by-one does not work due to a weird index/dereference issue, so we do it this way
		while (true) {
			let deleteHighlightButton = elem.querySelector("." + Constants.Classes.deleteHighlightButton);
			if (!deleteHighlightButton) {
				break;
			}
			deleteHighlightButton.parentNode.removeChild(deleteHighlightButton);
		}
	}

	private addClippedFromUrlToPage(page: OneNoteApi.OneNotePage) {
		if (this.clipperState.currentMode.get() !== ClipMode.Bookmark) {
			let sourceUrlCitation = Localization.getLocalizedString("WebClipper.FromCitation")
			.replace("{0}", '<a href="' + (this.clipperState.pageInfo.rawUrl) + '">' + this.clipperState.pageInfo.rawUrl + "</a>");

			let formattedCitation = this.createPostProcessessedHtml(sourceUrlCitation);
			page.addOnml(formattedCitation.outerHTML);
		}
	}

	private addPrimaryContent(page: OneNoteApi.OneNotePage): Promise<any> {
		switch (this.clipperState.currentMode.get()) {
			default:
			case ClipMode.Pdf:
				if (this.clipperState.pdfPreviewInfo.shouldAttachPdf && this.clipperState.pdfResult.data.get().byteLength < Constants.Settings.maximumMimeSizeLimit) {
					return this.addPdfAttachment(page);
				}
				break;
			case ClipMode.FullPage:
				page.addHtml(this.clipperState.pageInfo.contentData);
				break;
			case ClipMode.Region:
				for (let regionDataUrl of this.clipperState.regionResult.data) {
					// TODO: The API currently does not correctly space paragraphs. We need to remove "&nbsp;" when its fixed.
					page.addOnml("<p><img src=\"" + regionDataUrl + "\" /></p>&nbsp;");
				}
				break;
			case ClipMode.Augmentation:
				let processedAugmentedContent = this.createPostProcessessedHtml(this.clipperState.augmentationPreviewInfo.previewBodyHtml);
				page.addOnml(processedAugmentedContent.outerHTML);
				break;
			case ClipMode.Bookmark:
				let processedBookmarkContent = this.createPostProcessessedHtml(this.clipperState.bookmarkPreviewInfo.previewBodyHtml);
				page.addOnml(processedBookmarkContent.outerHTML);
				break;
			case ClipMode.Selection:
				let processedSelectedContent = this.createPostProcessessedHtml(this.clipperState.selectionPreviewInfo.previewBodyHtml);
				page.addOnml(processedSelectedContent.outerHTML);
				break;
		}
		return Promise.resolve();
	}

	private addPdfAttachment(page: OneNoteApi.OneNotePage): Promise<any> {
		let pdf = this.clipperState.pdfResult.data.get().pdf;
		return pdf.getData().then((buffer) => {
			if (buffer) {
				let attachmentName = UrlUtils.getFileNameFromUrl(this.clipperState.pageInfo.rawUrl, "Original.pdf");
				page.addAttachment(buffer, attachmentName);
			}

			return Promise.resolve();
		});
	}

	private pageToSaveable(page: OneNoteApi.OneNotePage): Promise<OneNoteSaveable> {
		if (this.clipperState.currentMode.get() === ClipMode.Pdf) {
			let pdf = this.clipperState.pdfResult.data.get().pdf;
			let pageIndexes = this.getPageIndicesToSendInPdfMode();
			if (this.clipperState.pdfPreviewInfo.shouldDistributePages) {
				return pdf.getPageAsDataUrl(pageIndexes[0]).then((dataUrl) => {
					page.addOnml("<p><img src=\"" + dataUrl + "\" /></p>&nbsp;");
					// We have added the first image to the createPage call, so we remove the first page from the indices we send in the BATCH
					return new OneNoteSaveablePdfBatched(page, pdf, pageIndexes.slice(1),
						this.clipperState.pageInfo.contentLocale,
						this.clipperState.saveLocation,
						this.clipperState.previewGlobalInfo.previewTitleText);
				});
			} else {
				return Promise.resolve(new OneNoteSaveablePdf(page, pdf, pageIndexes));
			}
		}
		return Promise.resolve(new OneNoteSaveablePage(page));
	}

	private getPageIndicesToSendInPdfMode() {
		let pdf = this.clipperState.pdfResult.data.get().pdf;
		if (this.clipperState.pdfPreviewInfo.allPages) {
			return _.range(pdf.numPages());
		}

		const parsePageRangeOperation = StringUtils.parsePageRange(this.clipperState.pdfPreviewInfo.selectedPageRange, pdf.numPages());
		if (parsePageRangeOperation.status !== OperationResult.Succeeded) {
			throw new Error("User is clipping an invalid page range");
		}
		const pageRange = parsePageRangeOperation.result as number[];
		return pageRange.map(value => value - 1);
	}
}
