import {Constants} from "../../../../scripts/constants";

import {PdfPageViewport} from "../../../../scripts/clipperUI/components/previewViewer/pdfPageViewport";

import {MithrilUtils} from "../../../mithrilUtils";
import {TestModule} from "../../../testModule";

import {pdfDataUrls, pdfDataUrlDimensions} from "./pdfDataUrls";

export class PdfPageViewportTests extends TestModule {
	protected module() {
		return "pdfPageViewport";
	}

	protected tests() {
		test("Given both the imgUrl and dimensions, the imgUrl is rendered in the component in a container div under those dimensions", () => {
			let expectedWidth = pdfDataUrlDimensions[0].width;
			let expectedHeight = pdfDataUrlDimensions[0].height;

			let pdfPageViewport = MithrilUtils.mountToFixture(
				<PdfPageViewport viewportDimensions={{ width: parseInt(expectedWidth, 10), height: parseInt(expectedHeight, 10) }}
					imgUrl={pdfDataUrls[0]} index={0} />);

			let container = MithrilUtils.getFixture().firstChild as HTMLElement;
			let containerComputedStyle = window.getComputedStyle(container);
			strictEqual(containerComputedStyle.maxWidth, expectedWidth, "The container's max width should be the specified viewport width");

			let images = container.getElementsByTagName("img");
			strictEqual(images.length, 1, "There should be one image in the viewport");

			let spinners = container.getElementsByClassName(Constants.Classes.spinner);
			strictEqual(spinners.length, 0, "There should be no spinners in the viewport");

			let imageComputedStyle = window.getComputedStyle(images[0]);
			strictEqual(imageComputedStyle.maxWidth, expectedWidth, "The image's max width should be the specified viewport width");
			strictEqual(imageComputedStyle.maxHeight, expectedHeight, "The image's max height should be the specified viewport height");
		});

		test("When not given the imgUrl, the component should render a blank viewport with the specified dimensions", () => {
			let expectedWidth = "300px";
			let expectedHeight = "400px";

			let pdfPageViewport = MithrilUtils.mountToFixture(
				<PdfPageViewport viewportDimensions={{ width:  parseInt(expectedWidth, 10), height: parseInt(expectedHeight, 10) }}
					index={0} />);

			let container = MithrilUtils.getFixture().firstChild as HTMLElement;
			let containerComputedStyle = window.getComputedStyle(container);
			strictEqual(containerComputedStyle.width, expectedWidth, "The container's width should be the specified viewport width");
			strictEqual(containerComputedStyle.height, expectedHeight, "The container's height should be the specified viewport width");

			let images = container.getElementsByTagName("img");
			strictEqual(images.length, 0, "There should be no images in the viewport");

			let spinners = container.getElementsByClassName(Constants.Classes.spinner);
			strictEqual(spinners.length, 1, "There should be a spinner in the viewport");

			let spinner = spinners[0];
			let spinnerComputerStyle = window.getComputedStyle(spinner);
			strictEqual(spinnerComputerStyle.width, "45px", "The container's width should be 45px");
			strictEqual(spinnerComputerStyle.height, "65px", "The container's height should be 65px");
		});

		test("When not given the imgUrl, the component should render a loading spinner with the specified dimensions given if the viewport is tiny, and the spinner should not exceed the viewport dimensions", () => {
			let expectedWidth = "2px";
			let expectedHeight = "1px";

			let pdfPageViewport = MithrilUtils.mountToFixture(
				<PdfPageViewport viewportDimensions={{ width:  parseInt(expectedWidth, 10), height: parseInt(expectedHeight, 10) }}
					index={0} />);

			let container = MithrilUtils.getFixture().firstChild as HTMLElement;
			let containerComputedStyle = window.getComputedStyle(container);
			strictEqual(containerComputedStyle.width, expectedWidth, "The container's width should be the specified viewport width");
			strictEqual(containerComputedStyle.height, expectedHeight, "The container's height should be the specified viewport height + the height of the spinner");

			let images = container.getElementsByTagName("img");
			strictEqual(images.length, 0, "There should be no images in the viewport");

			let spinners = container.getElementsByClassName(Constants.Classes.spinner);
			strictEqual(spinners.length, 1, "There should be a spinner in the viewport");

			let spinner = spinners[0];
			let spinnerComputerStyle = window.getComputedStyle(spinner);
			strictEqual(spinnerComputerStyle.width, expectedWidth, "The container's width should not exceed the viewport width");
			strictEqual(spinnerComputerStyle.height, expectedHeight, "The container's height should not exceed the viewport height");
		});

		test("Given the index, the component should render the container with the index stored in the attribute 'data-pageindex'", () => {
			let expectedIndex = 11;

			let pdfPageViewport = MithrilUtils.mountToFixture(
				<PdfPageViewport viewportDimensions={{ width: 20, height: 15 }}
					imgUrl={pdfDataUrls[0]} index={expectedIndex} />);

			let container = MithrilUtils.getFixture().firstChild as HTMLElement;
			strictEqual((container.dataset as any).pageindex, "" + expectedIndex, "The index should be stored in the data-pageindex attribute");
		});

		test("Given the index, but not an imgUrl, the component should still render the container with the index stored in the attribute 'data-pageindex'", () => {
			let expectedIndex = 999;

			let pdfPageViewport = MithrilUtils.mountToFixture(
				<PdfPageViewport viewportDimensions={{ width: 20, height: 15 }}
					index={expectedIndex} />);

			let container = MithrilUtils.getFixture().firstChild as HTMLElement;
			strictEqual((container.dataset as any).pageindex, "" + expectedIndex, "The index should be stored in the data-pageindex attribute");
		});
	}
}

(new PdfPageViewportTests()).runTests();
