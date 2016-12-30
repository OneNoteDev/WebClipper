import {ClientType} from "../../clientType";
import {Constants} from "../../constants";
import {AuthType, UpdateReason} from "../../userInfo";

import {ExtensionUtils} from "../../extensions/extensionUtils";

import {Localization} from "../../localization/localization";

import {Clipper} from "../frontEndGlobals";
import {ClipperStateProp} from "../clipperState";
import {ComponentBase} from "../componentBase";
import {Status} from "../status";

interface SignInPanelState {
	debugInformationShowing?: boolean;
}

interface SignInPanelProps extends ClipperStateProp {
	onSignInInvoked: (authType: AuthType) => void;
}

class SignInPanelClass extends ComponentBase<SignInPanelState, SignInPanelProps> {
	getInitialState() {
		return { debugInformationShowing: false };
	}

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

	signInAttempted(): boolean {
		return !!this.props.clipperState.userResult && !!this.props.clipperState.userResult.data
			&& this.props.clipperState.userResult.data.updateReason === UpdateReason.SignInAttempt;
	}

	signInFailureContainsErrorDescription(): boolean {
		return this.signInAttempted()
			&& this.props.clipperState.userResult.data.errorDescription
			// Right now we are only showing the error panel for OrgId errors since they tend to
			// be a little more actionable to the user, or at least a little more helpful.
			&& this.props.clipperState.userResult.data.errorDescription.indexOf("OrgId") === 0;
	}

	signInFailureThirdPartyCookiesBlocked(): boolean {
		return this.signInAttempted()
			&& !this.props.clipperState.userResult.data.writeableCookies;
	}

	debugInformationControlHandler() {
		this.setState({ debugInformationShowing: !this.state.debugInformationShowing });
	}

	signInErrorDetected() {
		return this.signInFailureContainsErrorDescription() || this.signInFailureThirdPartyCookiesBlocked();
	}

	errorMoreInformationTogggle() {
		if (this.signInErrorDetected()) {
			return <div id="signInErrorToggleInformation">
				<a id={Constants.Ids.signInErrorMoreInformation} {...this.enableInvoke(this.debugInformationControlHandler, 10) }>
					<img id={Constants.Ids.signInToggleErrorDropdownArrow} src={ExtensionUtils.getImageResourceUrl("dropdown_arrow.png")} />
					<span id={Constants.Ids.signInToggleErrorInformationText}
						style={Localization.getFontFamilyAsStyle(Localization.FontFamily.Light)}>
						{this.state.debugInformationShowing
							? Localization.getLocalizedString("WebClipper.Label.SignInUnsuccessfulLessInformation")
							: Localization.getLocalizedString("WebClipper.Label.SignInUnsuccessfulMoreInformation")
						}
					</span>
				</a>
				{this.debugInformation()}
			</div>;
		}

		return undefined;
	}

	debugInformation() {
		if (this.signInErrorDetected() && this.state.debugInformationShowing) {
			return <div id={Constants.Ids.signInErrorDebugInformation}>
				<span id={Constants.Ids.signInErrorDebugInformationDescription} style={Localization.getFontFamilyAsStyle(Localization.FontFamily.Light)}>
					{this.props.clipperState.userResult.data.errorDescription}
				</span>
				<div id={Constants.Ids.signInErrorDebugInformationContainer} style={Localization.getFontFamilyAsStyle(Localization.FontFamily.Light)}>
					<ul id={Constants.Ids.signInErrorDebugInformationList}>
						<li>{ClientType[this.props.clipperState.clientInfo.clipperType]}: {this.props.clipperState.clientInfo.clipperVersion}</li>
						<li>ID: {this.props.clipperState.clientInfo.clipperId}</li>
						<li>USID: {Clipper.getUserSessionId()}</li>
					</ul>
				</div>
			</div>;
		}
	}

	getErrorDescription() {
		if (this.signInFailureContainsErrorDescription()) {
			return this.props.clipperState.userResult.data.errorDescription;
		} else if (this.signInFailureThirdPartyCookiesBlocked()) {
			return <div>
				<div class={Constants.Ids.signInErrorCookieInformation}>{Localization.getLocalizedString("WebClipper.Error.CookiesDisabled.Line1")}</div>
				<div class={Constants.Ids.signInErrorCookieInformation}>{Localization.getLocalizedString("WebClipper.Error.CookiesDisabled.Line2")}</div>
			</div>;
		}

		return undefined;
	}

	errorInformationDescription() {
		if (this.signInErrorDetected()) {
			return <div id={Constants.Ids.signInErrorDescription}>
				<span id={Constants.Ids.signInErrorDescriptionContainer} style={Localization.getFontFamilyAsStyle(Localization.FontFamily.Light)}>
					{this.getErrorDescription()}
				</span>
				{this.errorMoreInformationTogggle()}
			</div>;
		}

		return undefined;
	}

	render() {
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
							{this.getSignInDescription()}
						</span>
					</div>
					{this.errorInformationDescription()}
					<a id={Constants.Ids.signInButtonMsa} {...this.enableInvoke(this.onSignInMsa, 11, AuthType.Msa)}>
						<div className="wideButtonContainer">
							<span className="wideButtonFont wideActionButton"
								style={Localization.getFontFamilyAsStyle(Localization.FontFamily.Regular)}>
								{Localization.getLocalizedString("WebClipper.Action.SigninMsa")}
							</span>
						</div>
					</a>
					<a id={Constants.Ids.signInButtonOrgId} {...this.enableInvoke(this.onSignInOrgId, 12, AuthType.OrgId) }>
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
