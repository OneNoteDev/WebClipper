import {Localization} from "../../localization/localization";
import {Rtl} from "../../localization/rtl";

import {Constants} from "../../constants";
import {OperationResult} from "../../operationResult";
import {PdfPreviewInfo} from "../../previewInfo";
import {StringUtils} from "../../stringUtils";

import {ExtensionUtils} from "../../extensions/extensionUtils";

import {ComponentBase} from "../componentBase";
import {ClipperStateProp} from "../clipperState";
import {Status} from "../status";

import {AnimationHelper} from "../animations/animationHelper";
import {AnimationState} from "../animations/animationState";
import {AnimationStrategy} from "../animations/animationStrategy";
import {FadeInAnimationStrategy} from "../animations/fadeInAnimationStrategy";

import {Popover} from "./popover";

import * as _ from "lodash";

interface PdfClipOptionsState {
	moreOptionsOpened?: boolean;
};

class PdfClipOptionsClass extends ComponentBase<PdfClipOptionsState, ClipperStateProp> {
	private static textAreaListenerAttached = false;

	private hiddenOptionsAnimationStrategy: AnimationStrategy;

	constructor(props: ClipperStateProp) {
		super(props);
		if (!PdfClipOptionsClass.textAreaListenerAttached) {
			this.addTextAreaListener();
			PdfClipOptionsClass.textAreaListenerAttached = true;
		}
		this.hiddenOptionsAnimationStrategy = new FadeInAnimationStrategy({
			extShouldAnimateIn: () => { return this.state.moreOptionsOpened; },
			extShouldAnimateOut: () => { return !this.state.moreOptionsOpened; }
		});
	}

