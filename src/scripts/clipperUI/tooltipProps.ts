import {ChangeLog} from "../versioning/changeLog";

export module TooltipProps {
	export interface WhatsNew {
		updates: ChangeLog.Update[];
	}
}
