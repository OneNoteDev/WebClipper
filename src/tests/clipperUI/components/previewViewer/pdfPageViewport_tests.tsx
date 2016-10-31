import {PdfPageViewport} from "../../../../scripts/clipperUI/components/previewViewer/pdfPageViewport";

import {HelperFunctions} from "../../../helperFunctions";

import {pdfDataUrls, pdfDataUrlDimensions} from "./pdfDataUrls";

QUnit.module("pdfPageViewport", {});

test("Given both the imgUrl and dimensions, the imgUrl is rendered in the component in a container div under those dimensions", () => {
	let expectedWidth = pdfDataUrlDimensions[0].width;
	let expectedHeight = pdfDataUrlDimensions[0].height;

	let pdfPageViewport = HelperFunctions.mountToFixture(
		<PdfPageViewport viewportDimensions={{ width: parseInt(expectedWidth, 10), height: parseInt(expectedHeight, 10) }}
			imgUrl={pdfDataUrls[0]} index={0} />);

	let container = HelperFunctions.getFixture().firstChild as HTMLElement;
	let containerComputedStyle = window.getComputedStyle(container);
	strictEqual(containerComputedStyle.maxWidth, expectedWidth, "The container's max width should be the specified viewport width");

	let images = container.getElementsByTagName("img");
	strictEqual(images.length, 1, "There should be one image present in the container");

	let imageComputedStyle = window.getComputedStyle(images[0]);
	strictEqual(imageComputedStyle.maxWidth, expectedWidth, "The image's max width should be the specified viewport width");
	strictEqual(imageComputedStyle.maxHeight, expectedHeight, "The image's max height should be the specified viewport height");
});

test("When not given the imgUrl, the component should render a blank viewport with the specified dimensions", () => {
	let expectedWidth = pdfDataUrlDimensions[0].width;
	let expectedHeight = pdfDataUrlDimensions[0].height;

	let pdfPageViewport = HelperFunctions.mountToFixture(
		<PdfPageViewport viewportDimensions={{ width: parseInt(expectedWidth, 10), height: parseInt(expectedHeight, 10) }}
			index={0} />);

	let container = HelperFunctions.getFixture().firstChild as HTMLElement;
	let containerComputedStyle = window.getComputedStyle(container);
	strictEqual(containerComputedStyle.width, expectedWidth, "The container's width should be the specified viewport width");
	strictEqual(containerComputedStyle.height, expectedHeight, "The container's height should be the specified viewport width");

	let images = container.getElementsByTagName("img");
	strictEqual(images.length, 0, "There should be no images rendered");
});

test("Given the index, the component should render the container with the index stored in the attribute 'data-pageindex'", () => {
	let expectedIndex = 11;

	let pdfPageViewport = HelperFunctions.mountToFixture(
		<PdfPageViewport viewportDimensions={{ width: 20, height: 15 }}
			imgUrl={pdfDataUrls[0]} index={expectedIndex} />);

	let container = HelperFunctions.getFixture().firstChild as HTMLElement;
	strictEqual((container.dataset as any).pageindex, "" + expectedIndex, "The index should be stored in the data-pageindex attribute");
});
