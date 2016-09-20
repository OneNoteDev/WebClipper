import {Constants} from "../../../constants";
import {PreviewGlobalInfo} from "../../../previewInfo";
import {Utils} from "../../../utils";

import {Highlighter} from "../../../highlighting/highlighter";

import {ClipMode} from "../../clipMode";
import {ClipperStateProp} from "../../clipperState";
import {Status} from "../../status";

import {PreviewComponentBase} from "./previewComponentBase";
import {PreviewViewerAugmentationHeader} from "./previewViewerAugmentationHeader";

export interface EditorPreviewState {
	textHighlighter?: any;
}

/**
 * Child components will inherit the editor header where users can make rich edits to their content, such as highlighting
 * and font changes.
 */
export abstract class EditorPreviewComponentBase<TState extends EditorPreviewState, TProps extends ClipperStateProp>
	extends PreviewComponentBase<TState, TProps> {

	// We use this to force the existence of only one click handler
	private static currentClickHandler;
	private clickHandler = this.handleClick.bind(this);

	constructor(props: TProps) {
		super(props);

		// This is to make sure we cleanly override the old click handler before we attach the current child's one
		if (EditorPreviewComponentBase.currentClickHandler) {
			window.removeEventListener("click", EditorPreviewComponentBase.currentClickHandler);
		}

		// We have to do it this way as we lose old onclick event listeners when we try and attach them to buttons individually
		window.addEventListener("click", this.clickHandler);
		EditorPreviewComponentBase.currentClickHandler = this.clickHandler;
	}

	protected abstract handleBodyChange(newBodyHtml: string);
	protected abstract getHighlightableContentBodyForCurrentStatus(): any;

	// Override
	protected getContentBodyForCurrentStatus() {
		return [
			<div id={Constants.Ids.highlightablePreviewBody}>{this.getHighlightableContentBodyForCurrentStatus()}</div>
		];
	}

	// Override
	protected getPreviewBodyConfig() {
		if (!this.state.textHighlighter) {
			this.setHighlighter();
		}
		if (this.props.clipperState.previewGlobalInfo.highlighterEnabled) {
			this.state.textHighlighter.enable();
		} else {
			this.state.textHighlighter.disable();
		}
	}

	protected getHeader() {
		return <PreviewViewerAugmentationHeader
			toggleHighlight={this.toggleHighlight.bind(this)}
			changeFontFamily={this.changeFontFamily.bind(this)}
			changeFontSize={this.changeFontSize.bind(this)}
			serif={this.props.clipperState.previewGlobalInfo.serif}
			textHighlighterEnabled={this.props.clipperState.previewGlobalInfo.highlighterEnabled} />;
	}

	// Override
	protected getPreviewBodyClass(): string {
		return this.state.textHighlighter && this.state.textHighlighter.isEnabled() ? Constants.Classes.highlightable : "";
	}

	private changeFontFamily(serif: boolean) {
		let previewGlobalInfo = Utils.createUpdatedObject(this.props.clipperState.previewGlobalInfo, {
			serif: serif
		} as PreviewGlobalInfo);

		this.props.clipperState.setState({
			previewGlobalInfo: previewGlobalInfo
		});
	}

	private changeFontSize(increase: boolean) {
		let newFontSize: number = this.props.clipperState.previewGlobalInfo.fontSize + (increase ? 2 : -2);
		if (newFontSize < Constants.Settings.minimumFontSize) {
			newFontSize = Constants.Settings.minimumFontSize;
		} else if (newFontSize > Constants.Settings.maximumFontSize) {
			newFontSize = Constants.Settings.maximumFontSize;
		}

		let previewGlobalInfo = Utils.createUpdatedObject(this.props.clipperState.previewGlobalInfo, {
			fontSize: newFontSize
		} as PreviewGlobalInfo);

		this.props.clipperState.setState({
			previewGlobalInfo: previewGlobalInfo
		});
	}

	private deleteHighlight(timestamp: number) {
		let previewBody = document.getElementById(Constants.Ids.highlightablePreviewBody);
		let highlightedElements = previewBody.querySelectorAll("span.highlighted[data-timestamp='" + timestamp + "']");
		for (let i = 0; i < highlightedElements.length; i++) {
			let current = highlightedElements[i] as HTMLSpanElement;
			let parent = current.parentNode;
			parent.insertBefore(document.createTextNode(current.innerText), current);
			parent.removeChild(current);
		}
		this.handleBodyChange(previewBody.innerHTML);
	}

	private handleClick(event: Event) {
		if (event && event.target) {
			let element = event.target as HTMLElement;
			if (element.className && element.className.indexOf(Constants.Classes.deleteHighlightButton) !== -1) {
				this.deleteHighlight(parseInt(element.getAttribute("data-timestamp"), 10));

				// If the button lives inside an anchor, we don't want to trigger that anchor if the button was clicked
				event.preventDefault();
			}
		}
	}

	private setHighlighter() {
		let addDeleteButton = (range: Range, normalizedHighlights: HTMLSpanElement[]) => {
			if (normalizedHighlights && normalizedHighlights.length > 0) {
				let previewBody = document.getElementById(Constants.Ids.highlightablePreviewBody);

				// We need to get the latest timestamp for normalizing all encompassed highlights later
				let timestamps = normalizedHighlights.map((span: HTMLSpanElement) => parseInt(span.getAttribute("data-timestamp"), 10 /* radix */));
				let timestamp: number = Math.max.apply(undefined, timestamps);

				// The highlight may have intersected another highlight ...
				for (let i = 0; i < normalizedHighlights.length; i++) {
					// ... so we should delete their old delete buttons, and normalize them to the same timestamp
					let oldHighlightTimestamp = normalizedHighlights[i].getAttribute("data-timestamp");
					let oldHighlights = previewBody.querySelectorAll("span." + Constants.Classes.highlighted + "[data-timestamp='" + oldHighlightTimestamp + "']");
					for (let j = 0; j < oldHighlights.length; j++) {
						// Delete old delete buttons
						let oldButtons = oldHighlights[j].querySelectorAll("img." + Constants.Classes.deleteHighlightButton);
						for (let k = 0; k < oldButtons.length; k++) {
							oldButtons[k].parentNode.removeChild(oldButtons[k]);
						}

						// Normalize timestamp
						oldHighlights[j].setAttribute("data-timestamp", "" + timestamp);
					}
				}

				// Find the first instance of the highlight and add the delete button
				let firstHighlighted = previewBody.querySelector("span.highlighted[data-timestamp='" + timestamp + "']");
				if (firstHighlighted) {
					let deleteHighlight = document.createElement("IMG") as HTMLImageElement;
					deleteHighlight.src = Utils.getImageResourceUrl("editoroptions/delete_button.png");
					deleteHighlight.className = Constants.Classes.deleteHighlightButton;
					deleteHighlight.setAttribute("data-timestamp", "" + timestamp);
					firstHighlighted.insertBefore(deleteHighlight, firstHighlighted.childNodes[0]);
				}

				this.handleBodyChange(previewBody.innerHTML);
			}
		};

		let textHighlighter = Highlighter.reconstructInstance(document.getElementById(Constants.Ids.highlightablePreviewBody), {
			color: Constants.Styles.Colors.oneNoteHighlightColor,
			contextClass: Constants.Classes.highlightable,
			onAfterHighlight: addDeleteButton
		});

		this.setState({
			textHighlighter: textHighlighter
		} as any);
	}

	private toggleHighlight() {
		if (!this.props.clipperState.previewGlobalInfo.highlighterEnabled && !window.getSelection().isCollapsed && this.selectionIsInPreviewBody()) {
			// If the user selects something and clicks the highlighter button, we behave traditionally (i.e., perform highlighting, not toggling)
			this.state.textHighlighter.doHighlight();
		} else {
			// No selection found, so we actually toggle the highlighter functionality
			let previewGlobalInfo = Utils.createUpdatedObject(this.props.clipperState.previewGlobalInfo, {
				highlighterEnabled: !this.props.clipperState.previewGlobalInfo.highlighterEnabled,
			} as PreviewGlobalInfo);

			this.props.clipperState.setState({
				previewGlobalInfo: previewGlobalInfo
			});
		}
	}

	// Similarly adopted from: http://stackoverflow.com/questions/8339857/how-to-know-if-selected-text-is-inside-a-specific-div
	private selectionIsInPreviewBody() {
		let previewBody = document.getElementById(Constants.Ids.highlightablePreviewBody);
		if (!previewBody) {
			return false;
		}

		let selection = window.getSelection();
		if (selection.rangeCount > 0) {
			// Check that all range parts belong to the preview body
			for (let i = 0; i < selection.rangeCount; i++) {
				let commonAncestorContainer = selection.getRangeAt(i).commonAncestorContainer;
				if (!(commonAncestorContainer === previewBody || previewBody.contains(commonAncestorContainer))) {
					return false;
				}
			}
			return true;
		}

		return false;
	}
}
