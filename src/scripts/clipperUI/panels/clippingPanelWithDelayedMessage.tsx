import {Localization} from "../../localization/localization";

import {ClipperStateProp} from "../clipperState";
import {ComponentBase} from "../componentBase";

import {ClippingPanel} from "./clippingPanel";

interface ClippingPanelWithDelayedMessageState {
	showMessage: boolean;
}

interface ClippingPanelWithDelayedMessageProp extends ClipperStateProp {
	delay: number;
	message: number;
}

class ClippingPanelWithDelayedMessageClass extends ComponentBase<ClippingPanelWithDelayedMessageState, ClippingPanelWithDelayedMessageProp> {
	constructor(props: ClippingPanelWithDelayedMessageProp) {
		super(props);
		setTimeout(() => {
			this.setState({
				showMessage: true
			});
		}, this.props.delay);
	}

	getInitialState(): ClippingPanelWithDelayedMessageState {
		return {
			showMessage: false
		};
	}

	getMessageElement() {
		return (
			<span className="actionLabelFont messageLabel"
				style={Localization.getFontFamilyAsStyle(Localization.FontFamily.Regular) }>
				{this.props.message}
			</span>
		);
	}

	render() {
		return (
			<div>
				<ClippingPanel clipperState={this.props.clipperState} />
				{ this.state.showMessage ? this.getMessageElement() : undefined}
			</div>
		);
	}
}

let component = ClippingPanelWithDelayedMessageClass.componentize();
export {component as ClippingPanelWithDelayedMessage};
