import {Constants} from "../../../constants";

import {Localization} from "../../../localization/localization";

import {ClipperStateProp} from "../../clipperState";
import {ComponentBase} from "../../componentBase";
import {Status} from "../../status";

import {PreviewComponentBase} from "./previewComponentBase";

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
							<div className="control-button-group">
								<span id={Constants.Ids.localPdfFileTitle} style={Localization.getFontFamilyAsStyle(Localization.FontFamily.Regular)} className="buttonLabelFont">
									{this.props.header}
								</span>
							</div>
						</div>
						<div id={Constants.Ids.previewContentContainer} className="local-pdf-file-content-container">
							<div className={Constants.Classes.localPdfPanelTitle}>{this.props.title}</div>
							<div className={Constants.Classes.localPdfPanelSubtitle}>{this.props.subtitle}</div>
						</div>
					</div>
				</div>
			</div>
		);
	}
}

let component = LocalFilesNotAllowedPanelClass.componentize();
export {component as LocalFilesNotAllowedPanel};
