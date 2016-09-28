import {ClipMode} from "./clipMode";
import {ClipperStateProp} from "./clipperState";
import {ComponentBase} from "./componentBase";

import {AugmentationPreview} from "./components/previewViewer/augmentationPreview";
import {BookmarkPreview} from "./components/previewViewer/bookmarkPreview";
import {FullPagePreview} from "./components/previewViewer/fullPagePreview";
import {RegionPreview} from "./components/previewViewer/regionPreview";
import {SelectionPreview} from "./components/previewViewer/selectionPreview";

class PreviewViewerClass<TState, TProp extends ClipperStateProp> extends ComponentBase<TState, TProp> {
	render() {
		switch (this.props.clipperState.currentMode.get()) {
			case ClipMode.FullPage:
				return <FullPagePreview	clipperState={this.props.clipperState} />;
			case ClipMode.Region:
				return <RegionPreview clipperState={this.props.clipperState} />;
			case ClipMode.Augmentation:
				return <AugmentationPreview clipperState={this.props.clipperState} />;
			case ClipMode.Bookmark:
				return <BookmarkPreview clipperState={this.props.clipperState} />;
			case ClipMode.Selection:
				return <SelectionPreview clipperState={this.props.clipperState} />;
			default:
				return <div />;
		}
	}
}

let component = PreviewViewerClass.componentize();
export {component as PreviewViewer};
