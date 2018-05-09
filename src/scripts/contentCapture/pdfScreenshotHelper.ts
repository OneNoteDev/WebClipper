import {Clipper} from "../clipperUI/frontEndGlobals";
import {Status} from "../clipperUI/status";

import {SmartValue} from "../communicator/smartValue";

import * as Log from "../logging/log";

import {ArrayUtils} from "../arrayUtils";
import {Constants} from "../constants";
import {PageInfo} from "../pageInfo";

import {CaptureFailureInfo} from "./captureFailureInfo";
import {PdfDocument} from "./pdfDocument";
import {PdfJsDocument} from "./pdfJsDocument";
import {ViewportDimensions} from "./viewportDimensions";

export interface PdfScreenshotResult extends CaptureFailureInfo {
	pdf?: PdfDocument;
	viewportDimensions?: ViewportDimensions[];
	byteLength?: number;
}

export class PdfScreenshotHelper {
	public static getLocalPdfData(localUrl: string): Promise<PdfScreenshotResult> {
		return PdfScreenshotHelper.getPdfScreenshotResult(localUrl);
	}

	public static getPdfData(url: string): Promise<PdfScreenshotResult> {
		return new Promise<PdfScreenshotResult>((resolve, reject) => {
			let getBinaryEvent = new Log.Event.PromiseEvent(Log.Event.Label.GetBinaryRequest);

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
						pdfScreenshotResult.byteLength = arrayBuffer.byteLength;
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

	/**
	 * Source can be a buffer object, or a url (including local)
	 */
	private static getPdfScreenshotResult(source): Promise<PdfScreenshotResult> {
		// Never rejects, interesting
		return new Promise<PdfScreenshotResult>((resolve, reject) => {
			PDFJS.getDocument(source).then((pdf) => {
				let pdfDocument: PdfDocument = new PdfJsDocument(pdf);
				pdfDocument.getAllPageViewportDimensions().then((viewportDimensions) => {
					pdfDocument.getByteLength().then((byteLength) => {
						resolve({
							pdf: pdfDocument,
							viewportDimensions: viewportDimensions,
							byteLength: byteLength
						});
					});
				});
			});
		});
	}
}
