import {Constants} from "../../constants";
import {Localization} from "../../localization/localization";
import {ClipMode} from "../clipMode";
import {ComponentBase} from "../componentBase";
import {AriaSetProps} from "./ariaSetProps";
import {AriaNavDirection} from "../AriaNavDirection";

export interface PropsForModeElementNoAriaGrouping {
	imgSrc: string;
	label: string;
	myMode: ClipMode;
	selected?: boolean;
	tabIndex?: number;
	onModeSelected: (modeButton: ClipMode) => void;
	tooltipText?: string;
}

export interface PropsForModeButton extends PropsForModeElementNoAriaGrouping, AriaSetProps { }

class ModeButtonClass extends ComponentBase<{}, PropsForModeButton> {
	buttonHandler() {
		this.props.onModeSelected(this.props.myMode);
	}

	public render() {
		let className = "modeButton";
		if (this.props.selected) {
			className += " selected";
		}
		let clipMode: string = ClipMode[this.props.myMode];
		clipMode = clipMode[0].toLowerCase() + clipMode.slice(1);
		let idName: string = clipMode + "Button";

		return (
			<a className={className} role="option" aria-selected={this.props.selected}
				id={idName} title={this.props.tooltipText ? this.props.tooltipText : ""}
				aria-setsize={this.props["aria-setsize"]} aria-posinset={this.props["aria-posinset"]}
				{...this.enableAriaInvoke({callback: this.buttonHandler, tabIndex: this.props.tabIndex, ariaSetName: Constants.AriaSet.modeButtonSet,ariaSetDirection: AriaNavDirection.Vertical})}>
				<img className="icon" src={this.props.imgSrc}/>
				<span className="label buttonLabelFont" style={Localization.getFontFamilyAsStyle(Localization.FontFamily.Regular)}>
					{this.props.label}
				</span>
			</a>
		);
	}
}

let component = ModeButtonClass.componentize();
export {component as ModeButton};
