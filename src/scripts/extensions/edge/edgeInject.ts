import {invoke} from "../webExtensionBase/webExtensionInject";
import {WebExtension} from "../webExtensionBase/webExtension";
import {WebExtensionContentMessageHandler} from "../webExtensionBase/webExtensionMessageHandler";

declare var browser;

/**
 * There is no need to check the window object for the browser property
 * since the window object is no longer available with Manifest V3
 */
WebExtension.browser = chrome;
const frameUrl = WebExtension.browser.runtime.getURL("clipper.html");

invoke({
	frameUrl: frameUrl,
	enableAddANote: true,
	enableEditableTitle: true,
	enableRegionClipping: true,
	extMessageHandlerThunk: () => { return new WebExtensionContentMessageHandler(); }
});
