import {ResponsePackage} from "../responsePackage";

import {Storage} from "../storage/storage";

export interface TimeStampedData {
	data: any;
	lastUpdated: number;
}

export type GetResponseAsync = () => Promise<ResponsePackage<string>>;

/**
 * Allows the creation of HTTP GET requests to retrieve data, as well as caching of the result.
 */
export class CachedHttp {
	private cache: Storage;

	constructor(cache: Storage) {
		this.cache = cache;
	}

	/**
	 * Given a key, checks the cache for a fresh copy of that value. If the cached value does
	 * not exist, or is not fresh, fetches a fresh copy of the data from the specified endpoint.
	 */
	public getFreshValue(key: string, getRemoteValue: GetResponseAsync, updateInterval: number): Promise<TimeStampedData> {
		if (!key) {
			throw new Error("key must be a non-empty string, but was: " + key);
		} else if (!getRemoteValue) {
			throw new Error("getRemoteValue must be non-undefined");
		} else if (updateInterval < 0) {
			updateInterval = 0;
		}

		let value = this.cache.getValue(key);
		let keyIsPresent = !!value;
		if (keyIsPresent) {
			let valueAsJson: TimeStampedData;
			try {
				valueAsJson = JSON.parse(value);
			} catch (e) {
				return Promise.reject({ error: e });
			}

			let valueHasExpired = CachedHttp.valueHasExpired(valueAsJson, updateInterval);

			if (!valueHasExpired) {
				return Promise.resolve(valueAsJson);
			}
		}

		return this.getAndCacheRemoteValue(key, getRemoteValue).catch((error) => {
			return Promise.reject(error);
		});
	}

	protected getAndCacheRemoteValue(key: string, getRemoteValue: GetResponseAsync): Promise<TimeStampedData> {
		if (!key) {
			throw new Error("key must be a non-empty string, but was: " + key);
		}

		if (!getRemoteValue) {
			throw new Error("getRemoteValue must be non-undefined");
		}

		return getRemoteValue().then((responsePackage) => {
			let setValue: TimeStampedData = this.setTimeStampedValue(key, responsePackage.parsedResponse);
			if (!setValue) {
				// Fresh data from the remote was unavailable
				this.cache.removeKey(key);
			}
			return Promise.resolve(setValue);
		}).catch((error: OneNoteApi.RequestError) => {
			// TODO: Don't use OneNoteApi.RequestError
			this.cache.removeKey(key);
			return Promise.reject(error);
		});
	}

	/**
	 * Returns true if the timestamped data is older than the expiry time; false otherwise.
	 */
	public static valueHasExpired(value: TimeStampedData, expiryTime: number): boolean {
		let lastUpdated = value && value.lastUpdated ? value.lastUpdated : 0;
		return (Date.now() - lastUpdated >= expiryTime);
	}

	/*
	 * Helper function that stores a value together with a timestamp as a json string. If
	 * the specified value is null, undefined, or unable to be jsonified, the value is not
	 * stored, and undefined is returned.
	 */
	private setTimeStampedValue(key: string, value: string): TimeStampedData {
		if (!key) {
			throw new Error("key must be a non-empty string, but was: " + key);
		}

		if (!value) {
			return undefined;
		}

		let valueAsJson: any;
		try {
			valueAsJson = JSON.parse(value);
		} catch (e) {
			return undefined;
		}

		let timeStampedValue: TimeStampedData = { data: valueAsJson, lastUpdated: Date.now() };
		this.cache.setValue(key, JSON.stringify(timeStampedValue));

		return timeStampedValue;
	}
}
