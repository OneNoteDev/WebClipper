import { ClientType } from "../../clientType";
import { WebExtension } from "../webExtensionBase/webExtension";

/* sendToOffscreenDocument("test-offscreen-document", {}).then((result) => {
	console.log("Result from offscreen document:", result);
}); */

WebExtension.browser = chrome;
let clipperBackground = new WebExtension(ClientType.ChromeExtension, {
	debugLoggingInjectUrl: "chromeDebugLoggingInject.js",
	webClipperInjectUrl: "chromeInject.js",
	pageNavInjectUrl: "chromePageNavInject.js"
});
