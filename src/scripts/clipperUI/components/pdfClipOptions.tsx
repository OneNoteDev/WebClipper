import {Localization} from "../../localization/localization";

import {Constants} from "../../constants";
import {PdfPreviewInfo} from "../../previewInfo";
import {StringUtils} from "../../stringUtils";

import {ExtensionUtils} from "../../extensions/extensionUtils";

import {ComponentBase } from "../componentBase";
import {ClipperStateProp} from "../clipperState";
import {Status, OperationResult} from "../status";

import {Popover} from "./popper";

import * as _ from "lodash";
import * as popperJS from "popper.js";

interface PdfClipOptionsState {
	moreOptionsOpened?: boolean;
};

class PdfClipOptionsClass extends ComponentBase<PdfClipOptionsState, ClipperStateProp> {
	private static textAreaListenerAttached = false;
	private static popover: popperJS;

	getInitialState(): PdfClipOptionsState {
		return {
			moreOptionsOpened: false
		};
	}

	constructor(props: ClipperStateProp) {
		super(props);
		if (!PdfClipOptionsClass.textAreaListenerAttached) {
			this.addTextAreaListener();
			PdfClipOptionsClass.textAreaListenerAttached = true;
		}
	}

	private addTextAreaListener() {
		document.addEventListener("input", (event) => {
			let element = event.target;
			let pageRangeField = document.getElementById(Constants.Ids.rangeInput) as HTMLTextAreaElement;
			if (!!element && element === pageRangeField) {
				this.onTextChange(pageRangeField.value);
			}
		});
	}

	onCheckboxChange(checked: boolean): void {
		const pdfHasSucceeded = this.props.clipperState.pdfResult.status === Status.Succeeded;
		const pdfIsTooLarge = pdfHasSucceeded && this.props.clipperState.pdfResult.data.get().byteLength > Constants.Settings.maximumMimeSizeLimit;

		if (!pdfHasSucceeded || pdfIsTooLarge) {
			return;
		}

		_.assign(_.extend(this.props.clipperState.pdfPreviewInfo, {
			shouldAttachPdf: checked
		} as PdfPreviewInfo), this.props.clipperState.setState);
	}

	onDistributionChange(checked: boolean): void {
		_.assign(_.extend(this.props.clipperState.pdfPreviewInfo, {
			shouldDistributePages: checked
		} as PdfPreviewInfo), this.props.clipperState.setState);
	}

	onSelectionChange(selection: boolean) {
		_.assign(_.extend(this.props.clipperState.pdfPreviewInfo, {
			allPages: selection,
			shouldShowPopover: false
		} as PdfPreviewInfo), this.props.clipperState.setState);
	}

	onTextChange(text: string) {
		_.assign(_.extend(this.props.clipperState.pdfPreviewInfo, {
			selectedPageRange: text
		} as PdfPreviewInfo), this.props.clipperState.setState);
	}

	onMoreClicked(): void {
		this.setState({
			moreOptionsOpened: !this.state.moreOptionsOpened
		});
	}

	onTextInputFocus(): void {
		if (this.props.clipperState.pdfPreviewInfo.shouldShowPopover) {
			_.assign(_.extend(this.props.clipperState.pdfPreviewInfo, {
				shouldShowPopover: false
			} as PdfPreviewInfo), this.props.clipperState.setState);
		};
	}

	// TODO These radio elements are repeat code
	getAllPagesRadioElement(): any {
		let pdfPreviewInfo = this.props.clipperState.pdfPreviewInfo;
		return (
			<div id={Constants.Ids.radioAllPagesLabel} class="pdf-control" {...this.enableInvoke(this.onSelectionChange, 60, true) }>
				<div class="pdf-indicator pdf-radio-indicator">
					{pdfPreviewInfo.allPages ? <div class={Constants.Classes.radioIndicatorFill}></div> : ""}
				</div>
				<span class="pdf-label">{Localization.getLocalizedString("WebClipper.Preview.Header.PdfAllPagesRadioButtonLabel")}</span>
			</div>
		);
	}

	getPageRangeRadioElement(): any {
		let pdfPreviewInfo = this.props.clipperState.pdfPreviewInfo;

		let invalidClassName = pdfPreviewInfo.shouldShowPopover ? "invalid" : "";
		return (
			<div id={Constants.Ids.radioPageRangeLabel} class="pdf-control" {...this.enableInvoke(this.onSelectionChange, 61, false) }>
				<div class="pdf-indicator pdf-radio-indicator">
					{!pdfPreviewInfo.allPages ? <div class={Constants.Classes.radioIndicatorFill}></div> : ""}
				</div>
				{!pdfPreviewInfo.allPages ?
					<input
						type="text"
						id={Constants.Ids.rangeInput}
						class={invalidClassName}
						placeholder="e.g. 1-5, 7, 9-12"
						onfocus={this.onTextInputFocus.bind(this)}
						value={this.props.clipperState.pdfPreviewInfo.selectedPageRange} {...this.enableInvoke(this.onSelectionChange, 62, false) }>
					</input>
					: <span class="pdf-label">{Localization.getLocalizedString("WebClipper.Preview.Header.PdfPageRangeRadioButtonLabel")}</span>}
				{pdfPreviewInfo.shouldShowPopover ?
					<Popover
						referenceElementId={Constants.Ids.rangeInput}
						placement="right"
						content={this.getErrorMessageForInvalidPageRange()}
						classNames={[Constants.Classes.popover]}
						arrowClassNames={[Constants.Classes.popoverArrow]}
						modifiersIgnored={["flip"]}
						removeOnDestroy={true} /> : ""}
			</div>
		);
	}

