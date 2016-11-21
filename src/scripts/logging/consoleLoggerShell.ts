import * as Log from "./log";
import {ConsoleOutput} from "./consoleOutput";

export class ConsoleLoggerShell {
	private consoleOutput: ConsoleOutput;
	private context: { [key: string]: string } = {};

	constructor(consoleOutput?: ConsoleOutput) {
		this.consoleOutput = consoleOutput;
	}

	public logToConsole(event: { [key: string]: string | number | boolean }): void {
		if (!event) {
			throw new Error("'event' argument to logToConsole was: " + event);
		}

		let level: string = <string>event[Log.PropertyName.Reserved.Level];

		// if Status == Failed or SubCategory == Failure, log as an error
		if (event[Log.PropertyName.Reserved.Status] === Log.Status[Log.Status.Failed]
			|| event[Log.PropertyName.Reserved.Category] === Log.PropertyName.Reserved.WebClipper + "." + Log.Failure.category) {
			level = Log.Trace.Level[Log.Trace.Level.Error];
		}

		let logger = this.consoleOutput;

		// Log all events as [EventName] [level?] [message?], eventToLog for ease of reading
		let messageToLog = "";
		messageToLog += "[" + event[Log.PropertyName.Reserved.EventName] + "]";
		messageToLog += level ? " [" + level + "]" : "";
		messageToLog += Log.PropertyName.Reserved.Message in event ? " " + event[Log.PropertyName.Reserved.Message] : "";

		let eventToLog: { [key: string]: string | number | boolean } = this.combineContextAndEvent(event);
		switch (Log.Trace.Level[level]) {
			case Log.Trace.Level.Warning:
				logger.warn(messageToLog, eventToLog);
				break;
			case Log.Trace.Level.Error:
				logger.error(messageToLog, eventToLog);
				break;
			case Log.Trace.Level.Verbose:
			case Log.Trace.Level.Information:
				logger.info(messageToLog, eventToLog);
				break;
			default:
				logger.log(messageToLog, eventToLog);
		}
	}

	public setContextProperty(key: string, value: string): void {
		this.context[key] = value;
	}

	public combineContextAndEvent(event: { [key: string]: string | number | boolean }): { [key: string]: string | number | boolean } {
		let contextAndEvent: { [key: string]: string | number | boolean } = {};

		for (let key in this.context) {
			if (this.context.hasOwnProperty(key)) {
				contextAndEvent[key] = this.context[key];
			}
		}

		for (let key in event) {
			if (event.hasOwnProperty(key)) {
				contextAndEvent[key] = event[key];
			}
		}

		return contextAndEvent;
	}
}
