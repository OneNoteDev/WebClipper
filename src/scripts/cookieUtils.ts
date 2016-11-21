import {ObjectUtils} from "./objectUtils";

export module CookieUtils {
	export function readCookie(cookieName: string, doc?: Document) {
		if (ObjectUtils.isNullOrUndefined(doc)) {
			doc = document;
		}

		let cookieKVPairs: string[][] = document.cookie.split(";").map(kvPair => kvPair.split("="));

		for (let cookie of cookieKVPairs) {
			if (cookie[0].trim() === cookieName) {
				return cookie[1].trim();
			}
		}
	}
}
