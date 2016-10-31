import {Constants} from "../../../constants";

import {ComponentBase} from "../../componentBase";

import {PdfPageViewport, PdfPageViewportProp} from "./PdfPageViewport";

export interface PdfPreviewPageProp extends PdfPageViewportProp {
	showPageNumber: boolean;
	isSelected: boolean;
}

/**
 * Provides page number overlay and selected/unselected stylings on top of the
 * pdf page viewport's functionality.
 */
class PdfPreviewPageClass extends ComponentBase<{}, PdfPreviewPageProp> {
	public render() {
		return (
			<div class="pdf-preview-image-container">
				<div className={Constants.Classes.pdfPreviewImageCanvas + (this.props.isSelected ? "" : " " + Constants.Classes.unselected)}>
					<PdfPageViewport viewportDimensions={this.props.viewportDimensions} imgUrl={this.props.imgUrl} index={this.props.index} />
				</div>
				<div className={Constants.Classes.overlay + (this.props.showPageNumber ? "" : (" " + Constants.Classes.overlayHidden))}>
					<span class={Constants.Classes.overlayNumber}>{this.props.index + 1}</span>
				</div>
			</div>
		);
	}
}

let component = PdfPreviewPageClass.componentize();
export {component as PdfPreviewPage};
