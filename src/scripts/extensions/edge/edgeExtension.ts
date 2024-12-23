import {ClientType} from "../../clientType";

import {WebExtension} from "../webExtensionBase/webExtension";

declare var browser;

WebExtension.browser = chrome;
WebExtension.offscreenUrl = chrome.runtime.getURL("chromeOffscreen.html");

let clipperBackground = new WebExtension(ClientType.EdgeExtension, {
	debugLoggingInjectUrl: "edgeDebugLoggingInject.js",
	webClipperInjectUrl: "edgeInject.js",
	pageNavInjectUrl: "edgePageNavInject.js"
});
