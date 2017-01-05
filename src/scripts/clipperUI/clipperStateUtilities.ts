import {StringUtils} from "../stringUtils";
import {ObjectUtils} from "../objectUtils";

import {ClipMode} from "./clipMode";
import {ClipperState} from "./clipperState";
import {Status} from "./status";

export class ClipperStateUtilities {
	public static isUserLoggedIn(state: ClipperState): boolean {
		return (state.userResult && state.userResult.status && state.userResult.data && !!state.userResult.data.user);
	}

	public static clipButtonEnabled(clipperState: ClipperState): boolean {
		let currentMode = clipperState.currentMode.get();
		switch (currentMode) {
			case ClipMode.Pdf:
				if (!clipperState.pdfPreviewInfo.isLocalFileAndNotAllowed) {
					return false;
				} else if (clipperState.pdfResult.status !== Status.Succeeded) {
					return false;
				} else if (clipperState.pdfPreviewInfo.allPages) {
					return true;
				} else if (!clipperState.pdfPreviewInfo.allPages && ObjectUtils.isNullOrUndefined(clipperState.pdfPreviewInfo.selectedPageRange)) {
					return false;
				}

				// If the user has an invalidPageRange, the clipButton is still enabled,
				// but when the user clips, we short circuit it and display a message instead
				return true;
			case ClipMode.FullPage:
				let fullPageScreenshotResult = clipperState.fullPageResult;
				return fullPageScreenshotResult.status === Status.Succeeded;
			case ClipMode.Region:
				let regionResult = clipperState.regionResult;
				return regionResult.status === Status.Succeeded && regionResult.data && regionResult.data.length > 0;
			case ClipMode.Augmentation:
				let augmentationResult = clipperState.augmentationResult;
				return augmentationResult.status === Status.Succeeded && augmentationResult.data && !!augmentationResult.data.ContentInHtml;
			case ClipMode.Bookmark:
				let bookmarkResult = clipperState.bookmarkResult;
				return bookmarkResult.status === Status.Succeeded;
			case ClipMode.Selection:
				// The availability of this mode is passed together with the selected text, so it's always available
				return true;
			default:
				return undefined;
		}
	}
}
