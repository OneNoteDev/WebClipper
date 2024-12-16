import {Localization} from "../localization/localization";
import { WebExtension } from "./webExtensionBase/webExtension";

export class InjectHelper {
	private static uninjectableUrlRegexes: RegExp[] = [
		/^about:/
	];

	public static alertUserOfUnclippablePage() {
		/*WebExtension.browser.notifications.create({
			type: "basic",
			iconUrl: "/icons/icon-48.png",
			title: Localization.getLocalizedString("WebClipper.Notification.Title"),
			message: Localization.getLocalizedString("WebClipper.Error.CannotClipPage"),
			priority: 1
			});*/
	}

	public static isKnownUninjectablePage(url: string): boolean {
		if (!url) {
			return false;
		}

		for (let i = 0; i < InjectHelper.isKnownUninjectablePage.length; i++) {
			if (InjectHelper.uninjectableUrlRegexes[i].test(url)) {
				return true;
			}
		}
		return false;
	}
}
