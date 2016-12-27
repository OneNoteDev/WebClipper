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
	errorDescriptionShowing?: boolean;
}

interface SignInPanelProps extends ClipperStateProp {
	onSignInInvoked: (authType: AuthType) => void;
}

class SignInPanelClass extends ComponentBase<SignInPanelState, SignInPanelProps> {
	getInitialState() {
		return { errorDescriptionShowing: false };
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

	signInFailureDetected(): boolean {
		return !!this.props.clipperState.userResult && !!this.props.clipperState.userResult.data
			&& this.props.clipperState.userResult.data.updateReason === UpdateReason.SignInAttempt
			// Right now we are only showing the error panel for OrgId errors since they tend to
			// be a little more actionable to the user, or at least a little more helpful.
			&& this.props.clipperState.userResult.data.errorDescription
			&& this.props.clipperState.userResult.data.errorDescription.indexOf("OrgId") === 0;
	}

	signInFailureThirdPartyCookiesBlocked(): boolean {
		return true;
	}

	errorDescriptionControlHandler() {
		this.setState({ errorDescriptionShowing: !this.state.errorDescriptionShowing });
	}

	errorInformationToggle() {
		if (this.signInFailureDetected()) {
			return <div className="signInErrorToggleInformation">
				<a id={Constants.Ids.signInErrorMoreInformation} {...this.enableInvoke(this.errorDescriptionControlHandler, 10) }>
					<img id={Constants.Ids.signInToggleErrorDropdownArrow} src={ExtensionUtils.getImageResourceUrl("dropdown_arrow.png")} />
					<span id={Constants.Ids.signInToggleErrorInformationText}
						style={Localization.getFontFamilyAsStyle(Localization.FontFamily.Light)}>
						{this.state.errorDescriptionShowing
							? Localization.getLocalizedString("WebClipper.Label.SignInUnsuccessfulLessInformation")
							: Localization.getLocalizedString("WebClipper.Label.SignInUnsuccessfulMoreInformation")
						}
					</span>
				</a>
			</div>;
		}

		return undefined;
	}

	errorInformationDescription() {
		if (this.signInFailureDetected() && this.state.errorDescriptionShowing) {
			return <div id={Constants.Ids.signInErrorDescription}>
				<span className={Constants.Ids.signInErrorDescriptionContainer} style={Localization.getFontFamilyAsStyle(Localization.FontFamily.Light)}>
					{this.props.clipperState.userResult.data.errorDescription}
				</span>
				<div className={Constants.Ids.signInErrorDebugInformationContainer}
					style={Localization.getFontFamilyAsStyle(Localization.FontFamily.Light)}>
					<ul className={Constants.Ids.signInErrorDebugInformationList}>
						<li>{ClientType[this.props.clipperState.clientInfo.clipperType]}: {this.props.clipperState.clientInfo.clipperVersion}</li>
						<li>ID: {this.props.clipperState.clientInfo.clipperId}</li>
						<li>USID: {Clipper.getUserSessionId()}</li>
					</ul>
				</div>
			</div>;
		}

		return undefined;
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
					{this.errorInformationToggle()}
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
