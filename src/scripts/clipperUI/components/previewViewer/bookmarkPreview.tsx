import {Constants} from "../../../constants";
import {ObjectUtils} from "../../../objectUtils";

import {BookmarkResult} from "../../../contentCapture/bookmarkHelper";

import {ExtensionUtils} from "../../../extensions/extensionUtils";

import {Localization} from "../../../localization/localization";

import {ClipperStateProp, DataResult} from "../../clipperState";
import {Status} from "../../status";

import {SpriteAnimation} from "../../components/spriteAnimation";

import {PreviewComponentBase} from "./previewComponentBase";
import {PreviewViewerBookmarkHeader} from "./previewViewerBookmarkHeader";

class BookmarkPreview extends PreviewComponentBase<{}, ClipperStateProp> {
	protected getStatus(): Status {
		return this.props.clipperState.bookmarkResult.status;
	}

	protected getTitleTextForCurrentStatus(): string {
		let failureMessage: string;

		let defaultFailureMessage = Localization.getLocalizedString("WebClipper.Preview.BookmarkModeGenericError");
		let previewStatus = this.getStatus();

		switch (previewStatus) {
			case Status.Succeeded:
				return this.props.clipperState.previewGlobalInfo.previewTitleText;
			case Status.NotStarted:
			case Status.InProgress:
				return Localization.getLocalizedString("WebClipper.Preview.LoadingMessage");
			default:
			case Status.Failed:
				failureMessage = this.props.clipperState.bookmarkResult.data.failureMessage;
				return !!failureMessage ? failureMessage : defaultFailureMessage;
		}
	}

	protected getContentBodyForCurrentStatus(): any[] {
		let previewStatus = this.getStatus();

		switch (previewStatus) {
			case Status.Succeeded:
				return this.convertBookmarkResultToContentData(this.props.clipperState.bookmarkResult.data);
			case Status.NotStarted:
			case Status.InProgress:
				return [this.getSpinner()];
			default:
			case Status.Failed:
				return [];
		}
	}

	protected getSpinner(): any {
		let spinner = <SpriteAnimation
			spriteUrl={ExtensionUtils.getImageResourceUrl("spinner_loop_colored.png") }
			imageHeight={65}
			imageWidth={45}
			totalFrameCount={21}
			loop={true} />;
		return <div className={Constants.Classes.centeredInPreview}>{spinner}</div>;
	}

	protected getHeader(): any {
		return <PreviewViewerBookmarkHeader
			clipperState={this.props.clipperState} />;
	}

	// Override
	protected getPreviewContentContainerClass(): string {
		return Constants.Ids.bookmarkPreviewContentContainer;
	}

	// Override
	protected getPreviewInnerContainerClass(): string {
		return Constants.Ids.bookmarkPreviewInnerContainer;
	}

	private convertBookmarkResultToContentData(result: BookmarkResult): any {
		let url = result.url;

		let secondColumnTdStyle = "";
		if (!ObjectUtils.isNullOrUndefined(result.thumbnailSrc)) {
			secondColumnTdStyle += "padding-left:16px;";
		}

		let urlTdStyle = "white-space:nowrap;overflow:hidden;text-overflow:ellipsis;";
		if (!ObjectUtils.isNullOrUndefined(result.description)) {
			urlTdStyle += "padding-bottom:13px;";
		}

		return (
			<table style="table-layout:auto;border-collapse:collapse;margin-bottom:24px;">
				<tr style="vertical-align:top;">
					{ this.renderThumbnailIfExists(result.thumbnailSrc) }
					<td style={secondColumnTdStyle}>
						<table>
							{ this.renderTitleIfExists(result.title) }
							<tr>
								<td style={urlTdStyle}>
									<a href={url} target="_blank" title={url}>{url}</a>
								</td>
							</tr>
							{ this.renderDescriptionIfExists(result.description) }
						</table>
					</td>
				</tr>
			</table>
		);
	}

	private renderTitleIfExists(title: string) {
		if (!ObjectUtils.isNullOrUndefined(title) && title.length > 0) {
			return (
				<tr>
					<td>
						<h2 style="margin:0;margin-bottom:13px;">{title}</h2>
					</td>
				</tr>
			);
		}
	}

	private renderDescriptionIfExists(description: string) {
		if (!ObjectUtils.isNullOrUndefined(description) && description.length > 0) {
			return (
				<tr>
					<td style="word-wrap:break-word;">{description}</td>
				</tr>
			);
		}
	}

	private renderThumbnailIfExists(thumbnailSrc: string) {
		if (!ObjectUtils.isNullOrUndefined(thumbnailSrc) && thumbnailSrc.length > 0) {
			let thumbnailSize = "112";
			return (
				<td width={thumbnailSize} style="padding-top:9px;">
					<img id={Constants.Ids.bookmarkThumbnail} src={thumbnailSrc} alt="thumbnail" width={thumbnailSize}/>
				</td>
			);
		}
	}
}

let component = BookmarkPreview.componentize();
export {component as BookmarkPreview};
