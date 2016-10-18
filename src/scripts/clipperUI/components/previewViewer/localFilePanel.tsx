import {PreviewComponentBase} from "./previewComponentBase";

import {ClipperStateProp} from "../../clipperState";

import {Status} from "../../status";

export class LocalFilePanelClass extends PreviewComponentBase<{}, ClipperStateProp> {
	protected getContentBodyForCurrentStatus(): any[] {
		return [
			<p>We need permission to clip PDF files stored on your computer</p>,
			<p>In Chrome, click More &rsaquo; Settings &rsaquo; Extensions and under OneNote Web Clipper, check "Allow access to file URLs"</p>
		];
	}

	protected getHeader(): any {
		return "PDF Document";
	}

	protected getStatus(): Status {
		return Status.Succeeded;
	}

	protected getTitleTextForCurrentStatus() {
		return "PDF Document";
	}

	protected getPreviewBodyClass(): string {
		
	}

	protected isTitleEnabled(): boolean {
		return false;
	}
}

let component = LocalFilePanelClass.componentize();
export {component as LocalFilePanel};
