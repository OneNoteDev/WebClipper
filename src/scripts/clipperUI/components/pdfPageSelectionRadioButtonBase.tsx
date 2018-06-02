import {ComponentBase} from "../componentBase";

export interface radioButtonGroup {
	role?: string;
	isAriaSet?: boolean;
	innerElements: any[];
}

/**
 * Represents a preview header that can contain multiple control button groups, i.e., groups
 * of buttons or similar header entities. Child classes need to simply declare each control's
 * buttons.
 */
export abstract class pdfPageSelectionRadioButtonBase<T, P> extends ComponentBase<T, P> {
	/**
	 * Gets the list of control groups to be rendered.
	 */
	abstract getRadioButtonGroups(): radioButtonGroup[];

	render() {
		let renderables = [];
		let buttonGroups = this.getRadioButtonGroups();

		for (let i = 0; i < buttonGroups.length; i++) {
			let currentButtonGroup = buttonGroups[i];
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
				<div role={role ? role : ""}>
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
