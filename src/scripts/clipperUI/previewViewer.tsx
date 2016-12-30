import {ClientType} from "../clientType";

import {Localization} from "../localization/localization";

import {ClipMode} from "./clipMode";
import {ClipperStateProp} from "./clipperState";
import {ComponentBase} from "./componentBase";

import {AugmentationPreview} from "./components/previewViewer/augmentationPreview";
import {BookmarkPreview} from "./components/previewViewer/bookmarkPreview";
import {FullPagePreview} from "./components/previewViewer/fullPagePreview";
import {PdfPreview} from "./components/previewViewer/pdfPreview";
import {SelectionPreview} from "./components/previewViewer/selectionPreview";
import {LocalFilesNotAllowedPanel} from "./components/previewViewer/localFilesNotAllowedPanel";

class PreviewViewerClass<TState, TProp extends ClipperStateProp> extends ComponentBase<TState, TProp> {
	render() {
		let state = this.props.clipperState;
		switch (state.currentMode.get()) {
			case ClipMode.Pdf:
				if (!state.pdfPreviewInfo.isLocalFileAndNotAllowed) {
					if (state.clientInfo.clipperType === ClientType.ChromeExtension) {
						return <LocalFilesNotAllowedPanel
							title={Localization.getLocalizedString("WebClipper.ClipType.Pdf.AskPermissionToClipLocalFile")}
							subtitle={Localization.getLocalizedString("WebClipper.ClipType.Pdf.InstructionsForClippingLocalFiles")}
							header={Localization.getLocalizedString("WebClipper.ClipType.Pdf.Button")} />;
					}
					return <LocalFilesNotAllowedPanel
						title={Localization.getLocalizedString("WebClipper.Preview.UnableToClipLocalFile")}
						subtitle={""}
						header={Localization.getLocalizedString("WebClipper.ClipType.Pdf.Button")} />;
				}
				return <PdfPreview clipperState={state} />;
			case ClipMode.FullPage:
				return <FullPagePreview	clipperState={state} />;
			case ClipMode.Selection:
				return <SelectionPreview clipperState={state} />;
			case ClipMode.Augmentation:
				return <AugmentationPreview clipperState={state} />;
			case ClipMode.Bookmark:
				return <BookmarkPreview clipperState={state} />;
			default:
				return <div />;
		}
	}
}

let component = PreviewViewerClass.componentize();
export {component as PreviewViewer};
