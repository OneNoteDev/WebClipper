import {Constants} from "../../../constants";

import {ExtensionUtils} from "../../../extensions/extensionUtils";

import {Localization} from "../../../localization/localization";

import {ClipperStateProp} from "../../clipperState";
import {Status} from "../../status";

import {ControlGroup, HeaderClasses, PreviewViewerHeaderComponentBase} from "./previewViewerHeaderComponentBase";

export interface PreviewViewerSelectionHeaderProp extends ClipperStateProp {
	toggleHighlight: () => void;
	changeFontFamily: (serif: boolean) => void;
	changeFontSize: (increase: boolean) => void;
	serif: boolean;
	textHighlighterEnabled: boolean;
}

/**
 * TODO copied from previewViewerAugmentationHeader for now as this is a prototype
 */
class PreviewViewerSelectionHeaderClass extends PreviewViewerHeaderComponentBase<{}, PreviewViewerSelectionHeaderProp> {
	getControlGroups(): ControlGroup[] {
		return [this.getHighlightGroup(), this.getSerifGroup(), this.getFontSizeGroup(), this.getAddSelectionGroup()];
	}

	private getHighlightGroup(): ControlGroup {
		let highlighterEnabled = this.props.textHighlighterEnabled;
		let classForHighlighter = highlighterEnabled ? HeaderClasses.Button.active : "";
		let imgSrc = highlighterEnabled ? "editorOptions/highlight_tool_on.png" : "editorOptions/highlight_tool_off.png";

		return {
			id: Constants.Ids.highlightControl,
			innerElements: [<img
				id={Constants.Ids.highlightButton}
				{...this.enableInvoke(this.props.toggleHighlight, 100) }
				className={classForHighlighter}
				src={ExtensionUtils.getImageResourceUrl(imgSrc) } />
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

	private getFontSizeGroup(): ControlGroup {
		return {
			id: Constants.Ids.fontSizeControl,
			className: HeaderClasses.Button.relatedButtons,
			innerElements: [
				<button className={HeaderClasses.Button.controlButton}
					type="button" {...this.enableInvoke(this.props.changeFontSize, 103, false) }
					id={Constants.Ids.decrementFontSize}>
					<img src={ExtensionUtils.getImageResourceUrl("editorOptions/font_down.png") } />
				</button>,
				<button className={HeaderClasses.Button.controlButton}
					type="button" {...this.enableInvoke(this.props.changeFontSize, 104, true) }
					id={Constants.Ids.incrementFontSize}>
					<img src={ExtensionUtils.getImageResourceUrl("editorOptions/font_up.png") } />
				</button>
			]
		};
	}

	private getAddSelectionGroup(): ControlGroup {
		// Rangy does not work on PDFs
		if (this.props.clipperState.pageInfo.contentType === OneNoteApi.ContentType.EnhancedUrl) {
			return undefined;
		}

		return {
			id: Constants.Ids.addRegionControl,
			innerElements: [
				<button
					id={Constants.Ids.addAnotherRegionButton}
					{...this.enableInvoke(this.addAnotherSelection.bind(this), 105) }
					className={HeaderClasses.Button.controlButton}
					style={Localization.getFontFamilyAsStyle(Localization.FontFamily.Regular) }
					type="button">
					<img src={ExtensionUtils.getImageResourceUrl("editorOptions/add_icon.png")} />
					<span>{"TODO"}</span>
				</button>
			]
		};
	}

	addAnotherSelection() {
		this.props.clipperState.setState({
			selectionStatus: Status.InProgress
		});
	}
}

let component = PreviewViewerSelectionHeaderClass.componentize();
export {component as PreviewViewerSelectionHeader};
