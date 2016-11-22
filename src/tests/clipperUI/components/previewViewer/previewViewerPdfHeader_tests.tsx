import * as sinon from "sinon";

import {Constants} from "../../../../scripts/constants";

import {ClipperState} from "../../../../scripts/clipperUI/clipperState";
import {Clipper} from "../../../../scripts/clipperUI/frontEndGlobals";
import {Status} from "../../../../scripts/clipperUI/status";

import {PreviewViewerPdfHeader, PreviewViewerPdfHeaderProp} from "../../../../scripts/clipperUI/components/previewViewer/previewViewerPdfHeader";

import {StubSessionLogger} from "../../../../scripts/logging/stubSessionLogger";

import {Assert} from "../../../assert";
import {MithrilUtils} from "../../../mithrilUtils";
import {MockProps} from "../../../mockProps";
import {TestModule} from "../../../testModule";

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

		this.clipperState = MockProps.getMockClipperState();
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
		test("Given that the user selected all pages, the tabbing should flow from all pages radio button to page selection radio button to attachment checkbox button", () => {
			MithrilUtils.mountToFixture(this.defaultComponent);
			Assert.tabOrderIsIncremental([Constants.Ids.radioAllPagesLabel, Constants.Ids.radioPageRangeLabel, Constants.Ids.attachmentCheckboxLabel]);
		});

		test("Given that the user selected page ranges, the tabbing should flow from all pages radio button to page selection radio button to attachment checkbox button", () => {
			MithrilUtils.mountToFixture(<PreviewViewerPdfHeader
				onCheckboxChange={this.mockProp.onCheckboxChange}
				onTextChange={this.mockProp.onTextChange}
				onSelectionChange={this.mockProp.onSelectionChange}
				allPages={false}
				shouldAttachPdf={this.mockProp.shouldAttachPdf}
				clipperState={this.clipperState}/>);
			Assert.tabOrderIsIncremental([Constants.Ids.radioAllPagesLabel, Constants.Ids.radioPageRangeLabel, Constants.Ids.rangeInput, Constants.Ids.attachmentCheckboxLabel]);
		});

		test("Given that the user selected page ranges, and MIME size limit was exceeded, the tabbing should flow from all pages radio button to page selection radio button to range input", () => {
			this.clipperState.pdfResult.data.get().byteLength = Constants.Settings.maximumMimeSizeLimit;
			MithrilUtils.mountToFixture(<PreviewViewerPdfHeader
				onCheckboxChange={this.mockProp.onCheckboxChange}
				onTextChange={this.mockProp.onTextChange}
				onSelectionChange={this.mockProp.onSelectionChange}
				allPages={false}
				shouldAttachPdf={this.mockProp.shouldAttachPdf}
				clipperState={this.clipperState}/>);
			Assert.tabOrderIsIncremental([Constants.Ids.radioAllPagesLabel, Constants.Ids.radioPageRangeLabel, Constants.Ids.rangeInput]);
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
