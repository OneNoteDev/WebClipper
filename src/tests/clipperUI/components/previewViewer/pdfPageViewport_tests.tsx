import {Constants} from "../../../../scripts/constants";

import {PdfPageViewport, PdfPageViewportProp} from "../../../../scripts/clipperUI/components/previewViewer/pdfPageViewport";

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
