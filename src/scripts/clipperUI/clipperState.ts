import {ClientInfo} from "../clientInfo";
import {PageInfo} from "../pageInfo";
import {PdfPreviewInfo, PreviewGlobalInfo, PreviewInfo} from "../previewInfo";
import {StringUtils} from "../stringUtils";
import {UserInfo} from "../userInfo";

import {SmartValue} from "../communicator/smartValue";

import {AugmentationResult} from "../contentCapture/augmentationHelper";
import {BookmarkResult} from "../contentCapture/bookmarkHelper";
import {FullPageScreenshotResult} from "../contentCapture/fullPageScreenshotHelper";
import {PdfScreenshotResult} from "../contentCapture/pdfScreenshotHelper";
import {SelectionResult} from "../contentCapture/selectionHelper";

import {ClipperInjectOptions} from "../extensions/clipperInject";
import {InvokeOptions} from "../extensions/invokeOptions";

import {ClipMode} from "./clipMode";
import {Status} from "./status";
import {ClipSaveStatus} from "./clipSaveStatus";

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
	selectionResult?: DataResult<SelectionResult>;
	augmentationResult?: DataResult<AugmentationResult>;
	bookmarkResult?: DataResult<BookmarkResult>;

	// Editable preview content
	previewGlobalInfo?: PreviewGlobalInfo;
	augmentationPreviewInfo?: PreviewInfo;
	bookmarkPreviewInfo?: PreviewInfo;
	pdfPreviewInfo?: PdfPreviewInfo;

	// Save to OneNote status
	oneNoteApiResult?: DataResult<OneNoteApi.Page | OneNoteApi.RequestError>;
	clipSaveStatus?: ClipSaveStatus;

	// Should be set when the Web Clipper enters a state that can not be recovered this session
	badState?: boolean;

	// Used for determining if user should see ratings prompt
	numSuccessfulClips?: number;
	showRatingsPrompt?: boolean;

	setState?: (partialState: ClipperState) => void;
	reset?: () => void;
}
