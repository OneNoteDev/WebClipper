import {ClientInfo} from "../clientInfo";
import {ClientType} from "../clientType";
import {Constants} from "../constants";
import {PageInfo} from "../pageInfo";
import {UserInfo, AuthType} from "../userInfo";
import {ObjectUtils} from "../objectUtils";

import {Communicator} from "../communicator/communicator";
import {CommunicatorPassthrough} from "../communicator/communicatorPassthrough";
import {IFrameMessageHandler} from "../communicator/iframeMessageHandler";
import {MessageHandler} from "../communicator/messageHandler";
import {SmartValue} from "../communicator/smartValue";

import {DomUtils} from "../domParsers/domUtils";

import {Rtl} from "../localization/rtl";

import * as Log from "../logging/log";
import {Logger} from "../logging/logger";
import {CommunicatorLoggerPure} from "../logging/communicatorLoggerPure";

import {ClipperStorageKeys} from "../storage/clipperStorageKeys";

import {InitializableRangyStatic} from "../typingsExtends/initializableRangyStatic";

import {Frame, StyledFrameFactory} from "./styledFrameFactory";
import {FrameInjectBase} from "./frameInjectBase";
import {FrameInjectOptions} from "./injectOptions";
import {InvokeOptions, InvokeMode} from "./invokeOptions";

export interface ClipperInjectOptions extends FrameInjectOptions {
	enableAddANote: boolean;
	enableEditableTitle: boolean;
	enableRegionClipping: boolean;
	useInlineBackgroundWorker?: boolean;
}

declare let rangy: InitializableRangyStatic;

/**
 * Loads up the Clipper iframe and manages it
 */
export class ClipperInject extends FrameInjectBase<ClipperInjectOptions> {
	private clientInfo: SmartValue<ClientInfo>;
	private pageInfo: SmartValue<PageInfo>;
	private isFullScreen: SmartValue<boolean>;
	private frameHeight = 100;

	private logger: Logger;

	/**
	 * Called to toggle the clipper's visibility, or to invoke it if it does not exist
	 */
	public static main(oneNoteClipperOptions: ClipperInjectOptions): ClipperInject {
		// Rather than using a static field (i.e., traditional singleton pattern), we have to attach
		// the singleton to the window object because each time we inject a new inject script, they are
		// sandboxed from each other, so having a static field will not work.
		let oneNoteInjectBaseObject = (<any>window).oneNoteInjectBaseObject as ClipperInject;
		if (!!document.getElementById(Constants.Ids.clipperUiFrame) && oneNoteInjectBaseObject) {
			// The page could have changed between invokes e.g., single page apps
			if (window.getComputedStyle(oneNoteInjectBaseObject.frame).display === "none") {
				oneNoteInjectBaseObject.updatePageInfo();
			}

			oneNoteInjectBaseObject.toggleClipper();

			return oneNoteInjectBaseObject;
		} else if (!document.getElementById(Constants.Ids.clipperUiFrame)) {
			// The Web Clipper has not been invoked on this page yet
			let clipperInject = new ClipperInject(oneNoteClipperOptions);
			(<any>window).oneNoteInjectBaseObject = clipperInject;
			return clipperInject;
		} else {
			// The inject base object has been lost, likely due to an extension refresh or update while the Web Clipper is invoked,
			// so we prevent further action. It technically still exists but it has been orphaned (i.e., we lost a reference to it).
			return undefined;
		}
	}

