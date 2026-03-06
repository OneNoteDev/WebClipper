import {StringUtils} from "../stringUtils";
import {ObjectUtils} from "../objectUtils";

import {Clipper} from "../clipperUI/frontEndGlobals";
import {ClipperState} from "../clipperUI/clipperState";

import {DomUtils, EmbeddedVideoIFrameSrcs} from "../domParsers/domUtils";

import * as Log from "../logging/log";

import {CaptureFailureInfo} from "./captureFailureInfo";

import {Readability} from "@mozilla/readability";

export enum AugmentationModel {
	None,
	Article,
	BizCard,
	EntityKnowledge,
	Recipe,
	Product,
	Screenshot,
	Wrapstar
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
			augmentationEvent.setCustomProperty(Log.PropertyName.Custom.CorrelationId, StringUtils.generateGuid());

			try {
				let result: AugmentationResult = { ContentModel: AugmentationModel.None, ContentObjects: [] };

				// Parse the page HTML into a Document for Readability
				let doc = (new DOMParser()).parseFromString(pageContent, "text/html");

				// Clone the document because Readability mutates it
				let docClone = doc.cloneNode(true) as Document;

				let reader = new Readability(docClone, { charThreshold: 100 });
				let article = reader.parse();

				if (article && article.content) {
					result.ContentInHtml = article.content;
					result.ContentModel = AugmentationModel.Article;
					result.ContentObjects = [];

					let metadata: { [key: string]: string } = {};
					if (article.title) {
						metadata.title = article.title;
					}
					if (article.excerpt) {
						metadata.description = article.excerpt;
					}
					if (article.byline) {
						metadata.author = article.byline;
					}
					if (article.siteName) {
						metadata.siteName = article.siteName;
					}
					if (article.publishedTime) {
						metadata.publishedTime = article.publishedTime;
					}
					result.PageMetadata = metadata;

					augmentationEvent.setCustomProperty(Log.PropertyName.Custom.AugmentationModel, AugmentationModel[result.ContentModel]);

					// Remove tags that are unsupported by ONML before we display them in the preview
					let contentDoc = (new DOMParser()).parseFromString(result.ContentInHtml, "text/html");
					let previewElement = AugmentationHelper.getArticlePreviewElement(contentDoc);

					DomUtils.toOnml(contentDoc).then(async () => {
						DomUtils.addPreviewContainerStyling(previewElement);
						await AugmentationHelper.addSupportedVideosToElement(previewElement, pageContent, url);
						result.ContentInHtml = contentDoc.body.innerHTML;
						resolve(result);
					});
				} else {
					resolve(result);
				}
			} catch (e) {
				augmentationEvent.setStatus(Log.Status.Failed);
				augmentationEvent.setFailureInfo({ error: e.message || "Readability parsing failed" });
				reject();
			}

			Clipper.logger.logEvent(augmentationEvent);
		});
	}

	public static getAugmentationType(state: ClipperState): string {
		// Default type to Article mode
		let augmentationType: string = AugmentationModel[AugmentationModel.Article].toString();

		if (!state || !state.augmentationResult || !state.augmentationResult.data) {
			return augmentationType;
		}

		let contentModel: AugmentationModel = state.augmentationResult.data.ContentModel;

		if (AugmentationHelper.isSupportedAugmentationType(contentModel)) {
			augmentationType = AugmentationModel[contentModel].toString();
		}

		return augmentationType;
	}

	public static getArticlePreviewElement(doc: Document): HTMLElement {
		let mainContainers = doc.getElementsByClassName("MainArticleContainer");
		if (ObjectUtils.isNullOrUndefined(mainContainers) || ObjectUtils.isNullOrUndefined(mainContainers[0])) {
			return doc.body;
		}
		return mainContainers[0] as HTMLElement;
	}

	private static isSupportedAugmentationType(contentModel: number): boolean {
		return contentModel === AugmentationModel.Article ||
			contentModel === AugmentationModel.Recipe ||
			contentModel === AugmentationModel.Product;
	}

	private static addSupportedVideosToElement(previewElement: HTMLElement, pageContent: string, url: string): Promise<void> {
		let addEmbeddedVideoEvent = new Log.Event.PromiseEvent(Log.Event.Label.AddEmbeddedVideo); // start event timer, just in case it gets logged

		return DomUtils.addEmbeddedVideosWhereSupported(previewElement, pageContent, url).then((videoSrcUrls: EmbeddedVideoIFrameSrcs[]) => {
			// only log when supported video is found on page
			if (!ObjectUtils.isNullOrUndefined(videoSrcUrls)) {
				Clipper.logger.logEvent(addEmbeddedVideoEvent);
			}
		}, (error: OneNoteApi.GenericError) => {
			addEmbeddedVideoEvent.setStatus(Log.Status.Failed);
			addEmbeddedVideoEvent.setFailureInfo(error);
			Clipper.logger.logEvent(addEmbeddedVideoEvent);
		});
	}
}
