import {HelperFunctions} from "../../helperFunctions";
import {Constants} from "../../../scripts/constants";
import {AuthType} from "../../../scripts/userInfo";
import {Status} from "../../../scripts/clipperUI/status";
import {SignInPanel} from "../../../scripts/clipperUI/panels/signInPanel";
import {UpdateReason} from "../../../scripts/userInfo";

declare function require(name: string);
let stringsJson = require("../../../strings.json");

let mockSignInPanelProps = {
	clipperState: HelperFunctions.getMockClipperState(),
	onSignInInvoked: () => { }
};

let defaultComponent;
QUnit.module("signInPanel", {
	beforeEach: () => {
		defaultComponent = <SignInPanel {...mockSignInPanelProps}/>;
	}
});

test("The sign in panel should display the correct default message when the override is not specified", () => {
	let controllerInstance = HelperFunctions.mountToFixture(defaultComponent);

	strictEqual(document.getElementById(Constants.Ids.signInText).innerText, stringsJson["WebClipper.Label.SignInDescription"],
		"The displayed message should be the default");
});

test("The sign in panel should display the token refresh error message when we're unable to refresh it", () => {
	let state = HelperFunctions.getMockClipperState();
	state.userResult = { status: Status.Failed, data: { lastUpdated: 10000000, updateReason: UpdateReason.TokenRefreshForPendingClip } };
	let controllerInstance = HelperFunctions.mountToFixture(<SignInPanel clipperState={state} onSignInInvoked={mockSignInPanelProps.onSignInInvoked}/>);

	strictEqual(document.getElementById(Constants.Ids.signInText).innerText, stringsJson["WebClipper.Error.GenericExpiredTokenRefreshError"],
		"The displayed message should be the correct error message");
});

test("The sign in panel should display the sign in failed message when sign in failed", () => {
	let state = HelperFunctions.getMockClipperState();
	state.userResult = { status: Status.Failed, data: { lastUpdated: 10000000, updateReason: UpdateReason.SignInAttempt } };
	let controllerInstance = HelperFunctions.mountToFixture(<SignInPanel clipperState={state} onSignInInvoked={mockSignInPanelProps.onSignInInvoked}/>);

	strictEqual(document.getElementById(Constants.Ids.signInText).innerText, stringsJson["WebClipper.Error.SignInUnsuccessful"],
		"The displayed message should be the correct error message");
});

test("The sign in panel should display the sign in description when the sign in attempt was cancelled", () => {
	let state = HelperFunctions.getMockClipperState();
	state.userResult = { status: Status.Failed, data: { lastUpdated: 10000000, updateReason: UpdateReason.SignInCancel } };
	let controllerInstance = HelperFunctions.mountToFixture(<SignInPanel clipperState={state} onSignInInvoked={mockSignInPanelProps.onSignInInvoked}/>);

	strictEqual(document.getElementById(Constants.Ids.signInText).innerText, stringsJson["WebClipper.Label.SignInDescription"],
		"The displayed message should be the sign in description message");
});

test("The callback should be passed the MSA auth type if the user clicks on the MSA button", () => {
	let type: AuthType;
	let onSignInInvoked = (chosenType: AuthType) => {
		type = chosenType;
	};
	let controllerInstance = HelperFunctions.mountToFixture(<SignInPanel clipperState={HelperFunctions.getMockClipperState()} onSignInInvoked={onSignInInvoked}/>);

	let msaButton = document.getElementById(Constants.Ids.signInButtonMsa);
	HelperFunctions.simulateAction(() => {
		msaButton.click();
	});

	strictEqual(type, AuthType.Msa, "The MSA auth type should be recorded");
});

test("The callback should be passed the OrgId auth type if the user clicks on the OrgId button", () => {
	let type: AuthType;
	let onSignInInvoked = (chosenType: AuthType) => {
		type = chosenType;
	};
	let controllerInstance = HelperFunctions.mountToFixture(<SignInPanel clipperState={HelperFunctions.getMockClipperState() } onSignInInvoked={onSignInInvoked}/>);

	let orgIdButton = document.getElementById(Constants.Ids.signInButtonOrgId);
	HelperFunctions.simulateAction(() => {
		orgIdButton.click();
	});

	strictEqual(type, AuthType.OrgId, "The OrgId auth type should be recorded");
});
