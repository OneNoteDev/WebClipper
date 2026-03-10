import {Clipper} from "../clipperUI/frontEndGlobals";

import * as Log from "../logging/log";

import {Constants} from "../constants";
import {Localization} from "../localization/localization";
import {StringUtils} from "../stringUtils";

import {CaptureFailureInfo} from "./captureFailureInfo";

export interface FullPageScreenshotResult extends CaptureFailureInfo {
	ImageFormat?: string;
	ImageBlob?: Blob;
	ImageWidth?: number;
}

export class FullPageScreenshotHelper {
	public static getFullPageScreenshot(pageInfoContentData: string, pageUrl?: string, stylesheetCache?: { [url: string]: { cssText: string; media: string } }): Promise<FullPageScreenshotResult> {
		return new Promise<FullPageScreenshotResult>((resolve, reject) => {
			let fullPageScreenshotEvent = new Log.Event.PromiseEvent(Log.Event.Label.FullPageScreenshotCall);
			let correlationId = StringUtils.generateGuid();
			fullPageScreenshotEvent.setCustomProperty(Log.PropertyName.Custom.CorrelationId, correlationId);

			let storageData: any = {
				fullPageHtmlContent: pageInfoContentData,
				fullPageStatusText: Localization.getLocalizedString("WebClipper.ClipType.ScreenShot.ProgressLabel") || "Capturing page...",
				fullPageStrings: {
					clipperTitle: Localization.getLocalizedString("WebClipper.Label.OneNoteWebClipper") || "OneNote Web Clipper",
					capturing: Localization.getLocalizedString("WebClipper.ClipType.ScreenShot.ProgressLabel") || "Capturing page...",
					cancel: Localization.getLocalizedString("WebClipper.Action.Cancel") || "Cancel",
					close: Localization.getLocalizedString("WebClipper.Action.CloseTheClipper") || "Close",
					captureComplete: Localization.getLocalizedString("WebClipper.ClipType.ScreenShot.Button") || "Capture complete",
					saveToOneNote: Localization.getLocalizedString("WebClipper.Action.ViewInOneNote") || "Save to OneNote",
					viewportProgress: Localization.getLocalizedString("WebClipper.ClipType.ScreenShot.IncrementalProgress") || "Capturing {0} of {1}...",
					saving: Localization.getLocalizedString("WebClipper.ClipType.ScreenShot.Saving") || "Saving..."
				}
			};
			if (pageUrl) {
				storageData.fullPageBaseUrl = pageUrl;
			}
			if (stylesheetCache) {
				storageData.fullPageStylesheets = stylesheetCache;
			}

			chrome.storage.session.set(storageData, () => {
				Clipper.getExtensionCommunicator().callRemoteFunction(
					Constants.FunctionKeys.takeFullPageScreenshot, {
						callback: (signal: any) => {
							if (!signal || !signal.success) {
								fullPageScreenshotEvent.setCustomProperty(Log.PropertyName.Custom.FullPageScreenshotContentFound, false);
								Clipper.logger.logEvent(fullPageScreenshotEvent);
								reject();
								return;
							}

							// Read single final JPEG from session storage (stitched by renderer)
							chrome.storage.session.get(["fullPageFinalImage"], (stored: any) => {
								chrome.storage.session.remove([
									"fullPageHtmlContent", "fullPageBaseUrl", "fullPageStatusText",
									"fullPageFinalImage", "fullPageStylesheets", "fullPageStrings"
								]);

								let dataUrl: string = stored && stored.fullPageFinalImage ? stored.fullPageFinalImage : "";

								if (dataUrl) {
									// Convert data URL to Blob
									fetch(dataUrl).then(function(r) { return r.blob(); }).then(function(imageBlob) {
										let result: FullPageScreenshotResult = {
											ImageFormat: signal.format || "jpeg",
											ImageBlob: imageBlob,
											ImageWidth: signal.cssWidth
										};

										fullPageScreenshotEvent.setCustomProperty(Log.PropertyName.Custom.FullPageScreenshotContentFound, true);
										Clipper.logger.logEvent(fullPageScreenshotEvent);
										resolve(result);
									}, function() {
										fullPageScreenshotEvent.setCustomProperty(Log.PropertyName.Custom.FullPageScreenshotContentFound, false);
										Clipper.logger.logEvent(fullPageScreenshotEvent);
										reject();
									});
								} else {
									fullPageScreenshotEvent.setCustomProperty(Log.PropertyName.Custom.FullPageScreenshotContentFound, false);
									Clipper.logger.logEvent(fullPageScreenshotEvent);
									reject();
								}
							});
						}
					}
				);
			});
		});
	}
}
