import * as sinon from "sinon";

import {Clipper} from "../../../../scripts/clipperUI/frontEndGlobals";
import {PreviewViewerPdfHeader, PreviewViewerPdfHeaderProp} from "../../../../scripts/clipperUI/components/previewViewer/previewViewerPdfHeader";

import {Constants} from "../../../../scripts/constants";

import {HelperFunctions} from "../../../helperFunctions";
import {MithrilUtils} from "../../../mithrilUtils";
import {TestModule} from "../../../testModule";

import {ClipperState} from "../../../../scripts/clipperUI/clipperState";
import {Status} from "../../../../scripts/clipperUI/status";

import {StubSessionLogger} from "../../../../scripts/logging/stubSessionLogger";

export class PreviewViewerPdfHeaderTests extends TestModule {
	private defaultComponent;
	private clipperState: ClipperState;
	private mockProp: PreviewViewerPdfHeaderProp;

	protected module() {
		return "previewViewerPdfHeader";
	}

	protected beforeEach() {
		this.mockProp = {
			onCheckboxChange: sinon.spy((checked: boolean) => { }),
			onTextChange: sinon.spy((text: string) => { }),
			onSelectionChange: sinon.spy((selection: boolean) => { }),
			allPages: true,
			shouldAttachPdf: false
		} as any;

		this.clipperState = HelperFunctions.getMockClipperState();
		this.clipperState.pdfResult.status = Status.Succeeded;
		this.clipperState.pdfResult.data.set({
			byteLength: Constants.Settings.maximumMimeSizeLimit - 1
		});

		this.defaultComponent =
			<PreviewViewerPdfHeader
				onCheckboxChange={this.mockProp.onCheckboxChange}
				onTextChange={this.mockProp.onTextChange}
				onSelectionChange={this.mockProp.onSelectionChange}
				allPages={this.mockProp.allPages}
				shouldAttachPdf={this.mockProp.shouldAttachPdf}
				clipperState={this.clipperState}/>;
	}

	protected tests() {
		test("Given that the user selected all pages, the tabbing should flow from all pages radio button to page selection radio button to attachment checkbox button,"
			+ "and each tab index should not be less than 1", () => {
			MithrilUtils.mountToFixture(this.defaultComponent);

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
			MithrilUtils.mountToFixture(<PreviewViewerPdfHeader
				onCheckboxChange={this.mockProp.onCheckboxChange}
				onTextChange={this.mockProp.onTextChange}
				onSelectionChange={this.mockProp.onSelectionChange}
				allPages={false}
				shouldAttachPdf={this.mockProp.shouldAttachPdf}
				clipperState={this.clipperState}/>);

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
			this.clipperState.pdfResult.data.get().byteLength = Constants.Settings.maximumMimeSizeLimit;
			MithrilUtils.mountToFixture(<PreviewViewerPdfHeader
				onCheckboxChange={this.mockProp.onCheckboxChange}
				onTextChange={this.mockProp.onTextChange}
				onSelectionChange={this.mockProp.onSelectionChange}
				allPages={false}
				shouldAttachPdf={this.mockProp.shouldAttachPdf}
				clipperState={this.clipperState}/>);

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
			MithrilUtils.mountToFixture(this.defaultComponent);
			ok(!document.getElementById(Constants.Ids.rangeInput), "The range input should not be present");
		});

		test("Given that the user selected page ranges, the range input text box should be present", () => {
			MithrilUtils.mountToFixture(<PreviewViewerPdfHeader
				onCheckboxChange={this.mockProp.onCheckboxChange}
				onTextChange={this.mockProp.onTextChange}
				onSelectionChange={this.mockProp.onSelectionChange}
				allPages={false}
				shouldAttachPdf={this.mockProp.shouldAttachPdf}
				clipperState={this.clipperState}/>);
			ok(document.getElementById(Constants.Ids.rangeInput), "The range input should be present");
		});
	}
}

(new PreviewViewerPdfHeaderTests()).runTests();
