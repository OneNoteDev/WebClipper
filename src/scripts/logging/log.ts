import {Logger} from "./logger";

import {Event} from "./submodules/event";
import {LogDataPackage} from "./submodules/logDataPackage";
import {LogMethods} from "./submodules/logMethods";

export let contextPropertyNameRegex = /^[a-zA-Z0-9](([a-zA-Z0-9|_]){0,98}[a-zA-Z0-9])?$/;
export let enableConsoleLogging = "enable_console_logging";
export let reportData = "ReportData";
export let unknownValue = "unknown";

export function parseAndLogDataPackage(data: LogDataPackage, logger: Logger) {
	switch (data.methodName) {
		case LogMethods.logEvent:
			let eventCategory: Event.Category = data.methodArgs[0];
			let eventData: Event.BaseEventData = data.methodArgs[1];
			logger.logEvent.apply(logger, [Event.createEvent(eventCategory, eventData)]);
			break;
		case LogMethods.logFailure:
			logger.logFailure.apply(logger, data.methodArgs);
			break;
		case LogMethods.pushToStream:
			logger.pushToStream.apply(logger, data.methodArgs);
			break;
		case LogMethods.logFunnel:
			logger.logUserFunnel.apply(logger, data.methodArgs);
			break;
		case LogMethods.logSessionStart:
			logger.logSessionStart.apply(logger, data.methodArgs);
			break;
		case LogMethods.logSessionEnd:
			logger.logSessionEnd.apply(logger, data.methodArgs);
			break;
		case LogMethods.logClickEvent:
			logger.logClickEvent.apply(logger, data.methodArgs);
			break;
		case LogMethods.setContextProperty:
			logger.setContextProperty.apply(logger, data.methodArgs);
			break;
		case LogMethods.logTrace:
		/* falls through */
		default:
			logger.logTrace.apply(logger, data.methodArgs);
			break;
	}
}

export {Click} from "./submodules/click";
export {Context} from "./submodules/context";
export {ErrorUtils} from "./submodules/errorUtils";
export {Event} from "./submodules/event";
export {Failure} from "./submodules/failure";
export {Funnel} from "./submodules/funnel";
export {LogDataPackage} from "./submodules/logDataPackage";
export {LogMethods} from "./submodules/logMethods";
export {NoOp} from "./submodules/noop";
export {PropertyName} from "./submodules/propertyName";
export {Session} from "./submodules/session";
export {Status} from "./submodules/status";
export {Trace} from "./submodules/trace";
