import {Localization} from "../../localization/localization";

import {ComponentBase} from "../componentBase";
import {ClipMode} from "../clipMode";

export interface ModeButtonProps {
	imgSrc: string;
	label: string;
	myMode: ClipMode;
	tabIndex: number;
	selected?: boolean;
	onModeSelected: (modeButton: ClipMode) => void;
	tooltipText?: string;
}

class ModeButtonClass extends ComponentBase<{}, ModeButtonProps> {
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
			<a className={className} aria-selected={this.props.selected} role="button"
				id={idName} title={this.props.tooltipText ? this.props.tooltipText : ""}
				{...this.enableInvoke(this.buttonHandler, this.props.tabIndex) }>
				<img className="icon" src={this.props.imgSrc} />
				<span className="label buttonLabelFont"
					style={Localization.getFontFamilyAsStyle(Localization.FontFamily.Regular)}>
					{this.props.label}
				</span>
			</a>
		);
	}
}

let component = ModeButtonClass.componentize();
export {component as ModeButton};
