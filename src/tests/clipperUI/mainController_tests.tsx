import {ClipMode} from "../../scripts/clipperUI/clipMode";
import {MainController, MainControllerClass, MainControllerProps, PanelType} from "../../scripts/clipperUI/mainController";
import {Status} from "../../scripts/clipperUI/status";

import {SmartValue} from "../../scripts/communicator/smartValue";

import {Constants} from "../../scripts/constants";

import {Assert} from "../assert";
import {MithrilUtils} from "../mithrilUtils";
import {MockProps} from "../mockProps";
import {TestModule} from "../testModule";

declare function require(name: string);

module TestConstants {
	export module Ids {
		// Dynamically generated, hence not in constants module
		export var fullPageButton = "fullPageButton";
		export var regionButton = "regionButton";
		export var augmentationButton = "augmentationButton";

		export var sectionLocationContainer = "sectionLocationContainer";
	}
}

// Currently we set a 100ms delay before the initial render, which breaks our tests
MainControllerClass.prototype.getInitialState = function() {
	return {
		currentPanel: this.getPanelTypeToShow()
	};
};

export class MainControllerTests extends TestModule {
	private mockMainControllerProps: MainControllerProps;
	private defaultComponent;

	protected module() {
		return "mainController";
	}

	protected beforeEach() {
		this.mockMainControllerProps = MockProps.getMockMainControllerProps();
		this.defaultComponent = <MainController
			clipperState={this.mockMainControllerProps.clipperState}
			onSignInInvoked={this.mockMainControllerProps.onSignInInvoked}
			onSignOutInvoked={this.mockMainControllerProps.onSignOutInvoked}
			updateFrameHeight={this.mockMainControllerProps.updateFrameHeight}
			onStartClip={this.mockMainControllerProps.onStartClip} />;
	}

