import {Constants} from "../scripts/constants";
import {Utils} from "../scripts/utils";

import {TooltipType} from "../scripts/clipperUI/tooltipType";

QUnit.module("utils", {});

test("addUrlQueryValue should add a name/value pair to a url that contains existing (and different) name/value pairs", () => {
	let originalUrl = "https://www.onenote.com/strings?ids=WebClipper.&pizza=cheesy&rice=fried";
	let name = "name";
	let value = "matthew";
	let newUrl = Utils.addUrlQueryValue(originalUrl, name, value);
	strictEqual(newUrl, "https://www.onenote.com/strings?ids=WebClipper.&pizza=cheesy&rice=fried&name=matthew");
});

test("addUrlQueryValue should add a name/value pair to a url that does not already contain a name/value pair", () => {
	let originalUrl = "http://www.onenote.com/strings";
	let name = "ids";
	let value = "Whatever";
	let newUrl = Utils.addUrlQueryValue(originalUrl, name, value);
	strictEqual(newUrl, "http://www.onenote.com/strings?ids=Whatever");
});

test("addUrlQueryValue should add a name/value pair correctly if the url contains a fragment and a name/value pair", () => {
	let originalUrl = "https://www.onenote.com/strings?ids=WebClipper.#frag";
	let name = "k";
	let value = "p";
	let newUrl = Utils.addUrlQueryValue(originalUrl, name, value);
	strictEqual(newUrl, "https://www.onenote.com/strings?ids=WebClipper.&k=p#frag");
});

test("addUrlQueryValue should add a name/value pair correctly if the url contains a fragment but not a name/value pair", () => {
	let originalUrl = "https://www.onenote.com/strings#frag";
	let name = "k";
	let value = "p";
	let newUrl = Utils.addUrlQueryValue(originalUrl, name, value);
	strictEqual(newUrl, "https://www.onenote.com/strings?k=p#frag");
});

test("addUrlQueryValue should replace the value of an existing name in the query string", () => {
	let originalUrl = "http://www.onenote.com/strings?ids=old";
	let name = "ids";
	let value = "new";
	let newUrl = Utils.addUrlQueryValue(originalUrl, name, value);
	strictEqual(newUrl, "http://www.onenote.com/strings?ids=new");
});

test("addUrlQueryValue should return the originalUrl parameter when passed an empty url", () => {
	let url = "";
	strictEqual(Utils.addUrlQueryValue(url, "name", "value"), url, "The originalUrl should be returned");
});

test("addUrlQueryValue should return the originalUrl parameter when passed a null url", () => {
	/* tslint:disable:no-null-keyword */
	let url = null;
	strictEqual(Utils.addUrlQueryValue(url, "name", "value"), url, "The originalUrl should be returned");
	/* tslint:enable:no-null-keyword */
});

test("addUrlQueryValue should return the originalUrl parameter when passed an undefined url", () => {
	let url = undefined;
	strictEqual(Utils.addUrlQueryValue(url, "name", "value"), url, "The originalUrl should be returned");
});

test("addUrlQueryValue should return the originalUrl parameter when passed an empty name", () => {
	let url = "http://www.thiswebsite.rules/strings?";
	strictEqual(Utils.addUrlQueryValue(url, "", "value"), url, "The originalUrl should be returned");
});

test("addUrlQueryValue should return the originalUrl parameter when passed a null name", () => {
	/* tslint:disable:no-null-keyword */
	let url = "http://www.thiswebsite.rules/strings?";
	strictEqual(Utils.addUrlQueryValue(url, null, "value"), url, "The originalUrl should be returned");
	/* tslint:enable:no-null-keyword */
});

test("addUrlQueryValue should return the originalUrl parameter when passed an undefined name", () => {
	let url = "http://www.thiswebsite.rules/strings?";
	strictEqual(Utils.addUrlQueryValue(url, undefined, "value"), url, "The originalUrl should be returned");
});

test("addUrlQueryValue should return the originalUrl parameter when passed an empty value", () => {
	let url = "http://www.thiswebsite.rules/strings?";
	strictEqual(Utils.addUrlQueryValue(url, "name", ""), url, "The originalUrl should be returned");
});

test("addUrlQueryValue should return the originalUrl parameter when passed a null value", () => {
	/* tslint:disable:no-null-keyword */
	let url = "http://www.thiswebsite.rules/strings?";
	strictEqual(Utils.addUrlQueryValue(url, "name", null), url, "The originalUrl should be returned");
	/* tslint:enable:no-null-keyword */
});

