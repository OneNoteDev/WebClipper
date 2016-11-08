/// <reference path="../../../node_modules/onenoteapi/target/oneNoteApi.d.ts" />

import {Clipper} from "../clipperUI/frontEndGlobals";
import {OneNoteApiUtils} from "../clipperUI/oneNoteApiUtils";
import {Status} from "../clipperUI/status";

import {HttpWithRetries} from "../http/httpWithRetries";

import * as Log from "../logging/log";

import {Constants} from "../constants";
import {PageInfo} from "../pageInfo";
import {Settings} from "../settings";
import {Utils} from "../utils";

import {CaptureFailureInfo} from "./captureFailureInfo";

export interface FullPageScreenshotResult extends CaptureFailureInfo {
	ImageEncoding?: string;
	ImageFormat?: string;
	Images?: string[];
}

export class FullPageScreenshotHelper {
	private static timeout = 50000;

	public static getFullPageScreenshot(pageInfoContentData: string): Promise<FullPageScreenshotResult> {
		return new Promise<FullPageScreenshotResult>((resolve, reject) => {
			Clipper.getUserSessionIdWhenDefined().then((sessionId) => {
				let fullPageScreenshotEvent = new Log.Event.PromiseEvent(Log.Event.Label.FullPageScreenshotCall);

				let correlationId = Utils.generateGuid();
				fullPageScreenshotEvent.setCustomProperty(Log.PropertyName.Custom.RequestCorrelationId, correlationId);

				let headers = {};
				headers[Constants.HeaderValues.accept] = "application/json";
				headers[Constants.HeaderValues.appIdKey] = Settings.getSetting("App_Id");
				headers[Constants.HeaderValues.noAuthKey] = "true";
				headers[Constants.HeaderValues.correlationId] = correlationId;
				headers[Constants.HeaderValues.userSessionIdKey] = sessionId;

				let errorCallback = (error: OneNoteApi.RequestError) => {
					fullPageScreenshotEvent.setCustomProperty(Log.PropertyName.Custom.CorrelationId, error.responseHeaders[Constants.HeaderValues.correlationId]);
					OneNoteApiUtils.logOneNoteApiRequestError(fullPageScreenshotEvent, error);
				};

				HttpWithRetries.post(Constants.Urls.fullPageScreenshotUrl, pageInfoContentData, headers, [200, 204], FullPageScreenshotHelper.timeout).then((request: XMLHttpRequest) => {
					if (request.status === 200) {
						try {
							resolve(JSON.parse(request.response) as FullPageScreenshotResult);
							fullPageScreenshotEvent.setCustomProperty(Log.PropertyName.Custom.FullPageScreenshotContentFound, true);
						} catch (e) {
							errorCallback(OneNoteApi.ErrorUtils.createRequestErrorObject(request, OneNoteApi.RequestErrorType.UNABLE_TO_PARSE_RESPONSE));
							reject();
						}
					} else {
						fullPageScreenshotEvent.setCustomProperty(Log.PropertyName.Custom.FullPageScreenshotContentFound, false);
						reject();
					}
				}, (error: OneNoteApi.RequestError) => {
					errorCallback(error);
					reject();
				}).then(() => {
					Clipper.logger.logEvent(fullPageScreenshotEvent);
				});
			});
		});
	}
}
