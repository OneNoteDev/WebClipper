import {Constants} from "../../constants";

import {MessageHandler} from "../../communicator/messageHandler";

import {DebugLoggingInject} from "../debugLoggingInject";

import {SafariContentMessageHandler} from "./safariMessageHandler";

declare var safari;

/*
 * Since there is no way for a Safari Extension to inject scripts On Demand,
 * this code is injected into every page, and waits for a command from the extension
 * to execute the code
 */

// This is injected into every page loaded (including frames), but we only want to set the listener on the main document
if (window.top === window) {
	safari.self.addEventListener("message", (event) => {
		if (event.name === Constants.FunctionKeys.invokeDebugLogging) {
			let extMessageHandlerThunk: () => MessageHandler =
				() => { return new SafariContentMessageHandler(); };
			DebugLoggingInject.main({ extMessageHandlerThunk: extMessageHandlerThunk });
		}
	});
}
