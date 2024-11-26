import { ClientType } from "../../clientType";
import { WebExtension } from "../webExtensionBase/webExtension";

WebExtension.browser = chrome;
WebExtension.offscreenUrl = chrome.runtime.getURL("chromeOffscreen.html");
let clipperBackground = new WebExtension(ClientType.ChromeExtension, {
	debugLoggingInjectUrl: "chromeDebugLoggingInject.js",
	webClipperInjectUrl: "chromeInject.js",
	pageNavInjectUrl: "chromePageNavInject.js"
});
