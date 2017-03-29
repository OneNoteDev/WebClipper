import {Constants} from "../constants";
import {ResponsePackage} from "../responsePackage";
import {UrlUtils} from "../urlUtils";

import {HttpWithRetries} from "../http/httpWithRetries";

export class LocalizationHelper {
	public static makeLocStringsFetchRequest(locale: string): Promise<ResponsePackage<string>> {
		let url = UrlUtils.addUrlQueryValue(Constants.Urls.localizedStringsUrlBase, "locale", locale);

		return HttpWithRetries.get(url).then((request) => {
			return Promise.resolve({
				request: request,
				parsedResponse: request.responseText
			});
		});
	}
}
