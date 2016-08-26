/// <reference path="../../../typings/main/ambient/qunit/qunit.d.ts" />

import {Constants} from "../../scripts/constants";
import {HelperFunctions} from "../helperFunctions";
import {MainController, MainControllerClass, PanelType} from "../../scripts/clipperUI/mainController";
import {ClipMode} from "../../scripts/clipperUI/clipMode";
import {Status} from "../../scripts/clipperUI/status";
import {SmartValue} from "../../scripts/communicator/smartValue";

declare function require(name: string);

export module TestConstants {
	export module Ids {
		// Dynamically generated, hence not in constants module
		export var fullPageButton = "fullPageButton";
		export var regionButton = "regionButton";
		export var augmentationButton = "augmentationButton";

		export var sectionLocationContainer = "sectionLocationContainer";
	}
}

function getMockRequestError(): OneNoteApi.RequestError {
	return {
		error: "Unexpected response status" as {},
		statusCode: 403,
		response: '{"error":{"code":"10004","message":"Unable to create a page in this section because it is password protected.","@api.url":"http://aka.ms/onenote-errors#C10004"}}'
	} as OneNoteApi.RequestError;
}

let mockMainControllerProps = HelperFunctions.getMockMainControllerProps();
let defaultComponent;
QUnit.module("mainController", {
	beforeEach: () => {
		defaultComponent = <MainController
			clipperState={mockMainControllerProps.clipperState}
			onSignInInvoked={mockMainControllerProps.onSignInInvoked}
			onSignOutInvoked={mockMainControllerProps.onSignOutInvoked}
			updateFrameHeight={mockMainControllerProps.updateFrameHeight}
			onStartClip={mockMainControllerProps.onStartClip} />;
	}
});

// Currently we set a 100ms delay before the initial render, which breaks our tests
MainControllerClass.prototype.getInitialState = function() {
	return {
		currentPanel: this.getPanelTypeToShow()
	};
};

/**
 * We don't test tabbing within expanded elements as that is tested lower in the component hierarchy
 */

test("On the sign in panel, the tab order is correct", () => {
	let controllerInstance = HelperFunctions.mountToFixture(defaultComponent);

	HelperFunctions.simulateAction(() => {
		controllerInstance.state.currentPanel = PanelType.SignInNeeded;
	});

	let elementsInExpectedTabOrder = [
		{ name: Constants.Ids.signInButtonMsa, elem: document.getElementById(Constants.Ids.signInButtonMsa) },
		{ name: Constants.Ids.signInButtonOrgId, elem: document.getElementById(Constants.Ids.signInButtonOrgId) },
		{ name: Constants.Ids.closeButton, elem: document.getElementById(Constants.Ids.closeButton) }
	];

	for (let i = 1; i < elementsInExpectedTabOrder.length; i++) {
		ok(elementsInExpectedTabOrder[i].elem.tabIndex > elementsInExpectedTabOrder[i - 1].elem.tabIndex,
			"Element " + elementsInExpectedTabOrder[i].name + " should have a greater tabIndex than element " + elementsInExpectedTabOrder[i - 1].name);
	}
});

