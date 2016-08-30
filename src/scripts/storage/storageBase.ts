/// <reference path="../../../node_modules/onenoteapi/target/oneNoteApi.d.ts" />

import {Constants} from "../constants";
import {ResponsePackage} from "../responsePackage";
import {Utils} from "../utils";

import * as Log from "../logging/log";
import {Logger} from "../logging/logger";

export interface TimeStampedData {
	data: any;
	lastUpdated: number;
}

export class StorageBase {
	public static defaultInterval = 12 * 60 * 60 * 1000; // Update after 12 hours.

	private logger: Logger;

	constructor(logger?: Logger) {
		this.logger = logger;
	}

	// TODO: verify that the logger gets set before being used
	public setLogger(logger: Logger) {
		this.logger = logger;
	}

	/*
	 * Get a value from local storage. Callback is passed undefined
	 * if the specified key has no corresponding value.
	 */
	public getValue(key: string): string {
		let result: string;
		if (window.localStorage) {
			result = window.localStorage.getItem(key);
			if (!result) {
				// Somehow we stored an invalid value. Destroy it!
				this.removeKey(key);
			}
		}
		return result;
	}

	/*
	 * Set a value in local storage
	 */
	public setValue(key: string, value: string): void {
		if (window.localStorage) {
			if (!value) {
				window.localStorage.removeItem(key);
			} else {
				window.localStorage.setItem(key, value);
			}
		}
	}

	/*
	 * Removes the value associated with the given key in local storage
	 */
	public removeKey(key: string): void {
		if (window.localStorage) {
			window.localStorage.removeItem(key);
		}
	}

	public static valueHasExpired(value: TimeStampedData, updateInterval: number = StorageBase.defaultInterval): boolean {
		let lastUpdated = value && value.lastUpdated ? value.lastUpdated : 0;
		return (Date.now() - lastUpdated >= updateInterval);
	}

	/*
	 * Returns the cached timestamped value if it's still fresh, otherwise calls the given
	 * function (that should return a promise) and returns the resulting value (which is also timestamped and cached).
	 *
	 * updateInterval can be set to 0 to force retrieval of fresh value from the url.
	 */
	public getFreshValue(key: string, fetchNonLocalData: () => Promise<ResponsePackage<string>>, updateInterval = StorageBase.defaultInterval): Promise<TimeStampedData> {
		if (!key) {
			this.logger.logFailure(Log.Failure.Label.InvalidArgument, Log.Failure.Type.Unexpected,
				{ error: "getFreshValue key parameter should be passed a non-empty string" }, "" + key);
			return Promise.resolve(undefined);
		} else if (!fetchNonLocalData) {
			this.logger.logFailure(Log.Failure.Label.InvalidArgument, Log.Failure.Type.Unexpected,
				{ error: "getFreshValue fetchNonLocalData parameter should be passed a function" }, "" + fetchNonLocalData);
		} else if (updateInterval < 0) {
			this.logger.logFailure(Log.Failure.Label.InvalidArgument, Log.Failure.Type.Unexpected,
				{ error: "getFreshValue updateInterval parameter should be passed a number >= 0" }, "" + updateInterval);
			updateInterval = 0;
		}

		return new Promise<TimeStampedData>((resolve, reject) => {
			let value = this.getValue(key);

			let keyIsPresent = !!value;
			if (keyIsPresent) {
				let valueAsJson: TimeStampedData;
				try {
					valueAsJson = JSON.parse(value);
				} catch (e) {
					this.logger.logJsonParseUnexpected(value);
					reject({ error: e });
				}

				let valueHasExpired = StorageBase.valueHasExpired(valueAsJson, updateInterval);

				if (!valueHasExpired) {
					resolve(valueAsJson);
					return;
				}
			}

			if (!fetchNonLocalData) {
				resolve(undefined);
				return;
			}

			// Need to download a fresh copy of the code.
			let fetchNonLocalDataEvent: Log.Event.PromiseEvent = new Log.Event.PromiseEvent(Log.Event.Label.FetchNonLocalData);
			fetchNonLocalDataEvent.setCustomProperty(Log.PropertyName.Custom.Key, key);
			fetchNonLocalDataEvent.setCustomProperty(Log.PropertyName.Custom.UpdateInterval, updateInterval);

			fetchNonLocalData().then((responsePackage) => {
				if (responsePackage.request) {
					let correlationId = responsePackage.request.getResponseHeader(Constants.HeaderValues.correlationId);
					if (correlationId) {
						fetchNonLocalDataEvent.setCustomProperty(Log.PropertyName.Custom.CorrelationId, correlationId);
					}
				}

				let setValue: TimeStampedData = this.setTimeStampedValue(key, responsePackage.parsedResponse);
				if (!setValue) {
					// Fresh data is unavailable, so we have to delete the value in storage as we were unable to refresh it
					this.removeKey(key);
				}
				resolve(setValue);
			}, (error: OneNoteApi.RequestError) => {
				fetchNonLocalDataEvent.setStatus(Log.Status.Failed);
				fetchNonLocalDataEvent.setFailureInfo(error);

				this.removeKey(key);
				reject(error);
			}).then(() => {
				this.logger.logEvent(fetchNonLocalDataEvent);
			});
		});
	}

	/*
	 * Calls the endpoint URL and returns the resulting data.
	 */
	public httpGet(url: string, headers?: any): Promise<ResponsePackage<string>> {
		if (!url) {
			this.logger.logFailure(Log.Failure.Label.InvalidArgument, Log.Failure.Type.Unexpected,
				{ error: "httpGet url parameter should be passed a non-empty string" }, "" + url);
			throw new Error("url must be a non-empty string, but was: " + url);
		}

		return new Promise<ResponsePackage<string>>((resolve, reject) => {
			let request = new XMLHttpRequest();
			request.open("GET", url);

			request.timeout = 30000; // Giving it a healthy timeout value to avoid slow connection problems.

			request.onload = () => {
				resolve({ parsedResponse: request.responseText, request: request });
			};

			request.onerror = () => {
				reject(OneNoteApi.ErrorUtils.createRequestErrorObject(request, OneNoteApi.RequestErrorType.NETWORK_ERROR));
			};

			request.ontimeout = () => {
				reject(OneNoteApi.ErrorUtils.createRequestErrorObject(request, OneNoteApi.RequestErrorType.REQUEST_TIMED_OUT));
			};

			for (let key in headers) {
				request.setRequestHeader(key, headers[key]);
			}

			request.send();
		});
	}

	/*
	 * Helper function that stores a value together with a time
	 * stamp as a json string. Does not store anything and returns
	 * undefined if the specified value is null, undefined, or
	 * unable to be jsonified.
	 */
	public setTimeStampedValue(key: string, value: string): TimeStampedData {
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
		this.setValue(key, JSON.stringify(timeStampedValue));

		return timeStampedValue;
	}
}
