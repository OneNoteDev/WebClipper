/// <reference path="../../../typings/main/ambient/es6-promise/es6-promise.d.ts"/>
/// <reference path="../../../node_modules/onenoteapi/target/oneNoteApi.d.ts" />

import {Clipper} from "../clipperUI/frontEndGlobals";
import {Status} from "../clipperUI/status";

import {SmartValue} from "../communicator/smartValue";

import * as Log from "../logging/log";

import {Constants} from "../constants";
import {PageInfo} from "../pageInfo";

import {CaptureFailureInfo} from "./captureFailureInfo";

export interface PdfScreenshotResult extends CaptureFailureInfo {
	arrayBuffer?: ArrayBuffer;
	dataUrls?: string[];
}

export class PdfScreenshotHelper {
	public static getLocalPdfData(localFileUrl: string): Promise<PdfScreenshotResult> {
		// Never rejects, interesting
		return new Promise<PdfScreenshotResult>((resolve, reject) => {
			PDFJS.getDocument(localFileUrl).then((pdf) => {
				PdfScreenshotHelper.convertPdfToDataUrls(pdf).then((dataUrls) => {
					resolve({
						dataUrls: dataUrls
					});
				});
			});
		});
	}

	public static getPdfData(url: string): Promise<PdfScreenshotResult> {
		return new Promise<PdfScreenshotResult>((resolve, reject) => {
			let getBinaryEvent = new Log.Event.PromiseEvent(Log.Event.Label.GetBinaryRequest);
			getBinaryEvent.setCustomProperty(Log.PropertyName.Custom.Url, url);

			let request = new XMLHttpRequest();
			request.open("GET", url, true);

			request.responseType = "arraybuffer";

			let errorCallback = (failureInfo: OneNoteApi.RequestError) => {
				getBinaryEvent.setStatus(Log.Status.Failed);
				getBinaryEvent.setFailureInfo(failureInfo);
				Clipper.logger.logEvent(getBinaryEvent);
				reject();
			};

			request.onload = () => {
				if (request.status === 200 && request.response) {
					let arrayBuffer = request.response;

					getBinaryEvent.setCustomProperty(Log.PropertyName.Custom.ByteLength, arrayBuffer.byteLength);
					Clipper.logger.logEvent(getBinaryEvent);

					PDFJS.getDocument(arrayBuffer).then((pdf) => {
						PdfScreenshotHelper.convertPdfToDataUrls(pdf).then((dataUrls) => {
							resolve({
								arrayBuffer: arrayBuffer,
								dataUrls: dataUrls
							});
						});
					});
				} else {
					errorCallback(OneNoteApi.ErrorUtils.createRequestErrorObject(request, OneNoteApi.RequestErrorType.UNEXPECTED_RESPONSE_STATUS));
				}
			};
			request.ontimeout = () => {
				errorCallback(OneNoteApi.ErrorUtils.createRequestErrorObject(request, OneNoteApi.RequestErrorType.REQUEST_TIMED_OUT));
			};
			request.onerror = () => {
				errorCallback(OneNoteApi.ErrorUtils.createRequestErrorObject(request, OneNoteApi.RequestErrorType.NETWORK_ERROR));
			};

			request.send();
		});
	}

	private static convertPdfToDataUrls(pdf: PDFDocumentProxy): Promise<string[]> {
		if (!pdf || !pdf.numPages || pdf.numPages === 0) {
			return Promise.resolve([]);
		}

		let getBinaryEvent = new Log.Event.PromiseEvent(Log.Event.Label.ProcessPdfIntoDataUrls);
		getBinaryEvent.setCustomProperty(Log.PropertyName.Custom.NumPages, pdf.numPages);

		let dataUrls: string[] = new Array(pdf.numPages);

		return new Promise<string[]>((resolve) => {
			for (let i = 0; i < pdf.numPages; i++) {
				// Pages start at index 1
				pdf.getPage(i + 1).then((page) => {
					let viewport = page.getViewport(1 /* scale */);
					let canvas = document.createElement("CANVAS") as HTMLCanvasElement;
					let context = canvas.getContext("2d");
					canvas.height = viewport.height;
					canvas.width = viewport.width;

					let renderContext = {
						canvasContext: context,
						viewport: viewport
					};

					// Rendering is async so results may come back in any order
					page.render(renderContext).then(() => {
						dataUrls[i] = canvas.toDataURL();
						if (PdfScreenshotHelper.isArrayComplete(dataUrls)) {
							getBinaryEvent.stopTimer();
							getBinaryEvent.setCustomProperty(Log.PropertyName.Custom.AverageProcessingDurationPerPage, getBinaryEvent.getDuration() / pdf.numPages);
							Clipper.logger.logEvent(getBinaryEvent);

							resolve(dataUrls);
						}
					});
				});
			}
		});
	}

	// We have to use this instead of Array.prototype.every because it doesn't work
	private static isArrayComplete(arr: string[]): boolean {
		for (let i = 0; i < arr.length; i++) {
			if (!arr[i]) {
				return false;
			}
		}
		return true;
	}
}