	constructor(options: ClipperInjectOptions) {
		super(options);

		try {
			this.updateUiSizeAttributes();
			this.overrideTransformStyles(document.documentElement);

			this.logger = new CommunicatorLoggerPure(this.uiCommunicator);

			this.updatePageInfo();

			this.extCommunicator.callRemoteFunction(Constants.FunctionKeys.setStorageValue, {
				param: { key: ClipperStorageKeys.lastInvokedDate, value: Date.now().toString() }
			});

			// We set up this call here as it requires both ui and ext communicators to be set up first
			this.extCommunicator.registerFunction(Constants.FunctionKeys.setInvokeOptions, (invokeOptions: InvokeOptions) => {
				// Some modes are gated here in the inject for extra processing
				switch (invokeOptions.invokeMode) {
					case InvokeMode.ContextTextSelection:
						// In the case of PDF, the selection is passed to us from the WebExtension API, so we use that instead as Rangy won't work
						if (invokeOptions.invokeDataForMode) {
							invokeOptions.invokeDataForMode = this.toScrubbedHtml(invokeOptions.invokeDataForMode);
							this.sendInvokeOptionsToUi(invokeOptions);
							break;
						}

						// Rangy initializes itself on the page load, so we need to initialize it if the user invoked before this happens
						if (!rangy.initialized && rangy.init) {
							rangy.init();
						}

						// We get the selection here as the WebExtension API only allows us to get text
						// We assume there is rangeCount of 1: https://developer.mozilla.org/en-US/docs/Web/API/Selection/rangeCount
						let selection = rangy.getSelection() as RangySelection;
						let range = selection.getRangeAt(0) as RangyRange;

						let doc = (new DOMParser()).parseFromString(range.toHtml(), "text/html");
						DomUtils.toOnml(doc).then(() => {
							// Selections are prone to not having an outer html element, which can lead to anomalies in preview
							invokeOptions.invokeDataForMode = this.toScrubbedHtml(doc.body.innerHTML);
							this.sendInvokeOptionsToUi(invokeOptions);
						});
						break;
					default:
						this.sendInvokeOptionsToUi(invokeOptions);
						break;
				}
			});

			document.onkeydown = (event) => {
				if (event.keyCode === Constants.KeyCodes.tab) {
					if (window.getComputedStyle(this.frame).display !== "none") {
						this.uiCommunicator.callRemoteFunction(Constants.FunctionKeys.tabToLowestIndexedElement);
					}
				}
			};
		} catch (e) {
			this.handleConstructorError(e);
			throw e;
		}
	}

	protected checkForNoOps() {
		// Ensure the frame was created and is visible
		let clipperFrame = document.getElementById(Constants.Ids.clipperUiFrame);
		let frameWasNotInjected = ObjectUtils.isNullOrUndefined(clipperFrame);
		let url = window.location.href;

		if (frameWasNotInjected) {
			Log.ErrorUtils.sendNoOpTrackerRequest({
				label: Log.NoOp.Label.WebClipperUiFrameDidNotExist,
				channel: Constants.CommunicationChannels.injectedAndUi,
				clientInfo: this.clientInfo,
				url: url
			});
		} else {
			let isFrameVisible = window.getComputedStyle(clipperFrame).display !== "none";
			if (!isFrameVisible) {
				Log.ErrorUtils.sendNoOpTrackerRequest({
					label: Log.NoOp.Label.WebClipperUiFrameIsNotVisible,
					channel: Constants.CommunicationChannels.injectedAndUi,
					clientInfo: this.clientInfo,
					url: url
				}, true);
			}
		}

		// No-op tracker for communication with the UI
		let noOpTrackerTimeout = Log.ErrorUtils.setNoOpTrackerRequestTimeout({
			label: Log.NoOp.Label.InitializeCommunicator,
			channel: Constants.CommunicationChannels.injectedAndUi,
			clientInfo: this.clientInfo,
			url: window.location.href
		});

		this.uiCommunicator.callRemoteFunction(Constants.FunctionKeys.noOpTracker, {
			param: new Date().getTime(),
			callback: () => {
				clearTimeout(noOpTrackerTimeout);
			}
		});
	}

	protected createFrame() {
		this.frame = StyledFrameFactory.getStyledFrame(Frame.WebClipper);
		this.frame.id = Constants.Ids.clipperUiFrame;
		this.frame.src = this.options.frameUrl;
	}

	protected handleConstructorError(e: Error) {
		Log.ErrorUtils.sendFailureLogRequest({
			label: Log.Failure.Label.UnhandledExceptionThrown,
			properties: {
				failureType: Log.Failure.Type.Unexpected,
				failureInfo: { error: JSON.stringify({ error: e.toString(), url: window.location.href }) },
				failureId: "InjectBase",
				stackTrace: Log.Failure.getStackTrace(e)
			},
			clientInfo: this.clientInfo
		});
	}

	protected init() {
		this.clientInfo = new SmartValue<ClientInfo>();
		this.pageInfo = new SmartValue<PageInfo>();
		this.isFullScreen = new SmartValue<boolean>(false);
	}

