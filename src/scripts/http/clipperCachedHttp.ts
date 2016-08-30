import {Constants} from "../constants";

import * as Log from "../logging/log";
import {Logger} from "../logging/logger";

import {Storage} from "../storage/storage";

interface TimeStampedData {
	data: any;
	lastUpdated: number;
}

/**
 * Allows the creation of HTTP requests to Clipper-specific endpoints. Also
 * provides caching of the result.
 * TODO: Extend an abstract class that provides caching functionality
 */
export class ClipperCachedHttp {
	private static defaultExpiry = 12 * 60 * 60 * 1000; // 12 hours

	private cache: Storage;
	private logger: Logger;

	constructor(cache: Storage, logger?: Logger) {
		this.cache = cache;
		this.logger = logger;
	}

	public getDefaultExpiry(): number {
		return ClipperCachedHttp.defaultExpiry;
	}

	public setLogger(logger: Logger) {
		this.logger = logger;
	}

	// TODO key should be enum!
	public getFreshValue(key: string, updateInterval = ClipperCachedHttp.defaultExpiry): Promise<TimeStampedData> {
		// TODO
		let fetchNonLocalData = () => { return undefined; };

		if (!key) {
			this.logger.logFailure(Log.Failure.Label.InvalidArgument, Log.Failure.Type.Unexpected,
				{ error: "getFreshValue key parameter should be passed a non-empty string" }, "" + key);
			return Promise.resolve(undefined);
		} else if (updateInterval < 0) {
			this.logger.logFailure(Log.Failure.Label.InvalidArgument, Log.Failure.Type.Unexpected,
				{ error: "getFreshValue updateInterval parameter should be passed a number >= 0" }, "" + updateInterval);
			updateInterval = 0;
		}

		return new Promise<TimeStampedData>((resolve, reject) => {
			this.cache.getValue(key, (value) => {
				let keyIsPresent = !!value;
				if (keyIsPresent) {
					let valueAsJson: TimeStampedData;
					try {
						valueAsJson = JSON.parse(value);
					} catch (e) {
						this.logger.logJsonParseUnexpected(value);
						reject({ error: e });
					}

					let valueHasExpired = ClipperCachedHttp.valueHasExpired(valueAsJson, updateInterval);

					if (!valueHasExpired) {
						resolve(valueAsJson);
						return;
					}

					// Need to download a fresh copy of the code.
					let fetchNonLocalDataEvent: Log.Event.PromiseEvent = new Log.Event.PromiseEvent(Log.Event.Label.FetchNonLocalData);
					fetchNonLocalDataEvent.setCustomProperty(Log.PropertyName.Custom.Key, key);
					fetchNonLocalDataEvent.setCustomProperty(Log.PropertyName.Custom.UpdateInterval, updateInterval);

					fetchNonLocalData().then((responsePackage) => {
						if (responsePackage.request) {
							this.addCorrelationIdToLogEvent(fetchNonLocalDataEvent, responsePackage.request);
						}

						let setValue: TimeStampedData = this.setTimeStampedValue(key, responsePackage.parsedResponse);
						if (!setValue) {
							// Fresh data is unavailable, so we have to delete the value in storage as we were unable to refresh it
							this.cache.removeKey(key);
						}
						resolve(setValue);
					}, (error: OneNoteApi.RequestError) => {
						fetchNonLocalDataEvent.setStatus(Log.Status.Failed);
						fetchNonLocalDataEvent.setFailureInfo(error);

						this.cache.removeKey(key);
						reject(error);
					}).then(() => {
						this.logger.logEvent(fetchNonLocalDataEvent);
					});
				}
			});
		});
	}

	public static valueHasExpired(value: TimeStampedData, expiryTime = ClipperCachedHttp.defaultExpiry): boolean {
		let lastUpdated = value && value.lastUpdated ? value.lastUpdated : 0;
		return (Date.now() - lastUpdated >= expiryTime);
	}

	private addCorrelationIdToLogEvent(logEvent: Log.Event.PromiseEvent, request: XMLHttpRequest) {
		let correlationId = request.getResponseHeader(Constants.HeaderValues.correlationId);
		if (correlationId) {
			logEvent.setCustomProperty(Log.PropertyName.Custom.CorrelationId, correlationId);
		}
	}

	/*
	 * Helper function that stores a value together with a time
	 * stamp as a json string. Does not store anything and returns
	 * undefined if the specified value is null, undefined, or
	 * unable to be jsonified.
	 */
	private setTimeStampedValue(key: string, value: string): TimeStampedData {
		if (!key) {
			this.logger.logFailure(Log.Failure.Label.InvalidArgument, Log.Failure.Type.Unexpected,
				{ error: "setTimeStampedValue key parameter should be passed a non-empty string" }, "" + key);
			return undefined;
		}

		if (!value) {
			return undefined;
		}

		let valueAsJson: any;
		try {
			valueAsJson = JSON.parse(value);
		} catch (e) {
			this.logger.logJsonParseUnexpected(value);
			return undefined;
		}

		let timeStampedValue: TimeStampedData = { data: valueAsJson, lastUpdated: Date.now() };
		this.cache.setValue(key, JSON.stringify(timeStampedValue));

		return timeStampedValue;
	}
}
