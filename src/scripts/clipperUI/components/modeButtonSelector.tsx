import {Constants} from "../../constants";
import {AugmentationHelper} from "../../contentCapture/augmentationHelper";
import {ExtensionUtils} from "../../extensions/extensionUtils";
import {InvokeMode} from "../../extensions/invokeOptions";
import {Localization} from "../../localization/localization";
import {ClipMode} from "../clipMode";
import {ClipperStateProp} from "../clipperState";
import {ComponentBase} from "../componentBase";
import {ModeButton} from "./modeButton";

export interface ModeButtonSelectorState {
	mouseKeyOnButton?: number;
}

class ModeButtonSelectorClass extends ComponentBase<ModeButtonSelectorState, ClipperStateProp> {
	constructor(props) {
		super(props);
		this.setState({
			mouseKeyOnButton: 1
		});
	}

	private handleKeydown = (event) => {
		if (event.keyCode === Constants.KeyCodes.down) {
			this.handleDownArrow();
		}
		if (event.keyCode === Constants.KeyCodes.up) {
			this.handleUpArrow();
		}
	};

	private handleUpArrow() {
		let selectedID = this.state.mouseKeyOnButton - 1;
		if (selectedID === 0) {
			selectedID = 4;
		}
		this.setState({ mouseKeyOnButton: selectedID});
		this.focusOnAButton(selectedID);
	};

	private handleDownArrow() {
		let selectedID = this.state.mouseKeyOnButton + 1;
		if (selectedID === 5) {
			selectedID = 1;
		}
		this.setState({ mouseKeyOnButton: selectedID});
		this.focusOnAButton(selectedID);
	};

	private focusOnAButton(selectedID) {
		const buttons = document.querySelectorAll("a[aria-setsize]");
		if (buttons.length > 0) {
			for (let i = 0; i < buttons.length; i++) {
				let selectable = buttons[i] as HTMLElement;
				let ariaIntForEach = parseInt(selectable.getAttribute("aria-posinset"), 10);
				if ( ariaIntForEach === selectedID) {
					selectable.focus();
				}
			}
		}
	};

	onModeSelected(newMode: ClipMode) {
		this.props.clipperState.setState({
			currentMode: this.props.clipperState.currentMode.set(newMode)
		});
	};

	private getScreenReaderOnlyElementThatAnnouncesCurrentMode(currentMode: ClipMode) {
		let stringToTellUserModeHasChanged = Localization.getLocalizedString("WebClipper.Accessibility.ScreenReader.CurrentModeHasChanged");
		stringToTellUserModeHasChanged = stringToTellUserModeHasChanged.replace("{0}", ClipMode[currentMode]);

		return (
			<div aria-live="polite" aria-relevant="text" className={Constants.Classes.srOnly}>{stringToTellUserModeHasChanged}</div>
		);
	}

	private getPdfModeButton(currentMode: ClipMode) {
		if (this.props.clipperState.pageInfo.contentType !== OneNoteApi.ContentType.EnhancedUrl) {
			return undefined;
		}

		return <ModeButton
			imgSrc={ExtensionUtils.getImageResourceUrl("pdf.png")}
			label={Localization.getLocalizedString("WebClipper.ClipType.Pdf.Button")}
			myMode={ClipMode.Pdf} tabIndex={39} selected={currentMode === ClipMode.Pdf}
			onModeSelected={this.onModeSelected.bind(this)}
			tooltipText={Localization.getLocalizedString("WebClipper.ClipType.Pdf.Button.Tooltip")}/>;
	}

	private getAugmentationModeButton(currentMode: ClipMode) {
		if (this.props.clipperState.pageInfo.contentType === OneNoteApi.ContentType.EnhancedUrl) {
			return undefined;
		}

		let augmentationType: string = AugmentationHelper.getAugmentationType(this.props.clipperState);
		let augmentationLabel: string = Localization.getLocalizedString("WebClipper.ClipType." + augmentationType + ".Button");
		let augmentationTooltip = Localization.getLocalizedString("WebClipper.ClipType.Button.Tooltip").replace("{0}", augmentationLabel);

		return <ModeButton
			imgSrc={ExtensionUtils.getImageResourceUrl(augmentationType + ".png")}
			label={augmentationLabel} myMode={ClipMode.Augmentation}
			tabIndex={42} selected={currentMode === ClipMode.Augmentation}
			onModeSelected={this.onModeSelected.bind(this)}
			tooltipText={augmentationTooltip}/>;
	}

