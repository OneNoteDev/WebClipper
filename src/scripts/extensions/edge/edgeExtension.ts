import {ClientType} from "../../clientType";

import {WebExtension} from "../webExtensionBase/webExtension";

declare var browser;

WebExtension.browser = ("browser" in window) ? browser : chrome;

let clipperBackground = new WebExtension(ClientType.EdgeExtension, {
	debugLoggingInjectUrl: "edgeDebugLoggingInject.js",
	webClipperInjectUrl: "edgeInject.js",
	pageNavInjectUrl: "edgePageNavInject.js"
});
