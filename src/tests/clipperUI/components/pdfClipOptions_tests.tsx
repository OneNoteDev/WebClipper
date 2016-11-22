import {Constants} from "../../../scripts/constants";

import {ClipperState, ClipperStateProp} from "../../../scripts/clipperUI/clipperState";

import {PdfClipOptions} from "../../../scripts/clipperUI/components/pdfClipOptions";

import {Assert} from "../../assert";
import {MithrilUtils} from "../../mithrilUtils";
import {MockProps} from "../../mockProps";
import {TestModule} from "../../testModule";

export class PdfClipOptionsTests extends TestModule {
	private defaultPdfClipOptionsProps: ClipperStateProp;
	private defaultComponent;

	protected module() {
		return "pdfClipOptions";
	}

	protected beforeEach() {
		let defaultClipperState = MockProps.getMockClipperState();
		this.defaultPdfClipOptionsProps = {
			clipperState: defaultClipperState,
		};
		this.defaultComponent = <PdfClipOptions {...this.defaultPdfClipOptionsProps} />;
	}

	protected tests() {
		// TODO test rendering based on props, click tests, test that all elements are rendered

		test("All elements that should always be present should be rendered correctly assuming all the props are true", () => {
			MithrilUtils.mountToFixture(this.defaultComponent);

			ok(document.getElementById(Constants.Ids.radioAllPagesLabel), "radioAllPagesLabel should exist");
			ok(document.getElementById(Constants.Ids.radioPageRangeLabel), "radioPageRangeLabel should exist");
			ok(document.getElementById(Constants.Ids.onePageForEntirePdfLabel), "onePageForEntirePdfLabel should exist");
			ok(document.getElementById(Constants.Ids.onePageForEachPdfLabel), "onePageForEachPdfLabel should exist");
			ok(document.getElementById(Constants.Ids.attachmentCheckboxLabel), "attachmentCheckboxLabel should exist");
		});

		test("All elements that should always be present should be rendered correctly assuming all the props are false", () => {
			this.defaultPdfClipOptionsProps.clipperState.pdfPreviewInfo.allPages = false;
			this.defaultPdfClipOptionsProps.clipperState.pdfPreviewInfo.shouldAttachPdf = false;
			this.defaultPdfClipOptionsProps.clipperState.pdfPreviewInfo.shouldDistributePages = false;
			MithrilUtils.mountToFixture(<PdfClipOptions {...this.defaultPdfClipOptionsProps} />);

			ok(document.getElementById(Constants.Ids.radioAllPagesLabel), "radioAllPagesLabel should exist");
			ok(document.getElementById(Constants.Ids.radioPageRangeLabel), "radioPageRangeLabel should exist");
			ok(document.getElementById(Constants.Ids.onePageForEntirePdfLabel), "onePageForEntirePdfLabel should exist");
			ok(document.getElementById(Constants.Ids.onePageForEachPdfLabel), "onePageForEachPdfLabel should exist");
			ok(document.getElementById(Constants.Ids.attachmentCheckboxLabel), "attachmentCheckboxLabel should exist");
		});

		test("The range input box should not be present if allPages is selected", () => {
			MithrilUtils.mountToFixture(this.defaultComponent);
			ok(!document.getElementById(Constants.Ids.rangeInput), "The range input box should not be present");
		});

		test("The range input box should be present if pageRange is selected", () => {
			this.defaultPdfClipOptionsProps.clipperState.pdfPreviewInfo.allPages = false;
			MithrilUtils.mountToFixture(<PdfClipOptions {...this.defaultPdfClipOptionsProps} />);
			ok(document.getElementById(Constants.Ids.rangeInput), "The range input box should not be present");
		});

		test("The tab order should flow linearly between pdf options", () => {
			MithrilUtils.mountToFixture(this.defaultComponent);
			Assert.tabOrderIsIncremental([
				Constants.Ids.radioAllPagesLabel, Constants.Ids.radioPageRangeLabel, Constants.Ids.onePageForEntirePdfLabel,
				Constants.Ids.onePageForEachPdfLabel, Constants.Ids.attachmentCheckboxLabel
			]);
		});

		test("Given that the user selected page ranges, the tab order should flow linearly between pdf options", () => {
			this.defaultPdfClipOptionsProps.clipperState.pdfPreviewInfo.allPages = false;
			MithrilUtils.mountToFixture(<PdfClipOptions {...this.defaultPdfClipOptionsProps} />);

			Assert.tabOrderIsIncremental([
				Constants.Ids.radioAllPagesLabel, Constants.Ids.radioPageRangeLabel, Constants.Ids.rangeInput,
				Constants.Ids.onePageForEntirePdfLabel, Constants.Ids.onePageForEachPdfLabel, Constants.Ids.attachmentCheckboxLabel
			]);
		});

		test("Given that the allPages prop is true, the allPages radio should be selected, and the pageRange radio should not", () => {
			MithrilUtils.mountToFixture(this.defaultComponent);

			let allPagesElem = document.getElementById(Constants.Ids.radioAllPagesLabel);
			let allPagesRadioElems = allPagesElem.getElementsByClassName(Constants.Classes.radioIndicatorFill);
			strictEqual(allPagesRadioElems.length, 1, "The all pages radio should be filled");

			let pageRangeElem = document.getElementById(Constants.Ids.radioPageRangeLabel);
			let pageRangeRadioElems = pageRangeElem.getElementsByClassName(Constants.Classes.radioIndicatorFill);
			strictEqual(pageRangeRadioElems.length, 0, "The page range radio should not be filled");
		});

		test("Given that the allPages prop is false, the pageRange radio should be selected, and the allPages radio should not", () => {
			this.defaultPdfClipOptionsProps.clipperState.pdfPreviewInfo.allPages = false;
			MithrilUtils.mountToFixture(<PdfClipOptions {...this.defaultPdfClipOptionsProps} />);

			let allPagesElem = document.getElementById(Constants.Ids.radioAllPagesLabel);
			let allPagesRadioElems = allPagesElem.getElementsByClassName(Constants.Classes.radioIndicatorFill);
			strictEqual(allPagesRadioElems.length, 0, "The all pages radio should not be filled");

			let pageRangeElem = document.getElementById(Constants.Ids.radioPageRangeLabel);
			let pageRangeRadioElems = pageRangeElem.getElementsByClassName(Constants.Classes.radioIndicatorFill);
			strictEqual(pageRangeRadioElems.length, 1, "The page range radio should be filled");
		});

		test("Given that the shouldDistributePages prop is true, the onePageForEachPdf radio should be selected, and the onePageForEntirePdf radio should not", () => {
			MithrilUtils.mountToFixture(this.defaultComponent);

			let onePageForEachPdfElem = document.getElementById(Constants.Ids.onePageForEachPdfLabel);
			let onePageForEachPdfRadioElems = onePageForEachPdfElem.getElementsByClassName(Constants.Classes.radioIndicatorFill);
			strictEqual(onePageForEachPdfRadioElems.length, 1, "The onePageForEachPdf radio should be filled");

			let onePageForEntirePdfElem = document.getElementById(Constants.Ids.onePageForEntirePdfLabel);
			let onePageForEntirePdfRadioElems = onePageForEntirePdfElem.getElementsByClassName(Constants.Classes.radioIndicatorFill);
			strictEqual(onePageForEntirePdfRadioElems.length, 0, "The onePageForEntirePdf radio should not be filled");
		});

		test("Given that the shouldDistributePages prop is true, the onePageForEachPdf radio should be selected, and the onePageForEntirePdf radio should not", () => {
			this.defaultPdfClipOptionsProps.clipperState.pdfPreviewInfo.shouldDistributePages = false;
			MithrilUtils.mountToFixture(<PdfClipOptions {...this.defaultPdfClipOptionsProps} />);

			let onePageForEachPdfElem = document.getElementById(Constants.Ids.onePageForEachPdfLabel);
			let onePageForEachPdfRadioElems = onePageForEachPdfElem.getElementsByClassName(Constants.Classes.radioIndicatorFill);
			strictEqual(onePageForEachPdfRadioElems.length, 0, "The onePageForEachPdf radio should not be filled");

			let onePageForEntirePdfElem = document.getElementById(Constants.Ids.onePageForEntirePdfLabel);
			let onePageForEntirePdfRadioElems = onePageForEntirePdfElem.getElementsByClassName(Constants.Classes.radioIndicatorFill);
			strictEqual(onePageForEntirePdfRadioElems.length, 1, "The onePageForEntirePdf radio should be filled");
		});

		test("Given that the shouldAttachPdf prop is true, the attachment checkbox should be selected", () => {
			MithrilUtils.mountToFixture(this.defaultComponent);

			let shouldAttachPdfElem = document.getElementById(Constants.Ids.attachmentCheckboxLabel);
			let checkboxCheckElems = shouldAttachPdfElem.getElementsByClassName(Constants.Classes.checkboxCheck);
			strictEqual(checkboxCheckElems.length, 1, "The checkbox to attach the pdf should be filled");
		});

		test("Given that the shouldAttachPdf prop is true, the attachment checkbox should be selected", () => {
			this.defaultPdfClipOptionsProps.clipperState.pdfPreviewInfo.shouldAttachPdf = false;
			MithrilUtils.mountToFixture(<PdfClipOptions {...this.defaultPdfClipOptionsProps} />);

			let shouldAttachPdfElem = document.getElementById(Constants.Ids.attachmentCheckboxLabel);
			let checkboxCheckElems = shouldAttachPdfElem.getElementsByClassName(Constants.Classes.checkboxCheck);
			strictEqual(checkboxCheckElems.length, 0, "The checkbox to attach the pdf should be filled");
		});

		test("Clicking on the allPages radio should set allPages in clipperState to true", () => {
			let pdfClipOptions = MithrilUtils.mountToFixture(this.defaultComponent);

			let allPagesElem = document.getElementById(Constants.Ids.radioAllPagesLabel);
			MithrilUtils.simulateAction(() => {
				allPagesElem.click();
			});

			ok(pdfClipOptions.props.clipperState.pdfPreviewInfo.allPages, "allPages in clipperState should be set to true");
		});

		test("Clicking on the pageRange radio should set allPages in clipperState to false", () => {
			let pdfClipOptions = MithrilUtils.mountToFixture(this.defaultComponent);

			let pageRangeElem = document.getElementById(Constants.Ids.radioPageRangeLabel);
			MithrilUtils.simulateAction(() => {
				pageRangeElem.click();
			});

			ok(!pdfClipOptions.props.clipperState.pdfPreviewInfo.allPages, "allPages in clipperState should be set to false");
		});
	}
}

(new PdfClipOptionsTests()).runTests();
