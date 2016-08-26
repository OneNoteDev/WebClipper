import {Constants} from "../../../constants";
import {Localization} from "../../../localization/localization";

import {PreviewViewerTitleOnlyHeaderComponentBase} from "./previewViewerTitleOnlyHeaderComponentBase";

class PreviewViewerFullPageHeaderClass extends PreviewViewerTitleOnlyHeaderComponentBase {
	public getControlGroupId(): string {
		return Constants.Ids.fullPageControl;
	}

	public getHeader(): string {
		return Localization.getLocalizedString("WebClipper.ClipType.ScreenShot.Button");
	}

	public getHeaderId(): string {
		return Constants.Ids.fullPageHeaderTitle;
	}
}

let component = PreviewViewerFullPageHeaderClass.componentize();
export {component as PreviewViewerFullPageHeader};
