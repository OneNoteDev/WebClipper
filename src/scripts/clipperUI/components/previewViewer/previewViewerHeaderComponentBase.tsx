import {ComponentBase} from "../../componentBase";

/**
 * Shared class names used by header elements for consistent styling.
 */
export module HeaderClasses {
	export module Button {
		export let active = " active";
		export let controlButton = " control-button";
		export let relatedButtons = " related-buttons";
		export let activeControlButton = active + controlButton;
	}
}

export interface ControlGroup {
	id?: string;
	className?: string;
	role?: string;
	isAriaSet?: boolean;
	innerElements: any[];
}

/**
 * Represents a preview header that can contain multiple control button groups, i.e., groups
 * of buttons or similar header entities. Child classes need to simply declare each control's
 * buttons.
 */
export abstract class PreviewViewerHeaderComponentBase<T, P> extends ComponentBase<T, P> {
	/**
	 * Gets the list of control groups to be rendered.
	 */
	abstract getControlGroups(): ControlGroup[];

	render() {
		let controlButtonGroup = "control-button-group";

		let renderables = [];
		let buttonGroups = this.getControlGroups();

		for (let i = 0; i < buttonGroups.length; i++) {
			let currentButtonGroup = buttonGroups[i];
			let id = currentButtonGroup.id;
			let className = currentButtonGroup.className;
			let role = currentButtonGroup.role;
			let isAriaSet = currentButtonGroup.isAriaSet;
			if (isAriaSet) {
				let setSize = currentButtonGroup.innerElements.length;
				for (let j = 0; j < setSize; j++) {
					currentButtonGroup.innerElements[j].attrs["aria-posinset"] = j + 1;
					currentButtonGroup.innerElements[j].attrs["aria-setsize"] = setSize;
				}

			}
			renderables.push(
				<div id={id ? id : ""} className={className ? className : controlButtonGroup} role={role ? role : ""}>
					{currentButtonGroup.innerElements}
				</div >);
		}

		return (
			<div>
				{renderables}
			</div>
		);
	}
}
