import * as Log from "./log";

export module LogHelpers {
	export function createBaseEventAsJson(subCategory: string, label: string): { [key: string]: string } {
		let baseEvent: { [key: string]: string } = {};
		baseEvent[Log.PropertyName.Reserved.EventType] = Log.reportData;
		baseEvent[Log.PropertyName.Reserved.Label] = label;

		let category = Log.PropertyName.Reserved.WebClipper + "." + subCategory;
		baseEvent[Log.PropertyName.Reserved.Category] = category;
		baseEvent[Log.PropertyName.Reserved.EventName] = category + "." + label;

		return baseEvent;
	}

	/**
	 * Creates and returns an event with category of Click and a label of `clickId`
	 * @param clickId
	 */
	export function createClickEventAsJson(clickId: string): { [key: string]: string } {
		if (!clickId) {
			throw new Error("Button clicked without an ID! Logged with ID " + JSON.stringify(clickId));
		}

		let clickEvent: { [key: string]: string } = LogHelpers.createBaseEventAsJson(Log.Click.category, clickId);
		return clickEvent;
	}

	export function createLogEventAsJson(event: Log.Event.BaseEvent): { [key: string]: string | number | boolean } {
		if (!event.timerWasStopped()) {
			event.stopTimer();
		}

		let eventCategory = event.getEventCategory();

		// Items that should exist on all event categories
		let logEvent: { [key: string]: string | number | boolean } =
			LogHelpers.createBaseEventAsJson(Log.Event.Category[eventCategory], event.getLabel());
		logEvent[Log.PropertyName.Reserved.Duration] = event.getDuration();
		addToLogEvent(logEvent, event.getCustomProperties());

		switch (eventCategory) {
			case Log.Event.Category.BaseEvent:
				break;
			case Log.Event.Category.PromiseEvent:
				addPromiseEventItems(logEvent, event as Log.Event.PromiseEvent);
				break;
			case Log.Event.Category.StreamEvent:
				addStreamEventItems(logEvent, event as Log.Event.StreamEvent);
				break;
			default:
				throw new Error("createLogEvent does not specify a case for event category: " + Log.Event.Category[eventCategory]);
		}

		return logEvent;
	}

	function addPromiseEventItems(logEvent: { [key: string]: string | number | boolean }, promiseEvent: Log.Event.PromiseEvent) {
		let status: string = promiseEvent.getStatus();
		logEvent[Log.PropertyName.Reserved.Status] = status;

		if (status === Log.Status[Log.Status.Failed]) {
			logEvent[Log.PropertyName.Reserved.FailureInfo] = promiseEvent.getFailureInfo();
			logEvent[Log.PropertyName.Reserved.FailureType] = promiseEvent.getFailureType();
		}
	}

	function addStreamEventItems(logEvent: { [key: string]: string | number | boolean }, streamEvent: Log.Event.StreamEvent) {
		logEvent[Log.PropertyName.Reserved.Stream] = JSON.stringify(streamEvent.getEventData().Stream);
	}

	export function createSetContextEventAsJson(key: Log.Context.Custom, value: string): { [key: string]: string } {
		let baseEvent = new Log.Event.BaseEvent(Log.Event.Label.SetContextProperty);
		let event = LogHelpers.createBaseEventAsJson(Log.Event.Category[baseEvent.getEventCategory()], baseEvent.getLabel());

		let keyAsString = Log.Context.toString(key);
		event[Log.PropertyName.Custom[Log.PropertyName.Custom.Key]] = keyAsString;

		event[Log.PropertyName.Custom[Log.PropertyName.Custom.Value]] = value;

		return event;
	}

	export function createFailureEventAsJson(label: Log.Failure.Label, failureType: Log.Failure.Type, failureInfo?: OneNoteApi.GenericError, id?: string): { [key: string]: string } {
		let failureEvent: { [key: string]: string } = LogHelpers.createBaseEventAsJson(Log.Failure.category, Log.Failure.Label[label]);
		failureEvent[Log.PropertyName.Reserved.FailureType] = Log.Failure.Type[failureType];
		if (failureInfo) {
			failureEvent[Log.PropertyName.Reserved.FailureInfo] = Log.ErrorUtils.toString(failureInfo);
		}
		if (id) {
			failureEvent[Log.PropertyName.Reserved.Id] = id;
		}
		failureEvent[Log.PropertyName.Reserved.StackTrace] = Log.Failure.getStackTrace();

		return failureEvent;
	}

	export function createFunnelEventAsJson(label: Log.Funnel.Label): { [key: string]: string } {
		let funnelEvent: { [key: string]: string } = LogHelpers.createBaseEventAsJson(Log.Funnel.category, Log.Funnel.Label[label]);
		return funnelEvent;
	}

	export function createSessionStartEventAsJson(): { [key: string]: string } {
		let sessionEvent: { [key: string]: string } = LogHelpers.createBaseEventAsJson(Log.Session.category, Log.Session.State[Log.Session.State.Started]);
		return sessionEvent;
	}

	export function createSessionEndEventAsJson(endTrigger: Log.Session.EndTrigger): { [key: string]: string } {
		let sessionEvent: { [key: string]: string } = LogHelpers.createBaseEventAsJson(Log.Session.category, Log.Session.State[Log.Session.State.Ended]);
		sessionEvent[Log.PropertyName.Reserved.Trigger] = Log.Session.EndTrigger[endTrigger];
		return sessionEvent;
	}

	export function createTraceEventAsJson(label: Log.Trace.Label, level: Log.Trace.Level, message?: string): { [key: string]: string } {
		let traceEvent: { [key: string]: string } = LogHelpers.createBaseEventAsJson(Log.Trace.category, Log.Trace.Label[label]);
		if (message) {
			traceEvent[Log.PropertyName.Reserved.Message] = message;
		}

		traceEvent[Log.PropertyName.Reserved.Level] = Log.Trace.Level[level];
		switch (level) {
			case Log.Trace.Level.Warning:
				// Add stack trace to warnings
				traceEvent[Log.PropertyName.Reserved.StackTrace] = Log.Failure.getStackTrace();
				break;
			default:
				break;
		}

		return traceEvent;
	}

	export function addToLogEvent(logEvent: { [key: string]: string | number | boolean }, properties?: {}): void {
		if (logEvent[Log.PropertyName.Reserved.Status] === Log.Status[Log.Status.Failed]) {
			logEvent[Log.PropertyName.Reserved.StackTrace] = Log.Failure.getStackTrace();
		}

		if (properties) {
			for (let name in properties) {
				if (properties.hasOwnProperty(name)) {
					let propValue: string;
					if (typeof (properties[name]) === "object") {
						propValue = JSON.stringify(properties[name]);
					} else {
						propValue = properties[name];
					}

					logEvent[name] = propValue;
				}
			}
		}
	}

	export function isConsoleOutputEnabled(): boolean {
		try {
			if (localStorage.getItem(Log.enableConsoleLogging)) {
				return true;
			}
		} catch (e) { };
		return false;
	}
}
