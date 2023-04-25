import {Constants} from "../../../constants";
import {PreviewGlobalInfo} from "../../../previewInfo";

import {ExtensionUtils} from "../../../extensions/extensionUtils";

import {Highlighter} from "../../../highlighting/highlighter";

import {ClipMode} from "../../clipMode";
import {ClipperStateProp} from "../../clipperState";
import {Status} from "../../status";

import {PreviewComponentBase} from "./previewComponentBase";
import {PreviewViewerAugmentationHeader} from "./previewViewerAugmentationHeader";

import * as _ from "lodash";
import { Localization } from "../../../localization/localization";
import { Clipper } from "../../frontEndGlobals";
import * as Log from "../../../logging/log";

export interface EditorPreviewState {
	textHighlighter?: any;
}

/**
 * Child components will inherit the editor header where users can make rich edits to their content, such as highlighting
 * and font changes. Within the preview body element, this component renders a highlightable preview body element underneath
 * it that the highlighter is attached to. Highlighting logic can only take place within this element, and this prevents
 * other types of preview bodies from accidentally providing highlighting functionality.
 */
export abstract class EditorPreviewComponentBase<TState extends EditorPreviewState, TProps extends ClipperStateProp>
	extends PreviewComponentBase<TState, TProps> {

	// We use this to force the existence of only one click handler
	private static currentClickHandler: EventListener;
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
			<div id={Constants.Ids.highlightablePreviewBody} tabindex="0">{this.getHighlightableContentBodyForCurrentStatus()}</div>
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
			textHighlighterEnabled={this.props.clipperState.previewGlobalInfo.highlighterEnabled}
			currentMode={this.props.clipperState.currentMode} />;
	}

	// Override
	protected getPreviewBodyClass(): string {
		return this.state.textHighlighter && this.state.textHighlighter.isEnabled() ? Constants.Classes.highlightable : "";
	}

	private announceWithAriaLive(announcement: string) {
		const ariaLiveDiv = document.getElementById(Constants.Ids.previewAriaLiveDiv);
		if (!ariaLiveDiv) {
			Clipper.logger.logTrace(Log.Trace.Label.General, Log.Trace.Level.Warning, `Aria-live div with id ${Constants.Ids.sectionLocationContainer} not found`);
			return;
		}
		// To make duplicate text announcement work. See https://core.trac.wordpress.org/ticket/36853
		if (ariaLiveDiv.textContent === announcement) {
			announcement += " \u00A0";
		}
		ariaLiveDiv.textContent = announcement;
	}

	private changeFontFamily(serif: boolean) {
		_.assign(_.extend(this.props.clipperState.previewGlobalInfo, {
			serif: serif
		} as PreviewGlobalInfo), this.props.clipperState.setState);

		if (serif) {
			this.announceWithAriaLive(Localization.getLocalizedString("WebClipper.Accessibility.ScreenReader.ChangeFontToSerif"));
		} else {
			this.announceWithAriaLive(Localization.getLocalizedString("WebClipper.Accessibility.ScreenReader.ChangeFontToSansSerif"));
		}
	}

	private changeFontSize(increase: boolean) {
		let newFontSize: number = this.props.clipperState.previewGlobalInfo.fontSize + (increase ? 2 : -2);
		if (newFontSize < Constants.Settings.minimumFontSize) {
			newFontSize = Constants.Settings.minimumFontSize;
		} else if (newFontSize > Constants.Settings.maximumFontSize) {
			newFontSize = Constants.Settings.maximumFontSize;
		}

		_.assign(_.extend(this.props.clipperState.previewGlobalInfo, {
			fontSize: newFontSize
		} as PreviewGlobalInfo), this.props.clipperState.setState);

		if (increase) {
			this.announceWithAriaLive(Localization.getLocalizedString("WebClipper.Accessibility.ScreenReader.IncreaseFontSize"));
		} else {
			this.announceWithAriaLive(Localization.getLocalizedString("WebClipper.Accessibility.ScreenReader.DecreaseFontSize"));
		}
	}

	private deleteHighlight(timestamp: number) {
		let highlightablePreviewBody = document.getElementById(Constants.Ids.highlightablePreviewBody);
		let highlightedElements = highlightablePreviewBody.querySelectorAll("span.highlighted[data-timestamp='" + timestamp + "']");
		for (let i = 0; i < highlightedElements.length; i++) {
			let current = highlightedElements[i] as HTMLSpanElement;
			let parent = current.parentNode;
			parent.insertBefore(document.createTextNode(current.innerText), current);
			parent.removeChild(current);
		}
		this.handleBodyChange(highlightablePreviewBody.innerHTML);
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
				let highlightablePreviewBody = document.getElementById(Constants.Ids.highlightablePreviewBody);

				// We need to get the latest timestamp for normalizing all encompassed highlights later
				let timestamps = normalizedHighlights.map((span: HTMLSpanElement) => parseInt(span.getAttribute("data-timestamp"), 10 /* radix */));
				let timestamp: number = Math.max.apply(undefined, timestamps);

				// The highlight may have intersected another highlight ...
				for (let i = 0; i < normalizedHighlights.length; i++) {
					// ... so we should delete their old delete buttons, and normalize them to the same timestamp
					let oldHighlightTimestamp = normalizedHighlights[i].getAttribute("data-timestamp");
					let oldHighlights = highlightablePreviewBody.querySelectorAll("span." + Constants.Classes.highlighted + "[data-timestamp='" + oldHighlightTimestamp + "']");
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
				let firstHighlighted = highlightablePreviewBody.querySelector("span.highlighted[data-timestamp='" + timestamp + "']");
				if (firstHighlighted) {
					let deleteHighlight = document.createElement("img") as HTMLImageElement;
					deleteHighlight.src = ExtensionUtils.getImageResourceUrl("editoroptions/delete_button.svg");
					deleteHighlight.className = Constants.Classes.deleteHighlightButton;
					deleteHighlight.setAttribute("data-timestamp", "" + timestamp);
					deleteHighlight.setAttribute("tabindex", "0");
					firstHighlighted.insertBefore(deleteHighlight, firstHighlighted.childNodes[0]);
				}

				this.handleBodyChange(highlightablePreviewBody.innerHTML);
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
			_.assign(_.extend(this.props.clipperState.previewGlobalInfo, {
				highlighterEnabled: !this.props.clipperState.previewGlobalInfo.highlighterEnabled
			} as PreviewGlobalInfo), this.props.clipperState.setState);
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
