import {Constants} from "../../../scripts/constants";

import {PdfClipOptions} from "../../../scripts/clipperUI/components/pdfClipOptions";

import {Assert} from "../../assert";
import {MithrilUtils} from "../../mithrilUtils";
import {MockProps} from "../../mockProps";
import {TestModule} from "../../testModule";

export class PdfClipOptionsTests extends TestModule {
	private defaultComponent;

	protected module() {
		return "pdfClipOptions";
	}

	protected beforeEach() {
		let mockClipperState = MockProps.getMockClipperState();
		this.defaultComponent = <PdfClipOptions
			clipperState={mockClipperState}
			onCheckboxChange={() => { } }
			onDistributionChange={() => { } }
			allPages={true}
			shouldAttachPdf={true}
			shouldDistributePages={true}
		/>;
	}

	protected tests() {
		// TODO test rendering based on props, listen for callbacks

		test("The tab order should flow linearly between pdf options", () => {
			MithrilUtils.mountToFixture(this.defaultComponent);
			Assert.tabOrderIsIncremental([
				Constants.Ids.radioAllPagesLabel, Constants.Ids.radioPageRangeLabel, Constants.Ids.onePageForEntirePdfLabel,
				Constants.Ids.onePageForEachPdfLabel, Constants.Ids.attachmentCheckboxLabel
			]);
		});
	}
}

(new PdfClipOptionsTests()).runTests();
