﻿import * as sinon from "sinon";

import * as Log from "../../scripts/logging/log";
import {ConsoleLoggerShell} from "../../scripts/logging/consoleLoggerShell";

import {BacklogDataPackage, MockConsole} from "./mockConsole";

import {TestModule} from "../testModule";

export class ConsoleLoggerShellTests extends TestModule {
	private consoleLoggerShell: ConsoleLoggerShell;
	private mockConsole: MockConsole;

	protected module() {
		return "consoleLoggerShell";
	}

	protected beforeEach() {
		this.mockConsole = sinon.createStubInstance(MockConsole) as any;
		this.consoleLoggerShell = new ConsoleLoggerShell(this.mockConsole);
	}

	protected tests() {
		test("logToConsole should throw an error if no event is passed in", () => {
			throws(() => {
				this.consoleLoggerShell.logToConsole(undefined);
			}, Error("'event' argument to logToConsole was: undefined"));
		});

		test("logToConsole should always contain the EventName of the event in the message logged to the console", () => {
			let event: { [key: string]: string | number | boolean } = {
				EventName: "MyEvent"
			};
			this.consoleLoggerShell.logToConsole(event);
			ok((this.mockConsole.log as Sinon.SinonSpy).calledOnce, "The log function should be called once");
			ok((this.mockConsole.log as Sinon.SinonSpy).calledWith("[MyEvent]", sinon.match(event)),
				"The log function should be called with the message and object");
		});

		test("If a Level property is present on the event, the message should contain that string", () => {
			let event: { [key: string]: string | number | boolean } = {
				EventName: "MyEvent",
				Level: "None"
			};
			this.consoleLoggerShell.logToConsole(event);
			ok((this.mockConsole.log as Sinon.SinonSpy).calledOnce, "The log function should be called once");
			ok((this.mockConsole.log as Sinon.SinonSpy).calledWith("[MyEvent] [None]", sinon.match(event)),
				"The log message should contain the EventName and Level tag");
		});

		test("If an Event has a Failed Status, the message should be logged as an error", () => {
			let event: { [key: string]: string | number | boolean } = {
				EventName: "MyEvent",
				Status: "Failed"
			};
			this.consoleLoggerShell.logToConsole(event);
			ok((this.mockConsole.error as Sinon.SinonSpy).calledOnce, "The error function should be called once");
			ok((this.mockConsole.error as Sinon.SinonSpy).calledWith("[MyEvent] [Error]", sinon.match(event)),
				"The error message should contain the EventName and Level Error tag");
		});

		test("If an Event has a Level and Message property, that message should be contained in the message logged to console", () => {
			let event: { [key: string]: string | number | boolean } = {
				EventName: "MyEvent",
				Level: "None",
				Message: "Hello world"
			};
			this.consoleLoggerShell.logToConsole(event);
			ok((this.mockConsole.log as Sinon.SinonSpy).calledOnce, "The log function should be called once");
			ok((this.mockConsole.log as Sinon.SinonSpy).calledWith("[MyEvent] [None] Hello world", sinon.match(event)),
				"The log message should contain the EventName, Level tag, and message");
		});

		test("If an Event has a Message property but no Level, the message should simply not include the Level", () => {
			let event: { [key: string]: string | number | boolean } = {
				EventName: "MyEvent",
				Message: "Hello world"
			};
			this.consoleLoggerShell.logToConsole(event);
			ok((this.mockConsole.log as Sinon.SinonSpy).calledOnce, "The log function should be called once");
			ok((this.mockConsole.log as Sinon.SinonSpy).calledWith("[MyEvent] Hello world", sinon.match(event)),
				"The log message should contain the EventName and message");
		});

		test("If the Level property is Warning, the warn function should be called on the console object", () => {
			let event: { [key: string]: string | number | boolean } = {
				EventName: "MyEvent",
				Level: "Warning",
				Message: "Hello world"
			};
			this.consoleLoggerShell.logToConsole(event);
			ok((this.mockConsole.warn as Sinon.SinonSpy).calledOnce, "The warn function should be called once");
			ok((this.mockConsole.warn as Sinon.SinonSpy).calledWith("[MyEvent] [Warning] Hello world", sinon.match(event)),
				"The warn message should contain the EventName and message");
		});

		test("If the Level property is Error, the error function should be called on the console object", () => {
			let event: { [key: string]: string | number | boolean } = {
				EventName: "MyEvent",
				Level: "Error",
				Message: "Hello world"
			};
			this.consoleLoggerShell.logToConsole(event);
			ok((this.mockConsole.error as Sinon.SinonSpy).calledOnce, "The error function should be called once");
			ok((this.mockConsole.error as Sinon.SinonSpy).calledWith("[MyEvent] [Error] Hello world", sinon.match(event)),
				"The error message should contain the EventName and message");
		});

		test("If the Level property is Verbose, the info function should be called on the console object", () => {
			let event: { [key: string]: string | number | boolean } = {
				EventName: "MyEvent",
				Level: "Verbose",
				Message: "Hello world"
			};
			this.consoleLoggerShell.logToConsole(event);
			ok((this.mockConsole.info as Sinon.SinonSpy).calledOnce, "The info function should be called once");
			ok((this.mockConsole.info as Sinon.SinonSpy).calledWith("[MyEvent] [Verbose] Hello world", sinon.match(event)),
				"The info message should contain the EventName and message");
		});

		test("If the Level property is Information, the info function should be called on the console object", () => {
			let event: { [key: string]: string | number | boolean } = {
				EventName: "MyEvent",
				Level: "Information",
				Message: "Hello world"
			};
			this.consoleLoggerShell.logToConsole(event);
			ok((this.mockConsole.info as Sinon.SinonSpy).calledOnce, "The info function should be called once");
			ok((this.mockConsole.info as Sinon.SinonSpy).calledWith("[MyEvent] [Information] Hello world", sinon.match(event)),
				"The info message should contain the EventName and message");
		});

		test("If the Level property is some arbitrary value, the log function should be called on the console object", () => {
			let event: { [key: string]: string | number | boolean } = {
				EventName: "MyEvent",
				Level: "asdf",
				Message: "Hello world"
			};
			this.consoleLoggerShell.logToConsole(event);
			ok((this.mockConsole.log as Sinon.SinonSpy).calledOnce, "The log function should be called once");
			ok((this.mockConsole.log as Sinon.SinonSpy).calledWith("[MyEvent] [asdf] Hello world", sinon.match(event)),
				"The log message should contain the EventName and message");
		});
	}
}

(new ConsoleLoggerShellTests()).runTests();
