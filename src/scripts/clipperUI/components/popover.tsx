import {Constants} from "../../constants";
import {StringUtils} from "../../stringUtils";
import {Localization} from "../../localization/localization";

import {ComponentBase} from "../componentBase";

import * as popperJS from "popper.js";

export interface PopoverProps {
	referenceElementId: string;
	placement: string; // TODO: use a union type of allowed values

	content?: string;
	classNames?: string[];
	arrowClassNames?: string[];
	modifiersIgnored?: string[]; // TODO: use a union type of allowed values
	removeOnDestroy?: boolean;
}

class PopoverClass extends ComponentBase<{}, PopoverProps> {
	private refToPopper: popperJS;

	constructor(props: any) {
		super(props);
	}

	handlePopoverLifecycle(element, isInitialized, context) {
		if (!isInitialized) {
			let popoverObj: any = {
				content: this.props.content,
				classNames: this.props.classNames,
				arrowClassNames: this.props.arrowClassNames
			};

			let mainControllerElem = document.getElementById(Constants.Ids.mainController);
			if (mainControllerElem) {
				// We want to set the parent lower in the HTML hierarchy to avoid z-index issues relating to stacking contexts
				popoverObj.parent = mainControllerElem;
			}

			this.refToPopper = new popperJS(document.getElementById(this.props.referenceElementId), popoverObj, {
				placement: this.props.placement,
				modifiersIgnored: this.props.modifiersIgnored,
				removeOnDestroy: this.props.removeOnDestroy
			});
		}

		if (isInitialized) {
			if (this.refToPopper) {
				this.refToPopper.update();
			}
		}

		context.onunload = () => {
			if (this.refToPopper) {
				this.refToPopper.destroy();
				this.refToPopper = undefined;
			}
		};
	}

	render() {
		return (
			<div config={this.handlePopoverLifecycle.bind(this)} />
		);
	}
}

let component = PopoverClass.componentize();
export {component as Popover};
