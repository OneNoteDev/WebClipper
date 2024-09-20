import { ObjectUtils } from "../objectUtils";

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
	protected static defaultTimeout = 30000;

	public static get(url: string, headers?: any, timeout = Http.defaultTimeout, expectedCodes = [200]): Promise<void> {
		return Http.createAndSendRequest("GET", url, headers, expectedCodes, timeout);
	}

	public static post(url: string, data: any, headers?: any, expectedCodes = [200], timeout = Http.defaultTimeout): Promise<void> {
		if (ObjectUtils.isNullOrUndefined(data)) {
			throw new Error("data must be a non-undefined object, but was: " + data);
		}
		return Http.createAndSendRequest("POST", url, headers, expectedCodes, timeout, data);
	}

	protected static createAndSendRequest(method: string, url: string, headers?: any, expectedCodes = [200], timeout = Http.defaultTimeout, data?: any): Promise<void> {
		if (!url) {
			throw new Error("url must be a non-empty string, but was: " + url);
		}

		return new Promise<void>(() => {});

		/* return new Promise<string>((resolve, reject) => {
			fetch(url, {
				method: method,
				headers: headers,
				body: data
			}).then((response: any) => {
				if (expectedCodes.indexOf(response.status) > -1) {
					resolve(JSON.parse(response) as string);
				} else {
					reject(OneNoteApi.ErrorUtils.createRequestErrorObject(Response, OneNoteApi.RequestErrorType.UNEXPECTED_RESPONSE_STATUS));
					reject(OneNoteApi.RequestErrorType.UNEXPECTED_RESPONSE_STATUS);
				}
			}).catch(() => {
				reject(OneNoteApi.ErrorUtils.createRequestErrorObject(response, OneNoteApi.RequestErrorType.NETWORK_ERROR));
				reject(OneNoteApi.RequestErrorType.NETWORK_ERROR);
			});

			setTimeout(() => {
				reject(OneNoteApi.ErrorUtils.createRequestErrorObject(response, OneNoteApi.RequestErrorType.REQUEST_TIMED_OUT));
				reject(OneNoteApi.RequestErrorType.REQUEST_TIMED_OUT);
			}, timeout);
		}); */
	}
}
