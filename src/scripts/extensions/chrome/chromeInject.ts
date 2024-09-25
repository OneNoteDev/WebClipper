import {invoke} from "../webExtensionBase/webExtensionInject";
import {WebExtension} from "../webExtensionBase/webExtension";
import {WebExtensionContentMessageHandler} from "../webExtensionBase/webExtensionMessageHandler";

declare var frameUrl: string;
WebExtension.browser = chrome;

var frameUrl = chrome.runtime.getURL("clipper.html");

invoke({
	frameUrl: frameUrl,
	enableAddANote: true,
	enableEditableTitle: true,
	enableRegionClipping: true,
	extMessageHandlerThunk: () => { return new WebExtensionContentMessageHandler(); }
});
