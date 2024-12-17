import {Constants} from "../constants";
import {ResponsePackage} from "../responsePackage";

import * as Log from "../logging/log";
import {Logger} from "../logging/logger";

import {Storage} from "../storage/storage";

import {CachedHttp, GetResponseAsync, TimeStampedData} from "./cachedHttp";

/**
 * Adds Clipper-specific logging functionality to the CachedHttp.
 */
export class ClipperCachedHttp extends CachedHttp {
	private static defaultExpiry = 12 * 60 * 60 * 1000; // 12 hours

	private logger: Promise<Logger>;

	constructor(cache: Storage, logger?: Promise<Logger>) {
		super(cache);
		this.logger = logger;
	}

	public setLogger(logger: Promise<Logger>) {
		this.logger = logger;
	}

	public static getDefaultExpiry(): number {
		return ClipperCachedHttp.defaultExpiry;
	}

	// Override
	public getFreshValue(key: string, getRemoteValue: GetResponseAsync, updateInterval = ClipperCachedHttp.defaultExpiry): Promise<TimeStampedData> {
		if (!key) {
			this.logger.then(logger => logger.logFailure(Log.Failure.Label.InvalidArgument, Log.Failure.Type.Unexpected,
				{ error: "getFreshValue key parameter should be passed a non-empty string" }, "" + key));
			return Promise.resolve(undefined);
		} else if (!getRemoteValue) {
			this.logger.then(logger => logger.logFailure(Log.Failure.Label.InvalidArgument, Log.Failure.Type.Unexpected,
				{ error: "getFreshValue getRemoteValue parameter should be passed a non-undefined function" }, "" + getRemoteValue));
			return Promise.resolve(undefined);
		} else if (updateInterval < 0) {
			this.logger.then(logger => logger.logFailure(Log.Failure.Label.InvalidArgument, Log.Failure.Type.Unexpected,
				{ error: "getFreshValue updateInterval parameter should be passed a number >= 0" }, "" + updateInterval));
			updateInterval = 0;
		}

		let loggedGetRemoteValue = this.addLoggingToGetResponseAsync(key, getRemoteValue, updateInterval);

		return super.getFreshValue(key, loggedGetRemoteValue, updateInterval);
	}

	private addLoggingToGetResponseAsync(key: string, getResponseAsync: GetResponseAsync, updateInterval: number): GetResponseAsync {
		return () => {
			// Need to download a fresh copy of the code.
			let fetchNonLocalDataEvent: Log.Event.PromiseEvent = new Log.Event.PromiseEvent(Log.Event.Label.FetchNonLocalData);
			fetchNonLocalDataEvent.setCustomProperty(Log.PropertyName.Custom.Key, key);
			fetchNonLocalDataEvent.setCustomProperty(Log.PropertyName.Custom.UpdateInterval, updateInterval);

			return new Promise<ResponsePackage<string>>((resolve, reject) => {
				getResponseAsync().then((responsePackage) => {
					if (responsePackage.response) {
						ClipperCachedHttp.addCorrelationIdToLogEvent(fetchNonLocalDataEvent, responsePackage.response);
					}
					resolve(responsePackage);
				}, (error) => {
					fetchNonLocalDataEvent.setStatus(Log.Status.Failed);
					fetchNonLocalDataEvent.setFailureInfo(error);
					reject(error);
				}).then(() => {
					this.logger.then(logger => logger.logEvent(fetchNonLocalDataEvent));
				});
			});
		};
	}

	private static addCorrelationIdToLogEvent(logEvent: Log.Event.PromiseEvent, response: Response) {
		let correlationId = response.headers.get(Constants.HeaderValues.correlationId);
		if (correlationId) {
			logEvent.setCustomProperty(Log.PropertyName.Custom.CorrelationId, correlationId);
		}
	}
}