	getInitialState(): PdfClipOptionsState {
		return {
			moreOptionsOpened: false
		};
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
			<div id={Constants.Ids.radioAllPagesLabel} className="pdf-control" {...this.enableInvoke(this.onSelectionChange, 60, true) }>
				<div className="pdf-indicator pdf-radio-indicator">
					{pdfPreviewInfo.allPages ? <div className={Constants.Classes.radioIndicatorFill}></div> : undefined}
				</div>
				<div className="pdf-label-margin">
					<span className="pdf-label">{Localization.getLocalizedString("WebClipper.Label.PdfAllPagesRadioButton")}</span>
				</div>
			</div>
		);
	}

	getPageRangeRadioElement(): any {
		let pdfPreviewInfo = this.props.clipperState.pdfPreviewInfo;

		let invalidClassName = pdfPreviewInfo.shouldShowPopover ? "invalid" : "";
		return (
			<div id={Constants.Ids.radioPageRangeLabel} className="pdf-control" {...this.enableInvoke(this.onSelectionChange, 61, false) }>
				<div className="pdf-indicator pdf-radio-indicator">
					{!pdfPreviewInfo.allPages ? <div className={Constants.Classes.radioIndicatorFill}></div> : undefined}
				</div>
				<input
					type="text"
					id={Constants.Ids.rangeInput}
					className={invalidClassName}
					placeholder="e.g. 1-5, 7, 9-12"
					onfocus={this.onTextInputFocus.bind(this)}
					value={this.props.clipperState.pdfPreviewInfo.selectedPageRange} {...this.enableInvoke(this.onSelectionChange, 62, false) }>
				</input>
				{pdfPreviewInfo.shouldShowPopover ?
					<Popover
						referenceElementId={Constants.Ids.rangeInput}
						placement={Rtl.isRtl(navigator.language || (navigator as any).userLanguage) ? "left" : "right"}
						content={this.getErrorMessageForInvalidPageRange()}
						classNames={[Constants.Classes.popover]}
						arrowClassNames={[Constants.Classes.popoverArrow]}
						modifiersIgnored={["flip"]}
						removeOnDestroy={true} /> : undefined}
			</div>
		);
	}

	private getErrorMessageForInvalidPageRange(): string {
		const pdfPreviewInfo = this.props.clipperState.pdfPreviewInfo;
		let parsePageRangeOperation = StringUtils.parsePageRange(pdfPreviewInfo.selectedPageRange, this.props.clipperState.pdfResult.data.get().pdf.numPages());
		if (parsePageRangeOperation.status === OperationResult.Succeeded) {
			throw Error("Given that shouldShowPopover is true, parsing the pageRange should never succeed: PageRange: " + pdfPreviewInfo.selectedPageRange);
		}

		return Localization.getLocalizedString("WebClipper.Popover.PdfInvalidPageRange").replace("{0}", parsePageRangeOperation.result as string);
	}

	getDistributePagesCheckbox(): any {
		let pdfPreviewInfo = this.props.clipperState.pdfPreviewInfo;
		return (
			<div className="pdf-control" id={Constants.Ids.checkboxToDistributePages} {...this.enableInvoke(this.onDistributionChange, 65, !pdfPreviewInfo.shouldDistributePages) }>
				<div className="pdf-indicator pdf-checkbox-indicator"></div>
				{pdfPreviewInfo.shouldDistributePages ? <div className={Constants.Classes.checkboxCheck}></div> : ""}
				<div className="pdf-label-margin">
					<span className="pdf-label">{Localization.getLocalizedString("WebClipper.Label.PdfDistributePagesCheckbox")}</span>
				</div>
			</div>
		);
	}

	getAttachmentCheckbox(): any {
		const pdfHasSucceeded = this.props.clipperState.pdfResult.status === Status.Succeeded;
		const pdfIsTooLarge = pdfHasSucceeded && this.props.clipperState.pdfResult.data.get().byteLength > Constants.Settings.maximumMimeSizeLimit;
		const disableCheckbox = pdfIsTooLarge || !pdfHasSucceeded;

		if (pdfIsTooLarge) {
			return this.getAttachmentIsTooLargeCheckbox();
		} else {
			return this.getAttachPdfCheckbox(pdfHasSucceeded);
		}
	}

	getAttachmentIsTooLargeCheckbox(): any {
		let pdfPreviewInfo = this.props.clipperState.pdfPreviewInfo;
		return (
			<div className="pdf-control" id={Constants.Ids.pdfIsTooLargeToAttachIndicator} {...this.enableInvoke(this.onCheckboxChange, 67, !pdfPreviewInfo.shouldAttachPdf) }>
				<img className="warning-image" src={ExtensionUtils.getImageResourceUrl("warning.png")}></img>
				<div className="pdf-label-margin">
					<span className="pdf-label disabled">{Localization.getLocalizedString("WebClipper.Label.PdfTooLargeToAttach")}</span>
				</div>
			</div>
		);
	}

	getAttachPdfCheckbox(clickable: boolean): any {
		return clickable ? this.getEnabledAttachmentCheckbox() : this.getDisabledAttachmentCheckbox();
	}

	// TODO: Programmaticaly remove the enableInvoke so that we can collapse the attachmentCheckbox functions into one
	getEnabledAttachmentCheckbox() {
		let pdfPreviewInfo = this.props.clipperState.pdfPreviewInfo;

		return (
			<div className="pdf-control" id={Constants.Ids.checkboxToAttachPdf} {...this.enableInvoke(this.onCheckboxChange, 66, !pdfPreviewInfo.shouldAttachPdf) }>
				<div className="pdf-indicator pdf-checkbox-indicator"></div>
				{pdfPreviewInfo.shouldAttachPdf ? <div className={Constants.Classes.checkboxCheck}></div> : ""}
				<div className="pdf-label-margin">
					<span className="pdf-label">{Localization.getLocalizedString("WebClipper.Label.AttachPdfFile") + " "}
						<span className="sub-label">{Localization.getLocalizedString("WebClipper.Label.AttachPdfFileSubText")}</span>
					</span>
				</div>
			</div>
		);
	}

	getDisabledAttachmentCheckbox() {
		const disabledClassName = " disabled";

		return (
			<div className={"pdf-control" + disabledClassName} id={Constants.Ids.checkboxToAttachPdf} tabIndex={66}>
				<div className={"pdf-indicator pdf-checkbox-indicator" + disabledClassName}></div>
				<div className="pdf-label-margin">
					<span className={"pdf-label" + disabledClassName}>{Localization.getLocalizedString("WebClipper.Label.AttachPdfFile") + " "}
						<span className={"sub-label" + disabledClassName}>{Localization.getLocalizedString("WebClipper.Label.AttachPdfFileSubText")}</span>
					</span>
				</div>
			</div>
		);
	}



	private onHiddenOptionsDraw(hiddenOptionsAnimator: HTMLElement) {
		this.hiddenOptionsAnimationStrategy.animate(hiddenOptionsAnimator);

		// If the user is rapidly clicking the More button, we want to cancel the current animation to kick off the next one
		let currentAnimationState = this.hiddenOptionsAnimationStrategy.getAnimationState();
		if (currentAnimationState === AnimationState.GoingOut && this.state.moreOptionsOpened) {
			AnimationHelper.stopAnimationsThen(hiddenOptionsAnimator, () => {
				this.hiddenOptionsAnimationStrategy.setAnimationState(AnimationState.Out);
				this.setState({ });
			});
		}
	}

	render() {
		let expandOptionLabel = this.state.moreOptionsOpened ? Localization.getLocalizedString("WebClipper.Action.Less") : Localization.getLocalizedString("WebClipper.Action.More");
		return (
			<div className="clipOptionsContainer">
				<div className="clipOptionsTitleContainer">
					<span className="clipOptionsTitle">{Localization.getLocalizedString("WebClipper.Label.PdfOptions")}</span>
					<span className="moreClipOptions" id={Constants.Ids.moreClipOptions} {...this.enableInvoke(this.onMoreClicked, 62) }>
						{expandOptionLabel}<img className="arrow" src={ExtensionUtils.getImageResourceUrl("dropdown_arrow.png")} />
					</span>
				</div>
				{this.getAllPagesRadioElement()}
				{this.getPageRangeRadioElement()}
				<div className="hiddenOptionsAnimator" {...this.onElementDraw(this.onHiddenOptionsDraw)}>
					{this.state.moreOptionsOpened ?
						<div className="hiddenOptions">
							{this.getDistributePagesCheckbox()}
							{this.getAttachmentCheckbox()}
						</div> : undefined}
				</div>
			</div>
		);
	}
}

let component = PdfClipOptionsClass.componentize();
export { component as PdfClipOptions };
