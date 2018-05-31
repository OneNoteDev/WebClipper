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
		return [this.getScreenReaderTitleGroup(), this.getHighlightGroup(), this.getSerifGroup(), this.getFontSizeGroup()];
	}

	private getScreenReaderTitleGroup() {
		return {
			className: Constants.Classes.srOnly,
			innerElements: [
				<div>{Localization.getLocalizedString("WebClipper.ClipType.Article.Button")}</div>
			]
		};
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
					aria-label={Localization.getLocalizedString("WebClipper.Accessibility.ScreenReader.ToggleHighlighterForArticleMode")}
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
			role: "radiogroup",
			isAriaSet: true,
			innerElements: [
				<button
					aria-label={Localization.getLocalizedString("WebClipper.Accessibility.ScreenReader.ChangeFontToSansSerif")}
					aria-checked={!this.props.serif ? "true" : "false"}
					id={Constants.Ids.sansSerif}
					{...this.enableInvoke(this.props.changeFontFamily, !this.props.serif ? 101 : undefined, false, undefined, Constants.AriaSet.serifGroupSet) }
					className={!this.props.serif ? HeaderClasses.Button.activeControlButton : HeaderClasses.Button.controlButton}
					role="radio">
					{Localization.getLocalizedString("WebClipper.Preview.Header.SansSerifButtonLabel") }
				</button>,
				<button
					aria-label={Localization.getLocalizedString("WebClipper.Accessibility.ScreenReader.ChangeFontToSerif")}
					aria-checked={this.props.serif ? "true" : "false"}
					id={Constants.Ids.serif}
					{...this.enableInvoke(this.props.changeFontFamily, this.props.serif ? 101 : undefined, true, undefined, Constants.AriaSet.serifGroupSet) }
					className={this.props.serif ? HeaderClasses.Button.activeControlButton : HeaderClasses.Button.controlButton}
					role="radio">
					{Localization.getLocalizedString("WebClipper.Preview.Header.SerifButtonLabel") }
				</button>
			]
		};
	}

	private getFontSizeGroup(): ControlGroup {
		return {
			id: Constants.Ids.fontSizeControl,
			className: HeaderClasses.Button.relatedButtons,
			isAriaSet: true,
			innerElements: [
				<button className={HeaderClasses.Button.controlButton}
					aria-label={Localization.getLocalizedString("WebClipper.Accessibility.ScreenReader.DecreaseFontSize")}
					type="button" {...this.enableInvoke(this.props.changeFontSize, 103, false) }
					id={Constants.Ids.decrementFontSize}>
					<img src={ExtensionUtils.getImageResourceUrl("editorOptions/font_down.png") } />
				</button>,
				<button className={HeaderClasses.Button.controlButton}
					aria-label={Localization.getLocalizedString("WebClipper.Accessibility.ScreenReader.IncreaseFontSize")}
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
