import {ClientType} from "../../clientType";
import {Constants} from "../../constants";
import {AuthType} from "../../userInfo";
import {Utils} from "../../utils";

import {Localization} from "../../localization/localization";

import * as Log from "../../logging/log";

import {Clipper} from "../frontEndGlobals";
import {ClipperStateProp, ClipperStateHelperFunctions} from "../clipperState";
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

		this.props.clipperState.setState({ userResult: undefined });
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
				this.feedbackUrl = Utils.generateFeedbackUrl(this.props.clipperState, Clipper.getUserSessionId(), Constants.LogCategories.oneNoteClipperUsage);
			}
			this.feedbackWindowRef = Utils.openPopupWindow(this.feedbackUrl);
		}
	}

	render() {
		let showUserInfo = ClipperStateHelperFunctions.isUserLoggedIn(this.props.clipperState);

		return (
			<div id={Constants.Ids.clipperFooterContainer} className="footerFont"
				style={Localization.getFontFamilyAsStyle(Localization.FontFamily.Regular)}>
				<div>
					<div className="footerButtonsLeft confineText">
						<a id={Constants.Ids.feedbackButton} {...this.enableInvoke(this.handleFeedbackButton, 80) }>
							<img id={Constants.Ids.feedbackImage} src={Utils.getImageResourceUrl("feedback_smiley.png")}
								alt={Localization.getLocalizedString("WebClipper.Action.Feedback") }/>
							<span>{Localization.getLocalizedString("WebClipper.Action.Feedback") }</span>
						</a>
					</div>
					{showUserInfo
						? (<div className="footerButtonsRight">
								<a id={Constants.Ids.currentUserControl} {...this.enableInvoke(this.userControlHandler, 81) }>
									<img id={Constants.Ids.userDropdownArrow} src={Utils.getImageResourceUrl("dropdown_arrow.png")} />
									<div id={Constants.Ids.currentUserDetails}>
									{
										this.props.clipperState.userResult.data.user.fullName
										? <div id={Constants.Ids.currentUserName} className="confineText">{this.props.clipperState.userResult.data.user.fullName}</div>
										: <div id={Constants.Ids.currentUserName} className="confineText"></div>
									}
										<div id={Constants.Ids.currentUserId} className="confineText currentUserIdFont"
											style={Localization.getFontFamilyAsStyle(Localization.FontFamily.Regular)}>
											{this.props.clipperState.userResult.data.user.emailAddress}
										</div>
									</div>
								</a>
							</div>)
						: undefined
					}
				</div>
				{this.state.userSettingsOpened
					? (<div id={Constants.Ids.userSettingsContainer} className="userSettingsFont"
							style={Localization.getFontFamilyAsStyle(Localization.FontFamily.Regular)}>
							<hr className="userDivider" />
							<div className="userDetails confineText">
								<label id={Constants.Ids.currentUserEmail}>{this.props.clipperState.userResult.data.user.emailAddress}</label>
								<a id={Constants.Ids.signOutButton} className="userActionButton"
									{...this.enableInvoke(this.handleSignOutButton, 82) }>
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
