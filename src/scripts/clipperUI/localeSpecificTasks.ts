import {Rtl} from "../localization/rtl";

import {ClipperStorageKeys} from "../storage/clipperStorageKeys";

/*
 * Responsible for executing locale-specific tasks before initializing and displaying
 * the Clipper.
 */
export class LocaleSpecificTasks {
	public static execute(locale: string): void {
		this.appendDirectionalCssToHead(locale);
	}

	/*
	 * Appends either the LTR or RTL css, whichever is suitable for the given locale
	 */
	private static appendDirectionalCssToHead(locale: string): void {
		let filenamePostfix = Rtl.isRtl(locale) ? "-rtl.css" : ".css";
		let cssFileNames = ["clipper", "sectionPicker"];
		for (let i = 0; i < cssFileNames.length; i++) {
			let clipperCssFilename = cssFileNames[i] + filenamePostfix;
			let clipperCssElem = document.createElement("link");
			clipperCssElem.setAttribute("rel", "stylesheet");
			clipperCssElem.setAttribute("type", "text/css");
			clipperCssElem.setAttribute("href", clipperCssFilename);
			document.getElementsByTagName("head")[0].appendChild(clipperCssElem);
		}
	}
}

let localeOverride: string;
try {
	localeOverride = window.localStorage.getItem(ClipperStorageKeys.displayLanguageOverride);
} catch (e) { }

LocaleSpecificTasks.execute(localeOverride || navigator.language || navigator.userLanguage);
