import {Localization} from "../localization/localization";

export class InjectHelper {
	private static uninjectableUrlRegexes: RegExp[] = [
		/^about:/
	];

	public static alertUserOfUnclippablePage() {
		alert(Localization.getLocalizedString("WebClipper.Error.CannotClipPage"));
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
