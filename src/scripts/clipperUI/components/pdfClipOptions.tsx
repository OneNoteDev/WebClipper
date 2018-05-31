import {Localization} from "../../localization/localization";
import {Constants} from "../../constants";
import {PdfPreviewInfo} from "../../previewInfo";
import {ExtensionUtils} from "../../extensions/extensionUtils";
import {ComponentBase} from "../componentBase";
import {ClipperStateProp} from "../clipperState";
import {Status} from "../status";
import {AnimationHelper} from "../animations/animationHelper";
import {AnimationState} from "../animations/animationState";
import {AnimationStrategy} from "../animations/animationStrategy";
import {FadeInAnimationStrategy} from "../animations/fadeInAnimationStrategy";
import {PdfPageSelectionRadioButton} from "./pdfPageSelectionRadioButton";
import * as _ from "lodash";

interface PdfClipOptionsState {
	moreOptionsOpened?: boolean;
};

class PdfClipOptionsClass extends ComponentBase<PdfClipOptionsState, ClipperStateProp> {

	private hiddenOptionsAnimationStrategy: AnimationStrategy;

	constructor(props: ClipperStateProp) {
		super(props);

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

	onMoreClicked(): void {
		this.setState({
			moreOptionsOpened: !this.state.moreOptionsOpened
		});
	}

	getDistributePagesCheckbox(): any {
		let pdfPreviewInfo = this.props.clipperState.pdfPreviewInfo;
		return (
			<div className="pdf-control" id={Constants.Ids.checkboxToDistributePages} {...this.enableInvoke(this.onDistributionChange, 65, !pdfPreviewInfo.shouldDistributePages) }>
				<div className="pdf-indicator pdf-checkbox-indicator"></div>
				{pdfPreviewInfo.shouldDistributePages ? <div className={Constants.Classes.checkboxCheck}></div> : ""}
				<div className="pdf-label-margin">
					<span className="pdf-label focused">{Localization.getLocalizedString("WebClipper.Label.PdfDistributePagesCheckbox")}</span>
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
		}

		return this.getAttachmentPdfCheckbox(pdfHasSucceeded);
	}

	getAttachmentIsTooLargeCheckbox(): any {
		const disabledClassName = " disabled";

		return (
			<div className={"pdf-control" + disabledClassName} id={Constants.Ids.pdfIsTooLargeToAttachIndicator} tabIndex={67}>
				<img className="warning-image" src={ExtensionUtils.getImageResourceUrl("warning.png")}></img>
				<div className="pdf-label-margin">
					<span className="pdf-label disabled">{Localization.getLocalizedString("WebClipper.Label.PdfTooLargeToAttach")}</span>
				</div>
			</div>
		);
	}

	getAttachmentPdfCheckbox(enabled: boolean) {
		const pdfPreviewInfo = this.props.clipperState.pdfPreviewInfo;
		const disabledClassName = enabled ? "" : " disabled";

		return (
			<div className={"pdf-control" + disabledClassName} id={Constants.Ids.checkboxToAttachPdf} {...this.enableInvoke(enabled ? this.onCheckboxChange : undefined, 66, !pdfPreviewInfo.shouldAttachPdf) }>
				<div className={"pdf-indicator pdf-checkbox-indicator" + disabledClassName}></div>
				{pdfPreviewInfo.shouldAttachPdf ? <div className={Constants.Classes.checkboxCheck}></div> : ""}
				<div className="pdf-label-margin">
					<span className={"pdf-label focused" + disabledClassName}>{Localization.getLocalizedString("WebClipper.Label.AttachPdfFile") + " "}
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
					<span className="moreClipOptions" id={Constants.Ids.moreClipOptions} {...this.enableInvoke(this.onMoreClicked, 60) }>
						{expandOptionLabel}<img className="arrow" src={ExtensionUtils.getImageResourceUrl("dropdown_arrow.png")} />
					</span>
				</div>
				<div role="radiogroup">
					<PdfPageSelectionRadioButton clipperState={this.props.clipperState} />
				</div>
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
