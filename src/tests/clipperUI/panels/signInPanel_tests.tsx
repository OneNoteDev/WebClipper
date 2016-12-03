import {Constants} from "../../../scripts/constants";
import {AuthType, UpdateReason} from "../../../scripts/userInfo";

import {Status} from "../../../scripts/clipperUI/status";
import {SignInPanel} from "../../../scripts/clipperUI/panels/signInPanel";

import {MithrilUtils} from "../../mithrilUtils";
import {MockProps} from "../../mockProps";
import {TestModule} from "../../testModule";

declare function require(name: string);

export class SignInPanelTests extends TestModule {
	private stringsJson = require("../../../strings.json");

	private mockSignInPanelProps = {
		clipperState: MockProps.getMockClipperState(),
		onSignInInvoked: () => { }
	};

	private defaultComponent;

	protected module() {
		return "signInPanel";
	}

	protected beforeEach() {
		this.defaultComponent = <SignInPanel {...this.mockSignInPanelProps}/>;
	}

	protected tests() {
		test("The sign in panel should display the correct default message when the override is not specified", () => {
			let controllerInstance = MithrilUtils.mountToFixture(this.defaultComponent);

			strictEqual(document.getElementById(Constants.Ids.signInText).innerText, this.stringsJson["WebClipper.Label.SignInDescription"],
				"The displayed message should be the default");
		});

		test("The sign in panel should display the token refresh error message when we're unable to refresh it", () => {
			let state = MockProps.getMockClipperState();
			state.userResult = { status: Status.Failed, data: { lastUpdated: 10000000, updateReason: UpdateReason.TokenRefreshForPendingClip } };
			let controllerInstance = MithrilUtils.mountToFixture(<SignInPanel clipperState={state} onSignInInvoked={this.mockSignInPanelProps.onSignInInvoked}/>);

			strictEqual(document.getElementById(Constants.Ids.signInText).innerText, this.stringsJson["WebClipper.Error.GenericExpiredTokenRefreshError"],
				"The displayed message should be the correct error message");
		});

		test("The sign in panel should display the sign in failed message when sign in failed", () => {
			let state = MockProps.getMockClipperState();
			state.userResult = { status: Status.Failed, data: { lastUpdated: 10000000, updateReason: UpdateReason.SignInAttempt } };
			let controllerInstance = MithrilUtils.mountToFixture(<SignInPanel clipperState={state} onSignInInvoked={this.mockSignInPanelProps.onSignInInvoked}/>);

			strictEqual(document.getElementById(Constants.Ids.signInText).innerText, this.stringsJson["WebClipper.Error.SignInUnsuccessful"],
				"The displayed message should be the correct error message");
		});

		test("The sign in panel should display the sign in description when the sign in attempt was cancelled", () => {
			let state = MockProps.getMockClipperState();
			state.userResult = { status: Status.Failed, data: { lastUpdated: 10000000, updateReason: UpdateReason.SignInCancel } };
			let controllerInstance = MithrilUtils.mountToFixture(<SignInPanel clipperState={state} onSignInInvoked={this.mockSignInPanelProps.onSignInInvoked}/>);

			strictEqual(document.getElementById(Constants.Ids.signInText).innerText, this.stringsJson["WebClipper.Label.SignInDescription"],
				"The displayed message should be the sign in description message");
		});

		test("The callback should be passed the MSA auth type if the user clicks on the MSA button", () => {
			let type: AuthType;
			let onSignInInvoked = (chosenType: AuthType) => {
				type = chosenType;
			};
			let controllerInstance = MithrilUtils.mountToFixture(<SignInPanel clipperState={MockProps.getMockClipperState()} onSignInInvoked={onSignInInvoked}/>);

			let msaButton = document.getElementById(Constants.Ids.signInButtonMsa);
			MithrilUtils.simulateAction(() => {
				msaButton.click();
			});

			strictEqual(type, AuthType.Msa, "The MSA auth type should be recorded");
		});

		test("The callback should be passed the OrgId auth type if the user clicks on the OrgId button", () => {
			let type: AuthType;
			let onSignInInvoked = (chosenType: AuthType) => {
				type = chosenType;
			};
			let controllerInstance = MithrilUtils.mountToFixture(<SignInPanel clipperState={MockProps.getMockClipperState() } onSignInInvoked={onSignInInvoked}/>);

			let orgIdButton = document.getElementById(Constants.Ids.signInButtonOrgId);
			MithrilUtils.simulateAction(() => {
				orgIdButton.click();
			});

			strictEqual(type, AuthType.OrgId, "The OrgId auth type should be recorded");
		});

		test("The 'more' button is enabled when a sign-in failure is detected (OrgID)", () => {
			let state = MockProps.getMockClipperState();
			state.userResult = { status: Status.Failed, data: { lastUpdated: 10000000, updateReason: UpdateReason.SignInAttempt, errorDescription: "OrgId: An error has occured." } };

			let controllerInstance = MithrilUtils.mountToFixture(<SignInPanel clipperState={state} onSignInInvoked={this.mockSignInPanelProps.onSignInInvoked} />);

			strictEqual(document.getElementById(Constants.Ids.signInToggleErrorInformationText).innerText, this.stringsJson["WebClipper.Label.SignInUnsuccessfulMoreInformation"],
				"The displayed message should be the 'more' message");
		});
	}
}

(new SignInPanelTests()).runTests();
