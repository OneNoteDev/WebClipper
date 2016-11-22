import {Constants} from "../../../../scripts/constants";

import {ClipperState} from "../../../../scripts/clipperUI/clipperState";
import {ClipMode} from "../../../../scripts/clipperUI/clipMode";
import {Status} from "../../../../scripts/clipperUI/status";

import {SmartValue} from "../../../../scripts/communicator/smartValue";

import {PdfScreenshotResult} from "../../../../scripts/contentCapture/pdfScreenshotHelper";

import {FullPagePreview} from "../../../../scripts/clipperUI/components/previewViewer/fullPagePreview";

import {MithrilUtils} from "../../../mithrilUtils";
import {MockProps} from "../../../mockProps";
import {TestModule} from "../../../testModule";

declare function require(name: string);

export class FullPagePreviewTests extends TestModule {
	private stringsJson = require("../../../../strings.json");

	protected module() {
		return "fullPagePreview";
	}

	protected tests() {
		test("The full page header should be displayed in Full Page mode", () => {
			let mockClipperState = this.getMockFullPageModeState();
			let defaultComponent = <FullPagePreview clipperState={mockClipperState} />;
			MithrilUtils.mountToFixture(defaultComponent);

			ok(!document.getElementById(Constants.Ids.addRegionControl), "The region control should not exist");

			ok(!document.getElementById(Constants.Ids.highlightControl), "The highlight control should not exist");
			ok(!document.getElementById(Constants.Ids.serifControl), "The font family control should not exist");
			ok(!document.getElementById(Constants.Ids.decrementFontSize), "The decrement font size button should not exist");
			ok(!document.getElementById(Constants.Ids.incrementFontSize), "The increment font size button should not exist");
		});

		test("The editable title of the page should be displayed in the preview title in Full Page mode", () => {
			let mockClipperState = this.getMockFullPageModeState();
			let defaultComponent = <FullPagePreview clipperState={mockClipperState} />;
			MithrilUtils.mountToFixture(defaultComponent);

			let previewHeaderInput = document.getElementById(Constants.Ids.previewHeaderInput) as HTMLTextAreaElement;
			strictEqual(previewHeaderInput.value, mockClipperState.previewGlobalInfo.previewTitleText,
				"The title of the page should be displayed in the preview title");
			ok(!previewHeaderInput.readOnly);
		});

		test("When the call to the full page screenshot fetch has not started, the preview should indicate that it is loading in Full Page mode", () => {
			let clipperState = this.getMockFullPageModeState();
			clipperState.currentMode.set(ClipMode.FullPage);
			clipperState.fullPageResult = {
				data: undefined,
				status: Status.NotStarted
			};
			MithrilUtils.mountToFixture(<FullPagePreview clipperState={clipperState} />);

			let previewHeaderInput = document.getElementById(Constants.Ids.previewHeaderInput) as HTMLTextAreaElement;
			strictEqual(previewHeaderInput.value, this.stringsJson["WebClipper.Preview.LoadingMessage"],
				"The preview title should display a loading message");
			ok(previewHeaderInput.readOnly);

			let previewBody = document.getElementById(Constants.Ids.previewBody);
			strictEqual(previewBody.getElementsByClassName(Constants.Classes.spinner).length, 1,
				"The spinner should be present in the preview body");
		});

		test("When the call to the full page screenshot fetch is in progress, the preview should indicate that it is loading in Full Page mode", () => {
			let clipperState = this.getMockFullPageModeState();
			clipperState.currentMode.set(ClipMode.FullPage);
			clipperState.fullPageResult = {
				data: undefined,
				status: Status.InProgress
			};
			MithrilUtils.mountToFixture(<FullPagePreview clipperState={clipperState} />);

			let previewHeaderInput = document.getElementById(Constants.Ids.previewHeaderInput) as HTMLTextAreaElement;
			strictEqual(previewHeaderInput.value, this.stringsJson["WebClipper.Preview.LoadingMessage"],
				"The preview title should display a loading message");
			ok(previewHeaderInput.readOnly);

			let previewBody = document.getElementById(Constants.Ids.previewBody);
			strictEqual(previewBody.getElementsByClassName(Constants.Classes.spinner).length, 1,
				"The spinner should be present in the preview body");
		});

		test("When the call to the full patch screenshot fetch successfully completes, but no data is returned, the preview should indicate no content was found in Full Page mode", () => {
			let clipperState = this.getMockFullPageModeState();
			clipperState.currentMode.set(ClipMode.FullPage);
			clipperState.fullPageResult = {
				data: undefined,
				status: Status.Succeeded
			};
			MithrilUtils.mountToFixture(<FullPagePreview clipperState={clipperState} />);

			let previewHeaderInput = document.getElementById(Constants.Ids.previewHeaderInput) as HTMLTextAreaElement;
			strictEqual(previewHeaderInput.value, this.stringsJson["WebClipper.Preview.NoContentFound"],
				"The preview title should display a message indicating no content was found");
			ok(previewHeaderInput.readOnly);

			strictEqual(document.getElementById(Constants.Ids.previewBody).innerText, "",
				"The preview body should be empty");
		});

		test("There should be one image rendered for every data url in state in Full Page mode", () => {
			let mockClipperState = this.getMockFullPageModeState();
			let defaultComponent = <FullPagePreview clipperState={mockClipperState} />;
			MithrilUtils.mountToFixture(defaultComponent);

			let previewBody = document.getElementById(Constants.Ids.previewBody);
			let images = previewBody.getElementsByTagName("IMG");

			let imageDataInState = mockClipperState.fullPageResult.data;
			strictEqual(images.length, imageDataInState.Images.length);

			for (let i = 0; i < images.length; i++) {
				let image = images[i] as HTMLImageElement;
				strictEqual(image.src, "data:image/" + imageDataInState.ImageFormat + ";" + imageDataInState.ImageEncoding + "," + imageDataInState.Images[i]);
			}
		});

		test("When the full page screenshot response is a failure, the preview should display an error message in Full Page mode", () => {
			let expectedMessage = "An error message.";

			let clipperState = MockProps.getMockClipperState();
			clipperState.currentMode.set(ClipMode.FullPage);
			clipperState.fullPageResult = {
				data: {
					failureMessage: expectedMessage
				},
				status: Status.Failed
			};
			MithrilUtils.mountToFixture(<FullPagePreview clipperState={clipperState} />);

			let previewHeaderInput = document.getElementById(Constants.Ids.previewHeaderInput) as HTMLTextAreaElement;
			strictEqual(previewHeaderInput.value, expectedMessage,
				"The title of the page should be displayed in the preview title");
			ok(previewHeaderInput.readOnly);
		});
	}

	private getMockFullPageModeState(): ClipperState {
		let state = MockProps.getMockClipperState() as ClipperState;
		state.currentMode.set(ClipMode.FullPage);
		state.fullPageResult = {
			data: {
				ImageEncoding: "jpeg",
				ImageFormat: "base64",
				Images: ["abc", "def"]
			},
			status: Status.Succeeded
		};
		return state;
	}
}

(new FullPagePreviewTests()).runTests();
