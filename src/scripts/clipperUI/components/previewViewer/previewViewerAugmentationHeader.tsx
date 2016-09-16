import {Constants} from "../../../constants";
import {Utils} from "../../../utils";

import {Localization} from "../../../localization/localization";

import {ControlGroup, HeaderClasses, PreviewViewerHeaderComponentBase} from "./previewViewerHeaderComponentBase";

export interface PreviewViewerAugmentationHeaderProp {
	toggleHighlight: () => void;
	changeFontFamily: (serif: boolean) => void;
	changeFontSize: (increase: boolean) => void;
	serif: boolean;
	textHighlighterEnabled: boolean;
}

class PreviewViewerAugmentationHeaderClass extends PreviewViewerHeaderComponentBase<{}, PreviewViewerAugmentationHeaderProp> {
	getControlGroups(): ControlGroup[] {
		return [this.getHighlightGroup(), this.getSerifGroup(), this.getFontDownGroup(), this.getFontUpGroup()];
	}

	private getHighlightGroup(): ControlGroup {
		return {
			id: Constants.Ids.highlightControl,
			innerElements: [<img
				id={Constants.Ids.highlightButton}
				{...this.enableInvoke(this.props.toggleHighlight, 100) }
				className={this.props.textHighlighterEnabled ? HeaderClasses.Button.active : ""}
				src={Utils.getImageResourceUrl("editorOptions/highlight_tool.png") } />
			]
		};
	}

	private getSerifGroup(): ControlGroup {
		return {
			id: Constants.Ids.serifControl,
			innerElements: [
				<button
					id={Constants.Ids.sansSerif}
					{...this.enableInvoke(this.props.changeFontFamily, 101, false) }
					className={!this.props.serif ? HeaderClasses.Button.activeControlButton : HeaderClasses.Button.controlButton}
					type="button">
					{Localization.getLocalizedString("WebClipper.Preview.Header.SansSerifButtonLabel") }
				</button>,
				<button
					id={Constants.Ids.serif}
					{...this.enableInvoke(this.props.changeFontFamily, 102, true) }
					className={this.props.serif ? HeaderClasses.Button.activeControlButton : HeaderClasses.Button.controlButton}
					type="button">
					{Localization.getLocalizedString("WebClipper.Preview.Header.SerifButtonLabel") }
				</button>
			]
		};
	}

	private getFontDownGroup(): ControlGroup {
		return {
			innerElements: [
				<button className={HeaderClasses.Button.controlButton}
					type="button" {...this.enableInvoke(this.props.changeFontSize, 103, false) }
					id={Constants.Ids.decrementFontSize}>
					<img src={Utils.getImageResourceUrl("editorOptions/font_down.png") } />
				</button>
			]
		};
	}

	private getFontUpGroup(): ControlGroup {
		return {
			innerElements: [
				<button className={HeaderClasses.Button.controlButton}
					type="button" {...this.enableInvoke(this.props.changeFontSize, 104, true) }
					id={Constants.Ids.incrementFontSize}>
					<img src={Utils.getImageResourceUrl("editorOptions/font_up.png") } />
				</button>
			]
		};
	}
}

let component = PreviewViewerAugmentationHeaderClass.componentize();
export {component as PreviewViewerAugmentationHeader};
