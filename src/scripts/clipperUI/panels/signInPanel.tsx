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
	signInFailureDetected?: boolean;
	errorDescriptionShowing?: boolean;
}

interface SignInPanelProps extends ClipperStateProp {
	onSignInInvoked: (authType: AuthType) => void;
}

class SignInPanelClass extends ComponentBase<SignInPanelState, SignInPanelProps> {
	onSignInMsa() {
		this.props.onSignInInvoked(AuthType.Msa);
	}

	onSignInOrgId() {
		this.props.onSignInInvoked(AuthType.OrgId);
	}

	getInitialState() {
		return { signInFailureDetected: false, errorDescriptionShowing: false };
	}

	getSignInDescription(): string {
		// Since the user is not signed in, we show a message depending on the reason of the last update to the userResult
		if (!this.props.clipperState.userResult || !this.props.clipperState.userResult.data) {
			return Localization.getLocalizedString("WebClipper.Label.SignInDescription");
		}

		switch (this.props.clipperState.userResult.data.updateReason) {
			case UpdateReason.SignInAttempt:
				this.setState({ signInFailureDetected: true });
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

	errorDescriptionControlHandler() {
		this.setState({ errorDescriptionShowing: !this.state.errorDescriptionShowing });
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
					{this.state.signInFailureDetected
						? (<div className="signInErrorToggleInformation">
							<a id={Constants.Ids.currentUserControl} {...this.enableInvoke(this.errorDescriptionControlHandler, 81) }>
								<span class={Constants.Ids.signInToggleErrorInformationText}
									style={Localization.getFontFamilyAsStyle(Localization.FontFamily.Light)}>
									{this.state.errorDescriptionShowing
										? Localization.getLocalizedString("WebClipper.Label.SignInUnsuccessfulLessInformation")
										: Localization.getLocalizedString("WebClipper.Label.SignInUnsuccessfulMoreInformation")
									}
								</span>
							</a>
						</div>) : undefined
					}
					{(this.state.signInFailureDetected && this.state.errorDescriptionShowing)
						? (<div className="signInErrorDescription">
							<span className={Constants.Ids.signInErrorDescriptionContainer}
								style={Localization.getFontFamilyAsStyle(Localization.FontFamily.Light)}>
								{this.props.clipperState.userResult.data.errorDescription}
								AADSTS65005: The application OneNote Web Clipper is currently not supported for your company my.****.**.uk. Your company is currently in an unmanaged state and needs an Administrator to claim ownership of the company by DNS validation of my.****.**.uk before the application OneNote Web Clipper can be provisioned.
						</span>
							<div className={Constants.Ids.signInErrorDebugInformationContainer}
								style={Localization.getFontFamilyAsStyle(Localization.FontFamily.Light)}>
								<ul className={Constants.Ids.signInErrorDebugInformationList}>
									<li>{ClientType[this.props.clipperState.clientInfo.clipperType]}: {this.props.clipperState.clientInfo.clipperVersion}</li>
									<li>ID: {this.props.clipperState.clientInfo.clipperId}</li>
									<li>USID: {Clipper.getUserSessionId()}</li>
								</ul>
							</div>
						</div>) : undefined
					}
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
