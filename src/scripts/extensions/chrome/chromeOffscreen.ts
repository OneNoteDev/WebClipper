import {OffscreenMessageTypes} from "../../communicator/offscreenMessageTypes";

// Registering this listener when the script is first executed ensures that the
// offscreen document will be able to receive messages when the promise returned
// by `offscreen.createDocument()` resolves.
chrome.runtime.onMessage.addListener(handleMessages);

// This function performs basic filtering and error checking on messages before
// dispatching the message to a more specific message handler.
async function handleMessages(message, sender, sendResponse) {
	message = JSON.parse(message);
	// Return early if this message isn't meant for the offscreen document.
	if (message.target !== "offscreen") {
		return false;
	}

	// Dispatch the message to an appropriate handler.
	switch (message.type) {
		case OffscreenMessageTypes.getFromLocalStorage:
			sendToServiceWorker(
				OffscreenMessageTypes.getFromLocalStorageResponse,
				window.localStorage.getItem(message.data.key),
				sendResponse
			);
			break;
		case OffscreenMessageTypes.setToLocalStorage:
			window.localStorage.setItem(message.data.key, message.data.value);
			sendToServiceWorker(
				OffscreenMessageTypes.setToLocalStorageResponse,
				"SUCCESS",
				sendResponse
			);
			break;
		case OffscreenMessageTypes.removeFromLocalStorage:
			window.localStorage.removeItem(message.data.key);
			sendToServiceWorker(
				OffscreenMessageTypes.removeFromLocalStorageResponse,
				"SUCCESS",
				sendResponse
			);
			break;
		case OffscreenMessageTypes.getHostname:
			sendToServiceWorker(
				OffscreenMessageTypes.getHostnameResponse,
				getHostname(message.data.url),
				sendResponse
			);
			break;
		case OffscreenMessageTypes.getPathname:
			sendToServiceWorker(
				OffscreenMessageTypes.getPathnameResponse,
				getPathname(message.data.url),
				sendResponse
			);
			break;
		default:
			console.warn(`Unexpected message type received: '${message.type}'.`);
			return false;
	}
}

function getHostname(url: string): string {
	let l = document.createElement("a");
	l.href = url;
	return l.protocol + "//" + l.host + "/";
}

function getPathname(url: string): string {
	let l = document.createElement("a");
	l.href = url;

	return l.pathname;
}

function sendToServiceWorker(type: string, data: string, sendResponse: (response: any) => void) {
	sendResponse(JSON.stringify({
		type,
		target: "service-worker",
		data
	}));
}
