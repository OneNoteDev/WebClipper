import {Constants} from "../../constants";
import {ClipperInject, ClipperInjectOptions} from "../clipperInject";
import {ContextItemParameter, ContextType} from "./safariContext";
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
		if (event.name === Constants.FunctionKeys.invokeClipper) {
			let options: ClipperInjectOptions = {
				frameUrl: event.message,
				enableAddANote: true,
				enableEditableTitle: true,
				enableRegionClipping: true,
				extMessageHandlerThunk: () => {
					return new SafariContentMessageHandler();
				}
			};
			ClipperInject.main(options);
		}
	});

	// Send 'what the user clicked on' back to the extension's contextmenu event
	document.addEventListener("contextmenu", (event: Event) => {
		let objToSend: ContextItemParameter;
		if (!window.getSelection().isCollapsed) {
			objToSend = {
				type: ContextType.Selection,
				parameters: {}
			};
		} else if (event.target && (<Node>event.target).nodeName === "IMG") {
			let node = event.target as HTMLImageElement;
			objToSend = {
				type: ContextType.Img,
				parameters: {
					src: node.src
				}
			};
		}

		if (objToSend) {
			// You can only set one user info context object, and it can not be an object!
			safari.self.tab.setContextMenuEventUserInfo(event, JSON.stringify(objToSend));
		}
	}, false);
}
