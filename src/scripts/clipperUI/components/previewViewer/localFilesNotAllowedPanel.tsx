import { ComponentBase } from "../../componentBase";
import { PreviewComponentBase } from "./previewComponentBase";

import {ClipperStateProp} from "../../clipperState";

import { Constants } from "../../../constants";

import { Status } from "../../status";

import {Localization} from "../../../localization/localization";

interface LocalFilesNotAllowedPanelProps {
	header?: string;
	title?: string;
	subtitle?: string;
}

export class LocalFilesNotAllowedPanelClass extends ComponentBase<{}, LocalFilesNotAllowedPanelProps> {
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

let component = LocalFilesNotAllowedPanelClass.componentize();
export {component as LocalFilesNotAllowedPanel};
