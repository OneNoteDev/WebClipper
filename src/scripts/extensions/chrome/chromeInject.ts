import {invoke} from "../webExtensionBase/webExtensionInject";
import {WebExtension} from "../webExtensionBase/webExtension";
import {WebExtensionContentMessageHandler} from "../webExtensionBase/webExtensionMessageHandler";

WebExtension.browser = chrome;

const frameUrl = WebExtension.browser.runtime.getURL("clipper.html");

invoke({
	frameUrl: frameUrl,
	enableAddANote: true,
	enableEditableTitle: true,
	enableRegionClipping: true,
	extMessageHandlerThunk: () => { return new WebExtensionContentMessageHandler(); }
});
