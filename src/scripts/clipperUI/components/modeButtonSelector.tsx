import {Constants} from "../../constants";
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
		let buttonSelected: boolean = currentMode === ClipMode.Pdf;

		return {
			imgSrc: ExtensionUtils.getImageResourceUrl("pdf.png"),
			label: Localization.getLocalizedString("WebClipper.ClipType.Pdf.Button"),
			myMode: ClipMode.Pdf,
			selected: buttonSelected,
			onModeSelected: this.onModeSelected.bind(this),
			tooltipText: Localization.getLocalizedString("WebClipper.ClipType.Pdf.Button.Tooltip")
		};
	}

	private getAugmentationModeButton(currentMode: ClipMode) {
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

	private getFullPageModeButton(currentMode: ClipMode) {
		if (this.props.clipperState.pageInfo.contentType === OneNoteApi.ContentType.EnhancedUrl) {
			return undefined;
		}
		let buttonSelected: boolean = currentMode === ClipMode.FullPage;

		return {
			imgSrc: ExtensionUtils.getImageResourceUrl("fullpage.png"),
			label: Localization.getLocalizedString("WebClipper.ClipType.ScreenShot.Button"),
			myMode: ClipMode.FullPage,
			selected: buttonSelected,
			onModeSelected: this.onModeSelected.bind(this),
			tooltipText: Localization.getLocalizedString("WebClipper.ClipType.ScreenShot.Button.Tooltip")
		};
	}

	private getRegionModeButton(currentMode: ClipMode) {
		let enableRegionClipping = this.props.clipperState.injectOptions && this.props.clipperState.injectOptions.enableRegionClipping;
		let contextImageModeUsed = this.props.clipperState.invokeOptions && this.props.clipperState.invokeOptions.invokeMode === InvokeMode.ContextImage;

		if (!enableRegionClipping && !contextImageModeUsed) {
			return undefined;
		}
		let buttonSelected: boolean = currentMode === ClipMode.Region;

		return {
			imgSrc: ExtensionUtils.getImageResourceUrl("region.png"),
			label: Localization.getLocalizedString(this.getRegionModeButtonLabel()),
			myMode: ClipMode.Region,
			selected: buttonSelected,
			onModeSelected: this.onModeSelected.bind(this),
			tooltipText: Localization.getLocalizedString("WebClipper.ClipType.MultipleRegions.Button.Tooltip")
		};
	}

	private getRegionModeButtonLabel(): string {
		return "WebClipper.ClipType.Region.Button";
	}

	private getSelectionModeButton(currentMode: ClipMode) {
		if (this.props.clipperState.invokeOptions.invokeMode !== InvokeMode.ContextTextSelection) {
			return undefined;
		}
		let buttonSelected: boolean = currentMode === ClipMode.Selection;

		return {
			imgSrc: ExtensionUtils.getImageResourceUrl("select.png"),
			label: Localization.getLocalizedString("WebClipper.ClipType.Selection.Button"),
			myMode: ClipMode.Selection,
			selected: buttonSelected,
			onModeSelected: this.onModeSelected.bind(this),
			tooltipText: Localization.getLocalizedString("WebClipper.ClipType.Selection.Button.Tooltip")
		};
	}

	private getBookmarkModeButton(currentMode: ClipMode) {
		if (this.props.clipperState.pageInfo.rawUrl.indexOf("file:///") === 0) {
			return undefined;
		}
		let buttonSelected: boolean = currentMode === ClipMode.Bookmark;

		return {
			imgSrc: ExtensionUtils.getImageResourceUrl("bookmark.png"),
			label: Localization.getLocalizedString("WebClipper.ClipType.Bookmark.Button"),
			myMode: ClipMode.Bookmark,
			selected: buttonSelected,
			onModeSelected: this.onModeSelected.bind(this),
			tooltipText: Localization.getLocalizedString("WebClipper.ClipType.Bookmark.Button.Tooltip")
		};
	}

	private getListOfButtons() {
		let currentMode = this.props.clipperState.currentMode.get();

		let targets = [
			this.getFullPageModeButton(currentMode),
			this.getRegionModeButton(currentMode),
			this.getAugmentationModeButton(currentMode),
			this.getSelectionModeButton(currentMode),
			this.getBookmarkModeButton(currentMode),
			this.getPdfModeButton(currentMode),
		];

		let buttons = [
			this.getScreenReaderOnlyElementThatAnnouncesCurrentMode(currentMode),
		];

		if (targets) {
			let onPage = targets.filter(attributes => attributes !== undefined);
			for (let attributes of onPage) {
				if (attributes === undefined) {
					return undefined;
				}
				let ariaPos = onPage.indexOf(attributes) + 1;
				buttons.push( <ModeButton imgSrc={attributes.imgSrc} label={attributes.label} myMode={attributes.myMode} selected={attributes.selected} onModeSelected={attributes.onModeSelected} tooltipText={attributes.tooltipText} aria-setsize={onPage.length.toString()} aria-posinset={ariaPos.toString()} tabIndex={attributes.selected ? 40 : "" } /> );
			}
			return buttons;
		}
	}

	public render() {

		return (
			<div style={Localization.getFontFamilyAsStyle(Localization.FontFamily.Semilight)} role="listbox">
				{ this.getListOfButtons() }
			</div>
		);
	}
}

let component = ModeButtonSelectorClass.componentize();
export {component as ModeButtonSelector};
