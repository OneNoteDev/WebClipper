import * as sinon from "sinon";

import {AugmentationHelper, AugmentationModel} from "../../scripts/contentCapture/augmentationHelper";

import {Constants} from "../../scripts/constants";

import {HelperFunctions} from "../helperFunctions";

let xhr: Sinon.SinonFakeXMLHttpRequest;
let server: Sinon.SinonFakeServer;

QUnit.module("augmentationHelper-sinon", {
	beforeEach: () => {
		xhr = sinon.useFakeXMLHttpRequest();
		let requests = this.requests = [];
		xhr.onCreate = req => {
			requests.push(req);
		};

		server = sinon.fakeServer.create();
	},
	afterEach: () => {
		xhr.restore();
		server.restore();
	}
});

test("makeAugmentationRequest should return the parsed response and the original xhr in the resolved promise", (assert: QUnitAssert) => {
	let done = assert.async();

	let state = HelperFunctions.getMockClipperState();
	let pageInfo = state.pageInfo;

	let responseJson = [{
		ContentModel: 1,
		ContentInHtml: "Hello world",
		ContentObjects: []
	}];
	server.respondWith(
		"POST", Constants.Urls.augmentationApiUrl + "?renderMethod=extractAggressive&url=" + pageInfo.canonicalUrl + "&lang=" + pageInfo.contentLocale,
		[200, { "Content-Type": "application/json" },
		JSON.stringify(responseJson)
	]);

	AugmentationHelper.makeAugmentationRequest(pageInfo.canonicalUrl, pageInfo.contentLocale, pageInfo.contentData, "abc123").then((responsePackage) => {
		deepEqual(responsePackage.parsedResponse, responseJson, "The parsedResponse field should be the response in json form");
		ok(responsePackage.request, "The request field should be defined");
	}, (error) => {
		ok(false, "reject should not be called");
	}).then(() => {
		done();
	});
	server.respond();
});

test("makeAugmentationRequest should return the error object in the rejected promise if the status code is not 200", (assert: QUnitAssert) => {
	let done = assert.async();

	let state = HelperFunctions.getMockClipperState();
	let pageInfo = state.pageInfo;

	let responseJson = "A *spooky* 404 message!";
	server.respondWith(
		"POST", Constants.Urls.augmentationApiUrl + "?renderMethod=extractAggressive&url=" + pageInfo.canonicalUrl + "&lang=" + pageInfo.contentLocale,
		[404, { "Content-Type": "application/json" },
		JSON.stringify(responseJson)
	]);

	AugmentationHelper.makeAugmentationRequest(pageInfo.canonicalUrl, pageInfo.contentLocale, pageInfo.contentData, "abc123").then((responsePackage) => {
		ok(false, "resolve should not be called");
	}, (error) => {
		deepEqual(error,
			{ error: "Unexpected response status", statusCode: 404, responseHeaders: { "Content-Type": "application/json" }, response: JSON.stringify(responseJson), timeout: 30000 },
			"The error object should be returned in the reject");
	}).then(() => {
		done();
	});
	server.respond();
});

test("makeAugmentationRequest should return the error object in the rejected promise if the status code is 200, but the response cannot be parsed as json", (assert: QUnitAssert) => {
	let done = assert.async();

	let state = HelperFunctions.getMockClipperState();
	let pageInfo = state.pageInfo;

	let obj = [{
		ContentModel: 1,
		ContentInHtml: "Hello world",
		ContentObjects: []
	}];
	let unJsonifiableString = "{" + JSON.stringify(obj);
	server.respondWith(
		"POST", Constants.Urls.augmentationApiUrl + "?renderMethod=extractAggressive&url=" + pageInfo.canonicalUrl + "&lang=" + pageInfo.contentLocale,
		[200, { "Content-Type": "application/json" },
		unJsonifiableString
	]);

	AugmentationHelper.makeAugmentationRequest(pageInfo.canonicalUrl, pageInfo.contentLocale, pageInfo.contentData, "abc123").then((responsePackage) => {
		ok(false, "resolve should not be called");
	}, (error) => {
		deepEqual(error,
			{ error: "Unable to parse response", statusCode: 200, responseHeaders: { "Content-Type": "application/json" }, response: unJsonifiableString },
			"The error object should be returned in the reject");
	}).then(() => {
		done();
	});
	server.respond();
});

let fixture: HTMLDivElement;

QUnit.module("augmentationHelper", {
	beforeEach: () => {
		fixture = HelperFunctions.getFixture() as HTMLDivElement;
	}
});

test("getAugmentationType returns the augmentation type as a string for types that we support", () => {
	let supported = [ AugmentationModel.Article, AugmentationModel.Recipe, AugmentationModel.Product ];
	let state = HelperFunctions.getMockClipperState();

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

	let state = HelperFunctions.getMockClipperState();
	state.augmentationResult.data = undefined;
	strictEqual(AugmentationHelper.getAugmentationType(state), AugmentationModel[AugmentationModel.Article]);

	state.augmentationResult = undefined;
	strictEqual(AugmentationHelper.getAugmentationType(state), AugmentationModel[AugmentationModel.Article]);
});

test("getAugmentationType returns 'Article' for types that we don't support", () => {
	let state = HelperFunctions.getMockClipperState();
	state.augmentationResult.data = {
		ContentInHtml: "",
		ContentModel: AugmentationModel.BizCard,
		ContentObjects: undefined,
		PageMetadata: {}
	};
	strictEqual(AugmentationHelper.getAugmentationType(state), AugmentationModel[AugmentationModel.Article]);

});

test("getArticlePreviewElement should return the MainArticleContainer class element if it exists", () => {
	let mainArticleContainer = document.createElement("DIV") as HTMLHtmlElement;
	mainArticleContainer.className = "MainArticleContainer";
	fixture.appendChild(mainArticleContainer);

	let actual = AugmentationHelper.getArticlePreviewElement(document);
	strictEqual(actual, mainArticleContainer, "The MainArticleContainer should be retrieved");
});

test("getArticlePreviewElement should return the document's body if the MainArticleContainer class element does not exist", () => {
	let actual = AugmentationHelper.getArticlePreviewElement(document);
	strictEqual(actual, document.body, "The body should be retrieved");
});
