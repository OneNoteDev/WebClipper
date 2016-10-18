import { ComponentBase } from "../../componentBase";
import { PreviewComponentBase } from "./previewComponentBase";

import {ClipperStateProp} from "../../clipperState";

import { Constants } from "../../../constants";

import { Status } from "../../status";

import {Localization} from "../../../localization/localization";

interface LocalFilePanelProps {
	header?: string;
	title?: string;
	subtitle?: string;
}

export class LocalFilePanelClass extends ComponentBase<{}, LocalFilePanelProps> {
	render() {
		return (
			<div id={Constants.Ids.previewOuterContainer} style={Localization.getFontFamilyAsStyle(Localization.FontFamily.Regular)}>
				<div id={Constants.Ids.previewInnerWrapper}>
					<div id={Constants.Ids.previewInnerContainer} style="height: auto;">
						<div id={Constants.Ids.previewOptionsContainer}>
							<div class="control-button-group">
								<span id={Constants.Ids.localPdfFileTitle} style={Localization.getFontFamilyAsStyle(Localization.FontFamily.Regular)} class="buttonLabelFont">
									{this.props.header}
								</span>
							</div>
						</div>
						<div id={Constants.Ids.previewContentContainer} class="local-pdf-file-content-container">
							<div class={Constants.Classes.localPdfPanelTitle}>{this.props.title}</div>
							<div class={Constants.Classes.localPdfPanelSubtitle}>{this.props.subtitle}</div>
						</div>
					</div>
				</div>
			</div>
		);
	}
}

// export class LocalFilePanelClass extends PreviewComponentBase<{}, ClipperStateProp> {
// 	protected getContentBodyForCurrentStatus(): any[] {
// 		return [
// 			<p>We need permission to clip PDF files stored on your computer</p>,
// 			<p>In Chrome, click More &rsaquo; Settings &rsaquo; Extensions and under OneNote Web Clipper, check "Allow access to file URLs"</p>
// 		];
// 	}

// 	protected getHeader(): any {
// 		return "PDF Document";
// 	}

// 	protected getStatus(): Status {
// 		return Status.Succeeded;
// 	}

// 	protected getTitleTextForCurrentStatus() {
// 		return "PDF Document";
// 	}

// 	protected getPreviewBodyClass(): string {
// 	}

// 	protected isTitleEnabled(): boolean {
// 		return false;
// 	}
// }

let component = LocalFilePanelClass.componentize();
export {component as LocalFilePanel};
