import {Constants} from "../../../constants";
import {Localization} from "../../../localization/localization";

import {PreviewViewerTitleOnlyHeaderComponentBase} from "./previewViewerTitleOnlyHeaderComponentBase";

// Used by Edge as we need a title-only header for the Region mode used when the user takes an image selection
class PreviewViewerRegionTitleOnlyHeaderClass extends PreviewViewerTitleOnlyHeaderComponentBase {
	public getControlGroupId(): string {
		return Constants.Ids.regionControl;
	}

	public getHeader(): string {
		return Localization.getLocalizedString("WebClipper.ClipType.Region.Button");
	}

	public getHeaderId(): string {
		return Constants.Ids.regionHeaderTitle;
	}
}

let component = PreviewViewerRegionTitleOnlyHeaderClass.componentize();
export {component as PreviewViewerRegionTitleOnlyHeader};
