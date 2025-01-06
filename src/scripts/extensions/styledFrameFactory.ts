import {Constants} from "../constants";

import {Rtl} from "../localization/rtl";

export enum Frame {
	WebClipper,
	PageNav
}

/**
 * Responsible for returning pre-styled iframes. Does not deal with ids or srces.
 */
export class StyledFrameFactory {
	public static getStyledFrame(frame: Frame): HTMLIFrameElement {
		switch (frame) {
			case Frame.WebClipper:
				return StyledFrameFactory.getStyledWebClipperFrame();
			default:
			case Frame.PageNav:
				return StyledFrameFactory.getStyledPageNavFrame();
		}
	}

	private static applyGlobalStyles(iframe: HTMLIFrameElement) {
		if (Rtl.isRtl(navigator.language || (<any>navigator).userLanguage)) {
			iframe.style.left = "0px";
			iframe.style.right = "auto";
		} else {
			iframe.style.left = "auto";
			iframe.style.right = "0px";
		}
		iframe.style.top = "0px";
		iframe.style.bottom = "auto";
		iframe.style.border = "none";
		iframe.style.display = "block";
		iframe.style.margin = "0px";
		iframe.style.maxHeight = "none";
		iframe.style.maxWidth = "none";
		iframe.style.minHeight = "0px";
		iframe.style.minWidth = "0px";
		iframe.style.overflow = "hidden";
		iframe.style.padding = "0px";
		iframe.style.position = "fixed";
		iframe.style.transition = "initial";
		iframe.style.zIndex = "2147483647";
		(iframe.style as any).colorScheme = "light";
	}

	private static getGloballyStyledFrame(): HTMLIFrameElement {
		let element = document.createElement("iframe") as HTMLIFrameElement;
		StyledFrameFactory.applyGlobalStyles(element);
		return element;
	}

	private static getStyledPageNavFrame(): HTMLIFrameElement {
		let element = StyledFrameFactory.getGloballyStyledFrame();
		element.style.width = Constants.Styles.clipperUiWidth + Constants.Styles.clipperUiTopRightOffset + Constants.Styles.clipperUiDropShadowBuffer + "px";
		return element;
	}

	private static getStyledWebClipperFrame(): HTMLIFrameElement {
		let element = StyledFrameFactory.getGloballyStyledFrame();
		return element;
	}
}
