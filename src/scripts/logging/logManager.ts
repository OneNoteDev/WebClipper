import {Communicator} from "../communicator/communicator";
import {SmartValue} from "../communicator/smartValue";
import {CommunicatorLoggerDecorator} from "./communicatorLoggerDecorator";
import {ConsoleLoggerDecorator} from "./consoleLoggerDecorator";
import {ConsoleOutput} from "./consoleOutput";
import {ProductionRequirements} from "./context";
import {LogHelpers} from "./logHelpers";
import {SessionLogger} from "./sessionLogger";
import {StubSessionLogger} from "./stubSessionLogger";
import {WebConsole} from "./webConsole";

export interface MiscLogEventData {
	label: string;
	category: string;
	properties: { [key: string]: string };
}

export class LogManager {
	/**
	 * Creates the logger responsible for centralized logging on the backend. If a
	 * communicator parameter is specified, it is assumed that console logging is
	 * enabled, and it will be set up in the logger object as well.
	 */
	static createExtLogger(sessionId: SmartValue<string>, uiCommunicator?: Communicator): SessionLogger {
		if (uiCommunicator) {
			return LogManager.createDebugLogger(uiCommunicator, sessionId);
		}
		return new StubSessionLogger();
	}

	static createDebugLogger(uiCommunicator: Communicator, sessionId: SmartValue<string>): SessionLogger {
		let commLogger: CommunicatorLoggerDecorator = uiCommunicator ? new CommunicatorLoggerDecorator(uiCommunicator) : undefined;

		let consoleOutput: ConsoleOutput =
			LogHelpers.isConsoleOutputEnabled() ? new WebConsole() : undefined;

		return new ConsoleLoggerDecorator(consoleOutput, {
			contextStrategy: new ProductionRequirements(),
			component: commLogger,
			sessionId: sessionId
		});
	}

	/**
	 * Sends an event to console with relevant data as query parameters
	 */
	static sendMiscLogRequest(data: MiscLogEventData, keysToCamelCase: boolean): void {
		console.warn(JSON.stringify({ label: data.label, category: data.category, properties: data.properties }));
	}
}
