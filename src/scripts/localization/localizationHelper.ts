/// <reference path="../../../node_modules/onenoteapi/target/oneNoteApi.d.ts" />

import {Constants} from "../constants";
import {ResponsePackage} from "../responsePackage";
import {Utils} from "../utils";

import {HttpWithRetries} from "../http/HttpWithRetries";

export class LocalizationHelper {
	public static makeLocStringsFetchRequest(locale: string): Promise<ResponsePackage<string>> {
		let url = Utils.addUrlQueryValue(Constants.Urls.localizedStringsUrlBase, "locale", locale);

		return HttpWithRetries.get(url).then((request) => {
			return Promise.resolve({
				request: request,
				parsedResponse: request.responseText
			});
		}).catch((error) => {
			return Promise.reject(error);
		});
	}
}