	protected tests() {
		test("On the sign in panel, the tab order is correct", () => {
			let controllerInstance = MithrilUtils.mountToFixture(this.defaultComponent);

			MithrilUtils.simulateAction(() => {
				controllerInstance.state.currentPanel = PanelType.SignInNeeded;
			});

			Assert.tabOrderIsIncremental([Constants.Ids.signInButtonMsa, Constants.Ids.signInButtonOrgId, Constants.Ids.closeButton]);
		});

		test("On the clip options panel, the tab order is correct", () => {
			let controllerInstance = MithrilUtils.mountToFixture(this.defaultComponent);

			MithrilUtils.simulateAction(() => {
				controllerInstance.state.currentPanel = PanelType.ClipOptions;
			});

			Assert.tabOrderIsIncremental([Constants.Ids.clipButton, TestConstants.Ids.fullPageButton, TestConstants.Ids.regionButton, TestConstants.Ids.augmentationButton,
				TestConstants.Ids.sectionLocationContainer, Constants.Ids.feedbackButton, Constants.Ids.currentUserControl, Constants.Ids.closeButton]);
		});

		test("On the pdf clip options panel, the tab order is correct", () => {
			this.mockMainControllerProps.clipperState.currentMode.set(ClipMode.Pdf);
			let controllerInstance = MithrilUtils.mountToFixture(this.defaultComponent);

			MithrilUtils.simulateAction(() => {
				controllerInstance.state.currentPanel = PanelType.ClipOptions;
			});

			Assert.tabOrderIsIncremental([Constants.Ids.clipButton, TestConstants.Ids.fullPageButton, TestConstants.Ids.regionButton, TestConstants.Ids.augmentationButton,
				TestConstants.Ids.sectionLocationContainer, Constants.Ids.radioAllPagesLabel, Constants.Ids.radioPageRangeLabel, Constants.Ids.onePageForEntirePdfLabel,
				Constants.Ids.onePageForEachPdfLabel, Constants.Ids.attachmentCheckboxLabel, Constants.Ids.feedbackButton, Constants.Ids.currentUserControl, Constants.Ids.closeButton]);
		});

		test("On the region instructions panel, the tab order is correct", () => {
			let controllerInstance = MithrilUtils.mountToFixture(this.defaultComponent);

			MithrilUtils.simulateAction(() => {
				controllerInstance.state.currentPanel = PanelType.RegionInstructions;
			});

			Assert.tabOrderIsIncremental([Constants.Ids.regionClipCancelButton, Constants.Ids.closeButton]);
		});

		test("On the clip success panel, the tab order is correct", () => {
			let controllerInstance = MithrilUtils.mountToFixture(this.defaultComponent);

			MithrilUtils.simulateAction(() => {
				controllerInstance.state.currentPanel = PanelType.ClippingSuccess;
			});

			Assert.tabOrderIsIncremental([Constants.Ids.launchOneNoteButton, Constants.Ids.closeButton]);
		});

		test("On the clip failure panel, the tab order is correct", () => {
			let controllerInstance = MithrilUtils.mountToFixture(this.defaultComponent);

			MithrilUtils.simulateAction(() => {
				controllerInstance.props.clipperState.oneNoteApiResult.data = this.getMockRequestError();
				controllerInstance.state.currentPanel = PanelType.ClippingFailure;
			});

			Assert.tabOrderIsIncremental([Constants.Ids.currentUserControl, Constants.Ids.closeButton ]);

			let dialogButtons = document.getElementsByClassName("dialogButton");
			Assert.equalTabIndexes(dialogButtons);
		});

		test("On the clip failure panel, the right message is displayed for a particular API error code", () => {
			let controllerInstance = MithrilUtils.mountToFixture(this.defaultComponent);

			MithrilUtils.simulateAction(() => {
				controllerInstance.props.clipperState.oneNoteApiResult.data = this.getMockRequestError();
				controllerInstance.state.currentPanel = PanelType.ClippingFailure;
			});

			let stringsJson = require("../../strings.json");
			strictEqual(document.getElementById(Constants.Ids.dialogMessage).innerText, stringsJson["WebClipper.Error.PasswordProtected"],
				"The correct message is displayed for the given status code");
		});

		test("If the close button is clicked, the uiExpanded prop should be set to false, and getPanelTypeToShow() should return the None panel", () => {
			let controllerInstance = MithrilUtils.mountToFixture(this.defaultComponent);

			MithrilUtils.simulateAction(() => {
				controllerInstance.state.currentPanel = PanelType.ClipOptions;
			});
			MithrilUtils.simulateAction(() => {
				document.getElementById(Constants.Ids.closeButton).click();
			});

			ok(!controllerInstance.state.uiExpanded,
				"If the close button is clicked, the uiExpanded prop should be false");
			strictEqual(controllerInstance.getPanelTypeToShow(), PanelType.None,
				"If the close button is clicked, getPanelTypeToShow() should return the None panel");
		});

		test("If the uiExpanded prop is set to false, getPanelTypeToShow() should return the None panel", () => {
			let props = MockProps.getMockMainControllerProps();
			props.clipperState.uiExpanded = false;
			let controllerInstance = MithrilUtils.mountToFixture(
				<MainController
					clipperState={props.clipperState}
					onSignInInvoked={this.mockMainControllerProps.onSignInInvoked}
					onSignOutInvoked={this.mockMainControllerProps.onSignOutInvoked}
					updateFrameHeight={this.mockMainControllerProps.updateFrameHeight}
					onStartClip={this.mockMainControllerProps.onStartClip} />);

			strictEqual(controllerInstance.getPanelTypeToShow(), PanelType.None,
				"If the clipper state is set to not show the UI, getPanelTypeToShow() should return the None panel");
		});

		test("If loc strings have not been fetched, the Loading panel should be displayed", () => {
			let props = MockProps.getMockMainControllerProps();
			props.clipperState.fetchLocStringStatus = Status.InProgress;
			let controllerInstance = MithrilUtils.mountToFixture(
				<MainController
					clipperState={props.clipperState}
					onSignInInvoked={this.mockMainControllerProps.onSignInInvoked}
					onSignOutInvoked={this.mockMainControllerProps.onSignOutInvoked}
					updateFrameHeight={this.mockMainControllerProps.updateFrameHeight}
					onStartClip={this.mockMainControllerProps.onStartClip} />);

			ok(document.getElementById(Constants.Ids.clipperLoadingContainer),
				"The Loading panel should be shown in the UI");
			strictEqual(controllerInstance.getPanelTypeToShow(), PanelType.Loading,
				"The Loading panel should be returned by getPanelTypeToShow()");
		});

		test("If user info is being fetched, the Loading panel should be displayed", () => {
			let props = MockProps.getMockMainControllerProps();
			props.clipperState.userResult.status = Status.InProgress;
			let controllerInstance = MithrilUtils.mountToFixture(
				<MainController
					clipperState={props.clipperState}
					onSignInInvoked={this.mockMainControllerProps.onSignInInvoked}
					onSignOutInvoked={this.mockMainControllerProps.onSignOutInvoked}
					updateFrameHeight={this.mockMainControllerProps.updateFrameHeight}
					onStartClip={this.mockMainControllerProps.onStartClip} />);

			ok(document.getElementById(Constants.Ids.clipperLoadingContainer),
				"The Loading panel should be shown in the UI");
			strictEqual(controllerInstance.getPanelTypeToShow(), PanelType.Loading,
				"The Loading panel should be returned by getPanelTypeToShow()");
		});

		test("If invoke options is being fetched, the Loading panel should be displayed", () => {
			let props = MockProps.getMockMainControllerProps();
			props.clipperState.invokeOptions = undefined;
			let controllerInstance = MithrilUtils.mountToFixture(
				<MainController
					clipperState={props.clipperState}
					onSignInInvoked={this.mockMainControllerProps.onSignInInvoked}
					onSignOutInvoked={this.mockMainControllerProps.onSignOutInvoked}
					updateFrameHeight={this.mockMainControllerProps.updateFrameHeight}
					onStartClip={this.mockMainControllerProps.onStartClip} />);

			ok(document.getElementById(Constants.Ids.clipperLoadingContainer),
				"The Loading panel should be shown in the UI");
			strictEqual(controllerInstance.getPanelTypeToShow(), PanelType.Loading,
				"The Loading panel should be returned by getPanelTypeToShow()");
		});

		test("If loc strings and user info have been fetched, getPanelTypeToShow() should not return the Loading panel", () => {
			let controllerInstance = MithrilUtils.mountToFixture(this.defaultComponent);

			notStrictEqual(controllerInstance.getPanelTypeToShow(), PanelType.Loading,
				"The Loading panel should be not shown when the loc strings and user info have been fetched");
		});

		test("If the user's info is not available, the SignInNeeded panel should be displayed", () => {
			let props = MockProps.getMockMainControllerProps();
			props.clipperState.userResult = { status: Status.Failed };
			let controllerInstance = MithrilUtils.mountToFixture(
				<MainController
					clipperState={props.clipperState}
					onSignInInvoked={this.mockMainControllerProps.onSignInInvoked}
					onSignOutInvoked={this.mockMainControllerProps.onSignOutInvoked}
					updateFrameHeight={this.mockMainControllerProps.updateFrameHeight}
					onStartClip={this.mockMainControllerProps.onStartClip} />);

			ok(document.getElementById(Constants.Ids.signInContainer),
				"The SignInNeeded panel should be shown in the UI");
			strictEqual(controllerInstance.getPanelTypeToShow(), PanelType.SignInNeeded,
				"The SignInNeeded panel should be returned by getPanelTypeToShow()");
		});

		test("If the region mode is selected and region selection is progress, the Loading panel should be displayed", () => {
			let props = MockProps.getMockMainControllerProps();
			props.clipperState.currentMode = new SmartValue<ClipMode>(ClipMode.Region);
			props.clipperState.regionResult.status = Status.InProgress;
			let controllerInstance = MithrilUtils.mountToFixture(
				<MainController
					clipperState={props.clipperState}
					onSignInInvoked={this.mockMainControllerProps.onSignInInvoked}
					onSignOutInvoked={this.mockMainControllerProps.onSignOutInvoked}
					updateFrameHeight={this.mockMainControllerProps.updateFrameHeight}
					onStartClip={this.mockMainControllerProps.onStartClip} />);

			ok(document.getElementById(Constants.Ids.clipperLoadingContainer),
				"The Loading panel should be shown in the UI");
			strictEqual(controllerInstance.getPanelTypeToShow(), PanelType.Loading,
				"The Loading panel should be returned by getPanelTypeToShow()");
		});

		test("If the region mode is selected and region selection has not started, the RegionInstructions panel should be displayed", () => {
			let props = MockProps.getMockMainControllerProps();
			props.clipperState.currentMode = new SmartValue<ClipMode>(ClipMode.Region);
			props.clipperState.regionResult.status = Status.NotStarted;
			let controllerInstance = MithrilUtils.mountToFixture(
				<MainController
					clipperState={props.clipperState}
					onSignInInvoked={this.mockMainControllerProps.onSignInInvoked}
					onSignOutInvoked={this.mockMainControllerProps.onSignOutInvoked}
					updateFrameHeight={this.mockMainControllerProps.updateFrameHeight}
					onStartClip={this.mockMainControllerProps.onStartClip} />);

			ok(document.getElementById(Constants.Ids.regionInstructionsContainer),
				"The RegionInstructions panel should be shown in the UI");
			strictEqual(controllerInstance.getPanelTypeToShow(), PanelType.RegionInstructions,
				"The RegionInstructions panel should be returned by getPanelTypeToShow()");
		});

		test("If currently clipping to OneNote, the ClippingToApi panel should be displayed", () => {
			let props = MockProps.getMockMainControllerProps();
			props.clipperState.oneNoteApiResult.status = Status.InProgress;
			let controllerInstance = MithrilUtils.mountToFixture(
				<MainController
					clipperState={props.clipperState}
					onSignInInvoked={this.mockMainControllerProps.onSignInInvoked}
					onSignOutInvoked={this.mockMainControllerProps.onSignOutInvoked}
					updateFrameHeight={this.mockMainControllerProps.updateFrameHeight}
					onStartClip={this.mockMainControllerProps.onStartClip} />);

			ok(document.getElementById(Constants.Ids.clipperApiProgressContainer),
				"The ClippingToApi panel should be shown in the UI");
			strictEqual(controllerInstance.getPanelTypeToShow(), PanelType.ClippingToApi,
				"The ClippingToApi panel should be returned by getPanelTypeToShow()");
		});

		test("If clipping to OneNote failed, the dialog panel should be displayed", () => {
			let props = MockProps.getMockMainControllerProps();
			props.clipperState.oneNoteApiResult.data = this.getMockRequestError();
			props.clipperState.oneNoteApiResult.status = Status.Failed;
			let controllerInstance = MithrilUtils.mountToFixture(
				<MainController
					clipperState={props.clipperState}
					onSignInInvoked={this.mockMainControllerProps.onSignInInvoked}
					onSignOutInvoked={this.mockMainControllerProps.onSignOutInvoked}
					updateFrameHeight={this.mockMainControllerProps.updateFrameHeight}
					onStartClip={this.mockMainControllerProps.onStartClip} />);

			ok(document.getElementById(Constants.Ids.dialogMessageContainer),
				"The ClippingFailure panel should be shown in the UI in the form of the dialog panel");
			strictEqual(controllerInstance.getPanelTypeToShow(), PanelType.ClippingFailure,
				"The ClippingFailure panel should be returned by getPanelTypeToShow()");
		});

		test("If clipping to OneNote succeeded, the ClippingSuccess panel should be displayed", () => {
			let props = MockProps.getMockMainControllerProps();
			props.clipperState.oneNoteApiResult.status = Status.Succeeded;
			let controllerInstance = MithrilUtils.mountToFixture(
				<MainController
					clipperState={props.clipperState}
					onSignInInvoked={this.mockMainControllerProps.onSignInInvoked}
					onSignOutInvoked={this.mockMainControllerProps.onSignOutInvoked}
					updateFrameHeight={this.mockMainControllerProps.updateFrameHeight}
					onStartClip={this.mockMainControllerProps.onStartClip} />);

			ok(document.getElementById(Constants.Ids.clipperSuccessContainer),
				"The ClippingSuccess panel should be shown in the UI");
			strictEqual(controllerInstance.getPanelTypeToShow(), PanelType.ClippingSuccess,
				"The ClippingSuccess panel should be returned by getPanelTypeToShow()");
		});

		test("The footer should not be rendered when the Loading panel is shown", () => {
			let controllerInstance = MithrilUtils.mountToFixture(this.defaultComponent);

			MithrilUtils.simulateAction(() => {
				controllerInstance.state.currentPanel = PanelType.Loading;
			});

			ok(!document.getElementById(Constants.Ids.clipperFooterContainer),
				"The footer container should not render when the clipper is loading");
		});

		test("The footer should be rendered when the SignIn panel is shown", () => {
			let controllerInstance = MithrilUtils.mountToFixture(this.defaultComponent);

			MithrilUtils.simulateAction(() => {
				controllerInstance.state.currentPanel = PanelType.SignInNeeded;
			});

			ok(document.getElementById(Constants.Ids.clipperFooterContainer),
				"The footer container should not render when the clipper is showing the sign in panel");
		});

		test("The footer should be rendered when the ClipOptions panel is shown", () => {
			let controllerInstance = MithrilUtils.mountToFixture(this.defaultComponent);

			MithrilUtils.simulateAction(() => {
				controllerInstance.state.currentPanel = PanelType.ClipOptions;
			});

			ok(document.getElementById(Constants.Ids.clipperFooterContainer),
				"The footer container should render when the clipper is showing the clip options panel");
		});

		test("The footer should not be rendered when the RegionInstructions panel is shown", () => {
			let controllerInstance = MithrilUtils.mountToFixture(this.defaultComponent);

			MithrilUtils.simulateAction(() => {
				controllerInstance.state.currentPanel = PanelType.RegionInstructions;
			});

			ok(!document.getElementById(Constants.Ids.clipperFooterContainer),
				"The footer container should not render when the clipper is showing the region instructions panel");
		});

		test("The footer should not be rendered when the ClippingToApi panel is shown", () => {
			let controllerInstance = MithrilUtils.mountToFixture(this.defaultComponent);

			MithrilUtils.simulateAction(() => {
				controllerInstance.state.currentPanel = PanelType.ClippingToApi;
			});

			ok(!document.getElementById(Constants.Ids.clipperFooterContainer),
				"The footer container should not render when the clipper is clipping to OneNote API");
		});

		test("The footer should be rendered when the ClippingFailure panel is shown", () => {
			let controllerInstance = MithrilUtils.mountToFixture(this.defaultComponent);

			MithrilUtils.simulateAction(() => {
				controllerInstance.props.clipperState.oneNoteApiResult.data = this.getMockRequestError();
				controllerInstance.state.currentPanel = PanelType.ClippingFailure;
			});

			ok(document.getElementById(Constants.Ids.clipperFooterContainer),
				"The footer container should render when the clipper is showing the clip failure panel");
		});

		test("The footer should be not be rendered when the ClippingSuccess panel is shown", () => {
			let controllerInstance = MithrilUtils.mountToFixture(this.defaultComponent);

			MithrilUtils.simulateAction(() => {
				controllerInstance.state.currentPanel = PanelType.ClippingSuccess;
			});

			ok(!document.getElementById(Constants.Ids.clipperFooterContainer),
				"The footer container should not be rendered when the clipper is showing the clip success panel");
		});

		test("The close button should not be rendered when the ClippingToApi panel is shown", () => {
			let controllerInstance = MithrilUtils.mountToFixture(this.defaultComponent);

			MithrilUtils.simulateAction(() => {
				controllerInstance.state.currentPanel = PanelType.ClippingToApi;
			});

			ok(!document.getElementById(Constants.Ids.closeButton),
				"The close button should not render when the clipper is clipping to OneNote API");
		});

		test("The close button should be rendered when the panel shown is not ClippingToApi", () => {
			let controllerInstance = MithrilUtils.mountToFixture(this.defaultComponent);

			let panels = [
				PanelType.Loading,
				PanelType.SignInNeeded,
				PanelType.ClipOptions,
				PanelType.RegionInstructions,
				PanelType.ClippingFailure,
				PanelType.ClippingSuccess
			];

			// We have to write it this (ugly) way as the sensible way is only supported by ES6, which we're not using
			for (let i = 0; i < panels.length; i++) {
				let panel = panels[i];
				MithrilUtils.simulateAction(() => {
					controllerInstance.state.currentPanel = panel;
				});
				ok(document.getElementById(Constants.Ids.closeButton),
					"The close button should render when the clipper is not clipping to OneNote API");
			}
		});
	}

	private getMockRequestError(): OneNoteApi.RequestError {
		return {
			error: "Unexpected response status" as {},
			statusCode: 403,
			response: '{"error":{"code":"10004","message":"Unable to create a page in this section because it is password protected.","@api.url":"http://aka.ms/onenote-errors#C10004"}}'
		} as OneNoteApi.RequestError;
	}
	}

(new MainControllerTests()).runTests();
