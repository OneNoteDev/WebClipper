import {Constants} from "../../constants";
import {StringUtils} from "../../stringUtils";

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
			let popperElement = this.generatePopperElement(Constants.Ids.mainController);
			this.refToPopper = new popperJS(document.getElementById(this.props.referenceElementId), popperElement, {
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

	private generatePopperElement(parentId: string): HTMLDivElement {
		let popperElement = document.createElement("div") as HTMLDivElement;
		popperElement.innerText = this.props.content;

		if (this.props.classNames) {
			for (let i = 0; i < this.props.classNames.length; i++) {
				popperElement.classList.add(this.props.classNames[i]);
			}
		}

		if (this.props.arrowClassNames) {
			let arrowElement = document.createElement("div");
			for (let i = 0; i < this.props.arrowClassNames.length; i++) {
				arrowElement.classList.add(this.props.arrowClassNames[i]);
			}
			popperElement.appendChild(arrowElement);
		}

		let parent = document.getElementById(parentId);
		if (parent) {
			// We want to set the parent lower in the HTML hierarchy to avoid z-index issues relating to stacking contexts
			parent.appendChild(popperElement);
		} else {
			document.body.appendChild(popperElement);
		}

		return popperElement;
	}

	render() {
		return (
			<div config={this.handlePopoverLifecycle.bind(this)} />
		);
	}
}

let component = PopoverClass.componentize();
export {component as Popover};
