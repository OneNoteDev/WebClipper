import {ClientInfo} from "../../clientInfo";
import {ClientType} from "../../clientType";

import {Communicator} from "../../communicator/communicator";
import {IFrameMessageHandler} from "../../communicator/iframeMessageHandler";
import {InlineMessageHandler} from "../../communicator/inlineMessageHandler";
import {SmartValue} from "../../communicator/smartValue";

import * as Log from "../../logging/log";
import {Logger} from "../../logging/logger";

import {ClipperData} from "../../storage/clipperData";
import {LocalStorage} from "../../storage/localStorage";

import {Constants} from "../../constants";
import {AuthType} from "../../userInfo";
import {Utils} from "../../utils";

import {ChangeLog} from "../../versioning/changeLog";

import {AuthenticationHelper} from "../authenticationHelper";
import {ExtensionWorkerBase} from "../extensionWorkerBase";
import {InvokeMode} from "../invokeOptions";
import {InvokeSource} from "../invokeSource";

import {InlineExtension} from "./inlineExtension";

export class InlineWorker extends ExtensionWorkerBase<any, any> {
	constructor(clientInfo: SmartValue<ClientInfo>, auth: AuthenticationHelper) {
		let uiMessageHandlerThunk = () => { return new InlineMessageHandler(); };
		let injectMessageHandlerThunk = () => { return new IFrameMessageHandler(() => parent); };
		super(clientInfo, auth, new ClipperData(new LocalStorage()), uiMessageHandlerThunk, injectMessageHandlerThunk);

		this.logger.setContextProperty(Log.Context.Custom.InPrivateBrowsing, Log.unknownValue);

		let invokeOptions = {
			invokeMode: InvokeMode.Default
		};
		this.sendInvokeOptionsToInject(invokeOptions);

		// The inline worker gets created after the UI was successfully inject, so we can safely log this here
		this.logger.logUserFunnel(Log.Funnel.Label.Invoke);
		this.logClipperInvoke({
			invokeSource: InvokeSource.Bookmarklet
		}, invokeOptions);
	}

	public getUiMessageHandler(): InlineMessageHandler {
		return this.uiCommunicator.getMessageHandler() as InlineMessageHandler;
	}

	public getUrl(): string {
		return "inline - unknown";
	}

	protected invokeClipperBrowserSpecific(): Promise<boolean> {
		return this.throwNotImplementedFailure();
	}

	protected invokeDebugLoggingBrowserSpecific(): Promise<boolean> {
		return this.throwNotImplementedFailure();
	}

	protected invokeWhatsNewTooltipBrowserSpecific(newVersions: ChangeLog.Update[]): Promise<boolean> {
		return this.throwNotImplementedFailure();
	}

	protected invokeTooltipBrowserSpecific(): Promise<boolean> {
		return this.throwNotImplementedFailure();
	}

	protected isAllowedFileSchemeAccessBrowserSpecific(): boolean {
		return false;
	}

	protected takeTabScreenshot(): Promise<string> {
		return this.throwNotImplementedFailure();
	}

	/**
	 * Launches the sign in window, rejecting with an error object if something went wrong on the server during
	 * authentication. Otherwise, it resolves with true if the redirect endpoint was hit as a result of a successful
	 * sign in attempt, and false if it was not hit (e.g., user manually closed the popup)
	 */
	protected doSignInAction(authType: AuthType): Promise<boolean> {
		let usidQueryParamValue = this.getUserSessionIdQueryParamValue();
		let signInUrl = Utils.generateSignInUrl(this.clientInfo.get().clipperId, usidQueryParamValue, AuthType[authType]);

		return this.launchPopupAndWaitForClose(signInUrl);
	}

	/**
	 * Signs the user out
	 */
	protected doSignOutAction(authType: AuthType) {
		let usidQueryParamValue = this.getUserSessionIdQueryParamValue();
		let signOutUrl = Utils.generateSignOutUrl(this.clientInfo.get().clipperId, usidQueryParamValue, AuthType[authType]);

		let iframe = document.createElement("iframe");
		iframe.hidden = true;
		iframe.style.display = "none";
		iframe.src = signOutUrl;
		document.body.appendChild(iframe);
	}

	private throwNotImplementedFailure(): any {
		this.logger.logFailure(Log.Failure.Label.NotImplemented, Log.Failure.Type.Unexpected);
		throw new Error("not implemented");
	}
}
