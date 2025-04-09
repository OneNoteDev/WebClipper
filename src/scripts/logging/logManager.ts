import * as Log from "../logging/log";
import {CommunicatorLoggerDecorator} from "../logging/communicatorLoggerDecorator";
import {ConsoleLoggerDecorator} from "../logging/consoleLoggerDecorator";
import {ConsoleOutput} from "../logging/consoleOutput";
import {LogHelpers} from "../logging/logHelpers";
import {ProductionRequirements} from "../logging/context";
import {SessionLogger} from "../logging/sessionLogger";
import {StubSessionLogger} from "../logging/stubSessionLogger";
import {WebConsole} from "../logging/webConsole";

import {Communicator} from "../communicator/communicator";
import {SmartValue} from "../communicator/smartValue";

/**
 * Creates the logger responsible for centralized logging on the backend. If a
 * communicator parameter is specified, it is assumed that console logging is
 * enabled, and it will be set up in the logger object as well.
 */
export function createExtLogger(sessionId: SmartValue<string>, uiCommunicator?: Communicator): SessionLogger {
	if (uiCommunicator) {
		return createDebugLogger(uiCommunicator, sessionId);
	}
	return new StubSessionLogger();
}

function createDebugLogger(uiCommunicator: Communicator, sessionId: SmartValue<string>): SessionLogger {
	let commLogger: CommunicatorLoggerDecorator = uiCommunicator ? new CommunicatorLoggerDecorator(uiCommunicator) : undefined;

	// If we have received a communicator, we can be sure that console logging is enabled
	let consoleOutput: ConsoleOutput = new WebConsole();

	return new ConsoleLoggerDecorator(consoleOutput, {
		contextStrategy: new ProductionRequirements(),
		component: commLogger,
		sessionId: sessionId
	});
}

export function reInitLoggerForDataBoundaryChange(userDataBoundary: string): void {
	let message: string = "DataBoundary different than default logging boundary :" + userDataBoundary;
	console.log(message);
}
