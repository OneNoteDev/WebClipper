import * as sinon from "sinon";

import {Clipper} from "../../../../scripts/clipperUI/frontEndGlobals";
import {PreviewViewerPdfHeader, PreviewViewerPdfHeaderProp} from "../../../../scripts/clipperUI/components/previewViewer/previewViewerPdfHeader";

import {Constants} from "../../../../scripts/constants";

import {HelperFunctions} from "../../../helperFunctions";

import {StubSessionLogger} from "../../../../scripts/logging/stubSessionLogger";

let defaultComponent;
let mockProp: PreviewViewerPdfHeaderProp;

QUnit.module("previewViewerAugmentationHeader", {
	beforeEach: () => {
		mockProp = {
			onCheckboxChange: sinon.spy((checked: boolean) => { }),
			onTextChange: sinon.spy((text: string) => { }),
			onSelectionChange: sinon.spy((selection: boolean) => { }),
			allPages: true,
			shouldAttachPdf: false
		} as any;
		defaultComponent =
			<PreviewViewerPdfHeader
				onCheckboxChange={mockProp.onCheckboxChange}
				onTextChange={mockProp.onTextChange}
				onSelectionChange={mockProp.onSelectionChange}
				allPages={mockProp.allPages}
				shouldAttachPdf={mockProp.shouldAttachPdf}
				clipperState={HelperFunctions.getMockClipperState()}/>;
	}
});

test("The tabbing should flow from highlight to font family selectors to font size selectors, and each tab index should not be less than 1", () => {
	HelperFunctions.mountToFixture(defaultComponent);

	let elementsInExpectedTabOrder = [
		{ name: Constants.Ids.radioAllPagesLabel, elem: document.getElementById(Constants.Ids.radioAllPagesLabel) },
		{ name: Constants.Ids.radioPageSelection, elem: document.getElementById(Constants.Ids.radioPageSelection) },
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
