import * as Log from "../../logging/log";

import {ExtensionUtils} from "../../extensions/extensionUtils";

import {ComponentBase} from "../componentBase";
import { Localization } from "../../localization/localization";

export interface RegionSelectionProps {
	imageSrc: string;
	index: number;
	onRemove?: (index: number) => void;
}

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
				? <a className="region-selection-remove-button" role="button"
					{...this.enableInvoke({callback: this.buttonHandler, tabIndex: 300, idOverride: Log.Click.Label.regionSelectionRemoveButton})}>
					<img src={ExtensionUtils.getImageResourceUrl("editorOptions/delete_button.png")} alt={Localization.getLocalizedString("WebClipper.Preview.RemoveSelectedRegion")} /></a>
				: undefined
		);
	}

	public render() {
		return (
			<div>
				<p className="region-selection">
					{this.getRemoveButton()}
					<img className="region-selection-image"
						src={this.props.imageSrc} alt={Localization.getLocalizedString("WebClipper.Preview.SelectedRegion")}/>
				</p>
			</div>
		);
	}
}

let component = RegionSelectionClass.componentize();
export {component as RegionSelection};
