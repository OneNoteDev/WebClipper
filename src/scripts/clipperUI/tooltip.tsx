import {Localization} from "../localization/localization";
import {ComponentBase} from "./componentBase";
import {CloseButton} from "./components/closeButton";

export interface TooltipProps {
	elementId: string;
	title?: string;
	onCloseButtonHandler: () => void;
	onElementDraw?: (el: HTMLElement) => void;
	renderablePanel: any;
	contentClasses?: string[];
	brandingImage?: any;
}

/**
 * Renders content with consistent tooltip styling
 */
export class TooltipClass extends ComponentBase<{}, TooltipProps> {
	getInitialState(): {} {
		return {};
	}

	render() {
		let additionalContentClasses = "";
		if (this.props.contentClasses) {
			additionalContentClasses = this.props.contentClasses.join(" ");
		}
		return (
			<div id={this.props.elementId} className="tooltip" {...this.onElementDraw(this.props.onElementDraw) }>
				{this.props.brandingImage}
				{this.props.title ? <div style={Localization.getFontFamilyAsStyle(Localization.FontFamily.Semibold)} className="tooltip-title">{this.props.title}</div> : undefined}
				<CloseButton onClickHandler={this.props.onCloseButtonHandler} onClickHandlerParams={undefined} />
				<div className={"tooltip-content " + additionalContentClasses}>
					{this.props.renderablePanel}
				</div>
			</div>
		);
	}
}

let component = TooltipClass.componentize();
export {component as Tooltip}
