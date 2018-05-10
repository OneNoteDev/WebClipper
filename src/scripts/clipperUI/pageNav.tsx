import {Communicator} from "../communicator/communicator";
import {IFrameMessageHandler} from "../communicator/iframeMessageHandler";
import {Constants} from "../constants";
import {Localization} from "../localization/localization";
import {CommunicatorLoggerPure} from "../logging/communicatorLoggerPure";
import * as Log from "../logging/log";
import {NewHeightInfo} from "./animations/slidingHeightAnimationStrategy";
import {ComponentBase} from "./componentBase";
import {Clipper} from "./frontEndGlobals";
import {TooltipRenderer} from "./tooltipRenderer";
import {TooltipType} from "./tooltipType";

export interface PageNavState {
	tooltipToRender?: TooltipType;
	tooltipProps?: any;
}

/**
 * Root component of the Page Nav experience. Has the responsibility of initialization, and does not
 * render any UI itself.
 */
class PageNavClass extends ComponentBase<PageNavState, {}> {
	constructor(props: {}) {
		super(props);
		this.initializeCommunicators();
		this.setFrontLoadedLocalizedStrings();
		this.getAndStoreDataFromExtension();
	}

	getInitialState(): PageNavState {
		return {};
	}

	onClosePageNavButton() {
		let closeEvent = new Log.Event.BaseEvent(Log.Event.Label.ClosePageNavTooltip);
		closeEvent.setCustomProperty(Log.PropertyName.Custom.PageNavTooltipType, this.state.tooltipToRender ? TooltipType[this.state.tooltipToRender] : "unknown");
		Clipper.logger.logEvent(closeEvent);
	}

	render() {
		return (
			<TooltipRenderer
				onCloseButtonHandler={this.onClosePageNavButton.bind(this)}
				onHeightChange={this.updateFrameHeight.bind(this)}
				onTooltipClose={this.closePageNav.bind(this)}
				tooltipToRender={this.state.tooltipToRender}
				tooltipProps={this.state.tooltipProps}/>
		);
	}

	private closePageNav() {
		Clipper.getInjectCommunicator().callRemoteFunction(Constants.FunctionKeys.closePageNavTooltip);
	}

	private getAndStoreDataFromExtension() {
		Clipper.getExtensionCommunicator().callRemoteFunction(Constants.FunctionKeys.getTooltipToRenderInPageNav, {
			callback: (tooltipType: TooltipType) => {
				this.setState({tooltipToRender: tooltipType});
			}
		});
		Clipper.getExtensionCommunicator().callRemoteFunction(Constants.FunctionKeys.getPageNavTooltipProps, {
			callback: (tooltipProps: any) => {
				this.setState({tooltipProps: tooltipProps});
			}
		});
	}

	private initializeCommunicators() {
		Clipper.setInjectCommunicator(new Communicator(new IFrameMessageHandler(() => parent), Constants.CommunicationChannels.pageNavInjectedAndPageNavUi));
		Clipper.setExtensionCommunicator(new Communicator(new IFrameMessageHandler(() => parent), Constants.CommunicationChannels.extensionAndPageNavUi));
		Clipper.logger = new CommunicatorLoggerPure(Clipper.getExtensionCommunicator());
	}

	private setFrontLoadedLocalizedStrings() {
		Clipper.getExtensionCommunicator().callRemoteFunction(Constants.FunctionKeys.clipperStringsFrontLoaded, {
			callback: (locStringsObj) => {
				Localization.setLocalizedStrings(locStringsObj);
			}
		});
	}

	private updateFrameHeight(newHeightInfo: NewHeightInfo) {
		Clipper.getInjectCommunicator().callRemoteFunction(Constants.FunctionKeys.updateFrameHeight, {
			param: newHeightInfo.newContainerHeight
		});
	}
}

// Catch any unhandled exceptions and log them
let oldOnError = window.onerror;
window.onerror = (message: string, filename?: string, lineno?: number, colno?: number, error?: Error) => {
	let callStack = error ? Log.Failure.getStackTrace(error) : "[unknown stacktrace]";

	Clipper.logger.logFailure(Log.Failure.Label.UnhandledExceptionThrown, Log.Failure.Type.Unexpected,
		{error: message + " (" + filename + ":" + lineno + ":" + colno + ") at " + callStack}, "PageNavUI");

	if (oldOnError) {
		oldOnError(message, filename, lineno, colno, error);
	}
};

let component = PageNavClass.componentize();
m.mount(document.getElementById("pageNavUIPlaceholder"), component);
export {component as PageNav}
