/// <reference path="../../../node_modules/onenoteapi/target/oneNoteApi.d.ts" />

import {Clipper} from "../clipperUI/frontEndGlobals";
import {Status} from "../clipperUI/status";

import {SmartValue} from "../communicator/smartValue";

import * as Log from "../logging/log";

import {Constants} from "../constants";
import {PageInfo} from "../pageInfo";

import {CaptureFailureInfo} from "./captureFailureInfo";

export type ViewportDimensions = {
	height: number;
	width: number;
}

export interface PdfScreenshotResult extends CaptureFailureInfo {
	pdf?: PDFDocumentProxy;
	viewportDimensions?: ViewportDimensions[];
}

export class PdfScreenshotHelper {
	public static getLocalPdfData(localUrl: string): Promise<PdfScreenshotResult> {
		return PdfScreenshotHelper.getPdfScreenshotResult(localUrl);
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

					PdfScreenshotHelper.getPdfScreenshotResult(arrayBuffer).then((pdfScreenshotResult) => {
						resolve(pdfScreenshotResult);
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

	public static getDataUrlsForPdfPageRange(pdf: PDFDocumentProxy, pageNumbers: number[]): Promise<string[]> {
		let numPages = pageNumbers.length;
		let dataUrls = new Array(numPages);
		return new Promise<string[]>((resolve) => {
			for (let i = 0; i < numPages; i++) {
				let currentPage = pageNumbers[i];
				this.getPdfPageAsDataUrl(pdf, currentPage).then((dataUrl) => {
					dataUrls[i] = dataUrl;
					if (PdfScreenshotHelper.isArrayComplete(dataUrls)) {
						resolve(dataUrls);
					}
				});
			}
		});
	}

	public static getPdfPageAsDataUrl(pdf: PDFDocumentProxy, pageNumber: number): Promise<string> {
		return new Promise<string>((resolve) => {
			pdf.getPage(pageNumber).then((page) => {
				let viewport = page.getViewport(1 /* scale */);
				let canvas = document.createElement("canvas") as HTMLCanvasElement;
				let context = canvas.getContext("2d");
				canvas.height = viewport.height;
				canvas.width = viewport.width;

				let renderContext = {
					canvasContext: context,
					viewport: viewport
				};

				page.render(renderContext).then(() => {
					resolve(canvas.toDataURL());
				});
			});
		});
	}

	private static getPdfScreenshotResult(source: string | Uint8Array | PDFSource): Promise<PdfScreenshotResult> {
		// Never rejects, interesting
		return new Promise<PdfScreenshotResult>((resolve, reject) => {
			PDFJS.getDocument(source).then((pdf) => {
				PdfScreenshotHelper.getPageViewportData(pdf).then((viewportDimensions) => {
					resolve({
						pdf: pdf,
						viewportDimensions: viewportDimensions
					});
				});
			});
		});
	}

	private static getPageViewportData(pdf: PDFDocumentProxy): Promise<ViewportDimensions[]> {
		let dimensions: ViewportDimensions[] = new Array(pdf.numPages);
		return new Promise((resolve) => {
			for (let i = 0; i < pdf.numPages; i++) {
				// Pages start at index 1
				pdf.getPage(i + 1).then((page) => {
					let viewport = page.getViewport(1 /* scale */);
					dimensions[i] = {
						height: viewport.height,
						width: viewport.width
					};

					if (PdfScreenshotHelper.isArrayComplete(dimensions)) {
						resolve(dimensions);
					}
				});
			}
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
				this.getPdfPageAsDataUrl(pdf, i + 1).then((dataUrl) => {
					dataUrls[i] = dataUrl;
					if (PdfScreenshotHelper.isArrayComplete(dataUrls)) {
						getBinaryEvent.stopTimer();
						getBinaryEvent.setCustomProperty(Log.PropertyName.Custom.AverageProcessingDurationPerPage, getBinaryEvent.getDuration() / pdf.numPages);
						Clipper.logger.logEvent(getBinaryEvent);

						resolve(dataUrls);
					}
				});
			}
		});
	}

	// We have to use this instead of Array.prototype.every because it doesn't work
	private static isArrayComplete(arr: any[]): boolean {
		for (let i = 0; i < arr.length; i++) {
			if (!arr[i]) {
				return false;
			}
		}
		return true;
	}
}
