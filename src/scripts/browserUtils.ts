export module BrowserUtils {
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
}
