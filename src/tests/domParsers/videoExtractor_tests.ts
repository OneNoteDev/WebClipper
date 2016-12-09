import {VideoExtractor} from "../../scripts/domParsers/videoExtractor";

import {TestModule} from "../testModule";

class MockVideoExtractor extends VideoExtractor {
	public createEmbeddedVideosFromHtml(html: string): HTMLIFrameElement[] {
		return [
			this.createMockIframe("https://www.myvideosite.xyz/id1"),
			this.createMockIframe("https://www.myvideosite.xyz/url"),
			this.createMockIframe("https://www.myvideosite.xyz/id1"),
			this.createMockIframe("https://www.myvideosite.xyz/id2")
		];
	}

	public createEmbeddedVideoFromUrl(url: string): HTMLIFrameElement {
		return this.createMockIframe("https://www.myvideosite.xyz/url");
	}

	public createEmbeddedVideoFromId(id: string): HTMLIFrameElement {
		return this.createMockIframe("https://www.myvideosite.xyz/id");
	};

	private createMockIframe(src: string): HTMLIFrameElement {
		let iframe = document.createElement("iframe") as HTMLIFrameElement;
		iframe.src = src;
		return iframe;
	}
}

export class KhanAcademyVideoExtractorTests extends TestModule {
	private mockVideoExtractor = new MockVideoExtractor();

	protected module() {
		return "videoExtractor";
	}

	protected tests() {
		test("Given that both of the page url and content represents a bunch of embeddable videos, a list of iframes are returned with no duplicate srcs", () => {
			let videoEmbeds = this.mockVideoExtractor.createEmbeddedVideosFromPage("", "");
			strictEqual(videoEmbeds.length, 3, "3 unique iframes should be returned");
			strictEqual(videoEmbeds[0].src, "https://www.myvideosite.xyz/url", "The video associated with the url should be returned first");
			strictEqual(videoEmbeds[1].src, "https://www.myvideosite.xyz/id1", "The videos in the html should be returned sequentially");
			strictEqual(videoEmbeds[2].src, "https://www.myvideosite.xyz/id2", "The videos in the html should be returned sequentially");
		});
	}
}

(new KhanAcademyVideoExtractorTests()).runTests();
