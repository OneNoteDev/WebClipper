import {ClientType} from "../../clientType";
import {Experiments} from "../../experiments";

import {AugmentationHelper} from "../../contentCapture/augmentationHelper";

import {ExtensionUtils} from "../../extensions/extensionUtils";
import {InvokeMode} from "../../extensions/invokeOptions";

import {Localization} from "../../localization/localization";

import {ClipMode} from "../clipMode";
import {ClipperStateProp} from "../clipperState";
import {ComponentBase} from "../componentBase";

import {ModeButton} from "./modeButton";

class ModeButtonSelectorClass extends ComponentBase<{}, ClipperStateProp> {
	onModeSelected(newMode: ClipMode) {
		this.props.clipperState.setState({
			currentMode: this.props.clipperState.currentMode.set(newMode)
		});
	};

	private getFullPageModeButton(currentMode: ClipMode) {
		if (this.props.clipperState.pageInfo.contentType === OneNoteApi.ContentType.EnhancedUrl) {
			return undefined;
		}

		return <ModeButton imgSrc={ExtensionUtils.getImageResourceUrl("fullpage.png")}
			label={Localization.getLocalizedString("WebClipper.ClipType.ScreenShot.Button")}
			myMode={ClipMode.FullPage} tabIndex={40}
			selected={currentMode === ClipMode.FullPage}
			onModeSelected={this.onModeSelected.bind(this) }
			tooltipText={Localization.getLocalizedString("WebClipper.ClipType.ScreenShot.Button.Tooltip")}/>;
	}

	private getSelectionModeButton(currentMode: ClipMode) {
		if (this.props.clipperState.pageInfo.contentType === OneNoteApi.ContentType.EnhancedUrl &&
			this.props.clipperState.invokeOptions.invokeMode !== InvokeMode.ContextTextSelection) {
			return undefined;
		}

		return <ModeButton imgSrc={ExtensionUtils.getImageResourceUrl("select.png") }
			label={Localization.getLocalizedString("WebClipper.ClipType.Selection.Button")}
			myMode={ClipMode.Selection} tabIndex={43} selected={currentMode === ClipMode.Selection}
			onModeSelected={this.onModeSelected.bind(this) }
			tooltipText={Localization.getLocalizedString("WebClipper.ClipType.Selection.Button.Tooltip")}/>;
	}

	private getAugmentationModeButton(currentMode: ClipMode) {
		if (this.props.clipperState.pageInfo.contentType === OneNoteApi.ContentType.EnhancedUrl) {
			return undefined;
		}

		let augmentationType: string = AugmentationHelper.getAugmentationType(this.props.clipperState);
		let augmentationLabel: string = Localization.getLocalizedString("WebClipper.ClipType." + augmentationType + ".Button");
		let augmentationTooltip = Localization.getLocalizedString("WebClipper.ClipType.Button.Tooltip").replace("{0}", augmentationLabel);

		return <ModeButton imgSrc={ExtensionUtils.getImageResourceUrl(augmentationType + ".png") }
			label={augmentationLabel} myMode={ClipMode.Augmentation}
			tabIndex={42} selected={currentMode === ClipMode.Augmentation}
			onModeSelected={this.onModeSelected.bind(this) }
			tooltipText={augmentationTooltip}/>;
	}

	private getBookmarkModeButton(currentMode: ClipMode) {
		if (this.props.clipperState.pageInfo.rawUrl.indexOf("file:///") === 0) {
			return undefined;
		}
		return <ModeButton imgSrc={ExtensionUtils.getImageResourceUrl("bookmark.png") }
			label={Localization.getLocalizedString("WebClipper.ClipType.Bookmark.Button") }
			myMode={ClipMode.Bookmark} tabIndex={44} selected={currentMode === ClipMode.Bookmark}
			onModeSelected={this.onModeSelected.bind(this) }
			tooltipText={Localization.getLocalizedString("WebClipper.ClipType.Bookmark.Button.Tooltip") } />;
	}

	private getPdfModeButton(currentMode: ClipMode) {
		if (this.props.clipperState.pageInfo.contentType !== OneNoteApi.ContentType.EnhancedUrl) {
			return undefined;
		}

		return <ModeButton imgSrc={ExtensionUtils.getImageResourceUrl("pdf.png") }
			label={Localization.getLocalizedString("WebClipper.ClipType.Pdf.Button")}
			myMode={ClipMode.Pdf} tabIndex={39} selected={currentMode === ClipMode.Pdf}
			onModeSelected={this.onModeSelected.bind(this) }
			tooltipText={Localization.getLocalizedString("WebClipper.ClipType.Pdf.Button.Tooltip")}/>;
	}

	public render() {
		let currentMode = this.props.clipperState.currentMode.get();

		return (
			<div style={Localization.getFontFamilyAsStyle(Localization.FontFamily.Semilight) }>
				{ this.getFullPageModeButton(currentMode) }
				{ this.getSelectionModeButton(currentMode) }
				{ this.getAugmentationModeButton(currentMode) }
				{ this.getBookmarkModeButton(currentMode) }
				{ this.getPdfModeButton(currentMode) }
			</div>
		);
	}
}

let component = ModeButtonSelectorClass.componentize();
export {component as ModeButtonSelector};