test("On the clip options panel, the tab order is correct", () => {
	let controllerInstance = HelperFunctions.mountToFixture(defaultComponent);

	HelperFunctions.simulateAction(() => {
		controllerInstance.state.currentPanel = PanelType.ClipOptions;
	});

	let elementsInExpectedTabOrder = [
		{ name: Constants.Ids.clipButton, elem: document.getElementById(Constants.Ids.clipButton) },
		{ name: TestConstants.Ids.fullPageButton, elem: document.getElementById(TestConstants.Ids.fullPageButton) },
		{ name: TestConstants.Ids.regionButton, elem: document.getElementById(TestConstants.Ids.regionButton) },
		{ name: TestConstants.Ids.augmentationButton, elem: document.getElementById(TestConstants.Ids.augmentationButton) },
		{ name: TestConstants.Ids.sectionLocationContainer, elem: document.getElementById(TestConstants.Ids.sectionLocationContainer) },
		{ name: Constants.Ids.feedbackButton, elem: document.getElementById(Constants.Ids.feedbackButton) },
		{ name: Constants.Ids.currentUserControl, elem: document.getElementById(Constants.Ids.currentUserControl) },
		{ name: Constants.Ids.closeButton, elem: document.getElementById(Constants.Ids.closeButton) }
	];

	for (let i = 1; i < elementsInExpectedTabOrder.length; i++) {
		ok(elementsInExpectedTabOrder[i].elem.tabIndex > elementsInExpectedTabOrder[i - 1].elem.tabIndex,
			"Element " + elementsInExpectedTabOrder[i].name + " (" + elementsInExpectedTabOrder[i].elem.tabIndex + ") should have a greater tabIndex than element " + elementsInExpectedTabOrder[i - 1].name + " (" + elementsInExpectedTabOrder[i - 1].elem.tabIndex + ")");
	}
});

test("On the region instructions panel, the tab order is correct", () => {
	let controllerInstance = HelperFunctions.mountToFixture(defaultComponent);

	HelperFunctions.simulateAction(() => {
		controllerInstance.state.currentPanel = PanelType.RegionInstructions;
	});

	let elementsInExpectedTabOrder = [
		{ name: Constants.Ids.currentUserControl, elem: document.getElementById(Constants.Ids.regionClipCancelButton) },
		{ name: Constants.Ids.closeButton, elem: document.getElementById(Constants.Ids.closeButton) }
	];

	for (let i = 1; i < elementsInExpectedTabOrder.length; i++) {
		ok(elementsInExpectedTabOrder[i].elem.tabIndex > elementsInExpectedTabOrder[i - 1].elem.tabIndex,
			"Element " + elementsInExpectedTabOrder[i].name + " should have a greater tabIndex than element " + elementsInExpectedTabOrder[i - 1].name);
	}
});

test("On the clip success panel, the tab order is correct", () => {
	let controllerInstance = HelperFunctions.mountToFixture(defaultComponent);

	HelperFunctions.simulateAction(() => {
		controllerInstance.state.currentPanel = PanelType.ClippingSuccess;
	});

	let elementsInExpectedTabOrder = [
		{ name: Constants.Ids.launchOneNoteButton, elem: document.getElementById(Constants.Ids.launchOneNoteButton) },
		{ name: Constants.Ids.feedbackButton, elem: document.getElementById(Constants.Ids.feedbackButton) },
		{ name: Constants.Ids.currentUserControl, elem: document.getElementById(Constants.Ids.currentUserControl) },
		{ name: Constants.Ids.closeButton, elem: document.getElementById(Constants.Ids.closeButton) }
	];

	for (let i = 1; i < elementsInExpectedTabOrder.length; i++) {
		ok(elementsInExpectedTabOrder[i].elem.tabIndex > elementsInExpectedTabOrder[i - 1].elem.tabIndex,
			"Element " + elementsInExpectedTabOrder[i].name + " should have a greater tabIndex than element " + elementsInExpectedTabOrder[i - 1].name);
	}
});