test("addUrlQueryValue should return the originalUrl parameter when passed an undefined value", () => {
	let url = "http://www.thiswebsite.rules/strings?";
	strictEqual(Utils.addUrlQueryValue(url, "name", undefined), url, "The originalUrl should be returned");
});

test("addUrlQueryValue should camel case the query param key added when told to do so", () => {
	let url = "http://www.thiswebsite.rules?name1=value1";
	let key = "name2";
	strictEqual(Utils.addUrlQueryValue(url, key, "value2", true), url + "&Name2=value2", "'" + key + "' should be camel cased in the url");
});

test("generateSignInUrl should generate the correct URL given a valid clipperId, sessionId and MSA authType", () => {
	let newUrl = Utils.generateSignInUrl("ON-1234-abcd", "session1234", "Msa");
	strictEqual(newUrl, Constants.Urls.Authentication.signInUrl + "?authType=Msa&clipperId=ON-1234-abcd&userSessionId=session1234");
});

test("generateSignInUrl should generate the correct URL given a valid clipperId, sessionId, and O365 authType", () => {
	let newUrl = Utils.generateSignInUrl("ON-1234-abcd", "session4567", "OrgId");
	strictEqual(newUrl, Constants.Urls.Authentication.signInUrl + "?authType=OrgId&clipperId=ON-1234-abcd&userSessionId=session4567");
});

test("generateSignOutUrl should generate the correct URL given a valid clipperId, sessionId and MSA authType", () => {
	let newUrl = Utils.generateSignOutUrl("ON-1234-abcd", "session1234", "Msa");
	strictEqual(newUrl, Constants.Urls.Authentication.signOutUrl + "?authType=Msa&clipperId=ON-1234-abcd&userSessionId=session1234");
});

test("generateSignOutUrl should generate the correct URL given a valid clipperId, sessionId, and O365 authType", () => {
	let newUrl = Utils.generateSignOutUrl("ON-1234-abcd", "session4567", "OrgId");
	strictEqual(newUrl, Constants.Urls.Authentication.signOutUrl + "?authType=OrgId&clipperId=ON-1234-abcd&userSessionId=session4567");
});

test("getFileNameFromUrl should return the file name when the url has a pdf file name", () => {
	let fileName = Utils.getFileNameFromUrl("www.website.com/my-file.pdf");
	strictEqual(fileName, "my-file.pdf", "File name should be retrieved from url");
});

test("getFileNameFromUrl should return the file name when the url has a doc file name", () => {
	let fileName = Utils.getFileNameFromUrl("www.website.com/my-file.doc");
	strictEqual(fileName, "my-file.doc", "File name should be retrieved from url");
});

test("getFileNameFromUrl should return the file name when the url has a doc file name and a number in the file name", () => {
	let fileName = Utils.getFileNameFromUrl("www.website.com/1my-file5.doc");
	strictEqual(fileName, "1my-file5.doc", "File name should be retrieved from url");
});

test("getFileNameFromUrl should return the file name when the url has a doc file name and a number in the extension", () => {
	let fileName = Utils.getFileNameFromUrl("www.website.com/my-file.7zip");
	strictEqual(fileName, "my-file.7zip", "File name should be retrieved from url");
});

test("getFileNameFromUrl should return the file name when the url has a doc file name while preserving casing", () => {
	let fileName = Utils.getFileNameFromUrl("www.website.com/FILE.json");
	strictEqual(fileName, "FILE.json", "File name should be retrieved from url while preserving casing");
});

test("getFileNameFromUrl should return the file name when the url has a doc file name and the url is valid but unusual/unexpected", () => {
	let fileName = Utils.getFileNameFromUrl("www.website.website/file.json");
	strictEqual(fileName, "file.json", "File name should be retrieved from url");
	fileName = Utils.getFileNameFromUrl("http://www.website.com/file.json");
	strictEqual(fileName, "file.json", "File name should be retrieved from url");
	fileName = Utils.getFileNameFromUrl("https://www.website.com/file.json");
	strictEqual(fileName, "file.json", "File name should be retrieved from url");
	fileName = Utils.getFileNameFromUrl("website.com/file.json");
	strictEqual(fileName, "file.json", "File name should be retrieved from url");
	fileName = Utils.getFileNameFromUrl("www.website.com/really/long/url/5/file.json");
	strictEqual(fileName, "file.json", "File name should be retrieved from url");
	fileName = Utils.getFileNameFromUrl("www.0800-website.reviews/file.json");
	strictEqual(fileName, "file.json", "File name should be retrieved from url");
});

