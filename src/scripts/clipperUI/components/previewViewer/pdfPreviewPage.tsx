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
				<div className={Constants.Classes.pdfPreviewImage + (this.props.isSelected ? "" : " unselected")}>
					<PdfPageViewport viewportDimensions={this.props.viewportDimensions} imgUrl={this.props.imgUrl} index={this.props.index} />
				</div>
				<div className={"overlay" + (this.props.showPageNumber ? "" : " overlay-hidden")}>
					<span class="overlay-number">{this.props.index + 1}</span>
				</div>
			</div>
		);
	}
}

let component = PdfPreviewPageClass.componentize();
export {component as PdfPreviewPage};
