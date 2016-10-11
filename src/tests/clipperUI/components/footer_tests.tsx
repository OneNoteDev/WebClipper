import {ClientType} from "../../../scripts/clientType";
import {Clipper} from "../../../scripts/clipperUI/frontEndGlobals";
import {HelperFunctions} from "../../helperFunctions";
import {Constants} from "../../../scripts/constants";
import {Footer} from "../../../scripts/clipperUI/components/footer";

import {Utils} from "../../../scripts/utils";

export module TestConstants {
	export module LogCategories {
		export var oneNoteClipperUsage = "OneNoteClipperUsage";
	}
	export module Urls {
		export var clipperFeedbackUrl = "https://www.onenote.com/feedback";
	}
}

let defaultComponent;
let startingState;
QUnit.module("footer", {
	beforeEach: () => {
		startingState = HelperFunctions.getMockClipperState();
		Clipper.sessionId.set(Utils.generateGuid());
		defaultComponent =
			<Footer clipperState={ startingState } />;
	}
});

test("The footer should be collapsed by default", () => {
	let controllerInstance = HelperFunctions.mountToFixture(defaultComponent);

	ok(!document.getElementById(Constants.Ids.userSettingsContainer),
		"The user settings container should not be rendered by default");
});

test("The footer should be expanded after clicking on the user control dropdown button", () => {
	let controllerInstance = HelperFunctions.mountToFixture(defaultComponent);

	let currentUserControl = document.getElementById(Constants.Ids.currentUserControl);
	HelperFunctions.simulateAction(() => {
		currentUserControl.click();
	});

	ok(document.getElementById(Constants.Ids.userSettingsContainer),
		"The user settings container should be rendered after clicking the user control dropdown button");
});

test("The footer should be collapsed when clicking on the user control dropdown button twice", () => {
	let controllerInstance = HelperFunctions.mountToFixture(defaultComponent);

	let currentUserControl = document.getElementById(Constants.Ids.currentUserControl);
	HelperFunctions.simulateAction(() => {
		currentUserControl.click();
		currentUserControl.click();
	});

	ok(!document.getElementById(Constants.Ids.userSettingsContainer),
		"The user settings container should not be rendered after clicking the user control dropdown button twice");
});

test("The footer should remain expanded after clicking on the user control dropdown button then losing focus", () => {
	let controllerInstance = HelperFunctions.mountToFixture(defaultComponent);

	let currentUserControl = document.getElementById(Constants.Ids.currentUserControl);
	HelperFunctions.simulateAction(() => {
		currentUserControl.focus();
		currentUserControl.click();
		currentUserControl.blur();
	});

	ok(document.getElementById(Constants.Ids.userSettingsContainer),
		"The user settings container remain open regardless of focus");
});

test("The user settings opened state should match the visibility of the user settings container", () => {
	let controllerInstance = HelperFunctions.mountToFixture(defaultComponent);

	let currentUserControl = document.getElementById(Constants.Ids.currentUserControl);
	strictEqual(controllerInstance.state.userSettingsOpened, false,
		"userSettingsOpened should be false by default");

	HelperFunctions.simulateAction(() => {
		currentUserControl.click();
	});
	strictEqual(controllerInstance.state.userSettingsOpened, true,
		"userSettingsOpened should be true after the user control dropdown button has been clicked once");

	HelperFunctions.simulateAction(() => {
		currentUserControl.click();
	});
	strictEqual(controllerInstance.state.userSettingsOpened, false,
		"userSettingsOpened should be false after the user control dropdown button has been clicked twice");
});

test("The footer fields should be populated with the current user's info", () => {
	let controllerInstance = HelperFunctions.mountToFixture(defaultComponent);

	let currentUserName = document.getElementById(Constants.Ids.currentUserName);
	let currentUserId = document.getElementById(Constants.Ids.currentUserId);
	strictEqual(currentUserName.innerText, startingState.userResult.data.user.fullName);
	strictEqual(currentUserId.innerText, startingState.userResult.data.user.emailAddress);

	let currentUserControl = document.getElementById(Constants.Ids.currentUserControl);
	HelperFunctions.simulateAction(() => {
		currentUserControl.click();
	});
	let currentUserEmail = document.getElementById(Constants.Ids.currentUserEmail);
	strictEqual(currentUserEmail.innerText, startingState.userResult.data.user.emailAddress);
});

test("On clicking the sign out button, the user state must be set to undefined and userSettingsOpened state should be set to false", () => {
	let controllerInstance = HelperFunctions.mountToFixture(defaultComponent);

	HelperFunctions.simulateAction(() => {
		document.getElementById(Constants.Ids.currentUserControl).click();
	});
	HelperFunctions.simulateAction(() => {
		document.getElementById(Constants.Ids.signOutButton).click();
	});

	strictEqual(controllerInstance.props.clipperState.user, undefined,
		"User token should be set to undefined on signout");
	strictEqual(controllerInstance.state.userSettingsOpened, false,
		"userSettingsOpened should be set to false on signout");
});

test("The feedback popup should not be open by default", () => {
	let controllerInstance = HelperFunctions.mountToFixture(defaultComponent);

	let feedbackWindowRef = controllerInstance.getFeedbackWindowRef();
	ok(!feedbackWindowRef || feedbackWindowRef.closed,
		"Popup should not be opened by default");
});

test("On clicking the feedback button, a popup should open", () => {
	let controllerInstance = HelperFunctions.mountToFixture(defaultComponent);

	HelperFunctions.simulateAction(() => {
		document.getElementById(Constants.Ids.feedbackButton).click();
	});

	ok(!controllerInstance.getFeedbackWindowRef().closed,
		"Popup should open when feedback button is clicked");
});

test("The tabbing should flow from the feedback to dropdown to sign out buttons", () => {
	let controllerInstance = HelperFunctions.mountToFixture(defaultComponent);

	let feedbackButton = document.getElementById(Constants.Ids.feedbackButton);
	let dropdown = document.getElementById(Constants.Ids.currentUserControl);
	HelperFunctions.simulateAction(() => {
		dropdown.click();
	});
	let signOutButton = document.getElementById(Constants.Ids.signOutButton);

	ok(feedbackButton.tabIndex < dropdown.tabIndex,
		"The dropdown button's tab index should be greater than the feedback button's");
	ok(dropdown.tabIndex < signOutButton.tabIndex,
		"The sign out button's tab index should be greater than the dropdown button's");
});

test("Tab indexes should not be less than 1", () => {
	let controllerInstance = HelperFunctions.mountToFixture(defaultComponent);

	let feedbackButton = document.getElementById(Constants.Ids.feedbackButton);
	let dropdown = document.getElementById(Constants.Ids.currentUserControl);
	HelperFunctions.simulateAction(() => {
		dropdown.click();
	});
	let signOutButton = document.getElementById(Constants.Ids.signOutButton);

	ok(feedbackButton.tabIndex > 0);
	ok(dropdown.tabIndex > 0);
	ok(signOutButton.tabIndex > 0);
});
