import {invoke} from "../webExtensionBase/webExtensionPageNavInject";
import {WebExtension} from "../webExtensionBase/webExtension";
import {WebExtensionContentMessageHandler} from "../webExtensionBase/webExtensionMessageHandler";

declare var browser;
WebExtension.browser = ("browser" in window) ? browser : chrome;

const frameUrl = WebExtension.browser.runtime.getURL("pageNav.html");

invoke({
	frameUrl: frameUrl,
	extMessageHandlerThunk: () => { return new WebExtensionContentMessageHandler(); }
});
