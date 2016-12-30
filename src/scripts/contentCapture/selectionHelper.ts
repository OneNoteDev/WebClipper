export interface SelectionResult {
	mode?: SelectionMode;
	htmlSelections?: string[];
}

export enum SelectionMode {
	Html,
	Region
}

export class SelectionHelper {
	public static createHtmlForImgSrc(src: string) {
		let img = document.createElement("img") as HTMLImageElement;
		img.src = src;
		return img.outerHTML;
	}
}
