import * as Log from "../../scripts/logging/log";
import {ConsoleOutput} from "../../scripts/logging/consoleOutput";

export interface BacklogDataPackage {
	level: Log.Trace.Level;
	message: string;
	object: any;
};

export class MockConsole implements ConsoleOutput {
	public backlog: BacklogDataPackage[];

	constructor() {
		this.backlog = [];
	}

	public warn(message: string, object: any): void {
		this.backlog.push({
			level: Log.Trace.Level.Warning,
			message: message,
			object: object
		});
	}

	public error(message: string, object: any): void {
		this.backlog.push({
			level: Log.Trace.Level.Error,
			message: message,
			object: object
		});
	}

	public info(message: string, object: any): void {
		this.backlog.push({
			level: Log.Trace.Level.Information,
			message: message,
			object: object
		});
	}

	public log(message: string, object: any): void {
		this.backlog.push({
			level: Log.Trace.Level.None,
			message: message,
			object: object
		});
	}
}
