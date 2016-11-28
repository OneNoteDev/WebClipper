import * as popperJS from "popper.js";

export interface PopperContentOptions {
	content: string;
	classNames: string[];
	arrowClassNames: string[];
};

export class Popover {
	private referenceElement: Element;
	private popperContentOptions: PopperContentOptions | Element;
	private popperBehaviorOptions: popperJS.PopperOptions;

	private refToPopperJsObj: popperJS;

	constructor(referenceElement: Element, popperContentOptions: PopperContentOptions | Element, popperBehaviorOptions: popperJS.PopperOptions) {
		this.referenceElement = referenceElement;
		this.popperContentOptions = popperContentOptions;
		this.popperBehaviorOptions = popperBehaviorOptions;
		this.refToPopperJsObj = new popperJS(referenceElement, popperContentOptions, popperBehaviorOptions);
	}

	show(): void {
		if (!this.refToPopperJsObj) {
			this.refToPopperJsObj = new popperJS(this.referenceElement, this.popperContentOptions, this.popperBehaviorOptions);
		}
	}

	hide(): void {
		if (this.refToPopperJsObj) {
			this.refToPopperJsObj.destroy();
		}
		this.refToPopperJsObj = undefined;
	}

	changeText(text: string) {
		if (this.refToPopperJsObj) {
			this.refToPopperJsObj.destroy();
		}
	}
}
