import {Constants} from "../../constants";
import {AuthType, UpdateReason} from "../../userInfo";

import {ExtensionUtils} from "../../extensions/extensionUtils";

import {Localization} from "../../localization/localization";

import {ClipperStateProp} from "../clipperState";
import {ComponentBase} from "../componentBase";
import {Status} from "../status";

interface SignInPanelProps extends ClipperStateProp {
	onSignInInvoked: (authType: AuthType) => void;
}

class SignInPanelClass extends ComponentBase<{}, SignInPanelProps> {
	onSignInMsa() {
		this.props.onSignInInvoked(AuthType.Msa);
	}

	onSignInOrgId() {
		this.props.onSignInInvoked(AuthType.OrgId);
	}

	getSignInDescription(): string {
		// Since the user is not signed in, we show a message depending on the reason of the last update to the userResult
		if (!this.props.clipperState.userResult || !this.props.clipperState.userResult.data) {
			return Localization.getLocalizedString("WebClipper.Label.SignInDescription");
		}

		switch (this.props.clipperState.userResult.data.updateReason) {
			case UpdateReason.SignInAttempt:
				return Localization.getLocalizedString("WebClipper.Error.SignInUnsuccessful");
			case UpdateReason.TokenRefreshForPendingClip:
				return Localization.getLocalizedString("WebClipper.Error.GenericExpiredTokenRefreshError");
			default:
			case UpdateReason.SignInCancel:
			case UpdateReason.SignOutAction:
			case UpdateReason.InitialRetrieval:
				return Localization.getLocalizedString("WebClipper.Label.SignInDescription");
		}
	}

	render() {
		let signInDescription = this.getSignInDescription();

		return (
			<div id={Constants.Ids.signInContainer}>
				<div className="signInPadding">
					<img id={Constants.Ids.signInLogo} src={ExtensionUtils.getImageResourceUrl("onenote_logo_clipper.png")} />
					<div id={Constants.Ids.signInMessageLabelContainer} className="messageLabelContainer">
						<span className="messageLabel"
							style={Localization.getFontFamilyAsStyle(Localization.FontFamily.Regular)}>
							{Localization.getLocalizedString("WebClipper.Label.OneNoteClipper")}
						</span>
					</div>
					<div className="signInDescription">
						<span id={Constants.Ids.signInText}
							style={Localization.getFontFamilyAsStyle(Localization.FontFamily.Light)}>
							{signInDescription}
						</span>
					</div>
					<a id={Constants.Ids.signInButtonMsa} {...this.enableInvoke(this.onSignInMsa, 1)}>
						<div className="wideButtonContainer">
							<span className="wideButtonFont wideActionButton"
								style={Localization.getFontFamilyAsStyle(Localization.FontFamily.Regular)}>
								{Localization.getLocalizedString("WebClipper.Action.SigninMsa")}
							</span>
						</div>
					</a>
					<a id={Constants.Ids.signInButtonOrgId} {...this.enableInvoke(this.onSignInOrgId, 2) }>
						<div className="wideButtonContainer">
							<span className="wideButtonFont wideActionButton"
								style={Localization.getFontFamilyAsStyle(Localization.FontFamily.Regular) }>
								{Localization.getLocalizedString("WebClipper.Action.SigninOrgId") }
							</span>
						</div>
					</a>
				</div>
			</div>
		);
	}
}

let component = SignInPanelClass.componentize();
export {component as SignInPanel};
