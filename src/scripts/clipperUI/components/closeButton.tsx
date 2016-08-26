import {Constants} from "../../constants";
import {Utils} from "../../utils";

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
				<a id={Constants.Ids.closeButton} {...this.enableInvoke(this.props.onClickHandler, 300, this.props.onClickHandlerParams) }>
					<img className="closeButtonIcon" src={Utils.getImageResourceUrl("close.png")} />
				</a>
			</div>
		);
	}
}

let component = CloseButtonClass.componentize();
export {component as CloseButton};
