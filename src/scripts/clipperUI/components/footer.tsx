import {BrowserUtils} from "../../browserUtils";
import {ClientType} from "../../clientType";
import {ClipperUrls} from "../../clipperUrls";
import {Constants} from "../../constants";

import {ExtensionUtils} from "../../extensions/extensionUtils";

import {Localization} from "../../localization/localization";

import * as Log from "../../logging/log";

import {Clipper} from "../frontEndGlobals";
import {ClipperStateProp} from "../clipperState";
import {ClipperStateUtilities} from "../clipperStateUtilities";
import {ComponentBase} from "../componentBase";

interface FooterState {
	userSettingsOpened: boolean;
}

interface FooterProps extends ClipperStateProp {
	onSignOutInvoked: (authType: string) => void;
}

class FooterClass extends ComponentBase<FooterState, FooterProps> {
	private feedbackUrl: string;
	private feedbackWindowRef: Window;

	getFeedbackWindowRef(): Window {
		return this.feedbackWindowRef;
	}

	getInitialState() {
		return { userSettingsOpened: false };
	}

	userControlHandler() {
		this.setState({ userSettingsOpened: !this.state.userSettingsOpened });
	}

	handleSignOutButton() {
		this.setState({ userSettingsOpened: false });
		if (this.props.onSignOutInvoked) {
			this.props.onSignOutInvoked(this.props.clipperState.userResult.data.user.authType);
		}
	}

	handleFeedbackButton(args: any, event: MouseEvent) {
		// In order to make it easy to collect some information from the user, we're hijacking
		// the feedback button to show the relevant info.
		if (event.altKey && event.shiftKey) {
			let debugMessage = ClientType[this.props.clipperState.clientInfo.clipperType] + ": " + this.props.clipperState.clientInfo.clipperVersion;
			debugMessage += "\nID: " + this.props.clipperState.clientInfo.clipperId;
			debugMessage += "\nUsid: " + Clipper.getUserSessionId();

			Clipper.logger.logEvent(new Log.Event.BaseEvent(Log.Event.Label.DebugFeedback));

			window.alert(debugMessage);
			return;
		}

		if (!this.feedbackWindowRef || this.feedbackWindowRef.closed) {
			if (!this.feedbackUrl) {
				this.feedbackUrl = ClipperUrls.generateFeedbackUrl(this.props.clipperState, Clipper.getUserSessionId(), Constants.LogCategories.oneNoteClipperUsage);
			}
			this.feedbackWindowRef = BrowserUtils.openPopupWindow(this.feedbackUrl);
		}
	}

	render() {
		let showUserInfo = ClipperStateUtilities.isUserLoggedIn(this.props.clipperState);
		let isMsaUser = ClipperStateUtilities.isMsaUser(this.props.clipperState);

		return (
			<div id={Constants.Ids.clipperFooterContainer} className="footerFont"
				style={Localization.getFontFamilyAsStyle(Localization.FontFamily.Regular)}>
				<div className={Constants.Ids.footerButtonsContainer}>
					<div className="footerButtonsLeft">
						{!isMsaUser
							? (<a id={Constants.Ids.feedbackButton} role="button" {...this.enableInvoke({callback: this.handleFeedbackButton, tabIndex: 80})}>
									<img id={Constants.Ids.feedbackImage} src={ExtensionUtils.getImageResourceUrl("feedback_smiley.svg")} aria-hidden="true"/>
									<span id={Constants.Ids.feedbackLabel} class="buttonTextInHighContrast">{Localization.getLocalizedString("WebClipper.Action.Feedback") }</span>
							</a>)
							: undefined
						}
					</div>
					{showUserInfo
						? (<div className="footerButtonsRight">
							<a id={Constants.Ids.currentUserControl} role="button" {...this.enableInvoke({callback: this.userControlHandler, tabIndex: 81})} aria-expanded={this.state.userSettingsOpened}>
								<div id={Constants.Ids.currentUserDetails}>
									{
										this.props.clipperState.userResult.data.user.fullName
										? <div id={Constants.Ids.currentUserName} class="buttonTextInHighContrast">{this.props.clipperState.userResult.data.user.fullName}</div>
										: <div id={Constants.Ids.currentUserName} class="buttonTextInHighContrast">{Localization.getLocalizedString("WebClipper.Label.SignedIn")}</div>
									}
									{
										this.props.clipperState.userResult.data.user.emailAddress
										? <div id={Constants.Ids.currentUserId} className="buttonTextInHighContrast currentUserIdFont" style={Localization.getFontFamilyAsStyle(Localization.FontFamily.Regular)}>{this.props.clipperState.userResult.data.user.emailAddress}</div>
										: ""
									}
								</div>
								<img aria-hidden="true" id={Constants.Ids.userDropdownArrow} src={ExtensionUtils.getImageResourceUrl("dropdown_arrow.svg")} />
							</a>
							</div>)
						: undefined
					}
				</div>
				{this.state.userSettingsOpened
					? (<div id={Constants.Ids.userSettingsContainer} className="userSettingsFont" role="complementary" aria-label={Localization.getLocalizedString("WebClipper.Accessibility.ScreenReader.Footer")}
							style={Localization.getFontFamilyAsStyle(Localization.FontFamily.Regular)}>
							<hr className="userDivider" aria-hidden="true"/>
							<div className="userDetails">
								<label for={Constants.Ids.signOutButton} id={Constants.Ids.currentUserEmail} aria-hidden="true">
									{this.props.clipperState.userResult.data.user.emailAddress}
								</label>
								<a id={Constants.Ids.signOutButton} role="button" className="userActionButton buttonTextInHighContrast"
									aria-label={Localization.getLocalizedString("WebClipper.Action.SignOut") + " " + this.props.clipperState.userResult.data.user.emailAddress}
									{...this.enableInvoke({callback: this.handleSignOutButton, tabIndex: 82})}>
									{Localization.getLocalizedString("WebClipper.Action.SignOut")}
								</a>
							</div>
						</div>)
					: undefined
				}
			</div>
		);
	}
}

let component = FooterClass.componentize();
export {component as Footer};
