export module PropertyName {
	export enum Custom {
		AnnotationAdded,
		ByteLength,
		BytesPerPdfPage,
		// Parity-gap candidate (V3 contentCaptureInject doesn't measure DOM size diff).
		BytesTrimmed,
		ClipMode,
		CloseReason,
		// Parity-gap candidate (V3 article mode has TextHighlighter but doesn't log
		// whether highlights were applied at save time).
		ContainsAtLeastOneHighlight,
		ContentType,
		CorrelationId,
		CurrentPanel,
		CurrentSectionStillExists,
		// Parity-gap candidate (V3 contentCaptureInject doesn't measure DOM size).
		DomSizeInBytes,
		// Parity-gap candidate (V3 article mode has font +/- buttons but doesn't log size).
		FontSize,
		ForceRetrieveFreshLocStrings,
		FreshUserInfoAvailable,
		// Parity-gap candidate (V3 captures full page but no telemetry).
		FullPageScreenshotContentFound,
		Height,
		InvokeMode,
		InvokeSource,
		IsHighDpiScreen,
		// Parity-gap candidate (V3 article mode has serif/sans-serif toggle but doesn't log).
		IsSerif,
		Key,
		LastUpdated,
		NumRegions,
		PageTitleModified,
		PdfAllPagesClipped,
		PdfAttachmentClipped,
		PdfFileSelectedPageCount,
		PdfFileTotalPageCount,
		PdfIsBatched,
		PdfIsLocalFile,
		SignInCancelled,
		StoredLocaleDifferentThanRequested,
		UpdateInterval,
		UserInformationReturned,
		UserInformationStored,
		UserUpdateReason,
		Value,
		Width,
		WriteableCookies,
		DataBoundary
	}

	/* tslint:disable:variable-name */
	export module Reserved {
		export let Category = "Category";
		export let Duration = "Duration";
		export let EventName = "EventName";
		export let EventType = "EventType";
		export let FailureInfo = "FailureInfo";
		export let FailureType = "FailureType";
		export let Id = "Id";
		export let Label = "Label";
		export let Level = "Level";
		export let Message = "Message";
		export let Properties = "Properties";
		export let StackTrace = "StackTrace";
		export let Status = "Status";
		export let Stream = "Stream";
		export let Trigger = "Trigger";
		export let WebClipper = "WebClipper";
	}
	/* tslint:enable:variable-name */
}
