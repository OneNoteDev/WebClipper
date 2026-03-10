import {OffscreenMessageTypes} from "./offscreenMessageTypes";

let creating: Promise<void>; // A global promise to avoid concurrency issues

// Use chrome API directly — WebExtension.browser is only initialized in the
// service worker context, but this module is also imported by the clipper UI.
let offscreenUrl = chrome.runtime.getURL("offscreen.html");

// This function performs basic filtering and error checking on messages before
// dispatching the message to a more specific message handler.
async function handleResponse(message): Promise<string> {
	message = JSON.parse(message);
	// Return early if this message isn't meant for the service worker
	if (message.target !== "service-worker") {
		return;
	}

	// Dispatch the message to an appropriate handler.
	switch (message.type) {
		case OffscreenMessageTypes.getFromLocalStorageResponse:
		case OffscreenMessageTypes.setToLocalStorageResponse:
		case OffscreenMessageTypes.removeFromLocalStorageResponse:
		case OffscreenMessageTypes.getHostnameResponse:
		case OffscreenMessageTypes.getPathnameResponse:
			return message.data;
		default:
			console.warn(`Unexpected message type received: '${message.type}'.`);
			return;
	}
}

export async function sendToOffscreenDocument(type: string, data: any): Promise<string> {
	// Access newer Chrome APIs via runtime references to avoid hardcoded strings
	let chromeRuntime = chrome.runtime as any;
	let chromeOffscreen = (chrome as any).offscreen;

	const existingContexts = await chromeRuntime.getContexts({
		contextTypes: [chromeRuntime.ContextType.OFFSCREEN_DOCUMENT],
		documentUrls: [offscreenUrl]
	});

	if (creating) {
		await creating;
	} else if (existingContexts.length === 0) {
		creating = chromeOffscreen.createDocument({
			url: offscreenUrl,
			reasons: [chromeOffscreen.Reason.DOM_PARSER],
			justification: "Parse DOM",
		});
		await creating;
		creating = undefined;
	}

	return new Promise<string>(resolve => {
		chrome.runtime.sendMessage(JSON.stringify({
			type: type,
			target: "offscreen",
			data: data
		}), (message) => {
			handleResponse(message).then((result) => {
				resolve(result);
			});
		});
	});
}
