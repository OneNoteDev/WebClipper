import * as sinon from "sinon";

import {Clipper} from "../../../../scripts/clipperUI/frontEndGlobals";
import {PreviewViewerPdfHeader, PreviewViewerPdfHeaderProp} from "../../../../scripts/clipperUI/components/previewViewer/previewViewerPdfHeader";

import {Constants} from "../../../../scripts/constants";

import {HelperFunctions} from "../../../helperFunctions";

import {ClipperState} from "../../../../scripts/clipperUI/clipperState";
import {Status} from "../../../../scripts/clipperUI/status";

import {StubSessionLogger} from "../../../../scripts/logging/stubSessionLogger";

let defaultComponent;
let clipperState: ClipperState;
let mockProp: PreviewViewerPdfHeaderProp;

QUnit.module("previewViewerPdfHeader", {
	beforeEach: () => {
		mockProp = {
			onCheckboxChange: sinon.spy((checked: boolean) => { }),
			onTextChange: sinon.spy((text: string) => { }),
			onSelectionChange: sinon.spy((selection: boolean) => { }),
			allPages: true,
			shouldAttachPdf: false
		} as any;

		clipperState = HelperFunctions.getMockClipperState();
		clipperState.pdfResult.status = Status.Succeeded;
		clipperState.pdfResult.data.set({
			byteLength: Constants.Settings.maximumMimeSizeLimit - 1
		});

		defaultComponent =
			<PreviewViewerPdfHeader
				onCheckboxChange={mockProp.onCheckboxChange}
				onTextChange={mockProp.onTextChange}
				onSelectionChange={mockProp.onSelectionChange}
				allPages={mockProp.allPages}
				shouldAttachPdf={mockProp.shouldAttachPdf}
				clipperState={clipperState}/>;
	}
});

test("Given that the user selected all pages, the tabbing should flow from all pages radio button to page selection radio button to attachment checkbox button,"
	+ "and each tab index should not be less than 1", () => {
	HelperFunctions.mountToFixture(defaultComponent);

	let elementsInExpectedTabOrder = [
		{ name: Constants.Ids.radioAllPagesLabel, elem: document.getElementById(Constants.Ids.radioAllPagesLabel) },
		{ name: Constants.Ids.radioPageRangeLabel, elem: document.getElementById(Constants.Ids.radioPageRangeLabel) },
		{ name: Constants.Ids.attachmentCheckboxLabel, elem: document.getElementById(Constants.Ids.attachmentCheckboxLabel) }
	];

	for (let i = 1; i < elementsInExpectedTabOrder.length; i++) {
		ok(elementsInExpectedTabOrder[i].elem.tabIndex > elementsInExpectedTabOrder[i - 1].elem.tabIndex,
			"Element " + elementsInExpectedTabOrder[i].name + " should have a greater tabIndex than element " + elementsInExpectedTabOrder[i - 1].name);
	}

	for (let i = 0; i < elementsInExpectedTabOrder.length; i++) {
		ok(elementsInExpectedTabOrder[i].elem.tabIndex > 0);
	}
});

test("Given that the user selected page ranges, the tabbing should flow from all pages radio button to page selection radio button to attachment checkbox button,"
	+ "and each tab index should not be less than 1", () => {
	HelperFunctions.mountToFixture(<PreviewViewerPdfHeader
		onCheckboxChange={mockProp.onCheckboxChange}
		onTextChange={mockProp.onTextChange}
		onSelectionChange={mockProp.onSelectionChange}
		allPages={false}
		shouldAttachPdf={mockProp.shouldAttachPdf}
		clipperState={clipperState}/>);

	let elementsInExpectedTabOrder = [
		{ name: Constants.Ids.radioAllPagesLabel, elem: document.getElementById(Constants.Ids.radioAllPagesLabel) },
		{ name: Constants.Ids.radioPageRangeLabel, elem: document.getElementById(Constants.Ids.radioPageRangeLabel) },
		{ name: Constants.Ids.rangeInput, elem: document.getElementById(Constants.Ids.rangeInput) },
		{ name: Constants.Ids.attachmentCheckboxLabel, elem: document.getElementById(Constants.Ids.attachmentCheckboxLabel) }
	];

	for (let i = 1; i < elementsInExpectedTabOrder.length; i++) {
		ok(elementsInExpectedTabOrder[i].elem.tabIndex > elementsInExpectedTabOrder[i - 1].elem.tabIndex,
			"Element " + elementsInExpectedTabOrder[i].name + " should have a greater tabIndex than element " + elementsInExpectedTabOrder[i - 1].name);
	}

	for (let i = 0; i < elementsInExpectedTabOrder.length; i++) {
		ok(elementsInExpectedTabOrder[i].elem.tabIndex > 0);
	}
});

test("Given that the user selected page ranges, and MIME size limit was exceeded, the tabbing should flow from all pages radio button to page selection radio button to range input,"
	+ "and each tab index should not be less than 1", () => {
	clipperState.pdfResult.data.get().byteLength = Constants.Settings.maximumMimeSizeLimit;
	HelperFunctions.mountToFixture(<PreviewViewerPdfHeader
		onCheckboxChange={mockProp.onCheckboxChange}
		onTextChange={mockProp.onTextChange}
		onSelectionChange={mockProp.onSelectionChange}
		allPages={false}
		shouldAttachPdf={mockProp.shouldAttachPdf}
		clipperState={clipperState}/>);

	let elementsInExpectedTabOrder = [
		{ name: Constants.Ids.radioAllPagesLabel, elem: document.getElementById(Constants.Ids.radioAllPagesLabel) },
		{ name: Constants.Ids.radioPageRangeLabel, elem: document.getElementById(Constants.Ids.radioPageRangeLabel) },
		{ name: Constants.Ids.rangeInput, elem: document.getElementById(Constants.Ids.rangeInput) }
	];

	for (let i = 1; i < elementsInExpectedTabOrder.length; i++) {
		ok(elementsInExpectedTabOrder[i].elem.tabIndex > elementsInExpectedTabOrder[i - 1].elem.tabIndex,
			"Element " + elementsInExpectedTabOrder[i].name + " should have a greater tabIndex than element " + elementsInExpectedTabOrder[i - 1].name);
	}

	for (let i = 0; i < elementsInExpectedTabOrder.length; i++) {
		ok(elementsInExpectedTabOrder[i].elem.tabIndex > 0);
	}
});

test("Given that the user selected all pages, the range input text box should not be present", () => {
	HelperFunctions.mountToFixture(defaultComponent);
	ok(!document.getElementById(Constants.Ids.rangeInput), "The range input should not be present");
});

test("Given that the user selected page ranges, the range input text box should be present", () => {
	HelperFunctions.mountToFixture(<PreviewViewerPdfHeader
		onCheckboxChange={mockProp.onCheckboxChange}
		onTextChange={mockProp.onTextChange}
		onSelectionChange={mockProp.onSelectionChange}
		allPages={false}
		shouldAttachPdf={mockProp.shouldAttachPdf}
		clipperState={clipperState}/>);
	ok(document.getElementById(Constants.Ids.rangeInput), "The range input should be present");
});
