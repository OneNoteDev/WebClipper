import {ComponentBase} from "../componentBase";
import {AnimationStrategy} from "../animations/animationStrategy";

import {Constants} from "../../constants";
import {Utils} from "../../utils";

import {Localization} from "../../localization/localization";

export interface DialogButton {
	id: string;
	label: string;
	handler: () => void;
}

export interface DialogPanelProps {
	message: string;
	content: HTMLElement[];
	buttons: DialogButton[];
	fontFamily?: Localization.FontFamily;
	buttonFontFamily?: Localization.FontFamily;
	divId?: string;
	animationStrategy?: AnimationStrategy;
}

export abstract class DialogPanelClass extends ComponentBase<{}, DialogPanelProps> {
	public getExtraMessages(): any[] {
		return undefined;
	}

	private onPanelAnimatorDraw(panelAnimator: HTMLElement) {
		if (this.props.animationStrategy) {
			this.props.animationStrategy.animate(panelAnimator);
		}
	}

	render() {
		let fontFamily = !Utils.isNullOrUndefined(this.props.fontFamily) ? this.props.fontFamily : Localization.FontFamily.Semibold;
		let buttonFontFamily = !Utils.isNullOrUndefined(this.props.buttonFontFamily) ? this.props.buttonFontFamily : Localization.FontFamily.Semibold;
		let divId = this.props.divId ? this.props.divId : "";

		return (
			<div id={divId}>
				<div className={Constants.Classes.panelAnimator} {...this.onElementDraw(this.onPanelAnimatorDraw)}>
					<div id={Constants.Ids.dialogMessageContainer} className="resultPagePadding">
						<div className="messageLabelContainer" style={Localization.getFontFamilyAsStyle(fontFamily)}>
							<div id={Constants.Ids.dialogMessage} className="dialogMessageFont messageLabel">
								{this.props.message}
							</div>
							{this.getExtraMessages()}
						</div>
					</div>
					<div id={Constants.Ids.dialogContentContainer} className="">
						{this.props.content}
					</div>
					<div id={Constants.Ids.dialogButtonContainer}>
						{this.props.buttons.map((button, i) => {
							return (
								<a id={button.id} className="dialogButton" {...this.enableInvoke(button.handler, 70) }>
									<div className="wideButtonContainer">
										<span className="wideButtonFont wideActionButton"
											style={Localization.getFontFamilyAsStyle(buttonFontFamily)}>
											{ button.label }
										</span>
									</div>
								</a>
							);
						}) }
					</div>
				</div>
			</div>
		);
	}
}

let component = DialogPanelClass.componentize();
export {component as DialogPanel};
