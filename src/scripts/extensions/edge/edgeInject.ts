import {invoke} from "../webExtensionBase/webExtensionInject";
import {WebExtension} from "../webExtensionBase/webExtension";
import {WebExtensionContentMessageHandler} from "../webExtensionBase/webExtensionMessageHandler";

declare var browser;
declare var frameUrl: string;
WebExtension.browser = ("browser" in window) ? browser : chrome;

invoke({
	frameUrl: frameUrl,
	enableAddANote: true,
	enableEditableTitle: true,
	enableRegionClipping: true,
	extMessageHandlerThunk: () => { return new WebExtensionContentMessageHandler(); }
});
