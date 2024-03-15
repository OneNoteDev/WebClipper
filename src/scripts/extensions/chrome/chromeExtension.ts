import {ClientType} from "../../clientType";

import {WebExtension} from "../webExtensionBase/webExtension";

function sendMessageToContentScript(tabs, msg) {
	if (tabs.length > 0) {
		chrome.tabs.sendMessage(tabs[0].id, { bMessage: msg }, function (response) {
			console.log(response.cMessage);
		});
	}
}

let port = chrome.runtime.connectNative('com.microsoft.onenote.stickynotes');

port.onMessage.addListener((response) => {
	console.log('Received from native application: ' + JSON.stringify(response));
	console.log('window.location.href as known to the current background script is: ' + window.location.href);
	/**
	 * This is a background script and cannot access the DOM of the current page.
	 * To access the DOM of the current page, we need to send a message to the
	 * content script.
	 */
	chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
		console.log('Getting window.location.href from content script...');
		sendMessageToContentScript(tabs, "GET_WINDOW_LOCATION_HREF");
		console.log('Getting video id from content script...');
		sendMessageToContentScript(tabs, "GET_VIDEO_ID");
		console.log('Getting stream player from content script...');
		sendMessageToContentScript(tabs, "GET_STREAM_PLAYER");
	});
  

});

port.onDisconnect.addListener(() => {
  console.log('Disconnected');
});

// let message = { text: 'Hello from the extension!' };
// port.postMessage(message);

WebExtension.browser = chrome;
let clipperBackground = new WebExtension(ClientType.ChromeExtension, {
	debugLoggingInjectUrl: "chromeDebugLoggingInject.js",
	webClipperInjectUrl: "chromeInject.js",
	pageNavInjectUrl: "chromePageNavInject.js"
});
