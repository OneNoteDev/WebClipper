import {ClientInfo} from "../clientInfo";
import {PageInfo} from "../pageInfo";
import {PdfPreviewInfo, PreviewGlobalInfo, PreviewInfo} from "../previewInfo";
import {StringUtils} from "../stringUtils";
import {UserInfo} from "../userInfo";

import {SmartValue} from "../communicator/smartValue";

import {AugmentationResult} from "../contentCapture/augmentationHelper";
import {FullPageScreenshotResult} from "../contentCapture/fullPageScreenshotHelper";
import {PdfScreenshotResult} from "../contentCapture/pdfScreenshotHelper";
import {BookmarkResult} from "../contentCapture/bookmarkHelper";

import {ClipperInjectOptions} from "../extensions/clipperInject";
import {InvokeOptions} from "../extensions/invokeOptions";

import {ClipMode} from "./clipMode";
import {Status} from "./status";

export interface DataResult<T> {
	data?: T;
	status: Status;
}

export interface ClipperStateProp {
	clipperState: ClipperState;
}

export interface ClipperState {
	injectOptions?: ClipperInjectOptions;
	uiExpanded?: boolean;

	fetchLocStringStatus?: Status;

	// Initialized at the start of the Clipper's instantiation to determine initial mode. Additionally,
	// is re-fetched whenever the Clipper visbility is toggled on
	invokeOptions?: InvokeOptions;

	// External "static" data
	userResult?: DataResult<UserInfo>;
	pageInfo?: PageInfo;
	clientInfo?: ClientInfo;

	// User input
	currentMode?: SmartValue<ClipMode>; // Full, Region, Augmentation
	saveLocation?: string; // Result from the SectionPicker

	// Content preview data + retrieval status
	fullPageResult?: DataResult<FullPageScreenshotResult>;
	pdfResult?: DataResult<SmartValue<PdfScreenshotResult>>;
	regionResult?: DataResult<string[]>;
	augmentationResult?: DataResult<AugmentationResult>;
	bookmarkResult?: DataResult<BookmarkResult>;

	// Editable preview content
	previewGlobalInfo?: PreviewGlobalInfo;
	augmentationPreviewInfo?: PreviewInfo;
	bookmarkPreviewInfo?: PreviewInfo;
	pdfPreviewInfo?: PdfPreviewInfo;
	selectionPreviewInfo?: PreviewInfo;

	// Save to OneNote status
	oneNoteApiResult?: DataResult<OneNoteApi.Page | OneNoteApi.RequestError>;

	numSuccessfulClips?: SmartValue<number>;

	// Should be set when the Web Clipper enters a state that can not be recovered this session
	badState?: boolean;

	showRatingsPrompt?: SmartValue<boolean>;

	setState?: (partialState: ClipperState) => void;
	reset?: () => void;
}

export module ClipperStateHelperFunctions {
	export function isUserLoggedIn(state: ClipperState): boolean {
		return (state.userResult && state.userResult.status && state.userResult.data && !!state.userResult.data.user);
	}

	export function clipButtonEnabled(clipperState: ClipperState): boolean {
		let currentMode = clipperState.currentMode.get();
		switch (currentMode) {
			case ClipMode.Pdf:
				// The clip button is disabled in PDF mode if:
				// 	1. The user is trying to clip a local file but they haven't granted us access
				// 	2. The user has specified an invalid range AND they have the page range mode selected
				if (clipperState.pdfPreviewInfo.showLocalFilePanel) {
					return false;
				} else if (!clipperState.pdfPreviewInfo.allPages && !StringUtils.parsePageRange(clipperState.pdfPreviewInfo.selectedPageRange)) {
					return false;
				}
				return true;
			case ClipMode.FullPage:
				// The pdf and full page screenshots are only needed for preview. In the case of pdf, binary downloads
				// can be deferred to the clip wait.
				return true;
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
