import {Constants} from "../constants";
import {ResponsePackage} from "../responsePackage";
import {UrlUtils} from "../urlUtils";

import {HttpWithRetries} from "../http/HttpWithRetries";

export class LocalizationHelper {
	public static makeLocStringsFetchRequest(locale: string): Promise<ResponsePackage<string>> {
		let url = UrlUtils.addUrlQueryValue(Constants.Urls.localizedStringsUrlBase, "locale", locale);

		return HttpWithRetries.get(url).then((response: Response) => {
			return new Promise<ResponsePackage<string>>(resolve => {
				response.text().then((responseText: string) => {
					resolve({
						parsedResponse: responseText
					});
				});
			});
		});
	}
}
