import {Constants} from "../../constants";

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
		}, Math.max(this.props.delay, 0));
	}

	getInitialState(): ClippingPanelWithDelayedMessageState {
		return {
			showMessage: false
		};
	}

	getMessageElement() {
		return (
			<span className="actionLabelFont messageLabel" id={Constants.Ids.clipProgressDelayedMessage}
				style={Localization.getFontFamilyAsStyle(Localization.FontFamily.Regular)}>
				{"Clipping Page 1 of 7"}
			</span>
		);
		// {this.props.message}
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
