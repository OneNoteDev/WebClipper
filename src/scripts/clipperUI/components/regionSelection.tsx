import * as Log from "../../logging/log";

import {Constants} from "../../constants";

import {ExtensionUtils} from "../../extensions/extensionUtils";

import {ComponentBase} from "../componentBase";

export interface RegionSelectionProps {
	imageSrc: string;
	index: number;
	onRemove?: (index: number) => void;
}

// TODO deprecate this and consolidate into htmlselectionclass
class RegionSelectionClass extends ComponentBase<{}, RegionSelectionProps> {
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
				<p className="region-selection">
					{this.getRemoveButton()}
					<img className="region-selection-image"
						src={this.props.imageSrc} />
				</p>
			</div>
		);
	}
}

let component = RegionSelectionClass.componentize();
export {component as RegionSelection};
