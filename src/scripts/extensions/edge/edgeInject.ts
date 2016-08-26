import {invoke} from "../webExtensionBase/webExtensionInject";
import {WebExtension} from "../webExtensionBase/webExtension";
import {WebExtensionContentMessageHandler} from "../webExtensionBase/webExtensionMessageHandler";

declare var browser;
declare var frameUrl: string;
WebExtension.browser = browser;

invoke({
	frameUrl: frameUrl,
	enableAddANote: true,
	enableEditableTitle: true,
	enableRegionClipping: false,
	extMessageHandlerThunk: () => { return new WebExtensionContentMessageHandler(); }
});