test("getFileNameFromUrl should return undefined when the url has no file name by default", () => {
	let fileName = Utils.getFileNameFromUrl("www.website.com/");
	strictEqual(fileName, undefined, "File name should be retrieved from url while preserving casing");
	fileName = Utils.getFileNameFromUrl("www.website.com");
	strictEqual(fileName, undefined, "File name should be retrieved from url while preserving casing");
	fileName = Utils.getFileNameFromUrl("website.com");
	strictEqual(fileName, undefined, "File name should be retrieved from url while preserving casing");
	fileName = Utils.getFileNameFromUrl("wus.www.website.com");
	strictEqual(fileName, undefined, "File name should be retrieved from url while preserving casing");
	fileName = Utils.getFileNameFromUrl("wus.www.website.com/pages/5");
	strictEqual(fileName, undefined, "File name should be retrieved from url while preserving casing");
});

test("getFileNameFromUrl should return the fallback when the url has no file name when the fallback is specified", () => {
	let fallback = "Fallback.xyz";
	let fileName = Utils.getFileNameFromUrl("www.website.com/", fallback);
	strictEqual(fileName, fallback, "File name should be retrieved from url while preserving casing");
	fileName = Utils.getFileNameFromUrl("www.website.com", fallback);
	strictEqual(fileName, fallback, "File name should be retrieved from url while preserving casing");
	fileName = Utils.getFileNameFromUrl("website.com", fallback);
	strictEqual(fileName, fallback, "File name should be retrieved from url while preserving casing");
	fileName = Utils.getFileNameFromUrl("wus.www.website.com", fallback);
	strictEqual(fileName, fallback, "File name should be retrieved from url while preserving casing");
	fileName = Utils.getFileNameFromUrl("wus.www.website.com/pages/5", fallback);
	strictEqual(fileName, fallback, "File name should be retrieved from url while preserving casing");
});

test("getFileNameFromUrl should return the fallback when passed an empty url", () => {
	let fallback = "Fallback.xyz";
	strictEqual(Utils.getFileNameFromUrl("", fallback), fallback,
		"The fallback should be returned");
});

test("getFileNameFromUrl should return the fallback when passed a null url", () => {
	/* tslint:disable:no-null-keyword */
	let fallback = "Fallback.xyz";
	strictEqual(Utils.getFileNameFromUrl(null, fallback), fallback,
		"The fallback should be returned");
	/* tslint:enable:no-null-keyword */
});

test("getFileNameFromUrl should return the fallback when passed an undefined url", () => {
	let fallback = "Fallback.xyz";
	strictEqual(Utils.getFileNameFromUrl(undefined, fallback), fallback,
		"The fallback should be returned");
});

test("getQueryValue should return the query value in the general case", () => {
	let url = "www.website.com/stuff?q=v";
	strictEqual(Utils.getQueryValue(url, "q"), "v");
});

test("getQueryValue should return the query value when there is more than one pair", () => {
	let url = "www.website.com/stuff?q=v&q1=v1&q2=v2";
	strictEqual(Utils.getQueryValue(url, "q"), "v");
	strictEqual(Utils.getQueryValue(url, "q1"), "v1");
	strictEqual(Utils.getQueryValue(url, "q2"), "v2");
});

test("getQueryValue should return undefined if the key doesn't exist", () => {
	let url = "www.website.com/stuff?q=v";
	strictEqual(Utils.getQueryValue(url, "notexist"), undefined);
});

test("getQueryValue should return undefined if no keys exist", () => {
	let url = "www.website.com/stuff?";
	strictEqual(Utils.getQueryValue(url, "notexist"), undefined);
	url = "www.website.com/stuff";
	strictEqual(Utils.getQueryValue(url, "notexist"), undefined);
});

test("getQueryValue should return empty string if the key exists but the value doesn't", () => {
	let url = "www.website.com/stuff?q=";
	strictEqual(Utils.getQueryValue(url, "q"), "");
});

test("getQueryValue should return undefined if any of the parameters are undefined or empty string", () => {
	strictEqual(Utils.getQueryValue("www.website.com/stuff?q=v", undefined), undefined);
	strictEqual(Utils.getQueryValue(undefined, "q"), undefined);
	strictEqual(Utils.getQueryValue("www.website.com/stuff?q=v", ""), undefined);
	strictEqual(Utils.getQueryValue("", "q"), undefined);
});

