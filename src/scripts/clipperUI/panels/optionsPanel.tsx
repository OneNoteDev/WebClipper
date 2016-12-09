import {Constants} from "../../constants";
import {OperationResult} from "../../operationResult";
import {StringUtils} from "../../stringUtils";

import {InvokeMode} from "../../extensions/invokeOptions";

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
				_.assign(_.extend(clipperState.pdfPreviewInfo, {
					shouldShowPopover: true
				}), clipperState.setState);
				return;
			}
		}

		this.props.onStartClip();
	}

	render() {
		let clipButtonEnabled = ClipperStateUtilities.clipButtonEnabled(this.props.clipperState);
		let clipButtonContainerClassName = clipButtonEnabled ? "wideButtonContainer" : "wideButtonContainer disabled";
		let clippingOptionsToRender = this.getCurrentClippingOptions();

		return (
			<div className="optionsPanel">
				<ModeButtonSelector clipperState={this.props.clipperState} />
				{clippingOptionsToRender}
				<SectionPicker onPopupToggle={this.props.onPopupToggle.bind(this)} clipperState={this.props.clipperState} />
				<div id={Constants.Ids.clipButtonContainer} className={clipButtonContainerClassName}>
					{clipButtonEnabled
					?	<a id={Constants.Ids.clipButton} className="wideActionButton" {...this.enableInvoke(this.checkOptionsBeforeStartClip.bind(this), 1) }>
							<span className="wideButtonFont"
								style={Localization.getFontFamilyAsStyle(Localization.FontFamily.Semibold)}>
								{Localization.getLocalizedString("WebClipper.Action.Clip")}
							</span>
						</a>
					:	<a id={Constants.Ids.clipButton} className="wideActionButton">
							<span className="wideButtonFont"
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
