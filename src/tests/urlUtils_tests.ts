import {Constants} from "../scripts/constants";
import {UrlUtils} from "../scripts/urlUtils";

import {TooltipType} from "../scripts/clipperUI/tooltipType";

import {TestModule} from "./testModule";

export class UrlUtilsTests extends TestModule {
	protected module() {
		return "urlUtils";
	}

	protected tests() {
		test("addUrlQueryValue should add a name/value pair to a url that contains existing (and different) name/value pairs", () => {
			let originalUrl = "https://www.onenote.com/strings?ids=WebClipper.&pizza=cheesy&rice=fried";
			let name = "name";
			let value = "matthew";
			let newUrl = UrlUtils.addUrlQueryValue(originalUrl, name, value);
			strictEqual(newUrl, "https://www.onenote.com/strings?ids=WebClipper.&pizza=cheesy&rice=fried&name=matthew");
		});

		test("addUrlQueryValue should add a name/value pair to a url that does not already contain a name/value pair", () => {
			let originalUrl = "http://www.onenote.com/strings";
			let name = "ids";
			let value = "Whatever";
			let newUrl = UrlUtils.addUrlQueryValue(originalUrl, name, value);
			strictEqual(newUrl, "http://www.onenote.com/strings?ids=Whatever");
		});

		test("addUrlQueryValue should add a name/value pair correctly if the url contains a fragment and a name/value pair", () => {
			let originalUrl = "https://www.onenote.com/strings?ids=WebClipper.#frag";
			let name = "k";
			let value = "p";
			let newUrl = UrlUtils.addUrlQueryValue(originalUrl, name, value);
			strictEqual(newUrl, "https://www.onenote.com/strings?ids=WebClipper.&k=p#frag");
		});

		test("addUrlQueryValue should add a name/value pair correctly if the url contains a fragment but not a name/value pair", () => {
			let originalUrl = "https://www.onenote.com/strings#frag";
			let name = "k";
			let value = "p";
			let newUrl = UrlUtils.addUrlQueryValue(originalUrl, name, value);
			strictEqual(newUrl, "https://www.onenote.com/strings?k=p#frag");
		});

		test("addUrlQueryValue should replace the value of an existing name in the query string", () => {
			let originalUrl = "http://www.onenote.com/strings?ids=old";
			let name = "ids";
			let value = "new";
			let newUrl = UrlUtils.addUrlQueryValue(originalUrl, name, value);
			strictEqual(newUrl, "http://www.onenote.com/strings?ids=new");
		});

		test("addUrlQueryValue should return the originalUrl parameter when passed an empty url", () => {
			let url = "";
			strictEqual(UrlUtils.addUrlQueryValue(url, "name", "value"), url, "The originalUrl should be returned");
		});

		test("addUrlQueryValue should return the originalUrl parameter when passed a null url", () => {
			/* tslint:disable:no-null-keyword */
			let url = null;
			strictEqual(UrlUtils.addUrlQueryValue(url, "name", "value"), url, "The originalUrl should be returned");
			/* tslint:enable:no-null-keyword */
		});

		test("addUrlQueryValue should return the originalUrl parameter when passed an undefined url", () => {
			let url = undefined;
			strictEqual(UrlUtils.addUrlQueryValue(url, "name", "value"), url, "The originalUrl should be returned");
		});

		test("addUrlQueryValue should return the originalUrl parameter when passed an empty name", () => {
			let url = "http://www.thiswebsite.rules/strings?";
			strictEqual(UrlUtils.addUrlQueryValue(url, "", "value"), url, "The originalUrl should be returned");
		});

		test("addUrlQueryValue should return the originalUrl parameter when passed a null name", () => {
			/* tslint:disable:no-null-keyword */
			let url = "http://www.thiswebsite.rules/strings?";
			strictEqual(UrlUtils.addUrlQueryValue(url, null, "value"), url, "The originalUrl should be returned");
			/* tslint:enable:no-null-keyword */
		});

		test("addUrlQueryValue should return the originalUrl parameter when passed an undefined name", () => {
			let url = "http://www.thiswebsite.rules/strings?";
			strictEqual(UrlUtils.addUrlQueryValue(url, undefined, "value"), url, "The originalUrl should be returned");
		});

		test("addUrlQueryValue should return the originalUrl parameter when passed an empty value", () => {
			let url = "http://www.thiswebsite.rules/strings?";
			strictEqual(UrlUtils.addUrlQueryValue(url, "name", ""), url, "The originalUrl should be returned");
		});

		test("addUrlQueryValue should return the originalUrl parameter when passed a null value", () => {
			/* tslint:disable:no-null-keyword */
			let url = "http://www.thiswebsite.rules/strings?";
			strictEqual(UrlUtils.addUrlQueryValue(url, "name", null), url, "The originalUrl should be returned");
			/* tslint:enable:no-null-keyword */
		});

		test("addUrlQueryValue should return the originalUrl parameter when passed an undefined value", () => {
			let url = "http://www.thiswebsite.rules/strings?";
			strictEqual(UrlUtils.addUrlQueryValue(url, "name", undefined), url, "The originalUrl should be returned");
		});

		test("addUrlQueryValue should camel case the query param key added when told to do so", () => {
			let url = "http://www.thiswebsite.rules?name1=value1";
			let key = "name2";
			strictEqual(UrlUtils.addUrlQueryValue(url, key, "value2", true), url + "&Name2=value2", "'" + key + "' should be camel cased in the url");
		});

		test("getFileNameFromUrl should return the file name when the url has a pdf file name", () => {
			let fileName = UrlUtils.getFileNameFromUrl("www.website.com/my-file.pdf");
			strictEqual(fileName, "my-file.pdf", "File name should be retrieved from url");
		});

		test("getFileNameFromUrl should return the file name when the url has a doc file name", () => {
			let fileName = UrlUtils.getFileNameFromUrl("www.website.com/my-file.doc");
			strictEqual(fileName, "my-file.doc", "File name should be retrieved from url");
		});

		test("getFileNameFromUrl should return the file name when the url has a doc file name and a number in the file name", () => {
			let fileName = UrlUtils.getFileNameFromUrl("www.website.com/1my-file5.doc");
			strictEqual(fileName, "1my-file5.doc", "File name should be retrieved from url");
		});

		test("getFileNameFromUrl should return the file name when the url has a doc file name and a number in the extension", () => {
			let fileName = UrlUtils.getFileNameFromUrl("www.website.com/my-file.7zip");
			strictEqual(fileName, "my-file.7zip", "File name should be retrieved from url");
		});

		test("getFileNameFromUrl should return the file name when the url has a doc file name while preserving casing", () => {
			let fileName = UrlUtils.getFileNameFromUrl("www.website.com/FILE.json");
			strictEqual(fileName, "FILE.json", "File name should be retrieved from url while preserving casing");
		});

		test("getFileNameFromUrl should return the file name when the url has a doc file name and the url is valid but unusual/unexpected", () => {
			let fileName = UrlUtils.getFileNameFromUrl("www.website.website/file.json");
			strictEqual(fileName, "file.json", "File name should be retrieved from url");
			fileName = UrlUtils.getFileNameFromUrl("http://www.website.com/file.json");
			strictEqual(fileName, "file.json", "File name should be retrieved from url");
			fileName = UrlUtils.getFileNameFromUrl("https://www.website.com/file.json");
			strictEqual(fileName, "file.json", "File name should be retrieved from url");
			fileName = UrlUtils.getFileNameFromUrl("website.com/file.json");
			strictEqual(fileName, "file.json", "File name should be retrieved from url");
			fileName = UrlUtils.getFileNameFromUrl("www.website.com/really/long/url/5/file.json");
			strictEqual(fileName, "file.json", "File name should be retrieved from url");
			fileName = UrlUtils.getFileNameFromUrl("www.0800-website.reviews/file.json");
			strictEqual(fileName, "file.json", "File name should be retrieved from url");
		});

		test("getFileNameFromUrl should return undefined when the url has no file name by default", () => {
			let fileName = UrlUtils.getFileNameFromUrl("www.website.com/");
			strictEqual(fileName, undefined, "File name should be retrieved from url while preserving casing");
			fileName = UrlUtils.getFileNameFromUrl("www.website.com");
			strictEqual(fileName, undefined, "File name should be retrieved from url while preserving casing");
			fileName = UrlUtils.getFileNameFromUrl("website.com");
			strictEqual(fileName, undefined, "File name should be retrieved from url while preserving casing");
			fileName = UrlUtils.getFileNameFromUrl("wus.www.website.com");
			strictEqual(fileName, undefined, "File name should be retrieved from url while preserving casing");
			fileName = UrlUtils.getFileNameFromUrl("wus.www.website.com/pages/5");
			strictEqual(fileName, undefined, "File name should be retrieved from url while preserving casing");
		});

		test("getFileNameFromUrl should return the fallback when the url has no file name when the fallback is specified", () => {
			let fallback = "Fallback.xyz";
			let fileName = UrlUtils.getFileNameFromUrl("www.website.com/", fallback);
			strictEqual(fileName, fallback, "File name should be retrieved from url while preserving casing");
			fileName = UrlUtils.getFileNameFromUrl("www.website.com", fallback);
			strictEqual(fileName, fallback, "File name should be retrieved from url while preserving casing");
			fileName = UrlUtils.getFileNameFromUrl("website.com", fallback);
			strictEqual(fileName, fallback, "File name should be retrieved from url while preserving casing");
			fileName = UrlUtils.getFileNameFromUrl("wus.www.website.com", fallback);
			strictEqual(fileName, fallback, "File name should be retrieved from url while preserving casing");
			fileName = UrlUtils.getFileNameFromUrl("wus.www.website.com/pages/5", fallback);
			strictEqual(fileName, fallback, "File name should be retrieved from url while preserving casing");
		});

		test("getFileNameFromUrl should return the fallback when passed an empty url", () => {
			let fallback = "Fallback.xyz";
			strictEqual(UrlUtils.getFileNameFromUrl("", fallback), fallback,
				"The fallback should be returned");
		});

		test("getFileNameFromUrl should return the fallback when passed a null url", () => {
			/* tslint:disable:no-null-keyword */
			let fallback = "Fallback.xyz";
			strictEqual(UrlUtils.getFileNameFromUrl(null, fallback), fallback,
				"The fallback should be returned");
			/* tslint:enable:no-null-keyword */
		});

		test("getFileNameFromUrl should return the fallback when passed an undefined url", () => {
			let fallback = "Fallback.xyz";
			strictEqual(UrlUtils.getFileNameFromUrl(undefined, fallback), fallback,
				"The fallback should be returned");
		});

		test("getQueryValue should return the query value in the general case", () => {
			let url = "www.website.com/stuff?q=v";
			strictEqual(UrlUtils.getQueryValue(url, "q"), "v");
		});

		test("getQueryValue should return the query value when there is more than one pair", () => {
			let url = "www.website.com/stuff?q=v&q1=v1&q2=v2";
			strictEqual(UrlUtils.getQueryValue(url, "q"), "v");
			strictEqual(UrlUtils.getQueryValue(url, "q1"), "v1");
			strictEqual(UrlUtils.getQueryValue(url, "q2"), "v2");
		});

		test("getQueryValue should return undefined if the key doesn't exist", () => {
			let url = "www.website.com/stuff?q=v";
			strictEqual(UrlUtils.getQueryValue(url, "notexist"), undefined);
		});

		test("getQueryValue should return undefined if no keys exist", () => {
			let url = "www.website.com/stuff?";
			strictEqual(UrlUtils.getQueryValue(url, "notexist"), undefined);
			url = "www.website.com/stuff";
			strictEqual(UrlUtils.getQueryValue(url, "notexist"), undefined);
		});

		test("getQueryValue should return empty string if the key exists but the value doesn't", () => {
			let url = "www.website.com/stuff?q=";
			strictEqual(UrlUtils.getQueryValue(url, "q"), "");
		});

		test("getQueryValue should return undefined if any of the parameters are undefined or empty string", () => {
			strictEqual(UrlUtils.getQueryValue("www.website.com/stuff?q=v", undefined), undefined);
			strictEqual(UrlUtils.getQueryValue(undefined, "q"), undefined);
			strictEqual(UrlUtils.getQueryValue("www.website.com/stuff?q=v", ""), undefined);
			strictEqual(UrlUtils.getQueryValue("", "q"), undefined);
		});

		test("getQueryValue should return a valid error if an error is specified.", () => {
			let url = "https://www.onenote.com/webclipper/auth?error=access_denied&error_description=AADSTS50000:+There+was+an+error+issuing+a+token.&state=abcdef12-6ac8-41bd-0445-f7ef7a4182e7";
			strictEqual(UrlUtils.getQueryValue(url, Constants.Urls.QueryParams.error), "access_denied");
		});

		test("getQueryValue should return a valid error description if an O365 error_description is specified.", () => {
			let url = "https://www.onenote.com/webclipper/auth?error=access_denied&error_description=AADSTS50000:+There+was+an+error+issuing+a+token.&state=abcdef12-6ac8-41bd-0445-f7ef7a4182e7";
			strictEqual(UrlUtils.getQueryValue(url, Constants.Urls.QueryParams.errorDescription), "AADSTS50000: There was an error issuing a token.");
		});

		test("getQueryValue should return a valid error description if an MSA errorDescription is specified.", () => {
			let url = "https://www.onenote.com/webclipper/auth?error=access_denied&errorDescription=AADSTS50000:+There+was+an+error+issuing+a+token.&state=abcdef12-6ac8-41bd-0445-f7ef7a4182e7";
			strictEqual(UrlUtils.getQueryValue(url, Constants.Urls.QueryParams.errorDescription), "AADSTS50000: There was an error issuing a token.");
		});

		test("onWhiteListedDomain should return true for urls with /yyyy/mm/dd/", () => {
			ok(UrlUtils.onWhitelistedDomain("http://www.sdfdsfsdasdsa.com/2014/09/25/garden/when-blogging-becomes-a-slog.html?_r=1"));
		});

		test("onWhiteListedDomain should return true for urls with /yyyy/mm/", () => {
			ok(UrlUtils.onWhitelistedDomain("http://www.sdfdsfsdasdsa.com/2014/09/garden/when-blogging-becomes-a-slog.html?_r=1"));
		});

		test("onWhiteListedDomain should return true for urls with /yy/mm/", () => {
			ok(UrlUtils.onWhitelistedDomain("http://www.sdfdsfsdasdsa.com/16/09/garden/when-blogging-becomes-a-slog.html?_r=1"));
		});

		test("onWhiteListedDomain should return true for urls with /yyyy/m/", () => {
			ok(UrlUtils.onWhitelistedDomain("http://www.sdfdsfsdasdsa.com/2014/1/garden/when-blogging-becomes-a-slog.html?_r=1"));
		});

		test("onWhiteListedDomain should return true for urls dash-seperated dates assuming they include the year, month, and day", () => {
			ok(UrlUtils.onWhitelistedDomain("http://www.sdfdsfsdasdsa.com/2014-09-25/garden/when-blogging-becomes-a-slog.html?_r=1"));
		});

		test("onWhiteListedDomain should return false for urls dash-seperated dates assuming they do not include the year, month, and day", () => {
			ok(!UrlUtils.onWhitelistedDomain("http://www.sdfdsfsdasdsa.com/2014-09/garden/when-blogging-becomes-a-slog.html?_r=1"));
		});

		test("onWhiteListedDomain should return false for urls with just years", () => {
			ok(!UrlUtils.onWhitelistedDomain("http://www.sdfdsfsdasdsa.com/2014/garden/when-blogging-becomes-a-slog.html?_r=1"));
		});

		test("onWhiteListedDomain should return false given undefined or empty string", () => {
			ok(!UrlUtils.onWhitelistedDomain(""));
			ok(!UrlUtils.onWhitelistedDomain(undefined));
		});

		test("getPathName should return a valid path given a valid URL", () => {
			ok(UrlUtils.getPathname("https://www.foo.com/bar/blah"), "/bar/blah");
			ok(UrlUtils.getPathname("https://www.youtube.com/watch?v=dQw4w9WgXcQ"), "/watch");
			ok(UrlUtils.getPathname("https://www.youtube.com"), "/");
		});

		let tooltipsToTest = [TooltipType.Pdf, TooltipType.Product, TooltipType.Recipe];
		test("checkIfUrlMatchesAContentType should return UNDEFINED for an undefined, null, or empty URL", () => {
			ok(!UrlUtils.checkIfUrlMatchesAContentType(undefined, tooltipsToTest));
			/* tslint:disable:no-null-keyword */
			ok(!UrlUtils.checkIfUrlMatchesAContentType(null, tooltipsToTest));
			/* tslint:enable:no-null-keyword */
			ok(!UrlUtils.checkIfUrlMatchesAContentType("", tooltipsToTest));
		});

		test("checkIfUrlMatchesAContentType for PDF should return UNDEFINED for a valid URL without .pdf at the end", () => {
			ok(!UrlUtils.checkIfUrlMatchesAContentType("https://www.fistbump.reviews", tooltipsToTest));
			ok(!UrlUtils.checkIfUrlMatchesAContentType("https://fistbumppdfs.reviews", tooltipsToTest));
		});

		test("checkIfUrlMatchesAContentType for PDF should return PDF for a valid URL with .pdf at the end, case insensitive", () => {
			strictEqual(UrlUtils.checkIfUrlMatchesAContentType("https://wwww.wen.jen/shipItFresh.pdf", tooltipsToTest), TooltipType.Pdf);
			strictEqual(UrlUtils.checkIfUrlMatchesAContentType("http://www.orimi.com/pdf-test.PDF", tooltipsToTest), TooltipType.Pdf);
		});

		test("checkIfUrlMatchesAContentType for Product should return UNDEFINED for an invalid url", () => {
			ok(!UrlUtils.checkIfUrlMatchesAContentType("https://www.onenote.com/clipper", tooltipsToTest));
		});

		test("checkIfUrlMatchesAContentType for Product should return Product for a valid Wal-mart URL", () => {
			strictEqual(UrlUtils.checkIfUrlMatchesAContentType("http://www.walmart.com/ip/49424374", tooltipsToTest), TooltipType.Product);
		});

		test("checkIfUrlMatchesAContentType for Recipe should return UNDEFINED for a valid url that isnt in the regex match", () => {
			ok(!UrlUtils.checkIfUrlMatchesAContentType("https://www.onenote.com/clipper", tooltipsToTest));
		});

		test("checkIfUrlMatchesAContentType for Recipe should return RECIPE for a valid URL", () => {
			strictEqual(UrlUtils.checkIfUrlMatchesAContentType("http://www.chowhound.com/recipes/easy-grilled-cheese-31834", tooltipsToTest), TooltipType.Recipe);
		});
	}
}

(new UrlUtilsTests()).runTests();
