// This function performs basic filtering and error checking on messages before
// dispatching the message to a more specific message handler.
async function handleResponse(message): Promise<string> {
	// Return early if this message isn't meant for the service worker
	if (message.target !== "service-worker") {
		return;
	}

	// Dispatch the message to an appropriate handler.
	switch (message.type) {
		case "offscreen-document-ready":
		case "hostname-received":
		case "pathname-received":
			return message.data;
		default:
			console.warn(`Unexpected message type received: '${message.type}'.`);
			return;
	}
}

export async function sendToOffscreenDocument(type: string, data: any): Promise<string> {
	const offscreenUrl = chrome.runtime.getURL("chromeOffscreen.html");
	const existingContexts = await chrome.runtime.getContexts({
		contextTypes: [chrome.runtime.ContextType.OFFSCREEN_DOCUMENT],
		documentUrls: [offscreenUrl]
	});

	if (existingContexts.length === 0) {
		await chrome.offscreen.createDocument({
			url: offscreenUrl,
			reasons: [chrome.offscreen.Reason.DOM_PARSER],
			justification: "Parse DOM",
		});
	}

	return await new Promise(resolve => {
		chrome.runtime.sendMessage({
			type: type,
			target: "offscreen",
			data: data
		}, (message) => {
			handleResponse(message).then((result) => {
				chrome.offscreen.closeDocument();
				resolve(result);
			});
		});
	});
}
