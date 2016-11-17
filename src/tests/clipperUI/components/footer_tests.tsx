import {ClientType} from "../../../scripts/clientType";
import {Constants} from "../../../scripts/constants";
import {StringUtils} from "../../../scripts/stringUtils";

import {Clipper} from "../../../scripts/clipperUI/frontEndGlobals";

import {Footer} from "../../../scripts/clipperUI/components/footer";

import {MithrilUtils} from "../../mithrilUtils";
import {MockProps} from "../../mockProps";
import {TestModule} from "../../testModule";

module TestConstants {
	export module LogCategories {
		export var oneNoteClipperUsage = "OneNoteClipperUsage";
	}
	export module Urls {
		export var clipperFeedbackUrl = "https://www.onenote.com/feedback";
	}
}

export class FooterTests extends TestModule {
	private defaultComponent;
	private startingState;

	protected module() {
		return "footer";
	}

	protected beforeEach() {
		this.startingState = MockProps.getMockClipperState();
		Clipper.sessionId.set(StringUtils.generateGuid());
		this.defaultComponent =
			<Footer clipperState={ this.startingState } />;
	}

	protected tests() {
		test("The footer should be collapsed by default", () => {
			let controllerInstance = MithrilUtils.mountToFixture(this.defaultComponent);

			ok(!document.getElementById(Constants.Ids.userSettingsContainer),
				"The user settings container should not be rendered by default");
		});

		test("The footer should be expanded after clicking on the user control dropdown button", () => {
			let controllerInstance = MithrilUtils.mountToFixture(this.defaultComponent);

			let currentUserControl = document.getElementById(Constants.Ids.currentUserControl);
			MithrilUtils.simulateAction(() => {
				currentUserControl.click();
			});

			ok(document.getElementById(Constants.Ids.userSettingsContainer),
				"The user settings container should be rendered after clicking the user control dropdown button");
		});

		test("The footer should be collapsed when clicking on the user control dropdown button twice", () => {
			let controllerInstance = MithrilUtils.mountToFixture(this.defaultComponent);

			let currentUserControl = document.getElementById(Constants.Ids.currentUserControl);
			MithrilUtils.simulateAction(() => {
				currentUserControl.click();
				currentUserControl.click();
			});

			ok(!document.getElementById(Constants.Ids.userSettingsContainer),
				"The user settings container should not be rendered after clicking the user control dropdown button twice");
		});

		test("The footer should remain expanded after clicking on the user control dropdown button then losing focus", () => {
			let controllerInstance = MithrilUtils.mountToFixture(this.defaultComponent);

			let currentUserControl = document.getElementById(Constants.Ids.currentUserControl);
			MithrilUtils.simulateAction(() => {
				currentUserControl.focus();
				currentUserControl.click();
				currentUserControl.blur();
			});

			ok(document.getElementById(Constants.Ids.userSettingsContainer),
				"The user settings container remain open regardless of focus");
		});

		test("The user settings opened state should match the visibility of the user settings container", () => {
			let controllerInstance = MithrilUtils.mountToFixture(this.defaultComponent);

			let currentUserControl = document.getElementById(Constants.Ids.currentUserControl);
			strictEqual(controllerInstance.state.userSettingsOpened, false,
				"userSettingsOpened should be false by default");

			MithrilUtils.simulateAction(() => {
				currentUserControl.click();
			});
			strictEqual(controllerInstance.state.userSettingsOpened, true,
				"userSettingsOpened should be true after the user control dropdown button has been clicked once");

			MithrilUtils.simulateAction(() => {
				currentUserControl.click();
			});
			strictEqual(controllerInstance.state.userSettingsOpened, false,
				"userSettingsOpened should be false after the user control dropdown button has been clicked twice");
		});

		test("The footer fields should be populated with the current user's info", () => {
			let controllerInstance = MithrilUtils.mountToFixture(this.defaultComponent);

			let currentUserName = document.getElementById(Constants.Ids.currentUserName);
			let currentUserId = document.getElementById(Constants.Ids.currentUserId);
			strictEqual(currentUserName.innerText, this.startingState.userResult.data.user.fullName);
			strictEqual(currentUserId.innerText, this.startingState.userResult.data.user.emailAddress);

			let currentUserControl = document.getElementById(Constants.Ids.currentUserControl);
			MithrilUtils.simulateAction(() => {
				currentUserControl.click();
			});
			let currentUserEmail = document.getElementById(Constants.Ids.currentUserEmail);
			strictEqual(currentUserEmail.innerText, this.startingState.userResult.data.user.emailAddress);
		});

		test("On clicking the sign out button, the user state must be set to undefined and userSettingsOpened state should be set to false", () => {
			let controllerInstance = MithrilUtils.mountToFixture(this.defaultComponent);

			MithrilUtils.simulateAction(() => {
				document.getElementById(Constants.Ids.currentUserControl).click();
			});
			MithrilUtils.simulateAction(() => {
				document.getElementById(Constants.Ids.signOutButton).click();
			});

			strictEqual(controllerInstance.props.clipperState.user, undefined,
				"User token should be set to undefined on signout");
			strictEqual(controllerInstance.state.userSettingsOpened, false,
				"userSettingsOpened should be set to false on signout");
		});

		test("The feedback popup should not be open by default", () => {
			let controllerInstance = MithrilUtils.mountToFixture(this.defaultComponent);

			let feedbackWindowRef = controllerInstance.getFeedbackWindowRef();
			ok(!feedbackWindowRef || feedbackWindowRef.closed,
				"Popup should not be opened by default");
		});

		test("On clicking the feedback button, a popup should open", () => {
			let controllerInstance = MithrilUtils.mountToFixture(this.defaultComponent);

			MithrilUtils.simulateAction(() => {
				document.getElementById(Constants.Ids.feedbackButton).click();
			});

			ok(!controllerInstance.getFeedbackWindowRef().closed,
				"Popup should open when feedback button is clicked");
		});

		test("The tabbing should flow from the feedback to dropdown to sign out buttons", () => {
			let controllerInstance = MithrilUtils.mountToFixture(this.defaultComponent);

			let feedbackButton = document.getElementById(Constants.Ids.feedbackButton);
			let dropdown = document.getElementById(Constants.Ids.currentUserControl);
			MithrilUtils.simulateAction(() => {
				dropdown.click();
			});
			let signOutButton = document.getElementById(Constants.Ids.signOutButton);

			ok(feedbackButton.tabIndex < dropdown.tabIndex,
				"The dropdown button's tab index should be greater than the feedback button's");
			ok(dropdown.tabIndex < signOutButton.tabIndex,
				"The sign out button's tab index should be greater than the dropdown button's");
		});

		test("Tab indexes should not be less than 1", () => {
			let controllerInstance = MithrilUtils.mountToFixture(this.defaultComponent);

			let feedbackButton = document.getElementById(Constants.Ids.feedbackButton);
			let dropdown = document.getElementById(Constants.Ids.currentUserControl);
			MithrilUtils.simulateAction(() => {
				dropdown.click();
			});
			let signOutButton = document.getElementById(Constants.Ids.signOutButton);

			ok(feedbackButton.tabIndex > 0);
			ok(dropdown.tabIndex > 0);
			ok(signOutButton.tabIndex > 0);
		});
	}
}

(new FooterTests()).runTests();
