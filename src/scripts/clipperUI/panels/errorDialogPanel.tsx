import {Constants} from "../../constants";

import {Clipper} from "../frontEndGlobals";

import {DialogPanelClass} from "./dialogPanel";

class ErrorDialogPanelClass extends DialogPanelClass {
	// Override
	public getExtraMessages(): any {
		return (
			<div id={Constants.Ids.dialogDebugMessageContainer}>
				{this.getDebugSessionId()}
			</div>
		);
	}

	private getDebugSessionId(): string {
		return "Usid: " + Clipper.getUserSessionId();
	}
}

let component = ErrorDialogPanelClass.componentize();
export {component as ErrorDialogPanel};
