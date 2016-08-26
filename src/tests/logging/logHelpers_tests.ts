/// <reference path="../../../typings/main/ambient/qunit/qunit.d.ts" />

import * as Log from "../../scripts/logging/log";
import {LogHelpers} from "../../scripts/logging/logHelpers";

QUnit.module("logHelpers", {});

test("createBaseEvent creates a k-v pair with EventType, Label, Category, and EventName", () => {
	let result = LogHelpers.createBaseEventAsJson("subCat", "lab");
	deepEqual(result, {
		EventType: "ReportData",
		Label: "lab",
		Category: "WebClipper.subCat",
		EventName: "WebClipper.subCat.lab"
	});
});

test("createClickEvent creates a base k-v pair with subcategory as Click and eventname as the id", () => {
	let result = LogHelpers.createClickEventAsJson("buttonA");
	deepEqual(result, {
		EventType: "ReportData",
		Label: "buttonA",
		Category: "WebClipper.Click",
		EventName: "WebClipper.Click.buttonA"
	});
});

test("createLogEvent creates a base k-v pair with additional Duration key if a BaseEvent", () => {
	let label = 0;
	let labelAsString = Log.Event.Label[label];
	let result = LogHelpers.createLogEventAsJson(new Log.Event.BaseEvent({
		Label: label,
		Duration: 10
	}));
	deepEqual(result, {
		EventType: "ReportData",
		Label: labelAsString,
		Category: "WebClipper.BaseEvent",
		EventName: "WebClipper.BaseEvent." + labelAsString,
		Duration: 10
	});
});

test("createLogEvent creates a base k-v pair with additional Duration, Status key if a non-failed PromiseEvent", () => {
	let label = 0;
	let labelAsString = Log.Event.Label[label];
	let result = LogHelpers.createLogEventAsJson(new Log.Event.PromiseEvent({
		Label: label,
		Duration: 20,
		LogStatus: Log.Status.Succeeded
	}));
	deepEqual(result, {
		EventType: "ReportData",
		Label: labelAsString,
		Category: "WebClipper.PromiseEvent",
		EventName: "WebClipper.PromiseEvent." + labelAsString,
		Duration: 20,
		Status: "Succeeded"
	});
});

test("createLogEvent creates a base k-v pair with additional Duration, Status, FailureInfo, FailureType key if a failed PromiseEvent", () => {
	let label = 0;
	let labelAsString = Log.Event.Label[label];
	let promiseEvent = new Log.Event.PromiseEvent({
		Label: label,
		Duration: 30,
		LogStatus: Log.Status.Failed
	});
	let failureInfo = {	error: "err info" };
	promiseEvent.setFailureInfo(failureInfo);
	let failureType = 0;
	let failureTypeAsString = Log.Failure.Type[failureType];
	promiseEvent.setFailureType(0);

	let result = LogHelpers.createLogEventAsJson(promiseEvent);
	deepEqual(JSON.stringify(result), JSON.stringify({
		EventType: "ReportData",
		Label: labelAsString,
		Category: "WebClipper.PromiseEvent",
		EventName: "WebClipper.PromiseEvent." + labelAsString,
		Duration: 30,
		Status: "Failed",
		FailureInfo: JSON.stringify(failureInfo),
		FailureType: failureTypeAsString
	}));
});

test("createLogEvent creates a base k-v pair with additional Duration, Stream key if a StreamEvent", () => {
	let label = 0;
	let labelAsString = Log.Event.Label[label];
	let stream = ["a", "b"];
	let streamEvent = new Log.Event.StreamEvent({
		Label: label,
		Duration: 30,
		Stream: stream
	});

	let result = LogHelpers.createLogEventAsJson(streamEvent);
	deepEqual(JSON.stringify(result), JSON.stringify({
		EventType: "ReportData",
		Label: labelAsString,
		Category: "WebClipper.StreamEvent",
		EventName: "WebClipper.StreamEvent." + labelAsString,
		Duration: 30,
		Stream: JSON.stringify(stream)
	}));
});

test("createSetContextEvent creates a base k-v pair with addditional Key, Value properties", () => {
	let key = 0;
	let keyAsString = Log.Context.toString(key);

	let result = LogHelpers.createSetContextEventAsJson(key, "val");
	deepEqual(JSON.stringify(result), JSON.stringify({
		EventType: "ReportData",
		Label: "SetContextProperty",
		Category: "WebClipper.BaseEvent",
		EventName: "WebClipper.BaseEvent.SetContextProperty",
		Key: keyAsString,
		Value: "val"
	}));
});

test("createFailureEvent creates a base k-v pair with additional FailureType, FailureInfo, Id, StackTrace", () => {
	let label = 0;
	let labelAsString = Log.Failure.Label[label];
	let failureType = 0;
	let failureTypeAsString = Log.Failure.Type[failureType];
	let failureInfo = { error: "err" };
	let id = "id";

	let result = LogHelpers.createFailureEventAsJson(label, failureType, failureInfo, id);
	deepEqual(JSON.stringify(result), JSON.stringify({
		EventType: "ReportData",
		Label: labelAsString,
		Category: "WebClipper.Failure",
		EventName: "WebClipper.Failure." + labelAsString,
		FailureType: failureTypeAsString,
		FailureInfo: JSON.stringify(failureInfo),
		Id: id
	}));
});

test("createFunnelEvent creates a base k-v pair", () => {
	let label = 0;
	let labelAsString = Log.Funnel.Label[label];

	let result = LogHelpers.createFunnelEventAsJson(label);
	deepEqual(JSON.stringify(result), JSON.stringify({
		EventType: "ReportData",
		Label: labelAsString,
		Category: "WebClipper.Funnel",
		EventName: "WebClipper.Funnel." + labelAsString
	}));
});

test("createSessionEvent Started creates a base k-v pair", () => {
	let result = LogHelpers.createSessionStartEventAsJson();
	deepEqual(JSON.stringify(result), JSON.stringify({
		EventType: "ReportData",
		Label: "Started",
		Category: "WebClipper.Session",
		EventName: "WebClipper.Session.Started"
	}));
});

test("createSessionEvent Ended creates a base k-v pair with additional Trigger property", () => {
	let trigger = 0;
	let triggerAsString = Log.Session.EndTrigger[trigger];
	let result = LogHelpers.createSessionEndEventAsJson(trigger);
	deepEqual(JSON.stringify(result), JSON.stringify({
		EventType: "ReportData",
		Label: "Ended",
		Category: "WebClipper.Session",
		EventName: "WebClipper.Session.Ended",
		Trigger: triggerAsString
	}));
});

test("createTraceEvent creates a base k-v pair with additional Message, Level property if not a Warning", () => {
	let label = 0;
	let labelAsString = Log.Trace.Label[label];
	let level = Log.Trace.Level.Information;
	let levelAsString = Log.Trace.Level[level];
	let message = "msg";

	let result = LogHelpers.createTraceEventAsJson(label, level, message);
	deepEqual(JSON.stringify(result), JSON.stringify({
		EventType: "ReportData",
		Label: labelAsString,
		Category: "WebClipper.Trace",
		EventName: "WebClipper.Trace." + labelAsString,
		Message: message,
		Level: levelAsString
	}));
});
