import {ComponentBase} from "../../componentBase";

import {ViewportDimensions} from "../../../contentCapture/pdfScreenshotHelper";

export interface PdfPageViewportProp {
	viewportDimensions: ViewportDimensions;
	imgUrl?: string;
	index: number;
}

class PdfPageViewportClass extends ComponentBase<{}, PdfPageViewportProp> {
	private getContainerDimensionsStyle(): string {
		return "max-width: " + this.props.viewportDimensions.width + "px;";
	}

	private getPlaceholderDimensionsStyle(): string {
		return "padding-bottom: " + ((this.props.viewportDimensions.height / this.props.viewportDimensions.width) * 100) + "%;";
	}

	public render() {
		return (
			<div data-pageindex={this.props.index} style={this.getContainerDimensionsStyle()}>
				{this.props.imgUrl ?
					<img src={this.props.imgUrl}></img> :
					<div style={this.getPlaceholderDimensionsStyle()}></div>}
			</div>
		);
	}
}

let component = PdfPageViewportClass.componentize();
export {component as PdfPageViewport};
