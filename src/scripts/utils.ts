import {ClientType} from "./clientType";
import {Constants} from "./constants";
import {Settings} from "./settings";

import {ClipperState} from "./clipperUI/clipperState";
import {TooltipType} from "./clipperUI/tooltipType";

export module Utils {
	export function generateGuid(): string {
		return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, c => {
			let r = Math.random() * 16 | 0, v = c === "x" ? r : (r & 0x3 | 0x8);
			return v.toString(16);
		});
	}
}
