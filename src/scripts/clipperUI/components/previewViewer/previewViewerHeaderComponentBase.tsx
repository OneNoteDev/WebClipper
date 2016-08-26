/// <reference path="../../../../../node_modules/onenoteapi/target/oneNoteApi.d.ts" />

import {Constants} from "../../../constants";
import {Utils} from "../../../utils";

import {ComponentBase} from "../../componentBase";

/**
 * Shared class names used by header elements for consistent styling.
 */
export module HeaderClasses {
	export module Button {
		export let active = " active";
		export let controlButton = " control-button";
		export let activeControlButton = active + controlButton;
	}
}

export interface ControlGroup {
	id?: string;
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
			renderables.push(
				<div id={buttonGroups[i].id ? buttonGroups[i].id : ""} className={controlButtonGroup}>
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
