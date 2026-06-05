/* eslint-disable no-console -- WebConsole is the project's console wrapper; delegating to console.* here is the entire point. */
import {ConsoleOutput} from "./consoleOutput";

export class WebConsole implements ConsoleOutput {
	warn(message: string, object: any): void {
		console.warn(message, object);
	}

	error(message: string, object: any): void {
		console.error(message, object);
	}

	info(message: string, object: any): void {
		console.info(message, object);
	}

	log(message: string, object: any): void {
		console.log(message, object);
	}
}
