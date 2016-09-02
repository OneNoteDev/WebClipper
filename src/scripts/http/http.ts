/// <reference path="../../../node_modules/onenoteapi/target/oneNoteApi.d.ts" />

interface ResponsePackage {
	parsedResponse: string;
	request: XMLHttpRequest;
}

/**
 * Helper class for performing http requests. This is a WIP and has barebones functionality, but
 * can be added to as necessary.
 * TODO: Wean this off OneNoteApi.ErrorUtils once we move the general http logic into its own package.
 */
export class Http {
	private static defaultTimeout = 30000;

	public static get(url: string, headers?: any, timeout = Http.defaultTimeout): Promise<ResponsePackage> {
		if (!url) {
			throw new Error("url must be a non-empty string, but was: " + url);
		}

		return new Promise<ResponsePackage>((resolve, reject) => {
			let request = new XMLHttpRequest();
			request.open("GET", url);

			request.timeout = timeout;

			request.onload = () => {
				if (request.status === 200) {
					resolve({ parsedResponse: request.responseText, request: request });
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

			for (let key in headers) {
				request.setRequestHeader(key, headers[key]);
			}

			request.send();
		});
	}
}
