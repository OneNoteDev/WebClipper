/// <reference path="../../../node_modules/onenoteapi/target/oneNoteApi.d.ts" />

import {Utils} from "../utils";

interface ResponsePackage {
	parsedResponse: string;
	request: XMLHttpRequest;
}

/**
 * Helper class for performing http requests. For each of the http methods, resolve(request) is only
 * called if the status code is an unexpected one, defined by the caller (defaulting to 200 only).
 *
 * TODO: Wean this off OneNoteApi.ErrorUtils once we move the general http logic into its own package.
 */
export class Http {
	private static defaultTimeout = 30000;

	public static get(url: string, headers?: any, timeout = Http.defaultTimeout, expectedCodes = [200]): Promise<XMLHttpRequest> {
		return Http.createAndSendRequest("GET", url, headers, expectedCodes, timeout);
	}

	public static post(url: string, data: any, headers?: any, expectedCodes = [200], timeout = Http.defaultTimeout): Promise<XMLHttpRequest> {
		if (Utils.isNullOrUndefined(data)) {
			throw new Error("data must be a non-undefined object, but was: " + data);
		}
		return Http.createAndSendRequest("POST", url, headers, expectedCodes, timeout, data);
	}

	private static createAndSendRequest(method: string, url: string, headers?: any, expectedCodes = [200], timeout = Http.defaultTimeout, data?: any): Promise<XMLHttpRequest> {
		if (!url) {
			throw new Error("url must be a non-empty string, but was: " + url);
		}

		return new Promise<XMLHttpRequest>((resolve, reject) => {
			let request = new XMLHttpRequest();
			request.open(method, url);

			request.onload = () => {
				if (expectedCodes.indexOf(request.status) > -1) {
					resolve(request);
				} else {
					reject(OneNoteApi.ErrorUtils.createRequestErrorObject(request, OneNoteApi.RequestErrorType.UNEXPECTED_RESPONSE_STATUS));
				}
			};

			request.onerror = () => {
				reject(OneNoteApi.ErrorUtils.createRequestErrorObject(request, OneNoteApi.RequestErrorType.NETWORK_ERROR));
			};

			request.ontimeout = () => {
				reject(OneNoteApi.ErrorUtils.createRequestErrorObject(request, OneNoteApi.RequestErrorType.REQUEST_TIMED_OUT));
			};

			Http.setHeaders(request, headers);
			request.timeout = timeout;

			request.send(data);
		});
	}

	private static setHeaders(request: XMLHttpRequest, headers: any): void {
		if (headers) {
			for (let key in headers) {
				request.setRequestHeader(key, headers[key]);
			}
		}
	}
}
