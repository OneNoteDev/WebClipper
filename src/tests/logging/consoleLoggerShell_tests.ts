/// <reference path="../../../typings/main/ambient/qunit/qunit.d.ts" />
/// <reference path="../../../typings/main/ambient/sinon/sinon.d.ts" />

import * as Log from "../../scripts/logging/log";
import {ConsoleLoggerShell} from "../../scripts/logging/consoleLoggerShell";

import {BacklogDataPackage, MockConsole} from "./mockConsole";

let consoleLoggerShell: ConsoleLoggerShell;
let mockConsole: MockConsole;

export interface BacklogDataPackage {
	level: Log.Trace.Level;
	message: string;
	object: any;
};

QUnit.module("consoleLoggerShell", {
	beforeEach: () => {
		mockConsole = sinon.createStubInstance(MockConsole) as any;
		consoleLoggerShell = new ConsoleLoggerShell(mockConsole);
	}
});

test("logToConsole should throw an error if no event is passed in", () => {
	throws(() => {
		consoleLoggerShell.logToConsole(undefined);
	}, Error("'event' argument to logToConsole was: undefined"));
});

test("logToConsole should always contain the EventName of the event in the message logged to the console", () => {
	let event: { [key: string]: string | number | boolean } = {
		EventName: "MyEvent"
	};
	consoleLoggerShell.logToConsole(event);
	ok((mockConsole.log as Sinon.SinonSpy).calledOnce, "The log function should be called once");
	ok((mockConsole.log as Sinon.SinonSpy).calledWith("[MyEvent]", sinon.match(event)),
		"The log function should be called with the message and object");
});

test("If a Level property is present on the event, the message should contain that string", () => {
	let event: { [key: string]: string | number | boolean } = {
		EventName: "MyEvent",
		Level: "None"
	};
	consoleLoggerShell.logToConsole(event);
	ok((mockConsole.log as Sinon.SinonSpy).calledOnce, "The log function should be called once");
	ok((mockConsole.log as Sinon.SinonSpy).calledWith("[MyEvent] [None]", sinon.match(event)),
		"The log message should contain the EventName and Level tag");
});

test("If an Event has a Failed Status, the message should be logged as an error", () => {
	let event: { [key: string]: string | number | boolean } = {
		EventName: "MyEvent",
		Status: "Failed"
	};
	consoleLoggerShell.logToConsole(event);
	ok((mockConsole.error as Sinon.SinonSpy).calledOnce, "The error function should be called once");
	ok((mockConsole.error as Sinon.SinonSpy).calledWith("[MyEvent] [Error]", sinon.match(event)),
		"The error message should contain the EventName and Level Error tag");
});

test("If an Event has a Level and Message property, that message should be contained in the message logged to console", () => {
	let event: { [key: string]: string | number | boolean } = {
		EventName: "MyEvent",
		Level: "None",
		Message: "Hello world"
	};
	consoleLoggerShell.logToConsole(event);
	ok((mockConsole.log as Sinon.SinonSpy).calledOnce, "The log function should be called once");
	ok((mockConsole.log as Sinon.SinonSpy).calledWith("[MyEvent] [None] Hello world", sinon.match(event)),
		"The log message should contain the EventName, Level tag, and message");
});

test("If an Event has a Message property but no Level, the message should simply not include the Level", () => {
	let event: { [key: string]: string | number | boolean } = {
		EventName: "MyEvent",
		Message: "Hello world"
	};
	consoleLoggerShell.logToConsole(event);
	ok((mockConsole.log as Sinon.SinonSpy).calledOnce, "The log function should be called once");
	ok((mockConsole.log as Sinon.SinonSpy).calledWith("[MyEvent] Hello world", sinon.match(event)),
		"The log message should contain the EventName and message");
});

test("If the Level property is Warning, the warn function should be called on the console object", () => {
	let event: { [key: string]: string | number | boolean } = {
		EventName: "MyEvent",
		Level: "Warning",
		Message: "Hello world"
	};
	consoleLoggerShell.logToConsole(event);
	ok((mockConsole.warn as Sinon.SinonSpy).calledOnce, "The warn function should be called once");
	ok((mockConsole.warn as Sinon.SinonSpy).calledWith("[MyEvent] [Warning] Hello world", sinon.match(event)),
		"The warn message should contain the EventName and message");
});

test("If the Level property is Error, the error function should be called on the console object", () => {
	let event: { [key: string]: string | number | boolean } = {
		EventName: "MyEvent",
		Level: "Error",
		Message: "Hello world"
	};
	consoleLoggerShell.logToConsole(event);
	ok((mockConsole.error as Sinon.SinonSpy).calledOnce, "The error function should be called once");
	ok((mockConsole.error as Sinon.SinonSpy).calledWith("[MyEvent] [Error] Hello world", sinon.match(event)),
		"The error message should contain the EventName and message");
});

test("If the Level property is Verbose, the info function should be called on the console object", () => {
	let event: { [key: string]: string | number | boolean } = {
		EventName: "MyEvent",
		Level: "Verbose",
		Message: "Hello world"
	};
	consoleLoggerShell.logToConsole(event);
	ok((mockConsole.info as Sinon.SinonSpy).calledOnce, "The info function should be called once");
	ok((mockConsole.info as Sinon.SinonSpy).calledWith("[MyEvent] [Verbose] Hello world", sinon.match(event)),
		"The info message should contain the EventName and message");
});

test("If the Level property is Information, the info function should be called on the console object", () => {
	let event: { [key: string]: string | number | boolean } = {
		EventName: "MyEvent",
		Level: "Information",
		Message: "Hello world"
	};
	consoleLoggerShell.logToConsole(event);
	ok((mockConsole.info as Sinon.SinonSpy).calledOnce, "The info function should be called once");
	ok((mockConsole.info as Sinon.SinonSpy).calledWith("[MyEvent] [Information] Hello world", sinon.match(event)),
		"The info message should contain the EventName and message");
});

test("If the Level property is some arbitrary value, the log function should be called on the console object", () => {
	let event: { [key: string]: string | number | boolean } = {
		EventName: "MyEvent",
		Level: "asdf",
		Message: "Hello world"
	};
	consoleLoggerShell.logToConsole(event);
	ok((mockConsole.log as Sinon.SinonSpy).calledOnce, "The log function should be called once");
	ok((mockConsole.log as Sinon.SinonSpy).calledWith("[MyEvent] [asdf] Hello world", sinon.match(event)),
		"The log message should contain the EventName and message");
});
