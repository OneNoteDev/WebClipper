import {ComponentBase} from "../../componentBase";

import {ViewportDimensions} from "../../../contentCapture/pdfScreenshotHelper";

interface PdfPageViewportProp {
	viewportDimensions: ViewportDimensions;
	imgUrl?: string;
	index: number;
}

class PdfPageViewportClass extends ComponentBase<{}, PdfPageViewportProp> {
	public render() {
		let styleString = "background-color: pink; ";
		styleString += "height: " + this.props.viewportDimensions.height + "px;";
		styleString += "width: " + this.props.viewportDimensions.width + "px;";
		return (
			<div data-pageindex={this.props.index} style={styleString}>
				{this.props.imgUrl ? <img src={this.props.imgUrl}></img> : undefined}
			</div>
		);
	}
}

let component = PdfPageViewportClass.componentize();
export {component as PdfPageViewport};