test("On the clip failure panel, the tab order is correct", () => {
	let controllerInstance = HelperFunctions.mountToFixture(defaultComponent);

	HelperFunctions.simulateAction(() => {
		controllerInstance.props.clipperState.oneNoteApiResult.data = getMockRequestError();
		controllerInstance.state.currentPanel = PanelType.ClippingFailure;
	});

	let dialogButtons = document.getElementsByClassName("dialogButton");

	let elementsInExpectedTabOrder = [
		{ name: Constants.Ids.currentUserControl, elem: dialogButtons[0] as HTMLElement },
		{ name: Constants.Ids.closeButton, elem: document.getElementById(Constants.Ids.closeButton) }
	];

	// Buttons should have a lower tab index than the close button
	for (let i = 1; i < elementsInExpectedTabOrder.length; i++) {
		ok(elementsInExpectedTabOrder[i].elem.tabIndex > elementsInExpectedTabOrder[i - 1].elem.tabIndex,
			"Element " + elementsInExpectedTabOrder[i].name + " should have a greater tabIndex than element " + elementsInExpectedTabOrder[i - 1].name);
	}

	// Buttons should have equal tab indexes
	let expectedTabIndex: number = undefined;
	for (let i = 0; i < dialogButtons.length; i++) {
		let element = dialogButtons[i] as HTMLElement;
		if (!expectedTabIndex) {
			expectedTabIndex = element.tabIndex;
		} else {
			strictEqual(element.tabIndex, expectedTabIndex, "Dialog button tabs should have the same tab indexes");
		}
	}
});

test("On the clip failure panel, the right message is displayed for a particular API error code", () => {
	let controllerInstance = HelperFunctions.mountToFixture(defaultComponent);

	HelperFunctions.simulateAction(() => {
		controllerInstance.props.clipperState.oneNoteApiResult.data = getMockRequestError();
		controllerInstance.state.currentPanel = PanelType.ClippingFailure;
	});

	let stringsJson = require("../../strings.json");
	strictEqual(document.getElementById(Constants.Ids.dialogMessage).innerText, stringsJson["WebClipper.Error.PasswordProtected"],
		"The correct message is displayed for the given status code");
});

test("If the close button is clicked, the uiExpanded prop should be set to false, and getPanelTypeToShow() should return the None panel", () => {
	let controllerInstance = HelperFunctions.mountToFixture(defaultComponent);

	HelperFunctions.simulateAction(() => {
		controllerInstance.state.currentPanel = PanelType.ClipOptions;
	});
	HelperFunctions.simulateAction(() => {
		document.getElementById(Constants.Ids.closeButton).click();
	});

	ok(!controllerInstance.state.uiExpanded,
		"If the close button is clicked, the uiExpanded prop should be false");
	strictEqual(controllerInstance.getPanelTypeToShow(), PanelType.None,
		"If the close button is clicked, getPanelTypeToShow() should return the None panel");
});

test("If the uiExpanded prop is set to false, getPanelTypeToShow() should return the None panel", () => {
	let props = HelperFunctions.getMockMainControllerProps();
	props.clipperState.uiExpanded = false;
	let controllerInstance = HelperFunctions.mountToFixture(
		<MainController
			clipperState={props.clipperState}
			onSignInInvoked={mockMainControllerProps.onSignInInvoked}
			onSignOutInvoked={mockMainControllerProps.onSignOutInvoked}
			updateFrameHeight={mockMainControllerProps.updateFrameHeight}
			onStartClip={mockMainControllerProps.onStartClip} />);

	strictEqual(controllerInstance.getPanelTypeToShow(), PanelType.None,
		"If the clipper state is set to not show the UI, getPanelTypeToShow() should return the None panel");
});

test("If loc strings have not been fetched, the Loading panel should be displayed", () => {
	let props = HelperFunctions.getMockMainControllerProps();
	props.clipperState.fetchLocStringStatus = Status.InProgress;
	let controllerInstance = HelperFunctions.mountToFixture(
		<MainController
			clipperState={props.clipperState}
			onSignInInvoked={mockMainControllerProps.onSignInInvoked}
			onSignOutInvoked={mockMainControllerProps.onSignOutInvoked}
			updateFrameHeight={mockMainControllerProps.updateFrameHeight}
			onStartClip={mockMainControllerProps.onStartClip} />);

	ok(document.getElementById(Constants.Ids.clipperLoadingContainer),
		"The Loading panel should be shown in the UI");
	strictEqual(controllerInstance.getPanelTypeToShow(), PanelType.Loading,
		"The Loading panel should be returned by getPanelTypeToShow()");
});

