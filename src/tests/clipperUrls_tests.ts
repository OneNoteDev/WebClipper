import {ClientType} from "../scripts/clientType";
import {ClipperUrls} from "../scripts/clipperUrls";
import {Constants} from "../scripts/constants";
import {StringUtils} from "../scripts/stringUtils";

import {HelperFunctions} from "./helperFunctions";
import {TestModule} from "./testModule";

module TestConstants {
	export module LogCategories {
		export var oneNoteClipperUsage = "OneNoteClipperUsage";
	}
	export module Urls {
		export var clipperFeedbackUrl = "https://www.onenote.com/feedback";
	}
}

export class ClipperUrlsTests extends TestModule {
	protected module() {
		return "clipperUrls";
	}

	protected tests() {
		test("The generated feedback url should be correct with url query values set appropriately", () => {
			let startingState = HelperFunctions.getMockClipperState();
			let usid: string = StringUtils.generateGuid();

			let url = ClipperUrls.generateFeedbackUrl(startingState, usid, TestConstants.LogCategories.oneNoteClipperUsage);
			strictEqual(url.indexOf("#"), -1,
				"There should be no fragment in the feedback url");

			let splitUrl = url.split("?");
			let hostAndPath = splitUrl[0];
			let queryParams = splitUrl[1].split("&");

			strictEqual(hostAndPath, TestConstants.Urls.clipperFeedbackUrl,
				"The feedback host and path should be correct");

			let expectedQueryParams = {
				LogCategory: TestConstants.LogCategories.oneNoteClipperUsage,
				originalUrl: startingState.pageInfo.rawUrl,
				clipperId: startingState.clientInfo.clipperId,
				usid: usid,
				type: ClientType[startingState.clientInfo.clipperType],
				version: startingState.clientInfo.clipperVersion
			};

			strictEqual(queryParams.length, 6, "There must be exactly 6 query params");

			for (let i = 0; i < queryParams.length; i++) {
				let keyValuePair = queryParams[i].split("=");
				let key = keyValuePair[0];
				let value = keyValuePair[1];
				ok(expectedQueryParams.hasOwnProperty(key),
					"The key " + key + " must exist in the query params");
				strictEqual(value, expectedQueryParams[key],
					"The correct value must be assigned to the key " + key);
			}
		});

		test("generateSignInUrl should generate the correct URL given a valid clipperId, sessionId and MSA authType", () => {
			let newUrl = ClipperUrls.generateSignInUrl("ON-1234-abcd", "session1234", "Msa");
			strictEqual(newUrl, Constants.Urls.Authentication.signInUrl + "?authType=Msa&clipperId=ON-1234-abcd&userSessionId=session1234");
		});

		test("generateSignInUrl should generate the correct URL given a valid clipperId, sessionId, and O365 authType", () => {
			let newUrl = ClipperUrls.generateSignInUrl("ON-1234-abcd", "session4567", "OrgId");
			strictEqual(newUrl, Constants.Urls.Authentication.signInUrl + "?authType=OrgId&clipperId=ON-1234-abcd&userSessionId=session4567");
		});

		test("generateSignOutUrl should generate the correct URL given a valid clipperId, sessionId and MSA authType", () => {
			let newUrl = ClipperUrls.generateSignOutUrl("ON-1234-abcd", "session1234", "Msa");
			strictEqual(newUrl, Constants.Urls.Authentication.signOutUrl + "?authType=Msa&clipperId=ON-1234-abcd&userSessionId=session1234");
		});

		test("generateSignOutUrl should generate the correct URL given a valid clipperId, sessionId, and O365 authType", () => {
			let newUrl = ClipperUrls.generateSignOutUrl("ON-1234-abcd", "session4567", "OrgId");
			strictEqual(newUrl, Constants.Urls.Authentication.signOutUrl + "?authType=OrgId&clipperId=ON-1234-abcd&userSessionId=session4567");
		});
	}
}

(new ClipperUrlsTests()).runTests();
