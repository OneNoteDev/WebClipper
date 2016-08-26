import {Constants} from "../../../constants";
import {Localization} from "../../../localization/localization";

import {PreviewViewerTitleOnlyHeaderComponentBase} from "./previewViewerTitleOnlyHeaderComponentBase";

class PreviewViewerBookmarkHeaderClass extends PreviewViewerTitleOnlyHeaderComponentBase {
	public getControlGroupId(): string {
		return Constants.Ids.bookmarkControl;
	}

	public getHeader(): string {
		return Localization.getLocalizedString("WebClipper.ClipType.Bookmark.Button");
	}

	public getHeaderId(): string {
		return Constants.Ids.bookmarkHeaderTitle;
	}
}

let component = PreviewViewerBookmarkHeaderClass.componentize();
export {component as PreviewViewerBookmarkHeader};
