import {Constants} from "../../../../scripts/constants";

import {PdfPreviewPage, PdfPreviewPageProp} from "../../../../scripts/clipperUI/components/previewViewer/pdfPreviewPage";

import {HelperFunctions} from "../../../helperFunctions";

import {pdfDataUrls, pdfDataUrlDimensions} from "./pdfDataUrls";

QUnit.module("pdfPreviewPage", {});

test("Given that the page is selected, the image container's opacity should be set to 1", () => {
	let pdfPreviewPage = HelperFunctions.mountToFixture(
		<PdfPreviewPage viewportDimensions={{ width: 50, height: 50 }}
			imgUrl={pdfDataUrls[0]} index={0} showPageNumber={false} isSelected={true} />);

	let container = HelperFunctions.getFixture().getElementsByClassName(Constants.Classes.pdfPreviewImageCanvas)[0];
	ok(!container.classList.contains(Constants.Classes.unselected), "The unselected class should not be applied to the container");
	strictEqual(HelperFunctions.getFixture().getElementsByClassName(Constants.Classes.unselected).length, 0,
		"The unselected class should not be applied anywhere");
});

test("Given that the page is not selected, the image container's opacity should be set to 0.3", () => {
	let pdfPreviewPage = HelperFunctions.mountToFixture(
		<PdfPreviewPage viewportDimensions={{ width: 50, height: 50 }}
			imgUrl={pdfDataUrls[0]} index={0} showPageNumber={false} isSelected={false} />);

	let container = HelperFunctions.getFixture().getElementsByClassName(Constants.Classes.pdfPreviewImageCanvas)[0];
	ok(container.classList.contains(Constants.Classes.unselected), "The unselected class should be applied to the container");
	strictEqual(HelperFunctions.getFixture().getElementsByClassName(Constants.Classes.unselected).length, 1,
		"The unselected class should only be applied once in the component");
});

// Note: Because we fade out the page numbers using a css class, we check for opacity to determine if the number is in view

test("Given that showPageNumber is true, the page number should be shown", () => {
	let index = 19;
	let expectedPageNumber = "" + (index + 1);
	let pdfPreviewPage = HelperFunctions.mountToFixture(
		<PdfPreviewPage viewportDimensions={{ width: 50, height: 50 }}
			imgUrl={pdfDataUrls[0]} index={index} showPageNumber={true} isSelected={true} />);

	let overlay = HelperFunctions.getFixture().getElementsByClassName(Constants.Classes.overlay)[0] as HTMLElement;
	strictEqual(overlay.innerText, expectedPageNumber, "The page number shown should be the index + 1");
	ok(!overlay.classList.contains(Constants.Classes.overlayHidden), "The overlay should not be hidden");
});

test("Given that showPageNumber is true and the index is 0, the page number should be shown", () => {
	let index = 0;
	let expectedPageNumber = "" + (index + 1);
	let pdfPreviewPage = HelperFunctions.mountToFixture(
		<PdfPreviewPage viewportDimensions={{ width: 50, height: 50 }}
			imgUrl={pdfDataUrls[0]} index={index} showPageNumber={true} isSelected={true} />);

	let overlay = HelperFunctions.getFixture().getElementsByClassName(Constants.Classes.overlay)[0] as HTMLElement;
	strictEqual(overlay.innerText, expectedPageNumber, "The page number shown should be the index + 1");
	ok(!overlay.classList.contains(Constants.Classes.overlayHidden), "The overlay should not be hidden");
});

test("Given that showPageNumber is false, the page number should not be shown", () => {
	let pdfPreviewPage = HelperFunctions.mountToFixture(
		<PdfPreviewPage viewportDimensions={{ width: 50, height: 50 }}
			imgUrl={pdfDataUrls[0]} index={10} showPageNumber={false} isSelected={true} />);

	let overlay = HelperFunctions.getFixture().getElementsByClassName(Constants.Classes.overlay)[0] as HTMLElement;
	ok(overlay.classList.contains(Constants.Classes.overlayHidden), "The overlay should be hidden");
});
