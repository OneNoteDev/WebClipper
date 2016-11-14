export module BrowserUtils {
	export function appendHiddenIframeToDocument(url: string) {
		let iframe = document.createElement("iframe");
		iframe.hidden = true;
		iframe.style.display = "none";
		iframe.src = url;
		document.body.appendChild(iframe);
	}

	/**
	 * Checks if the browser is unsupported by the Web Clipper, i.e., IE 9 and below.
	 *
	 * @return true if the the browser is supported by the Web Clipper; false otherwise
	 */
	export function browserNotSupported(): boolean {
		// Does not exist on IE8 and below
		if (!window.addEventListener) {
			return true;
		}

		// IE9
		if (navigator.appVersion.indexOf("MSIE 9") >= 0) {
			return true;
		}

		return false;
	}

	/**
	 * Assuming the caller is from IE, returns the browser version
	 */
	export function ieVersion(): string {
		let ua = window.navigator.userAgent;

		let msieIndex = ua.indexOf("MSIE ");
		if (msieIndex >= 0) {
			// IE 10 or older
			return "IE" + ua.substring(msieIndex + 5, ua.indexOf(".", msieIndex));
		}

		if (ua.indexOf("Trident/") >= 0) {
			// IE 11
			let rvIndex = ua.indexOf("rv:");
			return "IE" + ua.substring(rvIndex + 3, ua.indexOf(".", rvIndex));
		}

		if (ua.indexOf("Edge/") >= 0) {
			// Edge (IE 12+) => return version number
			return "Edge";
		}

		return undefined;
	}

	export function openPopupWindow(url: string, popupWidth = 1000, popupHeight = 700): Window {
		let leftPosition: number = (screen.width) ? (screen.width - popupWidth) / 2 : 0;
		let topPosition: number = (screen.height) ? (screen.height - popupHeight) / 2 : 0;

		let settings: string =
			"height=" + popupHeight +
			",width=" + popupWidth +
			",top=" + topPosition +
			",left=" + leftPosition +
			",scrollbars=yes,resizable=yes,location=no,menubar=no,status=yes,titlebar=no,toolbar=no";

		return window.open(url, "_blank", settings);
	}
}
