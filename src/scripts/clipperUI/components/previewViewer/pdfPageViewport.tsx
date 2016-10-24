import {ComponentBase} from "../../componentBase";

import {ViewportDimensions} from "../../../contentCapture/pdfScreenshotHelper";

interface PdfPageViewportProp {
	viewportDimensions: ViewportDimensions;
	imgUrl?: string;
	index: number;
}

class PdfPageViewportClass extends ComponentBase<{}, PdfPageViewportProp> {
	public render() {
		return (
			<div data-pageIndex={this.props.index} height={this.props.viewportDimensions.height} width={this.props.viewportDimensions.width} style="background-color: pink;">
				{this.props.imgUrl ? <img src={this.props.imgUrl}></img> : undefined}
			</div>
		);
	}
}

let component = PdfPageViewportClass.componentize();
export {component as PdfPageViewport};
