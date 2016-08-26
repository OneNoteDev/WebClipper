/// <reference path="../../../node_modules/onenoteapi/target/oneNoteApi.d.ts" />

import {Constants} from "../constants";
import {ResponsePackage} from "../responsePackage";
import {Utils} from "../utils";

export class LocalizationHelper {
	public static makeLocStringsFetchRequest(locale: string): Promise<ResponsePackage<string>> {
		let url = Utils.addUrlQueryValue(Constants.Urls.localizedStringsUrlBase, "locale", locale);

		return new Promise<ResponsePackage<string>>((resolve, reject) => {
			let request = new XMLHttpRequest();
			request.open("GET", url);

			request.timeout = 30000;

			// onload and onerror are not supported on older versions of IE
			request.onreadystatechange = () => {
				if (request.readyState === 4) {
					let status = request.status;
					if (status === 200) {
						resolve({
							parsedResponse: request.responseText,
							request: request
						});
					} else if (status === 0) {
						reject(OneNoteApi.ErrorUtils.createRequestErrorObject(request, OneNoteApi.RequestErrorType.NETWORK_ERROR));
					} else {
						reject(OneNoteApi.ErrorUtils.createRequestErrorObject(request, OneNoteApi.RequestErrorType.UNEXPECTED_RESPONSE_STATUS));
					}
				}
			};

			request.ontimeout = () => {
				reject(OneNoteApi.ErrorUtils.createRequestErrorObject(request, OneNoteApi.RequestErrorType.REQUEST_TIMED_OUT));
			};

			request.send();
		});
	}
}
