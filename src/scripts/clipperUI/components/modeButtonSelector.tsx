import {Constants} from "../../constants";
import {AugmentationHelper} from "../../contentCapture/augmentationHelper";
import {ExtensionUtils} from "../../extensions/extensionUtils";
import {InvokeMode} from "../../extensions/invokeOptions";
import {Localization} from "../../localization/localization";
import {ClipMode} from "../clipMode";
import {ClipperStateProp} from "../clipperState";
import {ComponentBase} from "../componentBase";
import {ModeButton, PropsForModeElementNoAriaGrouping} from "./modeButton";

class ModeButtonSelectorClass extends ComponentBase<{}, ClipperStateProp> {
	onModeSelected(newMode: ClipMode) {
		this.props.clipperState.setState({
			currentMode: this.props.clipperState.currentMode.set(newMode)
		});
	};

	private getScreenReaderThatAnnouncesCurrentModeProps(currentMode: ClipMode) {
		let stringToTellUserModeHasChanged = Localization.getLocalizedString("WebClipper.Accessibility.ScreenReader.CurrentModeHasChanged");
		stringToTellUserModeHasChanged = stringToTellUserModeHasChanged.replace("{0}", ClipMode[currentMode]);

		return (
			<div aria-live="assertive" aria-relevant="text" className={Constants.Classes.srOnly}>{stringToTellUserModeHasChanged}</div>
		);
	}

	private getPdfButtonProps(currentMode: ClipMode): PropsForModeElementNoAriaGrouping {
		if (this.props.clipperState.pageInfo.contentType !== OneNoteApi.ContentType.EnhancedUrl) {
			return undefined;
		}

		return {
			imgSrc: ExtensionUtils.getImageResourceUrl("pdf.png"),
			label: Localization.getLocalizedString("WebClipper.ClipType.Pdf.Button"),
			myMode: ClipMode.Pdf,
			selected: currentMode === ClipMode.Pdf,
			onModeSelected: this.onModeSelected.bind(this),
			tooltipText: Localization.getLocalizedString("WebClipper.ClipType.Pdf.Button.Tooltip")
		};
	}

	private getAugmentationButtonProps(currentMode: ClipMode): PropsForModeElementNoAriaGrouping {
		if (this.props.clipperState.pageInfo.contentType === OneNoteApi.ContentType.EnhancedUrl) {
			return undefined;
		}

		let augmentationType: string = AugmentationHelper.getAugmentationType(this.props.clipperState);
		let augmentationLabel: string = Localization.getLocalizedString("WebClipper.ClipType." + augmentationType + ".Button");
		let augmentationTooltip = Localization.getLocalizedString("WebClipper.ClipType.Button.Tooltip").replace("{0}", augmentationLabel);
		let buttonSelected: boolean = currentMode === ClipMode.Augmentation;

		return {
			imgSrc: ExtensionUtils.getImageResourceUrl(augmentationType + ".png"),
			label: augmentationLabel,
			myMode: ClipMode.Augmentation,
			selected: buttonSelected,
			onModeSelected: this.onModeSelected.bind(this),
			tooltipText: augmentationTooltip
		};
	}

	private getFullPageButtonProps(currentMode: ClipMode): PropsForModeElementNoAriaGrouping {
		if (this.props.clipperState.pageInfo.contentType === OneNoteApi.ContentType.EnhancedUrl) {
			return undefined;
		}

		return {
			imgSrc: ExtensionUtils.getImageResourceUrl("fullpage.png"),
			label: Localization.getLocalizedString("WebClipper.ClipType.ScreenShot.Button"),
			myMode: ClipMode.FullPage,
			selected: currentMode === ClipMode.FullPage,
			onModeSelected: this.onModeSelected.bind(this),
			tooltipText: Localization.getLocalizedString("WebClipper.ClipType.ScreenShot.Button.Tooltip")
		};
	}

