import {ComponentBase} from "../componentBase";

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
	divId?: string;
}

export abstract class DialogPanelClass extends ComponentBase<{}, DialogPanelProps> {
	public getExtraMessages(): any[] {
		return undefined;
	}

	render() {
		let fontFamily = !Utils.isNullOrUndefined(this.props.fontFamily) ? this.props.fontFamily : Localization.FontFamily.Semibold;

		return (
			<div id={this.props.divId}>
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
										style={Localization.getFontFamilyAsStyle(Localization.FontFamily.Semibold)}>
										{ button.label }
									</span>
								</div>
							</a>
						);
					}) }
				</div>
			</div>
		);
	}
}

let component = DialogPanelClass.componentize();
export {component as DialogPanel};
