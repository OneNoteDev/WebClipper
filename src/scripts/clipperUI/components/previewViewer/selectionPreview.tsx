import {Constants} from "../../../constants";

import {ClipperStateProp} from "../../clipperState";
import {Status} from "../../status";

import {HtmlSelection} from "../HtmlSelection";

import {EditorPreviewComponentBase, EditorPreviewState} from "./editorPreviewComponentBase";
import {PreviewViewerSelectionHeader} from "./previewViewerSelectionHeader";

class SelectionPreview extends EditorPreviewComponentBase<EditorPreviewState, ClipperStateProp> {
	protected getHighlightableContentBodyForCurrentStatus(): any {
		return this.convertSelectionResultToContentData();
	}

	private convertSelectionResultToContentData(): any[] {
		let contentBody = [];

		let status = this.props.clipperState.selectionStatus;
		switch (status) {
			case Status.Succeeded:
				let selections = this.props.clipperState.selectionPreviewInfo;
				for (let i = 0; i < selections.length; i++) {
					// Rangy does not work on PDFs, so we disallow removal of selections made through the context menu action
					let onRemove = this.props.clipperState.pageInfo.contentType !== OneNoteApi.ContentType.EnhancedUrl ? this.onRemove.bind(this) : undefined;
					contentBody.push(<HtmlSelection html={selections[i]} index={i} onRemove={onRemove} />);
				}
				break;
			default:
			case Status.NotStarted:
			case Status.InProgress:
			case Status.Failed:
				break;
		}

		return contentBody;
	}

	private onRemove(index: number) {
		let newSelections = this.props.clipperState.selectionPreviewInfo;
		newSelections.splice(index, 1);
		if (newSelections.length === 0) {
			this.props.clipperState.setState({ selectionStatus: Status.NotStarted, selectionPreviewInfo: newSelections });
		} else {
			this.props.clipperState.setState({ selectionStatus: Status.Succeeded, selectionPreviewInfo: newSelections });
		}
	}

	protected getStatus(): Status {
		return this.props.clipperState.selectionStatus;
	}

	protected getTitleTextForCurrentStatus(): string {
		return this.props.clipperState.previewGlobalInfo.previewTitleText;
	}

	// Override
	protected getHeader() {
		return <PreviewViewerSelectionHeader
			clipperState={this.props.clipperState}
			toggleHighlight={this.toggleHighlight.bind(this)}
			changeFontFamily={this.changeFontFamily.bind(this)}
			changeFontSize={this.changeFontSize.bind(this)}
			serif={this.props.clipperState.previewGlobalInfo.serif}
			textHighlighterEnabled={this.props.clipperState.previewGlobalInfo.highlighterEnabled} />;
	}

	protected handleBodyChange(newBodyHtml: string) {
		// Parse out individual selections
		let container = document.createElement("div") as HTMLDivElement;
		container.innerHTML = newBodyHtml;
		let selectionElems = document.getElementsByClassName(Constants.Classes.htmlSelectionContent);

		let selections: string[] = [];
		for (let i = 0; i < selectionElems.length; i++) {
			selections.push(selectionElems[i].innerHTML);
		}

		this.props.clipperState.setState({
			selectionPreviewInfo: selections
		});
	}
}

let component = SelectionPreview.componentize();
export {component as SelectionPreview};
