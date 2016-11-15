export interface PreviewGlobalInfo {
	annotation?: string;
	fontSize?: number;
	highlighterEnabled?: boolean;
	previewTitleText?: string;
	serif?: boolean;
}

export interface PdfPreviewInfo {
	allPages?: boolean;
	isLocalFileAndNotAllowed?: boolean;
	selectedPageRange?: string;
	shouldAttachPdf?: boolean;
	shouldDistributePages?: boolean;
};

export interface PreviewInfo {
	previewBodyHtml?: string;
};