	private getRegionButtonProps(currentMode: ClipMode): PropsForModeElementNoAriaGrouping {
		let enableRegionClipping = this.props.clipperState.injectOptions && this.props.clipperState.injectOptions.enableRegionClipping;
		let contextImageModeUsed = this.props.clipperState.invokeOptions && this.props.clipperState.invokeOptions.invokeMode === InvokeMode.ContextImage;

		if (!enableRegionClipping && !contextImageModeUsed) {
			return undefined;
		}

		return {
			imgSrc: ExtensionUtils.getImageResourceUrl("region.png"),
			label: Localization.getLocalizedString(this.getRegionButtonLabel()),
			myMode: ClipMode.Region,
			selected: currentMode === ClipMode.Region,
			onModeSelected: this.onModeSelected.bind(this),
			tooltipText: Localization.getLocalizedString("WebClipper.ClipType.MultipleRegions.Button.Tooltip")
		};
	}

	private getRegionButtonLabel(): string {
		return "WebClipper.ClipType.Region.Button";
	}

	private getSelectionButtonProps(currentMode: ClipMode): PropsForModeElementNoAriaGrouping {
		if (this.props.clipperState.invokeOptions.invokeMode !== InvokeMode.ContextTextSelection) {
			return undefined;
		}

		return {
			imgSrc: ExtensionUtils.getImageResourceUrl("select.png"),
			label: Localization.getLocalizedString("WebClipper.ClipType.Selection.Button"),
			myMode: ClipMode.Selection,
			selected: currentMode === ClipMode.Selection,
			onModeSelected: this.onModeSelected.bind(this),
			tooltipText: Localization.getLocalizedString("WebClipper.ClipType.Selection.Button.Tooltip")
		};
	}

	private getBookmarkButtonProps(currentMode: ClipMode): PropsForModeElementNoAriaGrouping {
		if (this.props.clipperState.pageInfo.rawUrl.indexOf("file:///") === 0) {
			return undefined;
		}

		return {
			imgSrc: ExtensionUtils.getImageResourceUrl("bookmark.png"),
			label: Localization.getLocalizedString("WebClipper.ClipType.Bookmark.Button"),
			myMode: ClipMode.Bookmark,
			selected: currentMode === ClipMode.Bookmark,
			onModeSelected: this.onModeSelected.bind(this),
			tooltipText: Localization.getLocalizedString("WebClipper.ClipType.Bookmark.Button.Tooltip")
		};
	}

	private getListOfButtons(): HTMLElement[] {
		let currentMode = this.props.clipperState.currentMode.get();

		let buttonProps = [
			this.getFullPageButtonProps(currentMode),
			this.getRegionButtonProps(currentMode),
			this.getAugmentationButtonProps(currentMode),
			this.getSelectionButtonProps(currentMode),
			this.getBookmarkButtonProps(currentMode),
			this.getPdfButtonProps(currentMode),
		];

		let visibleButtons = [];

		let propsForVisibleButtons = buttonProps.filter(attributes => !!attributes);
		for (let i = 0; i < propsForVisibleButtons.length; i++) {
			let attributes = propsForVisibleButtons[i];
			let ariaPos = i + 1;
			visibleButtons.push(<ModeButton {...attributes} aria-setsize={propsForVisibleButtons.length} aria-posinset={ariaPos} tabIndex={attributes.selected ? 40 : -1 } />);
		}
		return visibleButtons;
	}

	public render() {
		let currentMode = this.props.clipperState.currentMode.get();

		return (
			<div>
				{this.getScreenReaderThatAnnouncesCurrentModeProps(currentMode)}
				<div style={Localization.getFontFamilyAsStyle(Localization.FontFamily.Semilight)} role="listbox">
					{ this.getListOfButtons() }
				</div>
			</div>
		);
	}
}

let component = ModeButtonSelectorClass.componentize();
export {component as ModeButtonSelector};
