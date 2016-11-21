import {Constants} from "../constants";
import {Settings} from "../settings";
import {StringUtils} from "../stringUtils";
import {ObjectUtils} from "../objectUtils";

import {Clipper} from "../clipperUI/frontEndGlobals";
import {ClipperState} from "../clipperUI/clipperState";
import {OneNoteApiUtils} from "../clipperUI/oneNoteApiUtils";
import {Status} from "../clipperUI/status";

import {DomUtils} from "../domParsers/domUtils";

import {HttpWithRetries} from "../http/HttpWithRetries";

import {Localization} from "../localization/localization";

import * as Log from "../logging/log";

import {CaptureFailureInfo} from "./captureFailureInfo";

export enum AugmentationModel {
	None = 0,
	Article = 1,
	BizCard = 2,
	Recipe = 3,
	Product = 4,
	Screenshot = 5,
	Wrapstar = 6
}

export interface AugmentationResult extends CaptureFailureInfo {
	ContentInHtml?: string;
	ContentModel?: AugmentationModel;
	ContentObjects?: any[];
	PageMetadata?: { [key: string]: string };
}

export class AugmentationHelper {
	public static augmentPage(url: string, locale: string, pageContent: string): Promise<AugmentationResult> {
		return new Promise<AugmentationResult>((resolve, reject) => {
			let augmentationEvent = new Log.Event.PromiseEvent(Log.Event.Label.AugmentationApiCall);

			let correlationId = StringUtils.generateGuid();
			augmentationEvent.setCustomProperty(Log.PropertyName.Custom.CorrelationId, correlationId);

			AugmentationHelper.makeAugmentationRequest(url, locale, pageContent, correlationId).then((responsePackage: { parsedResponse: AugmentationResult[], request: XMLHttpRequest }) => {
				let parsedResponse = responsePackage.parsedResponse;
				let result: AugmentationResult = { ContentModel: AugmentationModel.None, ContentObjects: []	};

				augmentationEvent.setCustomProperty(Log.PropertyName.Custom.CorrelationId, responsePackage.request.getResponseHeader(Constants.HeaderValues.correlationId));

				if (parsedResponse && parsedResponse.length > 0 && parsedResponse[0].ContentInHtml) {
					result = parsedResponse[0];

					augmentationEvent.setCustomProperty(Log.PropertyName.Custom.AugmentationModel, AugmentationModel[result.ContentModel]);

					// Remove tags that are unsupported by ONML before we display them in the preview
					// Supported tags: https://msdn.microsoft.com/en-us/library/office/dn575442.aspx
					let doc = (new DOMParser()).parseFromString(result.ContentInHtml, "text/html");
					let previewElement = AugmentationHelper.getArticlePreviewElement(doc);

					DomUtils.removeElementsNotSupportedInOnml(doc);
					DomUtils.removeBlankImages(doc).then(() => {
						DomUtils.addPreviewContainerStyling(previewElement);
						AugmentationHelper.addSupportedVideosToElement(previewElement, pageContent, url);
						result.ContentInHtml = doc.body.innerHTML;
						resolve(result);
					});
				} else {
					resolve(result);
				}

				augmentationEvent.setCustomProperty(Log.PropertyName.Custom.AugmentationModel, AugmentationModel[result.ContentModel]);
			}).catch((failure: OneNoteApi.RequestError) => {
				OneNoteApiUtils.logOneNoteApiRequestError(augmentationEvent, failure);
				reject();
			}).then(() => {
				Clipper.logger.logEvent(augmentationEvent);
			});
		});
	}

	public static getAugmentationType(state: ClipperState): string {
		// Default type to Article mode
		let augmentationType: string = AugmentationModel[AugmentationModel.Article].toString();

		if (!state || !state.augmentationResult || !state.augmentationResult.data) {
			return augmentationType;
		}

		let contentModel: AugmentationModel = state.augmentationResult.data.ContentModel;

		if (AugmentationHelper.isSupportedAugmentatationType(contentModel)) {
			augmentationType = AugmentationModel[contentModel].toString();
		}

		return augmentationType;
	}

	/*
	 * Returns the augmented preview text.
	 */
	public static makeAugmentationRequest(url: string, locale: string, pageContent: string, requestCorrelationId: string): Promise<OneNoteApi.ResponsePackage<any>> {
		return Clipper.getUserSessionIdWhenDefined().then((sessionId) => {
			let augmentationApiUrl = Constants.Urls.augmentationApiUrl + "?renderMethod=extractAggressive&url=" + url + "&lang=" + locale;

			let headers = {};
			headers[Constants.HeaderValues.appIdKey] = Settings.getSetting("App_Id");
			headers[Constants.HeaderValues.noAuthKey] = "true";
			headers[Constants.HeaderValues.correlationId] = requestCorrelationId;
			headers[Constants.HeaderValues.userSessionIdKey] = sessionId;

			return HttpWithRetries.post(augmentationApiUrl, pageContent, headers).then((request: XMLHttpRequest) => {
				let parsedResponse: any;
				try {
					parsedResponse = JSON.parse(request.response);
				} catch (e) {
					Clipper.logger.logJsonParseUnexpected(request.response);
					return Promise.reject(OneNoteApi.ErrorUtils.createRequestErrorObject(request, OneNoteApi.RequestErrorType.UNABLE_TO_PARSE_RESPONSE));
				}

				let responsePackage = {
					parsedResponse: parsedResponse,
					request: request
				};
				return Promise.resolve(responsePackage);
			});
		});
	}

	public static getArticlePreviewElement(doc: Document): HTMLElement {
		let mainContainers = doc.getElementsByClassName("MainArticleContainer");
		if (ObjectUtils.isNullOrUndefined(mainContainers) || ObjectUtils.isNullOrUndefined(mainContainers[0])) {
			return doc.body;
		}
		return mainContainers[0] as HTMLElement;
	}

	private static isSupportedAugmentatationType(contentModel: number): boolean {
		return contentModel === AugmentationModel.Article ||
			contentModel === AugmentationModel.Recipe ||
			contentModel === AugmentationModel.Product;
	}

	private static addSupportedVideosToElement(previewElement: HTMLElement, pageContent: string, url: string) {
		let addEmbeddedVideoEvent = new Log.Event.PromiseEvent(Log.Event.Label.AddEmbeddedVideo); // start event timer, just in case it gets logged
		addEmbeddedVideoEvent.setCustomProperty(Log.PropertyName.Custom.Url, url);

		DomUtils.addEmbeddedVideosWhereSupported(previewElement, pageContent, url).then((videoSrcUrls: DomUtils.EmbeddedVideoIFrameSrcs[]) => {
			// only log when supported video is found on page
			if (!ObjectUtils.isNullOrUndefined(videoSrcUrls)) {
				addEmbeddedVideoEvent.setCustomProperty(Log.PropertyName.Custom.VideoSrcUrl, JSON.stringify(videoSrcUrls.map(function (v) { return v.srcAttribute; })));
				addEmbeddedVideoEvent.setCustomProperty(Log.PropertyName.Custom.VideoDataOriginalSrcUrl, JSON.stringify(videoSrcUrls.map(function (v) { return v.dataOriginalSrcAttribute; })));
				Clipper.logger.logEvent(addEmbeddedVideoEvent);
			}
		}, (error: OneNoteApi.GenericError) => {
			addEmbeddedVideoEvent.setStatus(Log.Status.Failed);
			addEmbeddedVideoEvent.setFailureInfo(error);
			Clipper.logger.logEvent(addEmbeddedVideoEvent);
		});
	}
}
