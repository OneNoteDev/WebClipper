import {Constants} from "../../../constants";

import {ExtensionUtils} from "../../../extensions/extensionUtils";

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
		return [this.getHighlightGroup(), this.getSerifGroup(), this.getFontSizeGroup()];
	}

	private getHighlightGroup(): ControlGroup {
		let highlighterEnabled = this.props.textHighlighterEnabled;
		let classForHighlighter = highlighterEnabled ? HeaderClasses.Button.active : "";
		let imgSrc = highlighterEnabled ? "editorOptions/highlight_tool_on.png" : "editorOptions/highlight_tool_off.png";

		return {
			id: Constants.Ids.highlightControl,
			innerElements: [
				<img
					role="button"
					aria-label="Toggle Highlighter for Article"
					aria-pressed={highlighterEnabled ? "true" : "false"}
					id={Constants.Ids.highlightButton}
					{...this.enableInvoke(this.props.toggleHighlight, 100) }
					className={classForHighlighter}
					src={ExtensionUtils.getImageResourceUrl(imgSrc)}
				/>
			]
		};
	}

	private getSerifGroup(): ControlGroup {
		return {
			id: Constants.Ids.serifControl,
			innerElements: [
				<button
					aria-label="Change font to Sans-Serif"
					aria-pressed={!this.props.serif ? "true" : "false"}
					id={Constants.Ids.sansSerif}
					{...this.enableInvoke(this.props.changeFontFamily, 101, false) }
					className={!this.props.serif ? HeaderClasses.Button.activeControlButton : HeaderClasses.Button.controlButton}
					type="button">
					{Localization.getLocalizedString("WebClipper.Preview.Header.SansSerifButtonLabel") }
				</button>,
				<button
					aria-label="Change font to Serif"
					aria-pressed={this.props.serif ? "true" : "false"}
					id={Constants.Ids.serif}
					{...this.enableInvoke(this.props.changeFontFamily, 102, true) }
					className={this.props.serif ? HeaderClasses.Button.activeControlButton : HeaderClasses.Button.controlButton}
					type="button">
					{Localization.getLocalizedString("WebClipper.Preview.Header.SerifButtonLabel") }
				</button>
			]
		};
	}

	private getFontSizeGroup(): ControlGroup {
		return {
			id: Constants.Ids.fontSizeControl,
			className: HeaderClasses.Button.relatedButtons,
			innerElements: [
				<button className={HeaderClasses.Button.controlButton}
					aria-label="Decrease font size"
					type="button" {...this.enableInvoke(this.props.changeFontSize, 103, false) }
					id={Constants.Ids.decrementFontSize}>
					<img src={ExtensionUtils.getImageResourceUrl("editorOptions/font_down.png") } />
				</button>,
				<button className={HeaderClasses.Button.controlButton}
					aria-label="Increase font size"
					type="button" {...this.enableInvoke(this.props.changeFontSize, 104, true) }
					id={Constants.Ids.incrementFontSize}>
					<img src={ExtensionUtils.getImageResourceUrl("editorOptions/font_up.png") } />
				</button>
			]
		};
	}
}

let component = PreviewViewerAugmentationHeaderClass.componentize();
export {component as PreviewViewerAugmentationHeader};
