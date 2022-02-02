import {Constants} from "../constants";
import {PageInfo} from "../pageInfo";
import {UrlUtils} from "../urlUtils";

import {DomUtils} from "../domParsers/domUtils";

import {Communicator} from "../communicator/communicator";
import {CommunicatorPassthrough} from "../communicator/communicatorPassthrough";
import {IFrameMessageHandler} from "../communicator/iframeMessageHandler";
import {MessageHandler} from "../communicator/messageHandler";
import {SmartValue} from "../communicator/smartValue";

import {Rtl} from "../localization/rtl";

import * as Log from "../logging/log";
import {Logger} from "../logging/logger";
import {CommunicatorLoggerPure} from "../logging/communicatorLoggerPure";

import {ChangeLog} from "../versioning/changeLog";

import {Frame, StyledFrameFactory} from "./styledFrameFactory";
import {FrameInjectBase} from "./frameInjectBase";
import {FrameInjectOptions} from "./injectOptions";

import {WebExtension} from "./webExtensionBase/webExtension";
import {WebExtensionContentMessageHandler} from "./webExtensionBase/webExtensionMessageHandler";

export class PageNavInject extends FrameInjectBase<FrameInjectOptions> {
	private pageInfo: SmartValue<PageInfo>;
	private logger: Logger;

	public static main(options: FrameInjectOptions) {
		// There is no toggling functionality in the What's New experience
		if (!document.getElementById(Constants.Ids.clipperPageNavFrame)) {
			// Rather than using a static field (i.e., traditional singleton pattern), we have to attach
			// the singleton to the window object because each time we inject a new inject script, they are
			// sandboxed from each other, so having a static field will not work.
			(<any>window).pageNavInjectObject = new PageNavInject(options);
		}
	}

	constructor(options: FrameInjectOptions) {
		super(options);
		this.logger = new CommunicatorLoggerPure(this.extCommunicator);
		this.setPageInfoContextProperties();
	}

	protected checkForNoOps() {
		// Nothing needed
	}

	protected createFrame() {
		this.frame = StyledFrameFactory.getStyledFrame(Frame.PageNav);
		this.frame.id = Constants.Ids.clipperPageNavFrame;
		this.frame.src = this.options.frameUrl;
	}

	protected handleConstructorError(e: Error) {
		Log.ErrorUtils.sendFailureLogRequest({
			label: Log.Failure.Label.UnhandledExceptionThrown,
			properties: {
				failureType: Log.Failure.Type.Unexpected,
				failureInfo: { error: e.toString() },
				failureId: "PageNavInject",
				stackTrace: Log.Failure.getStackTrace(e)
			}
		});
	}

	protected init() {
		this.pageInfo = new SmartValue<PageInfo>();
		// Nothing needed
	}

	protected initializeExtCommunicator(extMessageHandlerThunk: () => MessageHandler) {
		this.extCommunicator = new Communicator(extMessageHandlerThunk(), Constants.CommunicationChannels.pageNavInjectedAndExtension);
		this.extCommunicator.registerFunction(Constants.FunctionKeys.closePageNavTooltip, () => {
			this.closeFrame();
		});
	}

	protected initializeEventListeners() {
		// Notify the background when we're unloading
		window.onbeforeunload = (event) => {
			this.extCommunicator.callRemoteFunction(Constants.FunctionKeys.unloadHandler);
		};
	}

	protected initializePassthroughCommunicator(extMessageHandlerThunk: () => MessageHandler) {
		let passthroughCommunicator = new CommunicatorPassthrough(extMessageHandlerThunk(),
			new IFrameMessageHandler(() => this.frame.contentWindow),
			Constants.CommunicationChannels.extensionAndPageNavUi);
	}

	protected initializeUiCommunicator() {
		this.uiCommunicator = new Communicator(new IFrameMessageHandler(() => this.frame.contentWindow), Constants.CommunicationChannels.pageNavInjectedAndPageNavUi);
		this.uiCommunicator.registerFunction(Constants.FunctionKeys.closePageNavTooltip, () => {
			this.closeFrame();
		});
		this.uiCommunicator.registerFunction(Constants.FunctionKeys.updateFrameHeight, (newHeight: number) => {
			this.frame.style.height = newHeight + Constants.Styles.clipperUiTopRightOffset + (Constants.Styles.clipperUiDropShadowBuffer * 2) + "px";
		});
	}

	/**
	 * Sets context properties relating to page info
	 */
	private setPageInfoContextProperties(): void {
		this.logger.setContextProperty(Log.Context.Custom.ContentType, OneNoteApi.ContentType[DomUtils.getPageContentType(document)]);
	}
}