test("isNumeric should return false when the value is a string", () => {
	let value = "string";
	ok(!Utils.isNumeric(value), "isNumeric should return false");
});

test("isNumeric should return false when the value is a string numeral", () => {
	let value = "5";
	ok(!Utils.isNumeric(value), "isNumeric should return false");
});

test("isNumeric should return false when the value is an empty object", () => {
	let value = {};
	ok(!Utils.isNumeric(value), "isNumeric should return false");
});

test("isNumeric should return false when the value is a undefined", () => {
	ok(!Utils.isNumeric(undefined), "isNumeric should return false");
});

test("isNumeric should return false when the value is a NaN", () => {
	let value = NaN;
	ok(!Utils.isNumeric(value), "isNumeric should return false");
});

test("isNumeric should return false when the value is a null", () => {
	/* tslint:disable:no-null-keyword */
	let value = null;
	/* tslint:enable:no-null-keyword */
	ok(!Utils.isNumeric(value), "isNumeric should return false");
});

test("isNumeric should return false when the value is a string", () => {
	let value = "";
	ok(!Utils.isNumeric(value), "isNumeric should return false");
});

test("isNumeric should return true when the value is a number", () => {
	let value = 5;
	ok(Utils.isNumeric(value), "isNumeric should return true");
});

test("isNumeric should return true when the value is a negative number", () => {
	let value = -5;
	ok(Utils.isNumeric(value), "isNumeric should return true");
});

test("isNumeric should return true when the value is a decimal number", () => {
	let value = 4.12345;
	ok(Utils.isNumeric(value), "isNumeric should return true");
});

test("isNumeric should return true when the value is a Infinity", () => {
	let value = Infinity;
	ok(Utils.isNumeric(value), "isNumeric should return true");
});

test("onWhiteListedDomain should return true for urls with /yyyy/mm/dd/", () => {
	ok(Utils.onWhitelistedDomain("http://www.sdfdsfsdasdsa.com/2014/09/25/garden/when-blogging-becomes-a-slog.html?_r=1"));
});

test("onWhiteListedDomain should return true for urls with /yyyy/mm/", () => {
	ok(Utils.onWhitelistedDomain("http://www.sdfdsfsdasdsa.com/2014/09/garden/when-blogging-becomes-a-slog.html?_r=1"));
});

test("onWhiteListedDomain should return true for urls with /yy/mm/", () => {
	ok(Utils.onWhitelistedDomain("http://www.sdfdsfsdasdsa.com/16/09/garden/when-blogging-becomes-a-slog.html?_r=1"));
});

test("onWhiteListedDomain should return true for urls with /yyyy/m/", () => {
	ok(Utils.onWhitelistedDomain("http://www.sdfdsfsdasdsa.com/2014/1/garden/when-blogging-becomes-a-slog.html?_r=1"));
});

test("onWhiteListedDomain should return true for urls dash-seperated dates assuming they include the year, month, and day", () => {
	ok(Utils.onWhitelistedDomain("http://www.sdfdsfsdasdsa.com/2014-09-25/garden/when-blogging-becomes-a-slog.html?_r=1"));
});

test("onWhiteListedDomain should return false for urls dash-seperated dates assuming they do not include the year, month, and day", () => {
	ok(!Utils.onWhitelistedDomain("http://www.sdfdsfsdasdsa.com/2014-09/garden/when-blogging-becomes-a-slog.html?_r=1"));
});

test("onWhiteListedDomain should return false for urls with just years", () => {
	ok(!Utils.onWhitelistedDomain("http://www.sdfdsfsdasdsa.com/2014/garden/when-blogging-becomes-a-slog.html?_r=1"));
});

test("onWhiteListedDomain should return false given undefined or empty string", () => {
	ok(!Utils.onWhitelistedDomain(""));
	ok(!Utils.onWhitelistedDomain(undefined));
});

test("getPathName should return a valid path given a valid URL", () => {
	ok(Utils.getPathname("https://www.foo.com/bar/blah"), "/bar/blah");
	ok(Utils.getPathname("https://www.youtube.com/watch?v=dQw4w9WgXcQ"), "/watch");
	ok(Utils.getPathname("https://www.youtube.com"), "/");
});