	private getFullPageModeButton(currentMode: ClipMode) {
		if (this.props.clipperState.pageInfo.contentType === OneNoteApi.ContentType.EnhancedUrl) {
			return undefined;
		}

		return <ModeButton
			imgSrc={ExtensionUtils.getImageResourceUrl("fullpage.png")}
			label={Localization.getLocalizedString("WebClipper.ClipType.ScreenShot.Button")}
			myMode={ClipMode.FullPage}
			selected={currentMode === ClipMode.FullPage}
			onModeSelected={this.onModeSelected.bind(this)}
			tooltipText={Localization.getLocalizedString("WebClipper.ClipType.ScreenShot.Button.Tooltip")}/>;
	}

	private getRegionModeButton(currentMode: ClipMode) {
		let enableRegionClipping = this.props.clipperState.injectOptions && this.props.clipperState.injectOptions.enableRegionClipping;
		let contextImageModeUsed = this.props.clipperState.invokeOptions && this.props.clipperState.invokeOptions.invokeMode === InvokeMode.ContextImage;

		if (!enableRegionClipping && !contextImageModeUsed) {
			return undefined;
		}

		return <ModeButton
			imgSrc={ExtensionUtils.getImageResourceUrl("region.png")}
			label={Localization.getLocalizedString(this.getRegionModeButtonLabel())}
			myMode={ClipMode.Region} selected={currentMode === ClipMode.Region}
			onModeSelected={this.onModeSelected.bind(this)}
			tooltipText={Localization.getLocalizedString("WebClipper.ClipType.MultipleRegions.Button.Tooltip")}/>;
	}

	private getRegionModeButtonLabel(): string {
		return "WebClipper.ClipType.Region.Button";
	}

	private getSelectionModeButton(currentMode: ClipMode) {
		if (this.props.clipperState.invokeOptions.invokeMode !== InvokeMode.ContextTextSelection) {
			return undefined;
		}
		return <ModeButton
			imgSrc={ExtensionUtils.getImageResourceUrl("select.png")}
			label={Localization.getLocalizedString("WebClipper.ClipType.Selection.Button")}
			myMode={ClipMode.Selection} selected={currentMode === ClipMode.Selection}
			onModeSelected={this.onModeSelected.bind(this)}
			tooltipText={Localization.getLocalizedString("WebClipper.ClipType.Selection.Button.Tooltip")}/>;
	}

	private getBookmarkModeButton(currentMode: ClipMode) {
		if (this.props.clipperState.pageInfo.rawUrl.indexOf("file:///") === 0) {
			return undefined;
		}
		return <ModeButton
			imgSrc={ExtensionUtils.getImageResourceUrl("bookmark.png")}
			label={Localization.getLocalizedString("WebClipper.ClipType.Bookmark.Button")}
			myMode={ClipMode.Bookmark} selected={currentMode === ClipMode.Bookmark}
			onModeSelected={this.onModeSelected.bind(this)}
			tooltipText={Localization.getLocalizedString("WebClipper.ClipType.Bookmark.Button.Tooltip")}/>;
	}

	public render() {
		let currentMode = this.props.clipperState.currentMode.get();

		return (
			<div style={Localization.getFontFamilyAsStyle(Localization.FontFamily.Semilight)} role="listbox" onkeydown={this.handleKeydown}>
				{ this.getScreenReaderOnlyElementThatAnnouncesCurrentMode(currentMode)}
				{ this.getFullPageModeButton(currentMode) }
				{ this.getRegionModeButton(currentMode) }
				{ this.getAugmentationModeButton(currentMode) }
				{ this.getSelectionModeButton(currentMode) }
				{ this.getBookmarkModeButton(currentMode) }
				{ this.getPdfModeButton(currentMode) }
			</div>
		);
	}
}

let component = ModeButtonSelectorClass.componentize();
export {component as ModeButtonSelector};
