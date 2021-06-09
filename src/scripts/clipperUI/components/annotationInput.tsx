import * as _ from "lodash";
import {Constants} from "../../constants";
import {ExtensionUtils} from "../../extensions/extensionUtils";
import {Localization} from "../../localization/localization";
import {PreviewGlobalInfo} from "../../previewInfo";
import {ClipperStateProp} from "../clipperState";
import {ComponentBase} from "../componentBase";

class AnnotationInputClass extends ComponentBase<{}, ClipperStateProp> {
	private static textAreaListenerAttached = false;

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

	render() {
		if (!AnnotationInputClass.textAreaListenerAttached) {
			this.addTextAreaListener();
			AnnotationInputClass.textAreaListenerAttached = true;
		}

		return (
			<div id={Constants.Ids.annotationContainer}>
				<pre
					id={Constants.Ids.annotationFieldMirror}
					className={Constants.Classes.textAreaInputMirror}>
					<span style={Localization.getFontFamilyAsStyle(Localization.FontFamily.Regular)}>
						{!!this.props.clipperState.previewGlobalInfo.annotation ? this.props.clipperState.previewGlobalInfo.annotation : ""}
					</span>
					<br/>
				</pre>
				<input
					id={Constants.Ids.annotationField}
					className={Constants.Classes.textAreaInput}
					role="textbox"
					rows={1} tabIndex={211}
					aria-label={Localization.getLocalizedString("WebClipper.Accessibility.ScreenReader.InputBoxToChangeNotesToAddToPage")}
					style={Localization.getFontFamilyAsStyle(Localization.FontFamily.Regular)}
					value={!!this.props.clipperState.previewGlobalInfo.annotation ? this.props.clipperState.previewGlobalInfo.annotation : ""}
					placeholder={Localization.getLocalizedString("WebClipper.Label.AnnotationPlaceholder")} >
				</input>
			</div>
		);
	}
}

let component = AnnotationInputClass.componentize();
export { component as AnnotationInput };