test("If user info is being fetched, the Loading panel should be displayed", () => {
	let props = HelperFunctions.getMockMainControllerProps();
	props.clipperState.userResult.status = Status.InProgress;
	let controllerInstance = HelperFunctions.mountToFixture(
		<MainController
			clipperState={props.clipperState}
			onSignInInvoked={mockMainControllerProps.onSignInInvoked}
			onSignOutInvoked={mockMainControllerProps.onSignOutInvoked}
			updateFrameHeight={mockMainControllerProps.updateFrameHeight}
			onStartClip={mockMainControllerProps.onStartClip} />);

	ok(document.getElementById(Constants.Ids.clipperLoadingContainer),
		"The Loading panel should be shown in the UI");
	strictEqual(controllerInstance.getPanelTypeToShow(), PanelType.Loading,
		"The Loading panel should be returned by getPanelTypeToShow()");
});

test("If invoke options is being fetched, the Loading panel should be displayed", () => {
	let props = HelperFunctions.getMockMainControllerProps();
	props.clipperState.invokeOptions = undefined;
	let controllerInstance = HelperFunctions.mountToFixture(
		<MainController
			clipperState={props.clipperState}
			onSignInInvoked={mockMainControllerProps.onSignInInvoked}
			onSignOutInvoked={mockMainControllerProps.onSignOutInvoked}
			updateFrameHeight={mockMainControllerProps.updateFrameHeight}
			onStartClip={mockMainControllerProps.onStartClip} />);

	ok(document.getElementById(Constants.Ids.clipperLoadingContainer),
		"The Loading panel should be shown in the UI");
	strictEqual(controllerInstance.getPanelTypeToShow(), PanelType.Loading,
		"The Loading panel should be returned by getPanelTypeToShow()");
});

test("If loc strings and user info have been fetched, getPanelTypeToShow() should not return the Loading panel", () => {
	let controllerInstance = HelperFunctions.mountToFixture(defaultComponent);

	notStrictEqual(controllerInstance.getPanelTypeToShow(), PanelType.Loading,
		"The Loading panel should be not shown when the loc strings and user info have been fetched");
});

test("If the user's info is not available, the SignInNeeded panel should be displayed", () => {
	let props = HelperFunctions.getMockMainControllerProps();
	props.clipperState.userResult = { status: Status.Failed };
	let controllerInstance = HelperFunctions.mountToFixture(
		<MainController
			clipperState={props.clipperState}
			onSignInInvoked={mockMainControllerProps.onSignInInvoked}
			onSignOutInvoked={mockMainControllerProps.onSignOutInvoked}
			updateFrameHeight={mockMainControllerProps.updateFrameHeight}
			onStartClip={mockMainControllerProps.onStartClip} />);

	ok(document.getElementById(Constants.Ids.signInContainer),
		"The SignInNeeded panel should be shown in the UI");
	strictEqual(controllerInstance.getPanelTypeToShow(), PanelType.SignInNeeded,
		"The SignInNeeded panel should be returned by getPanelTypeToShow()");
});

test("If the region mode is selected and region selection is progress, the Loading panel should be displayed", () => {
	let props = HelperFunctions.getMockMainControllerProps();
	props.clipperState.currentMode = new SmartValue<ClipMode>(ClipMode.Region);
	props.clipperState.regionResult.status = Status.InProgress;
	let controllerInstance = HelperFunctions.mountToFixture(
		<MainController
			clipperState={props.clipperState}
			onSignInInvoked={mockMainControllerProps.onSignInInvoked}
			onSignOutInvoked={mockMainControllerProps.onSignOutInvoked}
			updateFrameHeight={mockMainControllerProps.updateFrameHeight}
			onStartClip={mockMainControllerProps.onStartClip} />);

	ok(document.getElementById(Constants.Ids.clipperLoadingContainer),
		"The Loading panel should be shown in the UI");
	strictEqual(controllerInstance.getPanelTypeToShow(), PanelType.Loading,
		"The Loading panel should be returned by getPanelTypeToShow()");
});

