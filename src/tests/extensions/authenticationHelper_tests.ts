import * as sinon from "sinon";

import {AuthenticationHelper} from "../../scripts/extensions/authenticationHelper";
import {ClipperData} from "../../scripts/storage/clipperData";
import {Logger} from "../../scripts/logging/logger";
import {UserInfoData} from "../../scripts/userInfo";

import {AsyncUtils} from "../asyncUtils";
import {TestModule} from "../testModule";

declare let setTimeout;

export class AuthenticationHelperTests extends TestModule {
	private mockClipperData: ClipperData;
	private mockLogger: Logger;
	private authentationHelper;

	protected module() {
		return "authenticationHelper";
	}

	protected beforeEach() {
		this.mockClipperData = sinon.createStubInstance(ClipperData) as any;
		this.mockLogger = sinon.createStubInstance(Logger) as any;
		this.authentationHelper = new AuthenticationHelper(this.mockClipperData, this.mockLogger);
	}

	protected tests() {
		/* tslint:disable:no-null-keyword */

		test("A valid userInfo should be validated by isValidUserInformationJsonString", () => {
			let userInfo = getValidUserInformationJson();
			ok(this.authentationHelper.isValidUserInformationJsonString(JSON.stringify(userInfo)),
				"Valid userInfo should be validated");
		});

		test("A null userInfo should be invalidated by isValidUserInformationJsonString", () => {
			ok(!this.authentationHelper.isValidUserInformationJsonString(null),
				"Null userInfo should be invalidated");
		});

		test("An undefined userInfo should be invalidated by isValidUserInformationJsonString", () => {
			ok(!this.authentationHelper.isValidUserInformationJsonString(undefined),
				"Undefined userInfo should be invalidated");
		});

		test("A non-json-string userInfo should be invalidated by isValidUserInformationJsonString", () => {
			ok(!this.authentationHelper.isValidUserInformationJsonString("{}}"),
				"Non-json-string userInfo should be invalidated");
		});

		test("Invalid accessToken should be detected by isValidUserInformationJsonString", () => {
			let userInfo = getValidUserInformationJson();
			userInfo.accessToken = null;
			ok(!this.authentationHelper.isValidUserInformationJsonString(JSON.stringify(userInfo)),
				"Null accessToken should be seen as invalid");
			userInfo.accessToken = undefined;
			ok(!this.authentationHelper.isValidUserInformationJsonString(JSON.stringify(userInfo)),
				"Undefined accessToken should be seen as invalid");
			userInfo.accessToken = "";
			ok(!this.authentationHelper.isValidUserInformationJsonString(JSON.stringify(userInfo)),
				"Empty accessToken should be seen as invalid");
		});

		test("Invalid accessTokenExpiration should be detected by isValidUserInformationJsonString", () => {
			let userInfo = getValidUserInformationJson();
			userInfo.accessTokenExpiration = 0;
			ok(!this.authentationHelper.isValidUserInformationJsonString(JSON.stringify(userInfo)),
				"0 accessTokenExpiration should be seen as invalid");
			userInfo.accessTokenExpiration = -1;
			ok(!this.authentationHelper.isValidUserInformationJsonString(JSON.stringify(userInfo)),
				"<0 accessTokenExpiration should be seen as invalid");
		});

		test("Invalid authType should be detected by isValidUserInformationJsonString", () => {
			let userInfo = getValidUserInformationJson();
			userInfo.authType = null;
			ok(!this.authentationHelper.isValidUserInformationJsonString(JSON.stringify(userInfo)),
				"Null authType should be seen as invalid");
			userInfo.authType = undefined;
			ok(!this.authentationHelper.isValidUserInformationJsonString(JSON.stringify(userInfo)),
				"Undefined authType should be seen as invalid");
			userInfo.authType = "";
			ok(!this.authentationHelper.isValidUserInformationJsonString(JSON.stringify(userInfo)),
				"Empty authType should be seen as invalid");
		});

		test("Valid cid should be detected by isValidUserInformationJsonString", () => {
			let userInfo = getValidUserInformationJson();
			userInfo.cid = null;
			ok(this.authentationHelper.isValidUserInformationJsonString(JSON.stringify(userInfo)),
				"Null cid should be seen as valid");
			userInfo.cid = undefined;
			ok(this.authentationHelper.isValidUserInformationJsonString(JSON.stringify(userInfo)),
				"Undefined cid should be seen as valid");
			userInfo.cid = "";
			ok(this.authentationHelper.isValidUserInformationJsonString(JSON.stringify(userInfo)),
				"Empty cid should be seen as valid");
		});

		test("Valid emailAddress should be detected by isValidUserInformationJsonString", () => {
			let userInfo = getValidUserInformationJson();
			userInfo.emailAddress = null;
			ok(this.authentationHelper.isValidUserInformationJsonString(JSON.stringify(userInfo)),
				"Null emailAddress should be seen as valid");
			userInfo.emailAddress = undefined;
			ok(this.authentationHelper.isValidUserInformationJsonString(JSON.stringify(userInfo)),
				"Undefined emailAddress should be seen as valid");
			userInfo.emailAddress = "";
			ok(this.authentationHelper.isValidUserInformationJsonString(JSON.stringify(userInfo)),
				"Empty emailAddress should be seen as valid");
		});

		test("Valid fullName should be detected by isValidUserInformationJsonString", () => {
			let userInfo = getValidUserInformationJson();
			userInfo.fullName = null;
			ok(this.authentationHelper.isValidUserInformationJsonString(JSON.stringify(userInfo)),
				"Null fullName should be seen as valid");
			userInfo.fullName = undefined;
			ok(this.authentationHelper.isValidUserInformationJsonString(JSON.stringify(userInfo)),
				"Undefined fullName should be seen as valid");
			userInfo.fullName = "";
			ok(this.authentationHelper.isValidUserInformationJsonString(JSON.stringify(userInfo)),
				"Empty fullName should be seen as valid");
		});

		/* tslint:enable:no-null-keyword */
	}
}

