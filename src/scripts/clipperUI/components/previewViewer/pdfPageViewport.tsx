import {Constants} from "../../../constants";

import {ComponentBase} from "../../componentBase";

import {ViewportDimensions} from "../../../contentCapture/viewportDimensions";

export interface PdfPageViewportProp {
	viewportDimensions: ViewportDimensions;
	imgUrl?: string;
	index: number;
}

class PdfPageViewportClass extends ComponentBase<{}, PdfPageViewportProp> {
	private getContainerStyle(): string {
		return "max-width: " + this.props.viewportDimensions.width + "px;";
	}

	private getImageStyle(): string {
		let styleString = "max-width: " + this.props.viewportDimensions.width + "px;";
		return styleString + "max-height: " + this.props.viewportDimensions.height + "px;";
	}

	private getPlaceholderStyle(): string {
		return "padding-bottom: " + ((this.props.viewportDimensions.height / this.props.viewportDimensions.width) * 100) + "%;";
	}

	public render() {
		return (
			<div data-pageindex={this.props.index} style={this.getContainerStyle()}>
				{this.props.imgUrl ?
					<img class={Constants.Classes.pdfPreviewImage} src={this.props.imgUrl} style={this.getImageStyle()}></img> :
					<div style={this.getPlaceholderStyle()}></div>}
			</div>
		);
	}
}

let component = PdfPageViewportClass.componentize();
export {component as PdfPageViewport};