test("If the region mode is selected and region selection has not started, the RegionInstructions panel should be displayed", () => {
	let props = HelperFunctions.getMockMainControllerProps();
	props.clipperState.currentMode = new SmartValue<ClipMode>(ClipMode.Region);
	props.clipperState.regionResult.status = Status.NotStarted;
	let controllerInstance = HelperFunctions.mountToFixture(
		<MainController
			clipperState={props.clipperState}
			onSignInInvoked={mockMainControllerProps.onSignInInvoked}
			onSignOutInvoked={mockMainControllerProps.onSignOutInvoked}
			updateFrameHeight={mockMainControllerProps.updateFrameHeight}
			onStartClip={mockMainControllerProps.onStartClip} />);

	ok(document.getElementById(Constants.Ids.regionInstructionsContainer),
		"The RegionInstructions panel should be shown in the UI");
	strictEqual(controllerInstance.getPanelTypeToShow(), PanelType.RegionInstructions,
		"The RegionInstructions panel should be returned by getPanelTypeToShow()");
});

test("If currently clipping to OneNote, the ClippingToApi panel should be displayed", () => {
	let props = HelperFunctions.getMockMainControllerProps();
	props.clipperState.oneNoteApiResult.status = Status.InProgress;
	let controllerInstance = HelperFunctions.mountToFixture(
		<MainController
			clipperState={props.clipperState}
			onSignInInvoked={mockMainControllerProps.onSignInInvoked}
			onSignOutInvoked={mockMainControllerProps.onSignOutInvoked}
			updateFrameHeight={mockMainControllerProps.updateFrameHeight}
			onStartClip={mockMainControllerProps.onStartClip} />);

	ok(document.getElementById(Constants.Ids.clipperApiProgressContainer),
		"The ClippingToApi panel should be shown in the UI");
	strictEqual(controllerInstance.getPanelTypeToShow(), PanelType.ClippingToApi,
		"The ClippingToApi panel should be returned by getPanelTypeToShow()");
});

test("If clipping to OneNote failed, the dialog panel should be displayed", () => {
	let props = HelperFunctions.getMockMainControllerProps();
	props.clipperState.oneNoteApiResult.data = getMockRequestError();
	props.clipperState.oneNoteApiResult.status = Status.Failed;
	let controllerInstance = HelperFunctions.mountToFixture(
		<MainController
			clipperState={props.clipperState}
			onSignInInvoked={mockMainControllerProps.onSignInInvoked}
			onSignOutInvoked={mockMainControllerProps.onSignOutInvoked}
			updateFrameHeight={mockMainControllerProps.updateFrameHeight}
			onStartClip={mockMainControllerProps.onStartClip} />);

	ok(document.getElementById(Constants.Ids.dialogMessageContainer),
		"The ClippingFailure panel should be shown in the UI in the form of the dialog panel");
	strictEqual(controllerInstance.getPanelTypeToShow(), PanelType.ClippingFailure,
		"The ClippingFailure panel should be returned by getPanelTypeToShow()");
});

test("If clipping to OneNote succeeded, the ClippingSuccess panel should be displayed", () => {
	let props = HelperFunctions.getMockMainControllerProps();
	props.clipperState.oneNoteApiResult.status = Status.Succeeded;
	let controllerInstance = HelperFunctions.mountToFixture(
		<MainController
			clipperState={props.clipperState}
			onSignInInvoked={mockMainControllerProps.onSignInInvoked}
			onSignOutInvoked={mockMainControllerProps.onSignOutInvoked}
			updateFrameHeight={mockMainControllerProps.updateFrameHeight}
			onStartClip={mockMainControllerProps.onStartClip} />);

	ok(document.getElementById(Constants.Ids.clipperSuccessContainer),
		"The ClippingSuccess panel should be shown in the UI");
	strictEqual(controllerInstance.getPanelTypeToShow(), PanelType.ClippingSuccess,
		"The ClippingSuccess panel should be returned by getPanelTypeToShow()");
});

