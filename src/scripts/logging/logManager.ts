import {SessionLogger} from "../logging/sessionLogger";
import {StubSessionLogger} from "../logging/stubSessionLogger";

import {SmartValue} from "../communicator/smartValue";

/**
 * Creates the logger responsible for centralized logging on the backend.
 * The public build ships a stub logger; the internal build's
 * logManager_internal.ts replaces this at bundle time with an Aria-backed one.
 */
export function createExtLogger(_sessionId: SmartValue<string>): SessionLogger {
	return new StubSessionLogger();
}

export function reInitLoggerForDataBoundaryChange(userDataBoundary: string): void {
	let message: string = "DataBoundary different than default logging boundary :" + userDataBoundary;
	console.log(message);
}
