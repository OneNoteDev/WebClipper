/// <reference path="../../../../typings/main/ambient/chrome/chrome.d.ts"/>

import {ClientType} from "../../clientType";

import {WebExtension} from "../webExtensionBase/webExtension";

WebExtension.browser = chrome;
let clipperBackground = new WebExtension(ClientType.ChromeExtension, {
	debugLoggingInjectUrl: "chromeDebugLoggingInject.js",
	webClipperInjectUrl: "chromeInject.js",
	pageNavInjectUrl: "chromePageNavInject.js"
});
