import {Constants} from "../../constants";

import {ExtensionUtils} from "../../extensions/extensionUtils";
import {Localization} from "../../localization/localization";

import {ComponentBase} from "../componentBase";

export interface CloseButtonProps {
	onClickHandler: () => void;
	onClickHandlerParams: any[];
}

class CloseButtonClass extends ComponentBase<{}, CloseButtonProps> {
	getInitialState(): {} {
		return {};
	}

	render() {
		return (
			<div id={Constants.Ids.closeButtonContainer}>
				<a id={Constants.Ids.closeButton} aria-label={Localization.getLocalizedString("WebClipper.Action.CloseTheClipper")} {...this.enableInvoke(this.props.onClickHandler, 300, this.props.onClickHandlerParams) }>
					<img className="closeButtonIcon" src={ExtensionUtils.getImageResourceUrl("close.png")} />
				</a>
			</div>
		);
	}
}

let component = CloseButtonClass.componentize();
export {component as CloseButton};