	private getErrorMessageForInvalidPageRange(): string {
		const pdfPreviewInfo = this.props.clipperState.pdfPreviewInfo;
		let parsePageRangeOperation = StringUtils.parsePageRange(pdfPreviewInfo.selectedPageRange, this.props.clipperState.pdfResult.data.get().pdf.numPages());
		if (parsePageRangeOperation.status === OperationResult.Succeeded) {
			throw Error("Given that shouldShowPopover is true, parsing the pageRange should never succeed: PageRange: " + pdfPreviewInfo.selectedPageRange);
		}

		return Localization.getLocalizedString("WebClipper.Preview.Header.PdfInvalidPageRange").replace("{0}", parsePageRangeOperation.result as string);
	}

	getDistributePagesCheckbox(): any {
		let pdfPreviewInfo = this.props.clipperState.pdfPreviewInfo;
		return (
			<div className="pdf-control" id={Constants.Ids.checkboxToDistributePages} {...this.enableInvoke(this.onDistributionChange, 65, !pdfPreviewInfo.shouldDistributePages) }>
				<div class="pdf-indicator pdf-checkbox-indicator"></div>
				{pdfPreviewInfo.shouldDistributePages ? <div className={Constants.Classes.checkboxCheck}></div> : ""}
				<span class="pdf-label">{Localization.getLocalizedString("WebClipper.Preview.Header.PdfDistributePagesCheckboxLabel")}</span>
			</div>
		);
	}

	getAttachmentCheckbox(): any {
		const pdfHasSucceeded = this.props.clipperState.pdfResult.status === Status.Succeeded;
		const pdfIsTooLarge = pdfHasSucceeded && this.props.clipperState.pdfResult.data.get().byteLength > Constants.Settings.maximumMimeSizeLimit;
		const disableCheckbox = pdfIsTooLarge || !pdfHasSucceeded;

		return disableCheckbox ? this.getDisabledAttachmentCheckbox() : this.getEnabledAttachmentCheckbox();
	}

	getDisabledAttachmentCheckbox(): any {
		let pdfPreviewInfo = this.props.clipperState.pdfPreviewInfo;
		return (
			<div className="pdf-control" id={Constants.Ids.checkboxToAttachPdfDisabled} {...this.enableInvoke(this.onCheckboxChange, 67, !pdfPreviewInfo.shouldAttachPdf) }>
				<img class="warning-image" src={ExtensionUtils.getImageResourceUrl("warning.png")}></img>
				<span class="pdf-label disabled">{Localization.getLocalizedString("WebClipper.Preview.Header.PdfTooLargeToAttach")}</span>
			</div>
		);
	}

	getEnabledAttachmentCheckbox(): any {
		let pdfPreviewInfo = this.props.clipperState.pdfPreviewInfo;
		return (
			<div class="pdf-control" id={Constants.Ids.checkboxToAttachPdf} {...this.enableInvoke(this.onCheckboxChange, 66, !pdfPreviewInfo.shouldAttachPdf) }>
				<div class="pdf-indicator pdf-checkbox-indicator"></div>
				{pdfPreviewInfo.shouldAttachPdf ? <div class={Constants.Classes.checkboxCheck}></div> : ""}
				<span class="pdf-label">{Localization.getLocalizedString("WebClipper.Preview.Header.AttachPdfFile")}</span>
			</div>
		);
	}

	render() {
		return (
			<div class="clipOptionsContainer">
				<div class="clipOptionsTitleContainer">
					<span class="clipOptionsTitle">{Localization.getLocalizedString("WebClipper.Options.PdfOptions")}</span>
					<span class="moreClipOptions" id={Constants.Ids.moreClipOptions} {...this.enableInvoke(this.onMoreClicked, 62) }>
						{Localization.getLocalizedString("WebClipper.Action.More")} <img class="arrow" src={ExtensionUtils.getImageResourceUrl("dropdown_arrow.png")} />
					</span>
				</div>
				{this.getAllPagesRadioElement()}
				{this.getPageRangeRadioElement()}
				{this.state.moreOptionsOpened ?
					<div className="hiddenOptions">
						{this.getDistributePagesCheckbox()}
						{this.getAttachmentCheckbox()}
					</div> : undefined}
			</div>
		);
	}
}

let component = PdfClipOptionsClass.componentize();
export { component as PdfClipOptions };
