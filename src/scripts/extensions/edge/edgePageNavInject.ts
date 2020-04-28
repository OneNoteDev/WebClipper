import {invoke} from "../webExtensionBase/webExtensionPageNavInject";
import {WebExtension} from "../webExtensionBase/webExtension";
import {WebExtensionContentMessageHandler} from "../webExtensionBase/webExtensionMessageHandler";

declare var browser;
declare var frameUrl: string;
WebExtension.browser = ("browser" in window) ? browser : chrome;

invoke({
	frameUrl: frameUrl,
	extMessageHandlerThunk: () => { return new WebExtensionContentMessageHandler(); }
});