test("The footer should not be rendered when the Loading panel is shown", () => {
	let controllerInstance = HelperFunctions.mountToFixture(defaultComponent);

	HelperFunctions.simulateAction(() => {
		controllerInstance.state.currentPanel = PanelType.Loading;
	});

	ok(!document.getElementById(Constants.Ids.clipperFooterContainer),
		"The footer container should not render when the clipper is loading");
});

test("The footer should be rendered when the SignIn panel is shown", () => {
	let controllerInstance = HelperFunctions.mountToFixture(defaultComponent);

	HelperFunctions.simulateAction(() => {
		controllerInstance.state.currentPanel = PanelType.SignInNeeded;
	});

	ok(document.getElementById(Constants.Ids.clipperFooterContainer),
		"The footer container should not render when the clipper is showing the sign in panel");
});

test("The footer should be rendered when the ClipOptions panel is shown", () => {
	let controllerInstance = HelperFunctions.mountToFixture(defaultComponent);

	HelperFunctions.simulateAction(() => {
		controllerInstance.state.currentPanel = PanelType.ClipOptions;
	});

	ok(document.getElementById(Constants.Ids.clipperFooterContainer),
		"The footer container should render when the clipper is showing the clip options panel");
});

test("The footer should not be rendered when the RegionInstructions panel is shown", () => {
	let controllerInstance = HelperFunctions.mountToFixture(defaultComponent);

	HelperFunctions.simulateAction(() => {
		controllerInstance.state.currentPanel = PanelType.RegionInstructions;
	});

	ok(!document.getElementById(Constants.Ids.clipperFooterContainer),
		"The footer container should not render when the clipper is showing the region instructions panel");
});

test("The footer should not be rendered when the ClippingToApi panel is shown", () => {
	let controllerInstance = HelperFunctions.mountToFixture(defaultComponent);

	HelperFunctions.simulateAction(() => {
		controllerInstance.state.currentPanel = PanelType.ClippingToApi;
	});

	ok(!document.getElementById(Constants.Ids.clipperFooterContainer),
		"The footer container should not render when the clipper is clipping to OneNote API");
});

test("The footer should be rendered when the ClippingFailure panel is shown", () => {
	let controllerInstance = HelperFunctions.mountToFixture(defaultComponent);

	HelperFunctions.simulateAction(() => {
		controllerInstance.props.clipperState.oneNoteApiResult.data = getMockRequestError();
		controllerInstance.state.currentPanel = PanelType.ClippingFailure;
	});

	ok(document.getElementById(Constants.Ids.clipperFooterContainer),
		"The footer container should render when the clipper is showing the clip failure panel");
});

test("The footer should be rendered when the ClippingSuccess panel is shown", () => {
	let controllerInstance = HelperFunctions.mountToFixture(defaultComponent);

	HelperFunctions.simulateAction(() => {
		controllerInstance.state.currentPanel = PanelType.ClippingSuccess;
	});

	ok(document.getElementById(Constants.Ids.clipperFooterContainer),
		"The footer container should render when the clipper is showing the clip success panel");
});

test("The close button should not be rendered when the ClippingToApi panel is shown", () => {
	let controllerInstance = HelperFunctions.mountToFixture(defaultComponent);

	HelperFunctions.simulateAction(() => {
		controllerInstance.state.currentPanel = PanelType.ClippingToApi;
	});

	ok(!document.getElementById(Constants.Ids.closeButton),
		"The close button should not render when the clipper is clipping to OneNote API");
});

test("The close button should be rendered when the panel shown is not ClippingToApi", () => {
	let controllerInstance = HelperFunctions.mountToFixture(defaultComponent);

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
		HelperFunctions.simulateAction(() => {
			controllerInstance.state.currentPanel = panel;
		});
		ok(document.getElementById(Constants.Ids.closeButton),
			"The close button should render when the clipper is not clipping to OneNote API");
	}
});
