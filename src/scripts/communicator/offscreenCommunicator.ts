import {WebExtension} from "../extensions/webExtensionBase/webExtension";
import {OffscreenMessageTypes} from "./offscreenMessageTypes";

let creating: Promise<void>; // A global promise to avoid concurrency issues

// This function performs basic filtering and error checking on messages before
// dispatching the message to a more specific message handler.
async function handleResponse(message): Promise<string> {
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
	const existingContexts = await WebExtension.browser.runtime.getContexts({
		contextTypes: [WebExtension.browser.runtime.ContextType.OFFSCREEN_DOCUMENT],
		documentUrls: [WebExtension.offscreenUrl]
	});

	if (creating) {
		await creating;
	} else if (existingContexts.length === 0) {
		creating = WebExtension.browser.offscreen.createDocument({
			url: WebExtension.offscreenUrl,
			reasons: [WebExtension.browser.offscreen.Reason.DOM_PARSER],
			justification: "Parse DOM",
		});
		await creating;
		creating = undefined;
	}

	return new Promise<string>(resolve => {
		WebExtension.browser.runtime.sendMessage({
			type: type,
			target: "offscreen",
			data: data
		}, (message) => {
			handleResponse(message).then((result) => {
				/**
				 * Commenting out the following line in order to always keep 1 offscreen document open
				 * so as to avoid concurrency issues with multiple offscreen documents.
				 * TODO: Investigate if there is a better way to handle concurrency issues.
				 */
				// WebExtension.browser.offscreen.closeDocument();
				resolve(result);
			});
		});
	});
}
