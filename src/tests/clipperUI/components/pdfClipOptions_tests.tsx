import {Constants} from "../../../scripts/constants";

import {ClipperState, ClipperStateProp} from "../../../scripts/clipperUI/clipperState";
import {Status} from "../../../scripts/clipperUI/status";

import {PdfClipOptions} from "../../../scripts/clipperUI/components/pdfClipOptions";

import {Assert} from "../../assert";
import {MithrilUtils} from "../../mithrilUtils";
import {MockProps} from "../../mockProps";
import {TestModule} from "../../testModule";

import {MockPdfDocument} from "../../contentCapture/MockPdfDocument";
import {MockPdfValues} from "../../contentCapture/mockPdfValues";

declare function require(name: string);

export class PdfClipOptionsTests extends TestModule {
	private stringsJson = require("../../../strings.json");
	private defaultPdfClipOptionsProps: ClipperStateProp;
	private defaultComponent;

	protected module() {
		return "pdfClipOptions";
	}

	protected beforeEach() {
		let defaultClipperState = MockProps.getMockClipperState();
		defaultClipperState.pdfResult.status = Status.Succeeded;
		defaultClipperState.pdfResult.data.set({
			pdf: new MockPdfDocument(),
			viewportDimensions: MockPdfValues.dimensions,
			byteLength: MockPdfValues.byteLength
		});
		this.defaultPdfClipOptionsProps = {
			clipperState: defaultClipperState
		};
		this.defaultComponent = <PdfClipOptions {...this.defaultPdfClipOptionsProps} />;
	}

