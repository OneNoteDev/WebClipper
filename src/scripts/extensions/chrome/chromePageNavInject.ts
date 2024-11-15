import {invoke} from "../webExtensionBase/webExtensionPageNavInject";
import {WebExtension} from "../webExtensionBase/webExtension";
import {WebExtensionContentMessageHandler} from "../webExtensionBase/webExtensionMessageHandler";

WebExtension.browser = chrome;

const frameUrl = WebExtension.browser.runtime.getURL("pageNav.html");

invoke({
	frameUrl: frameUrl,
	extMessageHandlerThunk: () => { return new WebExtensionContentMessageHandler(); }
});
