import {ExtensionBase} from "./extensionBase";

import {BrowserUtils} from "../browserUtils";
import {Constants} from "../constants";
import {ClientType} from "../clientType";

import {Rtl} from "../localization/rtl";

import * as Log from "../logging/log";

declare var bookmarkletRoot: string;

export class UnsupportedBrowserInject {
	private clipperFrame: HTMLIFrameElement;
	private frameHeight = 100;

	public static main() {
		let clipperFrame = document.getElementById(Constants.Ids.clipperUiFrame) as HTMLIFrameElement;
		if (!clipperFrame) {
			let injectBase = new UnsupportedBrowserInject();
		} else {
			clipperFrame.style.display = clipperFrame.style.display === "none" ? "block" : "none";
		}
	}

	constructor() {
		this.logUnsupportedBrowserEvent();
		this.clipperFrame = this.createUnsupportedBrowserFrame();
	}

	private createUnsupportedBrowserFrame() {
		let element = document.createElement("iframe");

		element.id = Constants.Ids.clipperUiFrame;
		element.src = bookmarkletRoot + "/unsupportedBrowser.html";

		let cssText =
			"margin: 0px; padding: 0px; border: 0px currentColor; border-image: none;" +
			"top: 0px; width: 349px; height: 250px; overflow: hidden;" +
			"display: block; position: fixed; z-index: 2147483647; ";
		cssText += Rtl.isRtl(navigator.language || (<any>navigator).userLanguage) ? "left: 0;" : "right: 0;";
		element.style.cssText = cssText;

		// Attach to the body, unless we're in a frameset, then attach to the document itself
		if (document.body.nodeName === "FRAMESET") {
			document.documentElement.appendChild(element);
		} else {
			document.body.appendChild(element);
		}

		// Any CSS "transform"s on the html or body elements break our fixed position, override them so we display properly
		document.documentElement.style.transform = document.documentElement.style.webkitTransform = "none";
		document.body.style.transform = document.body.style.webkitTransform = "none";

		return element;
	}

	private logUnsupportedBrowserEvent() {
		let logData: Log.ErrorUtils.FailureLogEventData = {
			label: Log.Failure.Label.UnsupportedBrowser, // We currently only don't support older versions (<10) of IE
			properties: {
				failureType: Log.Failure.Type.Expected,
				failureInfo: { error: JSON.stringify({ browserVersion: BrowserUtils.ieVersion(), clipperVersion: ExtensionBase.getExtensionVersion(), clientType: ClientType[ClientType.Bookmarklet] }) },
				stackTrace: Log.Failure.getStackTrace()
			}
		};
		Log.ErrorUtils.sendFailureLogRequest(logData);
	}
}
