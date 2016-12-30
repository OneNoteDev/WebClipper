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

		let status = this.props.clipperState.selectionResult.status;
		switch (status) {
			case Status.Succeeded:
				let selections = this.props.clipperState.selectionResult.data.htmlSelections;
				for (let i = 0; i < selections.length; i++) {
					// TODO are there any situations where we don't want the user to delete?
					// let onRemove = this.props.clipperState.pageInfo.contentType !== OneNoteApi.ContentType.EnhancedUrl ? this.onRemove.bind(this) : undefined;
					contentBody.push(<HtmlSelection html={selections[i]} index={i} onRemove={this.onRemove.bind(this)} />);
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
		let newSelections = this.props.clipperState.selectionResult.data.htmlSelections;
		newSelections.splice(index, 1);
		// TODO use lodash
		this.props.clipperState.setState({
			selectionResult: {
				status: newSelections.length === 0 ? Status.NotStarted : Status.Succeeded,
				data: {
					htmlSelections: newSelections,
					mode: undefined
				}
			}
		});
	}

	protected getStatus(): Status {
		return this.props.clipperState.selectionResult.status;
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

		// TODO use lodash
		this.props.clipperState.setState({
			selectionResult: {
				status: this.props.clipperState.selectionResult.status,
				data: {
					mode: this.props.clipperState.selectionResult.data.mode,
					htmlSelections: selections
				}
			}
		});
	}
}

let component = SelectionPreview.componentize();
export {component as SelectionPreview};
