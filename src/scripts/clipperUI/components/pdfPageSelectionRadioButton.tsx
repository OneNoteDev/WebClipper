import {ClipperStateProp} from "../clipperState";
import {Constants} from "../../constants";
import {Localization} from "../../localization/localization";
import {PdfPreviewInfo} from "../../previewInfo";
import {Popover} from "./popover";
import * as _ from "lodash";
import {StringUtils} from "../../stringUtils";
import {OperationResult} from "../../operationResult";
import {pdfPageSelectionRadioButtonBase, radioButtonGroup} from "./pdfPageSelectionRadioButtonBase";

class PdfPageSelectionRadioButton extends pdfPageSelectionRadioButtonBase<{}, ClipperStateProp> {
	private static textAreaListenerAttached = false;

	constructor(props: ClipperStateProp) {
		super(props);
		if (!PdfPageSelectionRadioButton.textAreaListenerAttached) {
			this.addTextAreaListener();
			PdfPageSelectionRadioButton.textAreaListenerAttached = true;
		}
	}

	getRadioButtonGroups(): radioButtonGroup[] {
		return [this.getRadioButtons()];
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

	onTextChange(text: string) {
		_.assign(_.extend(this.props.clipperState.pdfPreviewInfo, {
			selectedPageRange: text
		} as PdfPreviewInfo), this.props.clipperState.setState);
	}

	onTextInputFocus(): void {
		if (this.props.clipperState.pdfPreviewInfo.shouldShowPopover) {
			_.assign(_.extend(this.props.clipperState.pdfPreviewInfo, {
				shouldShowPopover: false
			} as PdfPreviewInfo), this.props.clipperState.setState);
		}
	}

	onSelectionChange(selection: boolean) {
		_.assign(_.extend(this.props.clipperState.pdfPreviewInfo, {
			allPages: selection,
			shouldShowPopover: false
		} as PdfPreviewInfo), this.props.clipperState.setState);

		if (!selection) {
			document.getElementById(Constants.Ids.rangeInput).focus();
		}
	}

	private getErrorMessageForInvalidPageRange(): string {
		const pdfPreviewInfo = this.props.clipperState.pdfPreviewInfo;
		let parsePageRangeOperation = StringUtils.parsePageRange(pdfPreviewInfo.selectedPageRange, this.props.clipperState.pdfResult.data.get().pdf.numPages());
		if (parsePageRangeOperation.status === OperationResult.Succeeded) {
			throw Error("Given that shouldShowPopover is true, parsing the pageRange should never succeed: PageRange: " + pdfPreviewInfo.selectedPageRange);
		}

		return Localization.getLocalizedString("WebClipper.Popover.PdfInvalidPageRange").replace("{0}", parsePageRangeOperation.result as string);
	}

	getRadioButtons(): any {
		let pdfPreviewInfo = this.props.clipperState.pdfPreviewInfo;
		let invalidClassName = pdfPreviewInfo.shouldShowPopover ? "invalid" : "";
		let selectedTabIndex = 60;
		let unselectedTabIndex = -1;

		return {
			role: "radiogroup",
			isAriaSet: true,
			innerElements: [
				<div role="radio" id={Constants.Ids.radioAllPagesLabel} className="pdf-control" {...this.enableInvoke(this.onSelectionChange, pdfPreviewInfo.allPages ? selectedTabIndex : unselectedTabIndex, true, undefined, Constants.AriaSet.pdfPageSelection)}>
					<div className={"pdf-indicator pdf-radio-indicator"}>
						{pdfPreviewInfo.allPages ? <div className={Constants.Classes.radioIndicatorFill}></div> : undefined}
					</div>
					<div className="pdf-label-margin">
					<span
						className={"pdf-label" + (pdfPreviewInfo.allPages ? " focused" : "")}>{Localization.getLocalizedString("WebClipper.Label.PdfAllPagesRadioButton")}</span>
					</div>
				</div>,
				<div id={Constants.Ids.radioPageRangeLabel} className="pdf-control" {...this.enableInvoke(this.onSelectionChange, !pdfPreviewInfo.allPages ? selectedTabIndex : unselectedTabIndex, false, undefined, Constants.AriaSet.pdfPageSelection)}>
					<div className={"pdf-indicator pdf-radio-indicator"}>
						{!pdfPreviewInfo.allPages ?
							<div className={Constants.Classes.radioIndicatorFill}></div> : undefined}
					</div>
					<input
					type="text"
					id={Constants.Ids.rangeInput}
					className={invalidClassName + (!pdfPreviewInfo.allPages ? " focused" : "")}
					placeholder="e.g. 1-5, 7, 9-12"
					onFocus={this.onTextInputFocus.bind(this)}
					value={this.props.clipperState.pdfPreviewInfo.selectedPageRange} {...this.enableInvoke(this.onSelectionChange, undefined, false,)}/>
					{pdfPreviewInfo.shouldShowPopover ?
						<Popover
						referenceElementId={Constants.Ids.rangeInput}
						placement="bottom"
						parentId={Constants.Ids.mainController}
						content={this.getErrorMessageForInvalidPageRange()}
						classNames={[Constants.Classes.popover]}
						arrowClassNames={[Constants.Classes.popoverArrow]}
						modifiersIgnored={["flip"]}
						removeOnDestroy={true}/> : undefined}
				</div>
			]
		};
	}
}

let component = PdfPageSelectionRadioButton.componentize();
export {component as PdfPageSelectionRadioButton};
