/// <reference path="../../../node_modules/onenoteapi/target/oneNoteApi.d.ts" />

import {Constants} from "../constants";
import {ResponsePackage} from "../responsePackage";
import {Utils} from "../utils";

import {HttpWithRetries} from "../http/HttpWithRetries";

export class LocalizationHelper {
	public static makeLocStringsFetchRequest(locale: string): Promise<ResponsePackage<string>> {
		let url = Utils.addUrlQueryValue(Constants.Urls.localizedStringsUrlBase, "locale", locale);

		return new Promise<ResponsePackage<string>>((resolve, reject) => {
			HttpWithRetries.get(url).then((request) => {
				resolve({
					request: request,
					parsedResponse: request.responseText
				});
			}, (error) => {
				reject(error);
			});
		});
	}
}
