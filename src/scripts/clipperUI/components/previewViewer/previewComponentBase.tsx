import * as _ from "lodash";
import {ClientType} from "../../../clientType";
import {Constants} from "../../../constants";
import {Localization} from "../../../localization/localization";
import {PreviewGlobalInfo} from "../../../previewInfo";
import {ClipMode} from "../../clipMode";
import {ClipperStateProp} from "../../clipperState";
import {ComponentBase} from "../../componentBase";
import {Status} from "../../status";
import {AnnotationInput} from "../annotationInput";

export abstract class PreviewComponentBase<TState, TProps extends ClipperStateProp>
	extends ComponentBase<TState, TProps> {

	private static textAreaListenerAttached = false;

	render() {
		if (!PreviewComponentBase.textAreaListenerAttached) {
			this.addTextAreaListener();
			PreviewComponentBase.textAreaListenerAttached = true;
		}

		let contentTitle = this.getTitleTextForCurrentStatus();
		let contentBody = this.getContentBodyForCurrentStatus();

		let editableTitleEnabled = this.props.clipperState.injectOptions && this.props.clipperState.injectOptions.enableEditableTitle;
		let titleIsEditable = editableTitleEnabled && this.getStatus() === Status.Succeeded &&
			contentTitle === this.props.clipperState.previewGlobalInfo.previewTitleText;

		let fontFamilyString = (this.props.clipperState.previewGlobalInfo.serif) ? "WebClipper.FontFamily.Preview.SerifDefault" : "WebClipper.FontFamily.Preview.SansSerifDefault";
		let previewStyle = {
			fontFamily: Localization.getLocalizedString(fontFamilyString),
			fontSize: this.props.clipperState.previewGlobalInfo.fontSize.toString() + "px"
		};

		let statusForCurrentMode = this.getStatus();
		let inProgressClassIfApplicable = statusForCurrentMode === Status.InProgress ? " in-progress" : "";

		// In IE, height: auto will result in a height of 0 so we have to set it to 100% like the other modes
		let previewInnerContainerClass = this.props.clipperState.clientInfo.clipperType === ClientType.Bookmarklet ? "" : this.getPreviewInnerContainerClass();

		return (
			<div id={Constants.Ids.previewOuterContainer}
				style={Localization.getFontFamilyAsStyle(Localization.FontFamily.Regular)}>
				<div id={Constants.Ids.previewInnerWrapper}>
					<div id={Constants.Ids.previewInnerContainer} className={previewInnerContainerClass}>
						<div id={Constants.Ids.previewOptionsContainer}>
							{this.getHeader()}
						</div>
						<div id={Constants.Ids.previewContentContainer}
							className={inProgressClassIfApplicable + " " + this.getPreviewContentContainerClass()}>
							{this.isTitleEnabled() ? <div id={Constants.Ids.previewHeaderContainer}>
								{this.getPreviewTitle(contentTitle, titleIsEditable, inProgressClassIfApplicable)}
								{this.getPreviewSubtitle()}
							</div> : ""}
							<div
								style={previewStyle}
								id={Constants.Ids.previewBody}
								className={inProgressClassIfApplicable + " " + this.getPreviewBodyClass()}
								config={this.getPreviewBodyConfig.bind(this)}>
								{contentBody}
							</div>
						</div>
					</div>
				</div>
			</div>
		);
	}

	protected abstract getContentBodyForCurrentStatus(): any[];

	protected abstract getHeader(): any;

	protected abstract getStatus(): Status;

	protected abstract getTitleTextForCurrentStatus(): string;

	/**
	 * Returns a config callback that should be added to the preview body, and is meant to be
	 * overridden by child classes on a per-need basis
	 */
	protected getPreviewBodyConfig(): any {
		return undefined;
	}

	/**
	 * Returns a class string that should be added to the preview body, and is meant to be
	 * overridden by child classes on a per-need basis
	 */
	protected getPreviewBodyClass(): string {
		return "";
	}

	/**
	 * Returns a class string that should be added to the preview content container
	 * and is meant to be overriden by child classes on a per-need basis
	 */
	protected getPreviewContentContainerClass(): string {
		return "";
	}

	/**
	 * Returns a class string that should be added to the preview inner container
	 * and is meant to be overriden by child classes on a per-need basis
	 */
	protected getPreviewInnerContainerClass(): string {
		return "";
	}

	// Can be overriden by child classes to disable the title
	protected isTitleEnabled(): boolean {
		return true;
	}

	private addTextAreaListener() {
		document.addEventListener("input", (event) => {
			let element = event.target;
			let previewHeaderInput = document.getElementById(Constants.Ids.previewHeaderInput) as HTMLTextAreaElement;
			if (!!element && element === previewHeaderInput) {
				this.handleTitleChange(previewHeaderInput.value);
			}
		});
	}

	private handleTitleChange(newTitleText: string) {
		_.assign(_.extend(this.props.clipperState.previewGlobalInfo, {
			previewTitleText: newTitleText
		} as PreviewGlobalInfo), this.props.clipperState.setState);
	}

	private getPreviewTitle(contentTitle: string, titleIsEditable: boolean, inProgressClassIfApplicable: string): any {
		if (this.props.clipperState.currentMode.get() !== ClipMode.Bookmark) {
			return (
				<div id={Constants.Ids.previewTitleContainer}>
					<pre className={Constants.Classes.textAreaInputMirror}><span>{contentTitle}</span><br/></pre>
					<textarea
						{...this.enableInvoke(undefined, 200)}
						rows="1"
						id={Constants.Ids.previewHeaderInput}
						aria-label={Localization.getLocalizedString("WebClipper.Accessibility.ScreenReader.InputBoxToChangeTitleOfOneNotePage")}
						className={!titleIsEditable ? Constants.Classes.textAreaInput + inProgressClassIfApplicable : Constants.Classes.textAreaInput}
						value={contentTitle}
						readOnly={!titleIsEditable}>
					</textarea>
				</div>
			);
		}
	}

	private getPreviewSubtitle(): any {
		let sourceUrlCitationPrefix = Localization.getLocalizedString("WebClipper.FromCitation")
			.replace("{0}", ""); // TODO can we change this loc string to remove the {0}?

		let sourceUrl = this.props.clipperState.pageInfo ? this.props.clipperState.pageInfo.rawUrl : "";

		return (
			<div id={Constants.Ids.previewSubtitleContainer}>
				{this.props.clipperState.injectOptions && this.props.clipperState.injectOptions.enableAddANote ?
					<AnnotationInput clipperState={this.props.clipperState}/>
					: undefined}
				{this.props.clipperState.currentMode.get() !== ClipMode.Bookmark ?
					<div id={Constants.Ids.previewUrlContainer} tabIndex={220}>
						<span aria-label={sourceUrlCitationPrefix}>{sourceUrlCitationPrefix}</span>
						<a  tabIndex={225} href={sourceUrl} target="_blank" aria-label={sourceUrl} title={sourceUrl}>{sourceUrl}</a>
					</div>
					: undefined}
			</div>
		);
	}
}
