import {Constants} from "../../../constants";
import {Utils} from "../../../utils";

import {ComponentBase} from "../../componentBase";

export interface PdfPreviewAttachmentProp {
	name: string;
}

/**
 * Provides page number overlay and selected/unselected stylings on top of the
 * pdf page viewport's functionality.
 */
class PdfPreviewAttachmentClass extends ComponentBase<{}, PdfPreviewAttachmentProp> {
	public render() {
		return (
			<span className={Constants.Classes.attachmentOverlay}>
				<img src={Utils.getImageResourceUrl("editorOptions/pdf_attachment_icon.png") }></img>
				<div className="file-name">{this.props.name}</div>
			</span>
		);
	}
}

let component = PdfPreviewAttachmentClass.componentize();
export {component as PdfPreviewAttachment};
