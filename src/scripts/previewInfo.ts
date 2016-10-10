export interface PreviewGlobalInfo {
	annotation?: string;
	fontSize?: number;
	highlighterEnabled?: boolean;
	previewTitleText?: string;
	serif?: boolean;
}

export interface PdfPreviewInfo {
	allPages?: boolean;
	pagesToShow?: number[];
	shouldAttachPdf?: boolean;
};

export interface PreviewInfo {
	previewBodyHtml?: string;
};
