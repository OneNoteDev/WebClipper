import * as Log from "../../logging/log";

import {Constants} from "../../constants";

import {ExtensionUtils} from "../../extensions/extensionUtils";

import {ComponentBase} from "../componentBase";

export interface HtmlSelectionProps {
	html: string;
	index: number;
	onRemove?: (index: number) => void;
}

// TODO repeat code with regionSelection
class HtmlSelectionClass extends ComponentBase<{}, HtmlSelectionProps> {
	buttonHandler() {
		if (this.props.onRemove) {
			this.props.onRemove(this.props.index);
		}
	}

	public getRemoveButton(): any[] {
		// No remove button is rendered if there's no callback specified
		return (
			this.props.onRemove
				? <a className={Constants.Classes.regionSelectionRemoveButton}
					{...this.enableInvoke(this.buttonHandler, 300, undefined, Log.Click.Label.regionSelectionRemoveButton) }>
					<img src={ExtensionUtils.getImageResourceUrl("editorOptions/delete_button.png") } /></a>
				: undefined
		);
	}

	public render() {
		return (
			<div>
				<p className="html-selection">
					{this.getRemoveButton()}
					<div className={Constants.Classes.htmlSelectionContent}>
						{m.trust(this.props.html)}
					</div>
				</p>
			</div>
		);
	}
}

let component = HtmlSelectionClass.componentize();
export {component as HtmlSelection};