test("checkIfUrlMatchesAContentType should return false for an undefined, null, or empty URL", () => {
	let tooltipsToTest = [TooltipType.Pdf, TooltipType.Product, TooltipType.Recipe];

	tooltipsToTest.forEach((tooltip) => {
		ok(!Utils.checkIfUrlMatchesAContentType(undefined, tooltip));
		/* tslint:disable:no-null-keyword */
		ok(!Utils.checkIfUrlMatchesAContentType(null, tooltip));
		/* tslint:enable:no-null-keyword */
		ok(!Utils.checkIfUrlMatchesAContentType("", tooltip));
	});
});

test("checkIfUrlMatchesAContentType for PDF should return false for a valid URL without .pdf at the end", () => {
	ok(!Utils.checkIfUrlMatchesAContentType("https://www.fistbump.reviews", TooltipType.Pdf));
	ok(!Utils.checkIfUrlMatchesAContentType("https://fistbumppdfs.reviews", TooltipType.Pdf));
});

test("checkIfUrlMatchesAContentType for PDF should return true for a valid URL with .pdf at the end, case insensitive", () => {
	ok(Utils.checkIfUrlMatchesAContentType("https://wwww.wen.jen/shipItFresh.pdf", TooltipType.Pdf));
	ok(Utils.checkIfUrlMatchesAContentType("http://www.orimi.com/pdf-test.PDF", TooltipType.Pdf));
});

test("checkIfUrlMatchesAContentType for Product should return false for an invalid url", () => {
	ok(!Utils.checkIfUrlMatchesAContentType("https://www.onenote.com/clipper", TooltipType.Product));
});

test("checkIfUrlMatchesAContentType for Product should return true for a valid Wal-mart URL", () => {
	ok(Utils.checkIfUrlMatchesAContentType("http://www.walmart.com/ip/49424374", TooltipType.Product));
});

test("checkIfUrlMatchesAContentType for Recipe should return false for a valid url that isnt in the regex match", () => {
	ok(!Utils.checkIfUrlMatchesAContentType("https://www.onenote.com/clipper", TooltipType.Recipe));
});

test("checkIfUrlMatchesAContentType for Recipe should return true for a valid URL", () => {
	ok(Utils.checkIfUrlMatchesAContentType("http://www.chowhound.com/recipes/easy-grilled-cheese-31834", TooltipType.Recipe));
});

test("ensureLeadingForwardSlash should return a valid path given different browser return values.", () => {
	ok(Utils.ensureLeadingForwardSlash("/foo/bar"), "/foo/bar");
	ok(Utils.ensureLeadingForwardSlash("foo/bar"), "/foo/bar");
	ok(Utils.ensureLeadingForwardSlash(""), "/");
	ok(Utils.ensureLeadingForwardSlash(undefined), "/");
});

test("createUpdatedObject should return a new object that adds the attributes of the second object to the first", () => {
	let first = { a: "a", b: "b" };
	let second = { c: "c", d: "d" };
	deepEqual(Utils.createUpdatedObject(first, second), { a: "a", b: "b", c: "c", d: "d" });
	deepEqual(first, { a: "a", b: "b" }, "The function should be pure");
	deepEqual(second, { c: "c", d: "d" }, "The function should be pure");
});

test("createUpdatedObject should update the first object if it contains an attribute that the second object contains", () => {
	let first = { a: "a", b: "b" };
	let second = { b: "new" };
	deepEqual(Utils.createUpdatedObject(first, second), { a: "a", b: "new" });
	deepEqual(first, { a: "a", b: "b" }, "The function should be pure");
	deepEqual(second, { b: "new" }, "The function should be pure");
});

test("createUpdatedObject should return a copy of the second object if the first is undefined", () => {
	let second = { a: "a" };
	deepEqual(Utils.createUpdatedObject(undefined, second), { a: "a" });
});

test("createUpdatedObject should return a copy of the second object if the first is empty", () => {
	let second = { a: "a" };
	deepEqual(Utils.createUpdatedObject({}, second), { a: "a" });
});

test("createUpdatedObject should return a copy of the first object if the second is undefined", () => {
	let first = { a: "a" };
	deepEqual(Utils.createUpdatedObject(first, undefined), { a: "a" });
});

test("createUpdatedObject should return a copy of the first object if the second is empty", () => {
	let first = { a: "a" };
	deepEqual(Utils.createUpdatedObject(first, {}), { a: "a" });
});

test("createUpdatedObject should return the empty object if both parameters are undefined or empty", () => {
	deepEqual(Utils.createUpdatedObject({}, {}), {});
	deepEqual(Utils.createUpdatedObject(undefined, undefined), {});
});
