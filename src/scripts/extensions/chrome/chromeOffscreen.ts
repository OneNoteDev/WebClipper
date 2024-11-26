// Registering this listener when the script is first executed ensures that the
// offscreen document will be able to receive messages when the promise returned
// by `offscreen.createDocument()` resolves.
chrome.runtime.onMessage.addListener(handleMessages);

// This function performs basic filtering and error checking on messages before
// dispatching the message to a more specific message handler.
async function handleMessages(message, sender, sendResponse) {
	// Return early if this message isn't meant for the offscreen document.
	if (message.target !== "offscreen") {
		return false;
	}

	// Dispatch the message to an appropriate handler.
	switch (message.type) {
		case "get-from-local-storage":
			sendToServiceWorker(
				"offscreen-document-ready",
				window.localStorage.getItem(message.data.key),
				sendResponse
			);
			break;
		case "get-hostname":
			sendToServiceWorker(
				"hostname-received",
				getHostname(message.data.url),
				sendResponse
			);
			break;
		case "get-pathname":
			sendToServiceWorker(
				"pathname-received",
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
	sendResponse({
		type,
		target: "service-worker",
		data
	});
}
