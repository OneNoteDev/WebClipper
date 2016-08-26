import {Constants} from "../constants";

import {Communicator} from "../communicator/communicator";

import * as Log from "./log";
import {Logger} from "./logger";

export class CommunicatorLoggerPure extends Logger {
	private communicator: Communicator;

	constructor(communicator: Communicator) {
		super();
		this.communicator = communicator;
	}

	public logEvent(event: Log.Event.BaseEvent): void {
		if (!event.timerWasStopped()) {
			event.stopTimer();
		}

		// We need to send the event category as well so that the other side knows which one it is
		this.sendDataPackage(Log.LogMethods.logEvent, [event.getEventCategory(), event.getEventData()]);
	}

	public logFailure(label: Log.Failure.Label, failureType: Log.Failure.Type, failureInfo?: OneNoteApi.GenericError, id?: string): void {
		this.sendDataPackage(Log.LogMethods.logFailure, arguments);
	}

	public logUserFunnel(label: Log.Funnel.Label): void {
		this.sendDataPackage(Log.LogMethods.logFunnel, arguments);
	}

	public logSessionStart(): void {
		this.sendDataPackage(Log.LogMethods.logSessionStart, arguments);
	}

	public logSessionEnd(endTrigger: Log.Session.EndTrigger): void {
		this.sendDataPackage(Log.LogMethods.logSessionEnd, arguments);
	}

	public logTrace(label: Log.Trace.Label, level: Log.Trace.Level, message?: string): void {
		if (message) {
			this.sendDataPackage(Log.LogMethods.logTrace, [label, level, message]);
		} else {
			this.sendDataPackage(Log.LogMethods.logTrace, [label, level]);
		}
	}

	public pushToStream(label: Log.Event.Label, value: any): void {
		this.sendDataPackage(Log.LogMethods.pushToStream, arguments);
	}

	public logClickEvent(clickId: string): void {
		this.sendDataPackage(Log.LogMethods.logClickEvent, arguments);
	}

	public setContextProperty(key: Log.Context.Custom | string, value: string): void {
		this.sendDataPackage(Log.LogMethods.setContextProperty, arguments);
	}

	private sendDataPackage(methodName: Log.LogMethods, args: IArguments | Array<any>): void {
		let data: Log.LogDataPackage = {
			methodName: methodName,
			methodArgs: Object.keys(args).map(key => args[key])
		};
		this.communicator.callRemoteFunction(Constants.FunctionKeys.telemetry, { param: data });
	}
}
