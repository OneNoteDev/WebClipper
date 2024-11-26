// This function performs basic filtering and error checking on messages before

import { WebExtension } from "../extensions/webExtensionBase/webExtension";

// dispatching the message to a more specific message handler.
async function handleResponse(message): Promise<string> {
	// Return early if this message isn't meant for the service worker
	if (message.target !== "service-worker") {
		return;
	}

	// Dispatch the message to an appropriate handler.
	switch (message.type) {
		case "local-storage-value-received":
		case "hostname-received":
		case "pathname-received":
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

	if (existingContexts.length === 0) {
		await WebExtension.browser.offscreen.createDocument({
			url: WebExtension.offscreenUrl,
			reasons: [WebExtension.browser.offscreen.Reason.DOM_PARSER],
			justification: "Parse DOM",
		});
	}

	return await new Promise(resolve => {
		WebExtension.browser.runtime.sendMessage({
			type: type,
			target: "offscreen",
			data: data
		}, (message) => {
			handleResponse(message).then((result) => {
				WebExtension.browser.offscreen.closeDocument();
				resolve(result);
			});
		});
	});
}
