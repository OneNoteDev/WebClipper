/// <reference path="../../../typings/main/ambient/es6-promise/es6-promise.d.ts"/>
/// <reference path="../../../node_modules/onenoteapi/target/oneNoteApi.d.ts" />

import {Clipper} from "../clipperUI/frontEndGlobals";
import {OneNoteApiUtils} from "../clipperUI/oneNoteApiUtils";
import {Status} from "../clipperUI/status";

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
	public static getFullPageScreenshot(pageInfoContentData: string): Promise<FullPageScreenshotResult> {
		return new Promise<FullPageScreenshotResult>((resolve, reject) => {
			let fullPageScreenshotEvent = new Log.Event.PromiseEvent(Log.Event.Label.FullPageScreenshotCall);

			let correlationId = Utils.generateGuid();
			fullPageScreenshotEvent.setCustomProperty(Log.PropertyName.Custom.RequestCorrelationId, correlationId);

			let request = new XMLHttpRequest();
			request.open("POST", Constants.Urls.fullPageScreenshotUrl);

			request.setRequestHeader(Constants.HeaderValues.appIdKey, Settings.getSetting("App_Id"));
			request.setRequestHeader(Constants.HeaderValues.noAuthKey, "true");
			request.setRequestHeader(Constants.HeaderValues.userSessionIdKey, correlationId);
			request.setRequestHeader("Accept", "application/json");

			let errorCallback = (failure: OneNoteApi.RequestError) => {
				fullPageScreenshotEvent.setCustomProperty(Log.PropertyName.Custom.CorrelationId, request.getResponseHeader(Constants.HeaderValues.correlationId));
				OneNoteApiUtils.logOneNoteApiRequestError(fullPageScreenshotEvent, failure);
				Clipper.logger.logEvent(fullPageScreenshotEvent);
				reject();
			};

			request.onload = () => {
				if (request.status === 200) {
					try {
						resolve(JSON.parse(request.response) as FullPageScreenshotResult);
						fullPageScreenshotEvent.setCustomProperty(Log.PropertyName.Custom.FullPageScreenshotContentFound, true);
						Clipper.logger.logEvent(fullPageScreenshotEvent);
					} catch (e) {
						errorCallback(OneNoteApi.ErrorUtils.createRequestErrorObject(request, OneNoteApi.RequestErrorType.UNABLE_TO_PARSE_RESPONSE));
					}
				} else if (request.status === 204) {
					reject();
					fullPageScreenshotEvent.setCustomProperty(Log.PropertyName.Custom.FullPageScreenshotContentFound, false);
					Clipper.logger.logEvent(fullPageScreenshotEvent);
				} else {
					errorCallback(OneNoteApi.ErrorUtils.createRequestErrorObject(request, OneNoteApi.RequestErrorType.UNEXPECTED_RESPONSE_STATUS));
				}
			};

			request.onerror = () => {
				errorCallback(OneNoteApi.ErrorUtils.createRequestErrorObject(request, OneNoteApi.RequestErrorType.NETWORK_ERROR));
			};

			request.timeout = 30000;
			request.ontimeout = () => {
				errorCallback(OneNoteApi.ErrorUtils.createRequestErrorObject(request, OneNoteApi.RequestErrorType.REQUEST_TIMED_OUT));
			};

			request.send(pageInfoContentData);
		});
	}
}