	protected tests() {
		// TODO test rendering based on props, click tests, test that all elements are rendered, text label rendering

		test("All elements that should always be present in the non-expanded state should be rendered correctly assuming all the props are true", () => {
			MithrilUtils.mountToFixture(this.defaultComponent);

			ok(document.getElementById(Constants.Ids.radioAllPagesLabel), "radioAllPagesLabel should exist");
			ok(document.getElementById(Constants.Ids.radioPageRangeLabel), "radioPageRangeLabel should exist");
			ok(!document.getElementById(Constants.Ids.checkboxToDistributePages), "checkboxToDistributePages should not exist");
			ok(!document.getElementById(Constants.Ids.checkboxToAttachPdf), "checkboxToDistributePages should not exist");
		});

		test("After clicking the 'More' button, all elements should be rendered correctly assuming all the props are true", () => {
			MithrilUtils.mountToFixture(this.defaultComponent);

			MithrilUtils.simulateAction(() => {
				document.getElementById(Constants.Ids.moreClipOptions).click();
			});

			ok(document.getElementById(Constants.Ids.radioAllPagesLabel), "radioAllPagesLabel should exist");
			ok(document.getElementById(Constants.Ids.radioPageRangeLabel), "radioPageRangeLabel should exist");
			ok(document.getElementById(Constants.Ids.checkboxToDistributePages), "checkboxToDistributePages should exist");
			ok(document.getElementById(Constants.Ids.checkboxToAttachPdf), "checkboxToAttachPdf should exist");
		});

		test("All elements that should always be present should be rendered correctly assuming all the props are false", () => {
			this.defaultPdfClipOptionsProps.clipperState.pdfPreviewInfo.allPages = false;
			this.defaultPdfClipOptionsProps.clipperState.pdfPreviewInfo.shouldAttachPdf = false;
			this.defaultPdfClipOptionsProps.clipperState.pdfPreviewInfo.shouldDistributePages = false;
			MithrilUtils.mountToFixture(<PdfClipOptions {...this.defaultPdfClipOptionsProps} />);

			ok(document.getElementById(Constants.Ids.radioAllPagesLabel), "radioAllPagesLabel should exist");
			ok(document.getElementById(Constants.Ids.radioPageRangeLabel), "radioPageRangeLabel should exist");
		});

		test("All elements that should always be present should be rendered correctly assuming all the props are false", () => {
			this.defaultPdfClipOptionsProps.clipperState.pdfPreviewInfo.allPages = false;
			this.defaultPdfClipOptionsProps.clipperState.pdfPreviewInfo.shouldAttachPdf = false;
			this.defaultPdfClipOptionsProps.clipperState.pdfPreviewInfo.shouldDistributePages = false;
			MithrilUtils.mountToFixture(<PdfClipOptions {...this.defaultPdfClipOptionsProps} />);

			MithrilUtils.simulateAction(() => {
				document.getElementById(Constants.Ids.moreClipOptions).click();
			});

			ok(document.getElementById(Constants.Ids.checkboxToDistributePages), "checkboxToDistributePages should exist");
			ok(document.getElementById(Constants.Ids.checkboxToAttachPdf), "checkboxToAttachPdf should exist");
		});

		test("The range input box should be present if allPages is selected", () => {
			MithrilUtils.mountToFixture(this.defaultComponent);
			ok(document.getElementById(Constants.Ids.rangeInput), "The range input box should be present");
		});

		test("The range input box should be present if pageRange is selected", () => {
			this.defaultPdfClipOptionsProps.clipperState.pdfPreviewInfo.allPages = false;
			MithrilUtils.mountToFixture(<PdfClipOptions {...this.defaultPdfClipOptionsProps} />);
			ok(document.getElementById(Constants.Ids.rangeInput), "The range input box should be present");
		});

		test("The tab order should flow linearly between pdf options", () => {
			MithrilUtils.mountToFixture(this.defaultComponent);
			MithrilUtils.simulateAction(() => {
				document.getElementById(Constants.Ids.moreClipOptions).click();
			});
			Assert.tabOrderIsIncremental([
				Constants.Ids.radioAllPagesLabel, Constants.Ids.radioPageRangeLabel, Constants.Ids.checkboxToDistributePages, Constants.Ids.checkboxToAttachPdf
			]);
		});

		test("Given that the user selected page ranges, the tab order should flow linearly between pdf options", () => {
			this.defaultPdfClipOptionsProps.clipperState.pdfPreviewInfo.allPages = false;
			MithrilUtils.mountToFixture(<PdfClipOptions {...this.defaultPdfClipOptionsProps} />);

			MithrilUtils.simulateAction(() => {
				document.getElementById(Constants.Ids.moreClipOptions).click();
			});
			Assert.tabOrderIsIncremental([
				Constants.Ids.radioAllPagesLabel, Constants.Ids.radioPageRangeLabel, Constants.Ids.rangeInput, Constants.Ids.checkboxToDistributePages, Constants.Ids.checkboxToAttachPdf
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

		test("Given that the shouldDistributePages prop is true, the checkboxToDistributePages should be filled", () => {
			MithrilUtils.mountToFixture(this.defaultComponent);
			MithrilUtils.simulateAction(() => {
				document.getElementById(Constants.Ids.moreClipOptions).click();
			});

			let shouldDistributePagesElemn = document.getElementById(Constants.Ids.checkboxToDistributePages);
			let checkboxCheckElems = shouldDistributePagesElemn.getElementsByClassName(Constants.Classes.checkboxCheck);
			strictEqual(checkboxCheckElems.length, 1, "The checkbox to distribute the pages should be filled");
		});

		test("Given that the shouldDistributePages prop is false, the checkboxToDistributePages should not be filled", () => {
			this.defaultPdfClipOptionsProps.clipperState.pdfPreviewInfo.shouldDistributePages = false;
			MithrilUtils.mountToFixture(this.defaultComponent);
			MithrilUtils.simulateAction(() => {
				document.getElementById(Constants.Ids.moreClipOptions).click();
			});

			let shouldDistributePagesElemn = document.getElementById(Constants.Ids.checkboxToDistributePages);
			let checkboxCheckElems = shouldDistributePagesElemn.getElementsByClassName(Constants.Classes.checkboxCheck);
			strictEqual(checkboxCheckElems.length, 0, "The checkbox to distribute the pages should not be filled");
		});

		test("Given that the shouldAttachPdf prop is true, the attachment checkbox should be selected", () => {
			MithrilUtils.mountToFixture(this.defaultComponent);
			MithrilUtils.simulateAction(() => {
				document.getElementById(Constants.Ids.moreClipOptions).click();
			});

			let shouldAttachPdfElem = document.getElementById(Constants.Ids.checkboxToAttachPdf);
			let checkboxCheckElems = shouldAttachPdfElem.getElementsByClassName(Constants.Classes.checkboxCheck);
			strictEqual(checkboxCheckElems.length, 1, "The checkbox to attach the pdf should be filled");
		});

		test("Given that the shouldAttachPdf prop is false, the attachment checkbox should not be selected", () => {
			this.defaultPdfClipOptionsProps.clipperState.pdfPreviewInfo.shouldAttachPdf = false;
			MithrilUtils.mountToFixture(<PdfClipOptions {...this.defaultPdfClipOptionsProps} />);
			MithrilUtils.simulateAction(() => {
				document.getElementById(Constants.Ids.moreClipOptions).click();
			});

			let shouldAttachPdfElem = document.getElementById(Constants.Ids.checkboxToAttachPdf);
			let checkboxCheckElems = shouldAttachPdfElem.getElementsByClassName(Constants.Classes.checkboxCheck);
			strictEqual(checkboxCheckElems.length, 0, "The checkbox to attach the pdf should not be filled");
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

		test("Clicking on the 'More' button should toggle the moreOptionsOpened boolean", () => {
			let pdfClipOptions = MithrilUtils.mountToFixture(this.defaultComponent);
			let initialMoreOptionsOpenedValue: boolean = pdfClipOptions.state.moreOptionsOpened;

			MithrilUtils.simulateAction(() => {
				document.getElementById(Constants.Ids.moreClipOptions).click();
			});

			strictEqual(pdfClipOptions.state.moreOptionsOpened, !initialMoreOptionsOpenedValue,
				"moreOptionsOpened in pdfClipOptionsState should be toggled (first click)");

			MithrilUtils.simulateAction(() => {
				document.getElementById(Constants.Ids.moreClipOptions).click();
			});

			strictEqual(pdfClipOptions.state.moreOptionsOpened, initialMoreOptionsOpenedValue,
				"moreOptionsOpened in pdfClipOptionsState should be toggled (second click)");
		});

		test("Clicking on shouldDistributesPagesCheckbox should toggle the shouldDistributePages boolean", () => {
			let pdfClipOptions = MithrilUtils.mountToFixture(this.defaultComponent);
			let initialCheckboxValue: boolean = pdfClipOptions.props.clipperState.pdfPreviewInfo.shouldDistributePages;

			MithrilUtils.simulateAction(() => {
				document.getElementById(Constants.Ids.moreClipOptions).click();
			});

			let checkboxToDistributePagesElem = document.getElementById(Constants.Ids.checkboxToDistributePages);

			MithrilUtils.simulateAction(() => {
				checkboxToDistributePagesElem.click();
			});

			strictEqual(pdfClipOptions.props.clipperState.pdfPreviewInfo.shouldDistributePages, !initialCheckboxValue,
				"shouldDistributePages in clipperState should be toggled (first click)");

			MithrilUtils.simulateAction(() => {
				checkboxToDistributePagesElem.click();
			});

			strictEqual(pdfClipOptions.props.clipperState.pdfPreviewInfo.shouldDistributePages, initialCheckboxValue,
				"shouldDistributePages in clipperState should be toggled (second click)");
		});

		test("Clicking on the attachment checkbox should toggle the shouldAttachPdf boolean", () => {
			let pdfClipOptions = MithrilUtils.mountToFixture(this.defaultComponent);
			let initialCheckboxValue: boolean = pdfClipOptions.props.clipperState.pdfPreviewInfo.shouldAttachPdf;

			MithrilUtils.simulateAction(() => {
				document.getElementById(Constants.Ids.moreClipOptions).click();
			});

			let attachmentCheckboxElem = document.getElementById(Constants.Ids.checkboxToAttachPdf);

			MithrilUtils.simulateAction(() => {
				attachmentCheckboxElem.click();
			});

			strictEqual(pdfClipOptions.props.clipperState.pdfPreviewInfo.shouldAttachPdf, !initialCheckboxValue,
				"shouldAttachPdf in clipperState should be toggled (first click)");

			MithrilUtils.simulateAction(() => {
				attachmentCheckboxElem.click();
			});

			strictEqual(pdfClipOptions.props.clipperState.pdfPreviewInfo.shouldAttachPdf, initialCheckboxValue,
				"shouldAttachPdf in clipperState should be toggled (second click)");
		});

		test("If the pdf is below the MIME size limit, the AttachPdfFile should be shown", () => {
			let pdfClipOptions = MithrilUtils.mountToFixture(this.defaultComponent);
			MithrilUtils.simulateAction(() => {
				document.getElementById(Constants.Ids.moreClipOptions).click();
			});

			let attachmentCheckboxElem = document.getElementById(Constants.Ids.checkboxToAttachPdf);
			strictEqual(attachmentCheckboxElem.innerText, this.stringsJson["WebClipper.Label.AttachPdfFile"] + " " + this.stringsJson["WebClipper.Label.AttachPdfFileSubText"]);
		});

		test("If the pdf is above the MIME size limit, the PdfTooLargeToAttach should be shown instead of AttachPdfFile", () => {
			this.defaultPdfClipOptionsProps.clipperState.pdfResult.data.get().byteLength = Constants.Settings.maximumMimeSizeLimit + 1;
			let pdfClipOptions = MithrilUtils.mountToFixture(this.defaultComponent);

			MithrilUtils.simulateAction(() => {
				document.getElementById(Constants.Ids.moreClipOptions).click();
			});
			let attachmentCheckboxElem = document.getElementById(Constants.Ids.pdfIsTooLargeToAttachIndicator);
			strictEqual(attachmentCheckboxElem.innerText.trim(), this.stringsJson["WebClipper.Label.PdfTooLargeToAttach"]);
		});

		test("If the PDF result has not started, or has failed, the checkboxToAttachPdf should be visible but disabled", () => {
			this.defaultPdfClipOptionsProps.clipperState.pdfResult.status = Status.NotStarted;
			let pdfClipOptions = MithrilUtils.mountToFixture(this.defaultComponent);
			MithrilUtils.simulateAction(() => {
				document.getElementById(Constants.Ids.moreClipOptions).click();
			});

			let checkbox: HTMLElement = document.getElementById(Constants.Ids.checkboxToAttachPdf);
			ok(checkbox, "The checkboxToAttachPdf should be visible");
			ok(checkbox.classList.contains("disabled"), "The checkboxToAttachPdf should be disabled");

			MithrilUtils.simulateAction(() => {
				this.defaultPdfClipOptionsProps.clipperState.pdfResult.status = Status.InProgress;
			});

			ok(document.getElementById(Constants.Ids.checkboxToAttachPdf), "The checkboxToAttachPdf should still be visible");
			ok(checkbox.classList.contains("disabled"), "The checkboxToAttachPdf should be disabled");
		});

		test("If the PDF result has finished, and the PDF is too large, the checkboxToAttachPdf should not be visible, and the pdfIsTooLargeToAttachIndicator should be visible", () => {
			let defaultClipperState = MockProps.getMockClipperState();
			defaultClipperState.pdfResult.status = Status.Succeeded;
			defaultClipperState.pdfResult.data.set({
				pdf: new MockPdfDocument(),
				viewportDimensions: MockPdfValues.dimensions,
				byteLength: Constants.Settings.maximumMimeSizeLimit + 5
			});
			this.defaultPdfClipOptionsProps = {
				clipperState: defaultClipperState
			};
			this.defaultComponent = <PdfClipOptions {...this.defaultPdfClipOptionsProps} />;
			MithrilUtils.mountToFixture(this.defaultComponent);
			MithrilUtils.simulateAction(() => {
				document.getElementById(Constants.Ids.moreClipOptions).click();
			});

			ok(document.getElementById(Constants.Ids.pdfIsTooLargeToAttachIndicator), "The pdfIsTooLargeToAttachIndicator should be visible");
		});

		test("Given that shouldShowPopover is true, then the popover should be visible", () => {
			this.defaultPdfClipOptionsProps.clipperState.pdfPreviewInfo.allPages = false;
			this.defaultPdfClipOptionsProps.clipperState.pdfPreviewInfo.shouldShowPopover = true;
			let pdfClipOptions = MithrilUtils.mountToFixture(this.defaultComponent);

			ok(document.querySelector("." + Constants.Classes.popover), "The popover should be visible");
		});
	}
}

(new PdfClipOptionsTests()).runTests();
