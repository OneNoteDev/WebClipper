import {ComponentBase} from "../../componentBase";

import {ViewportDimensions} from "../../../contentCapture/pdfScreenshotHelper";

export interface PdfPageViewportProp {
	viewportDimensions: ViewportDimensions;
	imgUrl?: string;
	index: number;
}

class PdfPageViewportClass extends ComponentBase<{}, PdfPageViewportProp> {
	private getDimensionsAsStyleString(): string {
		let styleString = "height: " + this.props.viewportDimensions.height + "px;";
		styleString += "width: " + this.props.viewportDimensions.width + "px;";
		return styleString;
	}

	public render() {
		return (
			<div data-pageindex={this.props.index} style={this.getDimensionsAsStyleString()}>
				{this.props.imgUrl ? <img src={this.props.imgUrl}></img> : undefined}
			</div>
		);
	}
}

let component = PdfPageViewportClass.componentize();
export {component as PdfPageViewport};
