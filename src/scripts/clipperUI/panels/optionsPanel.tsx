import {Constants} from "../../constants";
import {OperationResult} from "../../operationResult";
import {StringUtils} from "../../stringUtils";
import {Localization} from "../../localization/localization";
import {ModeButtonSelector} from "../components/modeButtonSelector";
import {SectionPicker} from "../components/sectionPicker";
import {ClipMode} from "../clipMode";
import {ClipperStateProp} from "../clipperState";
import {ClipperStateUtilities} from "../clipperStateUtilities";
import {ComponentBase} from "../componentBase";
import {Status} from "../status";
import {PdfClipOptions} from "../components/pdfClipOptions";
import * as _ from "lodash";

export interface OptionsPanelProp extends ClipperStateProp {
	onStartClip: () => void;
	onPopupToggle: (shouldNowBeOpen: boolean) => void;
}

class OptionsPanelClass extends ComponentBase<{}, OptionsPanelProp> {
	getCurrentClippingOptions(): any {
		const currentMode = this.props.clipperState.currentMode.get();
		switch (currentMode) {
			case ClipMode.Pdf:
				return <PdfClipOptions clipperState={this.props.clipperState} />;
			default:
				return undefined;
		}
	}

	checkOptionsBeforeStartClip() {
		const clipperState = this.props.clipperState;
		const pdfPreviewInfo = clipperState.pdfPreviewInfo;

		// If the user is in PDF mode and selected a page range, disallow the clip if it's an invalid range
		if (clipperState.currentMode.get() === ClipMode.Pdf && !pdfPreviewInfo.allPages && clipperState.pdfResult.status === Status.Succeeded) {
			const parsePageRangeOperation = StringUtils.parsePageRange(pdfPreviewInfo.selectedPageRange, clipperState.pdfResult.data.get().pdf.numPages());
			if (parsePageRangeOperation.status !== OperationResult.Succeeded) {
				let newPdfPreviewInfo = _.extend(_.cloneDeep(pdfPreviewInfo), { shouldShowPopover: true });
				clipperState.setState({
					pdfPreviewInfo: newPdfPreviewInfo
				});
				return;
			}
		}

		this.props.onStartClip();
	}

	// This function is passed into Mithril's config property
	// The config property is a function that allows you to hook into 
	// a component's lifecycle such as mounting and un-mounting
	attachClipHotKeyListener(element, isInitialized, context) {
		// If this is the first time we are initializing this element,
		// 	then attach the listener
		if (!isInitialized) {
			let oldOnKeyDown = document.onkeydown;
			document.onkeydown = (ev: KeyboardEvent) => {
				// TODO: KeyboardEvent::which is deprecated but PhantomJs doesn't support
				// 'event constructors', which is necessary to use the recommended KeyboardEvent::key 
				if (ev.altKey && ev.which === Constants.KeyCodes.c) {
					this.checkOptionsBeforeStartClip();
				}

				// Prevent focus on Edge+Narrator from going into the background page by looping focus on our page
				if (ev.shiftKey && ev.keyCode === Constants.KeyCodes.tab) {
					const targetAsAny = ev.target as any;
					if (targetAsAny && targetAsAny.id) {
						const idsThatShouldLoopFocus = [
							Constants.Ids.fullPageButton,
							Constants.Ids.bookmarkButton,
							Constants.Ids.regionButton,
							Constants.Ids.augmentationButton
						];
						if (idsThatShouldLoopFocus.indexOf(targetAsAny.id) !== -1) {
							document.getElementById("closeButton").focus();
							ev.preventDefault();
							ev.stopImmediatePropagation();
							return;
						}
					}
				}
				if (oldOnKeyDown) {
					oldOnKeyDown.call(document, ev);
				}
			};

			// Remove listener when this element is unmounted
			context.onunload = () => {
				document.onkeydown = oldOnKeyDown ? oldOnKeyDown.bind(document) : undefined;
			};
		// There is no else case, since we only care about initializaiton and destruction
		}
	}

	render() {
		let clipButtonEnabled = ClipperStateUtilities.clipButtonEnabled(this.props.clipperState);
		let clipButtonContainerClassName = clipButtonEnabled ? "wideButtonContainer" : "wideButtonContainer disabled";
		let clippingOptionsToRender = this.getCurrentClippingOptions();

		return (
			<div className="optionsPanel" config={this.attachClipHotKeyListener.bind(this)}>
				<ModeButtonSelector clipperState={this.props.clipperState} />
				{clippingOptionsToRender}
				<SectionPicker onPopupToggle={this.props.onPopupToggle.bind(this)} clipperState={this.props.clipperState} />
				<div id={Constants.Ids.clipButtonContainer} className={clipButtonContainerClassName}>
					{clipButtonEnabled
					?	<a id={Constants.Ids.clipButton} className="wideActionButton" {...this.enableInvoke({callback: this.checkOptionsBeforeStartClip.bind(this), tabIndex: 71})} role="button">
							<span className="wideButtonFont buttonTextInHighContrast"
								style={Localization.getFontFamilyAsStyle(Localization.FontFamily.Semibold)}>
								{Localization.getLocalizedString("WebClipper.Action.Clip")}
							</span>
						</a>
					:	<a id={Constants.Ids.clipButton} className="wideActionButton" role="button">
							<span className="wideButtonFont buttonTextInHighContrast"
								style={Localization.getFontFamilyAsStyle(Localization.FontFamily.Semibold)}>
								{Localization.getLocalizedString("WebClipper.Action.Clip")}
							</span>
						</a>}
				</div>
			</div>
		);
	}
}

let component = OptionsPanelClass.componentize();
export {component as OptionsPanel};