export class AuthenticationHelperSinonTests extends TestModule {
	private server: Sinon.SinonFakeServer;
	private mockClipperData: ClipperData;
	private mockLogger: Logger;
	private authentationHelper;

	private clipperId = "XX-1a23456b-a1b2-12ab-1a2b-12a34b567c8d";
	private authUrl = "https://www.onenote.com/webclipper/userinfo?clipperId=" + this.clipperId;

	protected module() {
		return "authenticationHelper-sinon";
	}

	protected beforeEach() {
		this.server = sinon.fakeServer.create();
		this.server.respondImmediately = true;

		AsyncUtils.mockSetTimeout();

		this.mockClipperData = sinon.createStubInstance(ClipperData) as any;
		this.mockLogger = sinon.createStubInstance(Logger) as any;
		this.authentationHelper = new AuthenticationHelper(this.mockClipperData, this.mockLogger);
	}

	protected afterEach() {
		this.server.restore();
		AsyncUtils.restoreSetTimeout();
	}

	protected tests() {
		test("retrieveUserInformation resolves the response as a json string if it represents valid user information", (assert: QUnitAssert) => {
			let done = assert.async();

			this.server.respondWith(
				"POST", this.authUrl,
				[200, { "Content-Type": "application/json" },
				JSON.stringify(getValidUserInformationJson())
			]);

			this.authentationHelper.retrieveUserInformation(this.clipperId).then((responsePackage) => {
				strictEqual(responsePackage.parsedResponse, JSON.stringify(getValidUserInformationJson()),
					"The user information should be resolved as a json string");
			}, (error) => {
				ok(false, "reject should not be called");
			}).then(() => {
				done();
			});
		});

		test("retrieveUserInformation resolves the response with no parameter if it returns an empty object", (assert: QUnitAssert) => {
			let done = assert.async();

			this.server.respondWith(
				"POST", this.authUrl,
				[200, { "Content-Type": "application/json" },
				JSON.stringify({})
			]);

			this.authentationHelper.retrieveUserInformation(this.clipperId).then((responsePackage) => {
				strictEqual(responsePackage.parsedResponse, undefined, "The response should be undefined");
			}, (error) => {
				ok(false, "reject should not be called");
			}).then(() => {
				done();
			});
		});

		test("retrieveUserInformation resolves the response with no parameter if it returns an empty string", (assert: QUnitAssert) => {
			let done = assert.async();

			this.server.respondWith(
				"POST", this.authUrl,
				[200, { "Content-Type": "application/json" },
				JSON.stringify("")
			]);

			this.authentationHelper.retrieveUserInformation(this.clipperId).then((responsePackage) => {
				strictEqual(responsePackage.parsedResponse, undefined, "The response should be undefined");
			}, (error) => {
				ok(false, "reject should not be called");
			}).then(() => {
				done();
			});
		});

		test("retrieveUserInformation resolves the response with no parameter if it represents incomplete user information", (assert: QUnitAssert) => {
			let done = assert.async();

			let invalidUserInformation = getValidUserInformationJson();
			invalidUserInformation.accessToken = undefined;
			this.server.respondWith(
				"POST", this.authUrl,
				[200, { "Content-Type": "application/json" },
				JSON.stringify(invalidUserInformation)
			]);

			this.authentationHelper.retrieveUserInformation(this.clipperId).then((responsePackage) => {
				strictEqual(responsePackage.parsedResponse, undefined, "The response should be undefined");
			}, (error) => {
				ok(false, "reject should not be called");
			}).then(() => {
				done();
			});
		});

		test("retrieveUserInformation resolves the response with no parameter if it represents empty user information", (assert: QUnitAssert) => {
			let done = assert.async();

			let invalidUserInformation: UserInfoData = {
				accessToken: undefined,
				accessTokenExpiration: 0,
				authType: undefined,
				cid: undefined,
				emailAddress: undefined,
				fullName: undefined
			};
			this.server.respondWith(
				"POST", this.authUrl,
				[200, { "Content-Type": "application/json" },
				JSON.stringify(invalidUserInformation)
			]);

			this.authentationHelper.retrieveUserInformation(this.clipperId).then((responsePackage) => {
				strictEqual(responsePackage.parsedResponse, undefined, "The response should be undefined");
			}, (error) => {
				ok(false, "reject should not be called");
			}).then(() => {
				done();
			});
		});

		test("retrieveUserInformation rejects the response with error object if the status code is 4XX", (assert: QUnitAssert) => {
			let done = assert.async();

			let responseMessage = "Something went wrong";
			this.server.respondWith(
				"POST", this.authUrl,
				[404, { "Content-Type": "application/json" },
				responseMessage
			]);

			this.authentationHelper.retrieveUserInformation(this.clipperId).then((responsePackage) => {
				ok(false, "resolve should not be called");
			}, (error) => {
				let expected = {
					error: "Unexpected response status",
					statusCode: 404,
					responseHeaders: { "Content-Type": "application/json" },
					response: responseMessage,
					timeout: 30000
				};
				deepEqual(error, expected, "The error object should be returned in the reject");
			}).then(() => {
				done();
			});
		});

		test("retrieveUserInformation rejects the response with error object if the status code is 5XX", (assert: QUnitAssert) => {
			let done = assert.async();

			let responseMessage = "Something went wrong on our end";
			this.server.respondWith(
				"POST", this.authUrl,
				[503, { "Content-Type": "application/json" },
				responseMessage
			]);

			this.authentationHelper.retrieveUserInformation(this.clipperId).then((responsePackage) => {
				ok(false, "resolve should not be called");
			}, (error) => {
				let expected = {
					error: "Unexpected response status",
					statusCode: 503,
					responseHeaders: { "Content-Type": "application/json" },
					response: responseMessage,
					timeout: 30000
				};
				deepEqual(error, expected,
					"The error object should be returned in the reject");
			}).then(() => {
				done();
			});
		});
	}
}

function getValidUserInformationJson(): UserInfoData {
	return {
		accessToken: "abcd",
		accessTokenExpiration: 2000,
		authType: "MSA",
		cid: "cid",
		emailAddress: "me@myemail.xyz",
		fullName: "George"
	};
}

(new AuthenticationHelperTests()).runTests();
(new AuthenticationHelperSinonTests()).runTests();
