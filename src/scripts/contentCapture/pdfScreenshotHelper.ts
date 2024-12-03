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
import { ErrorUtils } from "../responsePackage";

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

			let errorCallback = (failureInfo: Promise<OneNoteApi.RequestError>) => {
				failureInfo.then((error) => {
					getBinaryEvent.setStatus(Log.Status.Failed);
					error.response = error.responseHeaders = undefined;
					getBinaryEvent.setFailureInfo(error);
					Clipper.logger.logEvent(getBinaryEvent);
					reject();
				});
			};

			fetch(url)
				.then(response => {
					if (!response.ok) {
						errorCallback(ErrorUtils.createRequestErrorObject(response, OneNoteApi.RequestErrorType.UNEXPECTED_RESPONSE_STATUS));
					}
					return response.arrayBuffer();
				})
				.then(arrayBuffer => {
					getBinaryEvent.setCustomProperty(Log.PropertyName.Custom.ByteLength, arrayBuffer.byteLength);
					Clipper.logger.logEvent(getBinaryEvent);

					PdfScreenshotHelper.getPdfScreenshotResult(new Uint8Array(arrayBuffer))
						.then(pdfScreenshotResult => {
							pdfScreenshotResult.byteLength = arrayBuffer.byteLength;
							resolve(pdfScreenshotResult);
						});
				})
			.catch(() => {
				reject(OneNoteApi.RequestErrorType.NETWORK_ERROR);
			});
			setTimeout(() => {
				reject(OneNoteApi.RequestErrorType.REQUEST_TIMED_OUT);
			}, 60000);
		});
	}

	/**
	 * Source can be a buffer object, or a url (including local)
	 */
	private static getPdfScreenshotResult(source: string | Uint8Array): Promise<PdfScreenshotResult> {
		// Never rejects, interesting
		return new Promise<PdfScreenshotResult>((resolve, reject) => {
			let pdfPromise: PDFPromise<PDFDocumentProxy>;
			/**
			 * PDFJS.getDocument accepts either a string or a Uint8Array or a PDFSource as its source parameter.
			 * With the latest version of typescript, the type of the source parameter cannot be string | Uint8Array
			 * but must be exactly one of the three types mentioned above. The if-else block below ensures the same.
			 */
			if (typeof source === "string") {
				// source is of type string and matches the corresponding overload of PDFJS.getDocument
				pdfPromise = PDFJS.getDocument(source);
			} else {
				// source is of type Uint8Array and matches the corresponding overload of PDFJS.getDocument
				pdfPromise = PDFJS.getDocument(source);
			}
			pdfPromise.then((pdf) => {
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
