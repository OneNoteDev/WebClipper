import {AugmentationHelper, AugmentationModel} from "../../scripts/contentCapture/augmentationHelper";

import {MithrilUtils} from "../mithrilUtils";
import {MockProps} from "../mockProps";
import {TestModule} from "../testModule";

export class AugmentationHelperReadabilityTests extends TestModule {
	protected module() {
		return "augmentationHelper-readability";
	}

	protected tests() {
		test("augmentPage should return Article content model when page has readable content", (assert: QUnitAssert) => {
			let done = assert.async();

			let paragraphs = "";
			for (let i = 0; i < 10; i++) {
				paragraphs += "<p>This is a test article with enough content to be parsed by Readability. It needs sufficient text to pass the content threshold. </p>";
			}
			let html = "<html><head><title>Test Article</title></head><body><article>" + paragraphs + "</article></body></html>";

			AugmentationHelper.augmentPage("http://example.com", "en-US", html).then((result) => {
				strictEqual(result.ContentModel, AugmentationModel.Article, "ContentModel should be Article");
				ok(result.ContentInHtml && result.ContentInHtml.length > 0, "ContentInHtml should not be empty");
				ok(result.PageMetadata, "PageMetadata should be defined");
			}).then(() => { done(); });
		});

		test("augmentPage should return None content model when page is not readable", (assert: QUnitAssert) => {
			let done = assert.async();
			let html = "<html><body><nav>Just navigation</nav></body></html>";

			AugmentationHelper.augmentPage("http://example.com", "en-US", html).then((result) => {
				strictEqual(result.ContentModel, AugmentationModel.None, "ContentModel should be None for non-readable pages");
			}).then(() => { done(); });
		});

		test("augmentPage should populate PageMetadata from Readability output", (assert: QUnitAssert) => {
			let done = assert.async();

			let paragraphs = "";
			for (let i = 0; i < 20; i++) {
				paragraphs += "<p>Long article content here for readability extraction to work properly. </p>";
			}
			let html = "<html><head><title>Great Article</title>" +
				'<meta name="author" content="John Doe">' +
				'<meta name="description" content="A great article">' +
				"</head><body><article>" + paragraphs + "</article></body></html>";

			AugmentationHelper.augmentPage("http://example.com", "en-US", html).then((result) => {
				ok(result.PageMetadata, "PageMetadata should be populated");
				strictEqual(result.PageMetadata.title, "Great Article", "Title should be extracted");
			}).then(() => { done(); });
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

(new AugmentationHelperReadabilityTests()).runTests();
(new AugmentationHelperSinonTests()).runTests();
