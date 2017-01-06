import {Constants} from "../../../constants";

import {ComponentBase} from "../../componentBase";

export interface ControlGroup {
	id?: string;
	className?: string;
	innerElements: any[];
}

/**
 * Represents a preview header that can contain multiple control button groups, i.e., groups
 * of buttons or similar header entities. Child classes need to simply declare each control's
 * buttons.
 */
export abstract class PreviewViewerHeaderComponentBase<T, P> extends ComponentBase<T, P> {
	/**
	 * Shared class names used by header elements for consistent styling.
	 */
	public static HeaderClasses = {
		Button: {
			active: " active",
			controlButton: " control-button",
			relatedButtons: " related-buttons",
			activeControlButton: " active control-button"
		}
	};

	/**
	 * Gets the list of control groups to be rendered.
	 */
	abstract getControlGroups(): ControlGroup[];

	render() {
		let controlButtonGroup = "control-button-group";

		let renderables = [];
		let buttonGroups = this.getControlGroups();

		for (let i = 0; i < buttonGroups.length; i++) {
			let id = buttonGroups[i].id;
			let className = buttonGroups[i].className;
			renderables.push(
				<div id={id ? id : ""} className={className ? className : controlButtonGroup}>
					{buttonGroups[i].innerElements}
				</div >);
		}

		return (
			<div>
				{renderables}
			</div>
		);
	}
}
