import {Constants} from "../../constants";
import {Localization} from "../../localization/localization";
import {ClipMode} from "../clipMode";
import {ComponentBase} from "../componentBase";
import modeButtonSet = Constants.AriaSet.modeButtonSet;

export interface ModeButtonProps {
	imgSrc: string;
	label: string;
	myMode: ClipMode;
	tabIndex: number;
	selected?: boolean;
	"aria-posinset": string;
	"aria-setsize": string;
	onModeSelected: (modeButton: ClipMode) => void;
	tooltipText?: string;
}

class ModeButtonClass extends ComponentBase<{}, ModeButtonProps> {
	buttonHandler() {
		this.props.onModeSelected(this.props.myMode);
	}

	private getAriaPositionInSet(name) {
		switch (name) {
			case "fullPageButton":
				return "1";
			case "regionButton":
				return "2";
			case "augmentationButton":
				return "3";
			case "bookmarkButton":
				return "4";
			default:
				break;
		}
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
			<a
				className={className} role="option" aria-setsize="4" aria-posinset={this.getAriaPositionInSet(idName)} data-ariaSet={Constants.AriaSet.modeButtonSet}
				id={idName} title={this.props.tooltipText ? this.props.tooltipText : ""}
				{...this.enableInvoke(this.buttonHandler, this.props.tabIndex)} tabIndex={this.props.selected ? 40 : ""}
				aria-selected={this.props.selected}>
			<img className="icon" src={this.props.imgSrc} />
				<span className="label buttonLabelFont" style={Localization.getFontFamilyAsStyle(Localization.FontFamily.Regular)}>
					{this.props.label}
				</span>
			</a>
		);
	}
}

let component = ModeButtonClass.componentize();
export {component as ModeButton};
