import {Constants} from "../constants";
import {Polyfills} from "../polyfills";
import {Utils} from "../utils";

import {Localization} from "../localization/localization";
import {LocalizationHelper} from "../localization/localizationHelper";

import {Status} from "./status";

import {LoadingPanel} from "./panels/loadingPanel";

export interface UnsupportedBrowserState {
	localizedStringFetchAttemptCompleted: Status;
}

/**
 * A very browser-compliant class that notifies the user that their browser is unsupported
 * by the Web Clipper.
 */
class UnsupportedBrowserClass {
	public state: UnsupportedBrowserState;

	constructor() {
		this.state = this.getInitialState();
	}

	getInitialState(): UnsupportedBrowserState {
		return {
			localizedStringFetchAttemptCompleted: Status.NotStarted
		};
	}

	public setState(newPartialState: UnsupportedBrowserState) {
		m.startComputation();
		for (let key in newPartialState) {
			if (newPartialState.hasOwnProperty(key)) {
				this.state[key] = newPartialState[key];
			}
		}
		m.endComputation();
	}

	public static componentize() {
		let returnValue: any = () => { };
		returnValue.controller = (props: any) => {
			return new (this as any)(props);
		};
		returnValue.view = (controller: any, props: any) => {
			controller.props = props;
			return controller.render();
		};

		return returnValue;
	}

	private fetchLocalizedStrings(locale: string) {
		this.setState({
			localizedStringFetchAttemptCompleted: Status.InProgress
		});
		LocalizationHelper.makeLocStringsFetchRequest(locale).then((responsePackage) => {
			try {
				Localization.setLocalizedStrings(JSON.parse(responsePackage.parsedResponse));
				this.setState({
					localizedStringFetchAttemptCompleted: Status.Succeeded
				});
			} catch (e) {
				this.setState({
					localizedStringFetchAttemptCompleted: Status.Failed
				});
			}
		}, () => {
			this.setState({
				localizedStringFetchAttemptCompleted: Status.Failed
			});
		});
	}

	private attemptingFetchLocalizedStrings() {
		return this.state.localizedStringFetchAttemptCompleted === Status.NotStarted ||
			this.state.localizedStringFetchAttemptCompleted === Status.InProgress;
	}

	render() {
		if (this.state.localizedStringFetchAttemptCompleted === Status.NotStarted) {
			this.fetchLocalizedStrings(navigator.language || (<any>navigator).userLanguage);
		}

		// In IE8 and below, 'class' is a reserved keyword and cannot be used as a key in a JSON object
		return ({tag: "div", attrs: {id: Constants.Ids.unsupportedBrowserContainer}, children: [
				{tag: "div", attrs: {id: Constants.Ids.unsupportedBrowserPanel, "class": "panelContent"}, children: [
					{tag: "div", attrs: {className: Constants.Classes.heightAnimator, style: "min-height: 276px; max-height: 276px;"}, children: [
						{tag: "div", attrs: {className: Constants.Classes.panelAnimator, style: "left: 0px; opacity: 1;"}, children: [
							{tag: "div", attrs: {id: Constants.Ids.signInContainer}, children: [
								{tag: "div", attrs: {className: "signInPadding"}, children: [
									{tag: "img", attrs: {id: Constants.Ids.signInLogo, src: Utils.getImageResourceUrl("onenote_logo_clipper.png")}},
									{tag: "div", attrs: {id: Constants.Ids.signInMessageLabelContainer, "class": "messageLabelContainer"}, children: [
										{tag: "span", attrs: {"class": "messageLabel", style: Localization.getFontFamilyAsStyle(Localization.FontFamily.Regular)}, children: [
											this.attemptingFetchLocalizedStrings() ? "" : Localization.getLocalizedString("WebClipper.Label.OneNoteClipper")
										]}
									]},
									{tag: "div", attrs: {"class": "signInDescription"}, children: [
										{tag: "span", attrs: {id: Constants.Ids.signInText, style: Localization.getFontFamilyAsStyle(Localization.FontFamily.Light)}, children: [
											this.attemptingFetchLocalizedStrings() ? "" : Localization.getLocalizedString("WebClipper.Label.UnsupportedBrowser")
										]}
									]}
								]}
							]}
						]}
					]}
				]}
			]});
	}
}

Polyfills.init();
let component = UnsupportedBrowserClass.componentize();
m.mount(document.getElementById("clipperUIPlaceholder"), component);
export {component as UnsupportedBrowser}
