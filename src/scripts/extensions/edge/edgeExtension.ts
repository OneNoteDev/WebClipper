import {ClientType} from "../../clientType";

import {WebExtension} from "../webExtensionBase/webExtension";

declare var browser;

/**
 * There is no need to check the window object for the browser property
 * since the window object is no longer available with Manifest V3
 */
WebExtension.browser = chrome;
WebExtension.offscreenUrl = chrome.runtime.getURL("offscreen.html");

let clipperBackground = new WebExtension(ClientType.EdgeExtension, {
	debugLoggingInjectUrl: "edgeDebugLoggingInject.js",
	webClipperInjectUrl: "edgeInject.js",
	pageNavInjectUrl: "edgePageNavInject.js"
});
