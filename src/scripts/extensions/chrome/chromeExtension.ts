import {ClientType} from "../../clientType";

import {WebExtension} from "../webExtensionBase/webExtension";

function sendMessageToContentScript(tabs, msg) {
	if (tabs.length > 0) {
		chrome.tabs.sendMessage(tabs[0].id, { bMessage: msg }, function (response) {
			if (msg === "GET_ALL") {
				sendMessageToNativeApplication(response);
			} else {
				console.log(response.cMessage);
			}
		});
	}
}

/****** START CODE TO COMMUNICATE BETWEEN EXTENSION AND NATIVE APPLICATION ******/

let hostName = 'com.microsoft.onenote.stickynotes';
let port = chrome.runtime.connectNative(hostName);

function sendMessageToNativeApplication(msg) {
	port.postMessage(msg);
}

port.onMessage.addListener((response) => {
	console.log('Received from native application: ' + JSON.stringify(response));
	console.log('window.location.href as known to the current background script is: ' + window.location.href);
	/****** START CODE TO COMMUNICATE BETWEEN BACKGROUND AND CONTENT SCRIPTS ******/
	/**
	 * This is a background script and cannot access the DOM of the current page.
	 * To access the DOM of the current page, we need to send a message to the
	 * content script.
	 */
	chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
		console.log('Getting youtube url from content script...');
		sendMessageToContentScript(tabs, "GET_YOUTUBE_URL");
		console.log('Getting video id from content script...');
		sendMessageToContentScript(tabs, "GET_VIDEO_ID");
		console.log('Getting stream player from content script...');
		sendMessageToContentScript(tabs, "GET_STREAM_PLAYER");
		console.log('Getting all details from content script and sending back to native application...');
		sendMessageToContentScript(tabs, "GET_ALL");
	});
	/****** END CODE TO COMMUNICATE BETWEEN BACKGROUND AND CONTENT SCRIPTS ******/
});

port.onDisconnect.addListener(() => {
  console.log('Disconnected');
});

/****** END CODE TO COMMUNICATE BETWEEN EXTENSION AND NATIVE APPLICATION ******/

WebExtension.browser = chrome;
let clipperBackground = new WebExtension(ClientType.ChromeExtension, {
	debugLoggingInjectUrl: "chromeDebugLoggingInject.js",
	webClipperInjectUrl: "chromeInject.js",
	pageNavInjectUrl: "chromePageNavInject.js"
});
