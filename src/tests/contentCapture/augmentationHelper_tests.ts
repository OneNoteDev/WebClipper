import * as sinon from "sinon";

import {Constants} from "../../scripts/constants";

import {Clipper} from "../../scripts/clipperUI/frontEndGlobals";

import {AugmentationHelper, AugmentationModel} from "../../scripts/contentCapture/augmentationHelper";

import {AsyncUtils} from "../asyncUtils";
import {MithrilUtils} from "../mithrilUtils";
import {MockProps} from "../mockProps";
import {TestModule} from "../testModule";

export class AugmentationHelperTests extends TestModule {
	private server: Sinon.SinonFakeServer;

	protected module() {
		return "augmentationHelper-sinon";
	}

	protected beforeEach() {
		this.server = sinon.fakeServer.create();
		this.server.respondImmediately = true;

		AsyncUtils.mockSetTimeout();

		// The augmentation call waits on the session id, so we need to set this
		Clipper.sessionId.set("abcde");
	}

	protected afterEach() {
		this.server.restore();
		AsyncUtils.restoreSetTimeout();
		Clipper.sessionId.set(undefined);
	}

	protected tests() {
		test("makeAugmentationRequest should return the parsed response and the original xhr in the resolved promise", (assert: QUnitAssert) => {
			let done = assert.async();

			let state = MockProps.getMockClipperState();
			let pageInfo = state.pageInfo;

			let responseJson = [{
				ContentModel: 1,
				ContentInHtml: "Hello world",
				ContentObjects: []
			}];
			this.server.respondWith(
				"POST", Constants.Urls.augmentationApiUrl + "?renderMethod=extractAggressive&url=" + pageInfo.canonicalUrl + "&lang=" + pageInfo.contentLocale,
				[200, { "Content-Type": "application/json" },
				JSON.stringify(responseJson)
			]);

			AugmentationHelper.makeAugmentationRequest(pageInfo.canonicalUrl, pageInfo.contentLocale, pageInfo.contentData, "abc123").then((responsePackage) => {
				deepEqual(responsePackage.parsedResponse, responseJson, "The parsedResponse field should be the response in json form");
				ok(responsePackage.request, "The request field should be defined");
			}).catch((error) => {
				ok(false, "reject should not be called");
			}).then(() => {
				done();
			});
		});

		test("makeAugmentationRequest should return the error object in the rejected promise if the status code is not 200", (assert: QUnitAssert) => {
			let done = assert.async();

			let state = MockProps.getMockClipperState();
			let pageInfo = state.pageInfo;

			let responseJson = "A *spooky* 404 message!";
			this.server.respondWith(
				"POST", Constants.Urls.augmentationApiUrl + "?renderMethod=extractAggressive&url=" + pageInfo.canonicalUrl + "&lang=" + pageInfo.contentLocale,
				[404, { "Content-Type": "application/json" },
				JSON.stringify(responseJson)
			]);

			AugmentationHelper.makeAugmentationRequest(pageInfo.canonicalUrl, pageInfo.contentLocale, pageInfo.contentData, "abc123").then((responsePackage) => {
				ok(false, "resolve should not be called");
			}).catch((error) => {
				deepEqual(error,
					{ error: "Unexpected response status", statusCode: 404, responseHeaders: { "Content-Type": "application/json" }, response: JSON.stringify(responseJson), timeout: 30000 },
					"The error object should be returned in the reject");
			}).then(() => {
				done();
			});
		});

		test("makeAugmentationRequest should return the error object in the rejected promise if the status code is 200, but the response cannot be parsed as json", (assert: QUnitAssert) => {
			let done = assert.async();

			let state = MockProps.getMockClipperState();
			let pageInfo = state.pageInfo;

			let obj = [{
				ContentModel: 1,
				ContentInHtml: "Hello world",
				ContentObjects: []
			}];
			let unJsonifiableString = "{" + JSON.stringify(obj);
			this.server.respondWith(
				"POST", Constants.Urls.augmentationApiUrl + "?renderMethod=extractAggressive&url=" + pageInfo.canonicalUrl + "&lang=" + pageInfo.contentLocale,
				[200, { "Content-Type": "application/json" },
				unJsonifiableString
			]);

			AugmentationHelper.makeAugmentationRequest(pageInfo.canonicalUrl, pageInfo.contentLocale, pageInfo.contentData, "abc123").then((responsePackage) => {
				ok(false, "resolve should not be called");
			}).catch((error) => {
				deepEqual(error,
					{ error: "Unable to parse response", statusCode: 200, responseHeaders: { "Content-Type": "application/json" }, response: unJsonifiableString },
					"The error object should be returned in the reject");
			}).then(() => {
				done();
			});
		});
	}
}

export class AugmentationHelperSinonTests extends TestModule {
	private fixture: HTMLDivElement;

	protected module() {
		return "augmentationHelper";
	}

	protected beforeEach() {
		this.fixture = MithrilUtils.getFixture() as HTMLDivElement;
	}

	protected tests() {
		test("getAugmentationType returns the augmentation type as a string for types that we support", () => {
			let supported = [ AugmentationModel.Article, AugmentationModel.Recipe, AugmentationModel.Product ];
			let state = MockProps.getMockClipperState();

			for (let i = 0; i < supported.length; i++) {
				state.augmentationResult.data = {
					ContentInHtml: "",
					ContentModel: supported[i],
					ContentObjects: undefined,
					PageMetadata: {}
				};
				strictEqual(AugmentationHelper.getAugmentationType(state), AugmentationModel[supported[i]]);
			}
		});

		test("getAugmentationType returns 'Article' if the augmentation result is unavailable", () => {
			strictEqual(AugmentationHelper.getAugmentationType(undefined), AugmentationModel[AugmentationModel.Article]);

			let state = MockProps.getMockClipperState();
			state.augmentationResult.data = undefined;
			strictEqual(AugmentationHelper.getAugmentationType(state), AugmentationModel[AugmentationModel.Article]);

			state.augmentationResult = undefined;
			strictEqual(AugmentationHelper.getAugmentationType(state), AugmentationModel[AugmentationModel.Article]);
		});

		test("getAugmentationType returns 'Article' for types that we don't support", () => {
			let state = MockProps.getMockClipperState();
			state.augmentationResult.data = {
				ContentInHtml: "",
				ContentModel: AugmentationModel.BizCard,
				ContentObjects: undefined,
				PageMetadata: {}
			};
			strictEqual(AugmentationHelper.getAugmentationType(state), AugmentationModel[AugmentationModel.Article]);

		});

		test("getArticlePreviewElement should return the MainArticleContainer class element if it exists", () => {
			let mainArticleContainer = <any>document.createElement("div") as HTMLHtmlElement;
			mainArticleContainer.className = "MainArticleContainer";
			this.fixture.appendChild(mainArticleContainer);

			let actual = AugmentationHelper.getArticlePreviewElement(document);
			strictEqual(actual, mainArticleContainer, "The MainArticleContainer should be retrieved");
		});

		test("getArticlePreviewElement should return the document's body if the MainArticleContainer class element does not exist", () => {
			let actual = AugmentationHelper.getArticlePreviewElement(document);
			strictEqual(actual, document.body, "The body should be retrieved");
		});
	}
}

(new AugmentationHelperTests()).runTests();
(new AugmentationHelperSinonTests()).runTests();
