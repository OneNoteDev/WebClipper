import {Constants} from "../../constants";
import {FrameInjectOptions} from "../injectOptions";
import {PageNavInject} from "../pageNavInject";
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
		if (event.name === Constants.FunctionKeys.invokePageNav) {
			let options: FrameInjectOptions = {
				frameUrl: event.message,
				extMessageHandlerThunk: () => {
					return new SafariContentMessageHandler();
				}
			};
			PageNavInject.main(options);
		}
	});
}
