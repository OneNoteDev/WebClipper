import {Localization} from "../../../localization/localization";

import {ClipperStateProp} from "../../clipperState";

import {ControlGroup, ButtonGroupingsComponentBase} from "./previewViewerHeaderComponentBase";

export abstract class PreviewViewerTitleOnlyHeaderComponentBase extends ButtonGroupingsComponentBase<{}, ClipperStateProp> {
	public abstract getControlGroupId(): string;
	public abstract getHeader(): string;
	public abstract getHeaderId(): string;

	getControlGroups(): ControlGroup[] {
		return [this.getTitleGroup(this.getControlGroupId(), this.getHeader(), this.getHeaderId())];
	}

	private getTitleGroup(controlGroupId: string, header: string, headerId: string): ControlGroup {
		return {
			id: controlGroupId,
			innerElements: [
				<div
					id={headerId}
					style={Localization.getFontFamilyAsStyle(Localization.FontFamily.Regular)}
					className="buttonLabelFont">
					<span>{header}</span>
				</div>
			]
		};
	}
}
