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

interface ScrollData {
	scrollPositions: number[];
	viewportHeight: number;
}

export class FullPageScreenshotHelper {
	public static getFullPageScreenshot(pageInfoContentData: string, pageUrl?: string): Promise<FullPageScreenshotResult> {
		return new Promise<FullPageScreenshotResult>((resolve, reject) => {
			let fullPageScreenshotEvent = new Log.Event.PromiseEvent(Log.Event.Label.FullPageScreenshotCall);
			let correlationId = StringUtils.generateGuid();
			fullPageScreenshotEvent.setCustomProperty(Log.PropertyName.Custom.CorrelationId, correlationId);

			let statusText = Localization.getLocalizedString("WebClipper.ClipType.ScreenShot.ProgressLabel") || "Capturing page...";
			let storageData: any = { fullPageHtmlContent: pageInfoContentData, fullPageStatusText: statusText };
			if (pageUrl) {
				storageData.fullPageBaseUrl = pageUrl;
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

							chrome.storage.session.get(["fullPageScreenshots", "fullPageScrollData"], (stored: any) => {
								let dataUrls: string[] = stored && stored.fullPageScreenshots ? stored.fullPageScreenshots : [];
								let scrollData: ScrollData = stored && stored.fullPageScrollData ? stored.fullPageScrollData : undefined;

								chrome.storage.session.remove([
								"fullPageHtmlContent", "fullPageBaseUrl", "fullPageStatusText",
								"fullPageScreenshots", "fullPageScrollData"
							]);

								if (dataUrls.length > 0) {
									FullPageScreenshotHelper.stitchImages(dataUrls, scrollData).then((imageBlob) => {
										let result: FullPageScreenshotResult = {
											ImageFormat: signal.format || "jpeg",
											ImageBlob: imageBlob,
											ImageWidth: signal.cssWidth
										};

										fullPageScreenshotEvent.setCustomProperty(Log.PropertyName.Custom.FullPageScreenshotContentFound, true);
										Clipper.logger.logEvent(fullPageScreenshotEvent);
										resolve(result);
									}, () => {
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

	/**
	 * Stitches multiple viewport screenshots into a single image, cropping overlaps.
	 * Uses scroll position data to detect where captures overlap (last capture is
	 * typically clamped by the browser, causing duplication with the previous one).
	 */
	private static stitchImages(dataUrls: string[], scrollData: ScrollData): Promise<Blob> {
		return new Promise<Blob>((resolve, reject) => {
			let images: HTMLImageElement[] = [];
			let loaded = 0;

			let onAllLoaded = () => {
				let totalWidth = images[0].naturalWidth;
				let imgHeight = images[0].naturalHeight;

				// Device pixel ratio: captured images may be larger than CSS viewport
				let dpr = scrollData ? imgHeight / scrollData.viewportHeight : 1;

				// Calculate the visible (non-overlapping) portion of each capture
				let slices: { img: HTMLImageElement; srcY: number; height: number }[] = [];

				if (scrollData && scrollData.scrollPositions.length === images.length) {
					let positions = scrollData.scrollPositions;

					for (let i = 0; i < images.length; i++) {
						if (i === 0) {
							// First capture: full image
							slices.push({ img: images[i], srcY: 0, height: imgHeight });
						} else {
							// Calculate overlap in CSS pixels, then scale to image pixels
							let expectedScroll = i * scrollData.viewportHeight;
							let actualScroll = positions[i];
							let overlapCss = expectedScroll - actualScroll;
							let overlapPx = Math.round(overlapCss * dpr);

							if (overlapPx > 0 && overlapPx < imgHeight) {
								// Crop the overlapping top portion
								slices.push({ img: images[i], srcY: overlapPx, height: imgHeight - overlapPx });
							} else {
								slices.push({ img: images[i], srcY: 0, height: imgHeight });
							}
						}
					}
				} else {
					// No scroll data — stitch naively
					for (let i = 0; i < images.length; i++) {
						slices.push({ img: images[i], srcY: 0, height: imgHeight });
					}
				}

				// Calculate total stitched height, capped at 16384px (canvas/API limit)
				let maxCanvasHeight = 16384;
				let totalHeight = 0;
				for (let i = 0; i < slices.length; i++) {
					if (totalHeight + slices[i].height > maxCanvasHeight) {
						slices[i].height = maxCanvasHeight - totalHeight;
						totalHeight = maxCanvasHeight;
						slices.length = i + 1;
						break;
					}
					totalHeight += slices[i].height;
				}

				let canvas = document.createElement("canvas");
				canvas.width = totalWidth;
				canvas.height = totalHeight;
				let ctx = canvas.getContext("2d") as CanvasRenderingContext2D;

				let yOffset = 0;
				for (let i = 0; i < slices.length; i++) {
					let s = slices[i];
					ctx.drawImage(s.img, 0, s.srcY, totalWidth, s.height, 0, yOffset, totalWidth, s.height);
					yOffset += s.height;
				}

				canvas.toBlob(((blob: Blob) => {
					resolve(blob);
				}) as BlobCallback, "image/jpeg", 0.9);
			};

			for (let i = 0; i < dataUrls.length; i++) {
				let img = new Image();
				img.onload = () => {
					loaded++;
					if (loaded === dataUrls.length) {
						onAllLoaded();
					}
				};
				img.onerror = () => {
					reject();
				};
				images.push(img);
				img.src = dataUrls[i];
			}
		});
	}
}
