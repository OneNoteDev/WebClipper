import {ClipMode} from "./clipMode";
import {ClipperStateProp} from "./clipperState";
import {ComponentBase} from "./componentBase";

import {AugmentationPreview} from "./components/previewViewer/augmentationPreview";
import {BookmarkPreview} from "./components/previewViewer/bookmarkPreview";
import {FullPagePreview} from "./components/previewViewer/fullPagePreview";
import {PdfPreview} from "./components/previewViewer/pdfPreview";
import {RegionPreview} from "./components/previewViewer/regionPreview";
import {SelectionPreview} from "./components/previewViewer/selectionPreview";

class PreviewViewerClass<TState, TProp extends ClipperStateProp> extends ComponentBase<TState, TProp> {
	render() {
		let state = this.props.clipperState;
		switch (state.currentMode.get()) {
			case ClipMode.Pdf:
				return <PdfPreview clipperState={state} />;
			case ClipMode.FullPage:
				if (state.pageInfo.contentType === OneNoteApi.ContentType.EnhancedUrl) {
					return <PdfPreview clipperState={state} />;
				}
				return <FullPagePreview	clipperState={state} />;
			case ClipMode.Region:
				return <RegionPreview clipperState={state} />;
			case ClipMode.Augmentation:
				return <AugmentationPreview clipperState={state} />;
			case ClipMode.Bookmark:
				return <BookmarkPreview clipperState={state} />;
			case ClipMode.Selection:
				return <SelectionPreview clipperState={state} />;
			default:
				return <div />;
		}
	}
}

let component = PreviewViewerClass.componentize();
export {component as PreviewViewer};