	protected initializeExtCommunicator(extMessageHandlerThunk: () => MessageHandler) {
		this.extCommunicator = new Communicator(extMessageHandlerThunk(), Constants.CommunicationChannels.injectedAndExtension);

		// Clear the extension no-op tracker
		this.extCommunicator.registerFunction(Constants.FunctionKeys.noOpTracker, (trackerStartTime: number) => {
			let clearNoOpTrackerEvent = new Log.Event.BaseEvent(Log.Event.Label.ClearNoOpTracker);
			clearNoOpTrackerEvent.setCustomProperty(Log.PropertyName.Custom.TimeToClearNoOpTracker, new Date().getTime() - trackerStartTime);
			clearNoOpTrackerEvent.setCustomProperty(Log.PropertyName.Custom.Channel, Constants.CommunicationChannels.injectedAndExtension);
			this.logger.logEvent(clearNoOpTrackerEvent);

			return Promise.resolve();
		});

		this.extCommunicator.setErrorHandler((e: Error) => {
			this.uiCommunicator.callRemoteFunction(Constants.FunctionKeys.showRefreshClipperMessage, {
				param: "Communicator " + Constants.CommunicationChannels.injectedAndExtension + " caught an error: " + e.message
			});
			// Orphaned web clippers are a handled communicator error, so no further handling is needed here
		});

		this.extCommunicator.subscribeAcrossCommunicator(this.clientInfo, Constants.SmartValueKeys.clientInfo);
	}

	protected initializeEventListeners() {
		// Preserve any onkeydown events the page might have set
		let oldOnKeyDown = document.onkeydown;
		document.onkeydown = (event) => {
			if (event.keyCode === Constants.KeyCodes.esc) {
				this.uiCommunicator.callRemoteFunction(Constants.FunctionKeys.escHandler);
			}
			if (oldOnKeyDown) {
				oldOnKeyDown.call(document, event);
			}
		};

		// Notify the background when we're unloading
		window.onbeforeunload = (event) => {
			this.extCommunicator.callRemoteFunction(Constants.FunctionKeys.unloadHandler);
		};

		// On single-page-app 'navigates' we want to be able to toggle off the Clipper. We don't destroy it completely as it causes
		// the extension to be in a weird state.
		// See: http://stackoverflow.com/questions/4570093/how-to-get-notified-about-changes-of-the-history-via-history-pushstate
		let history: any = window.history;
		history.pushState = function (state) {
			if (typeof history.onpushstate === "function") {
				history.onpushstate({ state: state });
			}
			return history.pushState.apply(history, arguments);
		};
		window.onpopstate = history.onpushstate = (event) => {
			this.uiCommunicator.callRemoteFunction(Constants.FunctionKeys.onSpaNavigate);
		};

		// SPF is a SPA framework that some sites use, e.g., youtube. It sends an spfdone event when the page has 'navigated'.
		document.addEventListener("spfdone", () => {
			this.uiCommunicator.callRemoteFunction(Constants.FunctionKeys.onSpaNavigate);
		});
	}

	protected initializePassthroughCommunicator(extMessageHandlerThunk: () => MessageHandler) {
		if (!this.options.useInlineBackgroundWorker) {
			// Create a link for the extension to pass communication to the ui without having to re-register all the functions, smartValues, etc.
			let passthroughCommunicator = new CommunicatorPassthrough(extMessageHandlerThunk(),
				new IFrameMessageHandler(() => this.frame.contentWindow),
				Constants.CommunicationChannels.extensionAndUi,
				(e: Error) => {
					this.uiCommunicator.callRemoteFunction(Constants.FunctionKeys.showRefreshClipperMessage, {
						param: "Communicator " + Constants.CommunicationChannels.extensionAndUi + " caught an error: " + e.message
					});
					Log.ErrorUtils.handleCommunicatorError(Constants.CommunicationChannels.extensionAndUi, e, this.clientInfo);
				});
		}
	}

