import {invoke} from "../webExtensionBase/webExtensionPageNavInject";
import {WebExtension} from "../webExtensionBase/webExtension";
import {WebExtensionContentMessageHandler} from "../webExtensionBase/webExtensionMessageHandler";

declare var frameUrl: string;
WebExtension.browser = chrome;

invoke({
	frameUrl: frameUrl,
	extMessageHandlerThunk: () => { return new WebExtensionContentMessageHandler(); }
});
