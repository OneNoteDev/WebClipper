import {Constants} from "../../../constants";
import {Localization} from "../../../localization/localization";

import {PreviewViewerTitleOnlyHeaderComponentBase} from "./previewViewerTitleOnlyHeaderComponentBase";

class PreviewViewerPdfHeaderClass extends PreviewViewerTitleOnlyHeaderComponentBase {
	public getControlGroupId(): string {
		return Constants.Ids.pdfControl;
	}

	public getHeader(): string {
		return Localization.getLocalizedString("WebClipper.ClipType.Pdf.Button");
	}

	public getHeaderId(): string {
		return Constants.Ids.pdfHeaderTitle;
	}
}

let component = PreviewViewerPdfHeaderClass.componentize();
export {component as PreviewViewerPdfHeader};