	protected initializeUiCommunicator() {
		this.uiCommunicator = new Communicator(new IFrameMessageHandler(() => this.frame.contentWindow), Constants.CommunicationChannels.injectedAndUi);
		this.uiCommunicator.setErrorHandler((e: Error) => {
			Log.ErrorUtils.handleCommunicatorError(Constants.CommunicationChannels.injectedAndUi, e, this.clientInfo);
		});

		this.uiCommunicator.callRemoteFunction(Constants.FunctionKeys.setInjectOptions, { param: this.options });
		this.uiCommunicator.broadcastAcrossCommunicator(this.pageInfo, Constants.SmartValueKeys.pageInfo);

		this.uiCommunicator.subscribeAcrossCommunicator(this.isFullScreen, Constants.SmartValueKeys.isFullScreen, () => {
			this.updateUiSizeAttributes();
		});

		this.uiCommunicator.registerFunction(Constants.FunctionKeys.updateFrameHeight, (newHeight: number) => {
			this.frameHeight = newHeight + Constants.Styles.clipperUiTopRightOffset + (Constants.Styles.clipperUiDropShadowBuffer * 2);
			this.updateUiSizeAttributes();
		});

		this.uiCommunicator.registerFunction(Constants.FunctionKeys.updatePageInfoIfUrlChanged, () => {
			if (document.URL !== this.pageInfo.get().rawUrl) {
				this.updatePageInfo();
			}
			return Promise.resolve();
		});

		this.uiCommunicator.registerFunction(Constants.FunctionKeys.hideUi, () => {
			this.frame.style.display = "none";
		});

		this.uiCommunicator.registerFunction(Constants.FunctionKeys.refreshPage, () => {
			location.reload();
		});
	}

	/**
	 * Creates a PageInfo object from the document data
	 */
	private createPageInfo(): PageInfo {
		let contentType: OneNoteApi.ContentType = DomUtils.getPageContentType(document);

		return {
			canonicalUrl: DomUtils.fetchCanonicalUrl(document),
			contentData: this.getTrimmedDomString(),
			contentLocale: DomUtils.getLocale(document),
			contentTitle: (contentType === OneNoteApi.ContentType.EnhancedUrl) ? DomUtils.getFileNameFromUrl(document) : document.title,
			contentType: contentType,
			rawUrl: document.URL
		} as PageInfo;
	}

	private getTrimmedDomString() {
		const maxPartLength = 2097152;
		let cleanDomEvent: Log.Event.BaseEvent = new Log.Event.BaseEvent(Log.Event.Label.GetCleanDom);

		let fullDomString = DomUtils.getCleanDomOfCurrentPage(document);
		let totalBytes = DomUtils.getByteSize(fullDomString);
		cleanDomEvent.setCustomProperty(Log.PropertyName.Custom.DomSizeInBytes, totalBytes);

		let trimmedString: string = DomUtils.truncateStringToByteSize(fullDomString, maxPartLength);
		let trimmedBytes = DomUtils.getByteSize(trimmedString);
		if (trimmedBytes !== totalBytes) {
			cleanDomEvent.setCustomProperty(Log.PropertyName.Custom.BytesTrimmed, totalBytes - trimmedBytes);
		}

		this.logger.logEvent(cleanDomEvent);
		return trimmedString;
	}

	private overrideTransformStyles(element: HTMLElement) {
		let parentStyles = window.getComputedStyle(element);
		if (parentStyles) {
			if (parentStyles.transform !== "none" || parentStyles.webkitTransform !== "none") {
				element.style.transform = element.style.webkitTransform = "none";
			}
		}
	}

	private sendInvokeOptionsToUi(invokeOptions: InvokeOptions) {
		this.uiCommunicator.callRemoteFunction(Constants.FunctionKeys.setInvokeOptions, {
			param: invokeOptions
		});
	}

	private toggleClipper() {
		if (this.frame.style.display === "none") {
			this.frame.style.display = "";
		}
		this.uiCommunicator.callRemoteFunction(Constants.FunctionKeys.toggleClipper);
	}

	private toScrubbedHtml(content: string): string {
		let divContainer = document.createElement("div");
		divContainer.innerHTML = DomUtils.cleanHtml(content);
		return divContainer.outerHTML;
	}

	private updatePageInfo() {
		this.pageInfo.set(this.createPageInfo());
	}

	private updateUiSizeAttributes() {
		if (this.isFullScreen.get()) {
			this.frame.style.width = "100%";
			this.frame.style.height = "100%";
		} else {
			this.frame.style.width = Constants.Styles.clipperUiWidth + Constants.Styles.clipperUiDropShadowBuffer + Constants.Styles.clipperUiTopRightOffset + "px";
			this.frame.style.height = this.frameHeight + "px";
		}
	}
}
