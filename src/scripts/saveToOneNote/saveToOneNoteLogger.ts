import * as Log from "../logging/log";

import {Constants} from "../constants";
import {PreviewGlobalInfo, PreviewInfo} from "../previewInfo";
import {StringUtils} from "../stringUtils";

import {ClipMode} from "../clipperUI/clipMode";
import {Clipper} from "../clipperUI/frontEndGlobals";
import {ClipperState} from "../clipperUI/clipperState";

import {AugmentationModel} from "../contentCapture/augmentationHelper";

import {DomUtils} from "../domParsers/domUtils";

/**
 * Solely responsible for logging clip attempts (note: attempts, not successes)
 */
export class SaveToOneNoteLogger {
	public static logClip(clipperState: ClipperState) {
		SaveToOneNoteLogger.logCommonClipModifications(clipperState);
		SaveToOneNoteLogger.logClipModeSpecific(clipperState);
	}

	private static logCommonClipModifications(clipperState: ClipperState) {
		let event = new Log.Event.BaseEvent(Log.Event.Label.ClipCommonOptions);
		event.setCustomProperty(Log.PropertyName.Custom.ClipMode, ClipMode[clipperState.currentMode.get()]);
		event.setCustomProperty(Log.PropertyName.Custom.PageTitleModified, clipperState.pageInfo.contentTitle !== clipperState.previewGlobalInfo.previewTitleText);
		event.setCustomProperty(Log.PropertyName.Custom.AnnotationAdded, !!clipperState.previewGlobalInfo.annotation);
		Clipper.logger.logEvent(event);
	}

	private static logClipModeSpecific(clipperState: ClipperState) {
		switch (clipperState.currentMode.get()) {
			default:
				case ClipMode.Pdf:
					SaveToOneNoteLogger.logPdfClip(clipperState);
					break;
				case ClipMode.FullPage:
					// Nothing to log
					break;
				case ClipMode.Region:
					SaveToOneNoteLogger.logRegionClip(clipperState);
					break;
				case ClipMode.Augmentation:
					SaveToOneNoteLogger.logAugmentationClip(clipperState);
					break;
				case ClipMode.Bookmark:
					// Nothing to log
					break;
				case ClipMode.Selection:
					SaveToOneNoteLogger.logSelectionClip(clipperState);
					break;
		}
	}

	private static logPdfClip(clipperState: ClipperState) {
		SaveToOneNoteLogger.logPdfClipOptions(clipperState);
		SaveToOneNoteLogger.logPdfByteMetadata(clipperState);
	}

	private static logPdfClipOptions(clipperState: ClipperState) {
		let event = new Log.Event.BaseEvent(Log.Event.Label.ClipPdfOptions);

		let pdfInfo = clipperState.pdfPreviewInfo;
		event.setCustomProperty(Log.PropertyName.Custom.PdfAllPagesClipped, pdfInfo.allPages);
		event.setCustomProperty(Log.PropertyName.Custom.PdfAttachmentClipped, pdfInfo.shouldAttachPdf);
		event.setCustomProperty(Log.PropertyName.Custom.PdfIsLocalFile, clipperState.pageInfo.rawUrl.indexOf("file:///") === 0);
		event.setCustomProperty(Log.PropertyName.Custom.PdfIsBatched, pdfInfo.shouldDistributePages);

		let totalPageCount = clipperState.pdfResult.data.get().viewportDimensions.length;
		let selectedPageCount = pdfInfo.allPages ? totalPageCount : Math.min(totalPageCount, StringUtils.countPageRange(pdfInfo.selectedPageRange));
		event.setCustomProperty(Log.PropertyName.Custom.PdfFileSelectedPageCount, selectedPageCount);
		event.setCustomProperty(Log.PropertyName.Custom.PdfFileTotalPageCount, totalPageCount);

		Clipper.logger.logEvent(event);
	}

	private static logPdfByteMetadata(clipperState: ClipperState) {
		let event = new Log.Event.BaseEvent(Log.Event.Label.PdfByteMetadata);

		let byteLength = clipperState.pdfResult.data.get().byteLength;
		event.setCustomProperty(Log.PropertyName.Custom.ByteLength, byteLength);
		event.setCustomProperty(Log.PropertyName.Custom.BytesPerPdfPage, byteLength / clipperState.pdfResult.data.get().pdf.numPages());

		Clipper.logger.logEvent(event);
	}

	private static logRegionClip(clipperState: ClipperState) {
		let event = new Log.Event.BaseEvent(Log.Event.Label.ClipRegionOptions);
		event.setCustomProperty(Log.PropertyName.Custom.NumRegions, clipperState.regionResult.data.length);
		Clipper.logger.logEvent(event);
	}

	private static logAugmentationClip(clipperState: ClipperState) {
		let event = new Log.Event.BaseEvent(Log.Event.Label.ClipAugmentationOptions);
		SaveToOneNoteLogger.setEditOptions(event, clipperState.previewGlobalInfo, clipperState.augmentationPreviewInfo);
		event.setCustomProperty(Log.PropertyName.Custom.AugmentationModel, AugmentationModel[clipperState.augmentationResult.data.ContentModel]);
		Clipper.logger.logEvent(event);
	}

	private static logSelectionClip(clipperState: ClipperState) {
		let event = new Log.Event.BaseEvent(Log.Event.Label.ClipSelectionOptions);
		SaveToOneNoteLogger.setEditOptions(event, clipperState.previewGlobalInfo, clipperState.selectionPreviewInfo);
		Clipper.logger.logEvent(event);
	}

	private static setEditOptions(event: Log.Event.BaseEvent, previewGlobalInfo: PreviewGlobalInfo, previewInfo: PreviewInfo) {
		event.setCustomProperty(Log.PropertyName.Custom.FontSize, previewGlobalInfo.fontSize);
		event.setCustomProperty(Log.PropertyName.Custom.IsSerif, previewGlobalInfo.serif);

		// Log if the user has performed a highlight
		let container = document.createElement("div");
		container.innerHTML = DomUtils.cleanHtml(previewInfo.previewBodyHtml);
		let highlightedList = container.getElementsByClassName(Constants.Classes.highlighted);
		event.setCustomProperty(Log.PropertyName.Custom.ContainsAtLeastOneHighlight, highlightedList && highlightedList.length > 0);
	}
}
