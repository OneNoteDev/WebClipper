import {WebExtension} from "./webExtension";

type ButtonListener = (notificationId: string, buttonIndex: number) => void;

export class WebExtensionNotifications {
	private static buttonListener: ButtonListener;

	public static setButtonListener(buttonListener: ButtonListener): void {
		WebExtensionNotifications.removeButtonListener();
		WebExtensionNotifications.buttonListener = buttonListener;
		WebExtension.browser.notifications.onButtonClicked.addListener(buttonListener);
	}

	public static removeButtonListener(): void {
		if (WebExtensionNotifications.buttonListener) {
			WebExtension.browser.notifications.onButtonClicked.removeListener(WebExtensionNotifications.buttonListener);
			WebExtensionNotifications.buttonListener = undefined;
		}
	}
}
