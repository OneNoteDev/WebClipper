import {Constants} from "../../constants";
import {Localization} from "../../localization/localization";
import {PreviewGlobalInfo} from "../../previewInfo";
import {Utils} from "../../utils";

import {ClipperStateProp} from "../clipperState";
import {ComponentBase} from "../componentBase";

interface AnnotationInputState {
	opened: boolean;
}

class AnnotationInputClass extends ComponentBase<AnnotationInputState, ClipperStateProp> {
	private static textAreaListenerAttached = false;

	getInitialState(): AnnotationInputState {
		return { opened: !!this.props.clipperState.previewGlobalInfo.annotation };
	}

	handleAnnotateButton() {
		this.setState({ opened: !this.state.opened });
	}

	setFocus(textArea: HTMLElement) {
		textArea.focus();
	}

	// TODO: change this to a config passed into the textarea?
	private addTextAreaListener() {
		document.addEventListener("input", (event) => {
			let element = event.target;
			let annotationField = document.getElementById(Constants.Ids.annotationField) as HTMLTextAreaElement;
			if (!!element && element === annotationField) {
				this.handleAnnotationFieldChanged(annotationField.value);
			}
		});
	}

	private handleAnnotationFieldChanged(annotationValue: string) {
		this.props.clipperState.setState({
			previewGlobalInfo: {
				previewTitleText: this.props.clipperState.previewGlobalInfo.previewTitleText,
				annotation: annotationValue,
				fontSize: this.props.clipperState.previewGlobalInfo.fontSize,
				serif: this.props.clipperState.previewGlobalInfo.serif
			}
		});
	}

	onDoneEditing(e: Event) {
		let value = (e.target as HTMLTextAreaElement).value.trim();
		let previewGlobalInfo = Utils.createUpdatedObject(this.props.clipperState.previewGlobalInfo, {
			annotation: value
		} as PreviewGlobalInfo);

		this.props.clipperState.setState({
			previewGlobalInfo: previewGlobalInfo
		});

		// We do this as if we trigger this on the mousedown instead, the hide causes some buttons to
		// reposition themselves, and we cannot guarantee that the subsequent mouseup will be on the
		// button the user originally intended to click
		if (value === "") {
			let nextMouseupEvent = () => {
				this.setState({ opened: false });
				window.removeEventListener("mouseup", nextMouseupEvent);
			};
			window.addEventListener("mouseup", nextMouseupEvent);
		}
	}

	render() {
		if (!AnnotationInputClass.textAreaListenerAttached) {
			this.addTextAreaListener();
			AnnotationInputClass.textAreaListenerAttached = true;
		}

		if (!this.state.opened) {
			return (
				<div id={Constants.Ids.annotationContainer}>
					<a id={Constants.Ids.annotationPlaceholder} style={Localization.getFontFamilyAsStyle(Localization.FontFamily.Regular)} {...this.enableInvoke(this.handleAnnotateButton, 210)}>
						<img src={Utils.getImageResourceUrl("editorOptions/add_icon_purple.png")} />
						<span>{Localization.getLocalizedString("WebClipper.Label.AnnotationPlaceholder")}</span>
					</a>
				</div>
			);
		} else {
			return (
				<div id={Constants.Ids.annotationContainer}>
					<pre id={Constants.Ids.annotationFieldMirror}
						className={Constants.Classes.textAreaInputMirror}>
						<span style={Localization.getFontFamilyAsStyle(Localization.FontFamily.Regular)}>
							{!!this.props.clipperState.previewGlobalInfo.annotation ? this.props.clipperState.previewGlobalInfo.annotation : ""}
						</span>
						<br/>
					</pre>
					<textarea
						id={Constants.Ids.annotationField}
						className={Constants.Classes.textAreaInput}
						rows={1} tabIndex={211}
						style={Localization.getFontFamilyAsStyle(Localization.FontFamily.Regular)}
						value={!!this.props.clipperState.previewGlobalInfo.annotation ? this.props.clipperState.previewGlobalInfo.annotation : ""}
						onblur={this.onDoneEditing.bind(this)} {...this.onElementFirstDraw(this.setFocus)}>
					</textarea>
				</div>
			);
		}
	}
}

let component = AnnotationInputClass.componentize();
export {component as AnnotationInput};
