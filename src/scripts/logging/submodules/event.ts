import {ErrorUtils, Failure, PropertyName, Status} from "../log";
import {ObjectUtils} from "../../objectUtils";

export module Event {
	export enum Category {
		BaseEvent,
		PromiseEvent,
		StreamEvent,
	}

	export enum Label {
		AddEmbeddedVideo,
		AugmentationApiCall,
		BatchRequests,
		BookmarkPage,
		CompressRegionSelection,
		ClearNoOpTracker,
		Click,
		ClipAugmentationOptions,
		ClipCommonOptions,
		ClipPdfOptions,
		ClipRegionOptions,
		ClipSelectionOptions,
		ClipToOneNoteAction,
		CloseClipper,
		ClosePageNavTooltip,
		CreateNotebook,
		CreatePage,
		CreateSection,
		DebugFeedback,
		DeviceIdMap,
		FetchNonLocalData,
		FullPageScreenshotCall,
		GetBinaryRequest,
		GetCleanDom,
		GetExistingUserInformation,
		GetFlightingAssignments,
		GetLocale,
		GetLocalizedStrings,
		GetNotebookByName,
		GetNotebooks,
		GetPage,
		GetPageContent,
		GetPages,
		HandleSignInEvent,
		HideClipperDueToSpaNavigate,
		InvokeClipper,
		InvokeTooltip,
		InvokeWhatsNew,
		LocalFilesNotAllowedPanelShown,
		PagesSearch,
		PdfByteMetadata,
		PdfDataUrlMetadata,
		ProcessPdfIntoDataUrls,
		RegionSelectionCapturing,
		RegionSelectionLoading,
		RegionSelectionProcessing,
		RetrieveUserInformation,
		SetContextProperty,
		SetDoNotPromptRatings,
		ShouldShowRatingsPrompt,
		TooltipImpression,
		UpdatePage,
		UserInfoUpdated,
		WhatsNewImpression
	}

	export interface BaseEventData {
		Label: Event.Label;
		Duration: number;
		Properties?: {};
	}

	export class BaseEvent {
		protected _label: Event.Label;
		protected _duration: number;
		protected _properties: {};
		protected _timerWasStopped: boolean = false;

		private _startTime: number;

		constructor(labelOrData: Event.Label | BaseEventData) {
			if (this.isEventData(labelOrData)) {
				let eventData: BaseEventData = <BaseEventData>labelOrData;

				this._label = eventData.Label;
				this._duration = eventData.Duration;

				// TODO theoretically, this is a dangerous set
				// because we're not doing the checks found in .setCustomProperty
				this._properties = eventData.Properties ? JSON.parse(JSON.stringify(eventData.Properties)) : undefined;
			} else {
				let label: Event.Label = <Event.Label>labelOrData;
				this._label = label;
				this.startTimer();
			}
		}

		public getDuration(): number {
			return this._duration;
		}

		/**
		 * Returns the object's event category. Should be overriden by child classes.
		 */
		public getEventCategory(): Event.Category {
			return Event.Category.BaseEvent;
		}

		/**
		 * Returns a copy of this BaseEvent's internal data
		 * (copy to prevent altering of class internals without setters)
		 */
		public getEventData(): Event.BaseEventData {
			return {
				Label: this._label,
				Duration: this._duration,
				Properties: this.getCustomProperties()
			};
		}

		public getLabel(): string {
			return Event.Label[this._label];
		}

		/**
		 * Returns a copy of this Event's Properties
		 * (copy to prevent altering of class internals without .setCustomProperty())
		 */
		public getCustomProperties(): {} {
			return this._properties ? JSON.parse(JSON.stringify(this._properties)) : undefined;
		}

		public setCustomProperty(key: PropertyName.Custom, value: string | number | boolean): void {
			if (this.isReservedPropertyName(key)) {
				throw new Error("Tried to overwrite key '" + PropertyName.Custom[key] + "' with value of " + JSON.stringify(value));
			}

			if (!this._properties) {
				this._properties = {};
			}
			this._properties[PropertyName.Custom[key]] = value;
		}

		/**
		 * Calling this multiple times in a row will result in restart of the timer
		 */
		public startTimer(): void {
			this._startTime = new Date().getTime();
		}

		/**
		 * If called multiple times in a row, last call wins
		 * If called before startTimer(), nothing happens
		 */
		public stopTimer(): boolean {
			if (this._startTime) {
				this._duration = new Date().getTime() - this._startTime;
				this._timerWasStopped = true;
				return true;
			}
			return false;
		}

		public timerWasStopped(): boolean {
			return this._timerWasStopped;
		}

		protected isEventData(labelOrData: Event.Label | BaseEventData) {
			let tryCastAsEventData: BaseEventData = <BaseEventData>labelOrData;
			if (tryCastAsEventData && !ObjectUtils.isNullOrUndefined(tryCastAsEventData.Label)) {
				return true;
			}
			return false;
		}

		private isReservedPropertyName(value: PropertyName.Custom): boolean {
			for (let v in PropertyName.Reserved) {
				if (PropertyName.Custom[value].toLowerCase() === v.toLowerCase()) {
					return true;
				}
			}
			return false;
		}
	}

	export interface PromiseEventData extends BaseEventData {
		LogStatus: Status;
		FailureType?: Failure.Type;
		FailureInfo?: OneNoteApi.GenericError;
	}

	export class PromiseEvent extends BaseEvent {
		private _logStatus: Status = Status.Succeeded;
		private _failureType: Failure.Type = Failure.Type.Unexpected;
		private _failureInfo: OneNoteApi.GenericError;

		constructor(labelOrData: Event.Label | PromiseEventData) {
			super(labelOrData);

			if (this.isEventData(labelOrData)) {
				let eventData: PromiseEventData = <PromiseEventData>labelOrData;
				this._logStatus = eventData.LogStatus;
				this._failureType = eventData.FailureType;
				this._failureInfo = ErrorUtils.clone(eventData.FailureInfo);
			}
		}

		public getEventCategory(): Event.Category {
			return Event.Category.PromiseEvent;
		}

		/**
		 * Returns a copy of this PromiseEvent's internal data
		 * (copy to prevent altering of class internals without setters)
		 */
		public getEventData(): Event.PromiseEventData {
			return {
				Label: this._label,
				Duration: this._duration,
				Properties: this.getCustomProperties(),
				LogStatus: this._logStatus,
				FailureType: this._failureType,
				FailureInfo: ErrorUtils.clone(this._failureInfo)
			};
		}

		public getStatus(): string {
			return Status[this._logStatus];
		}

		public setStatus(status: Status): void {
			this._logStatus = status;
			if (!this._timerWasStopped) {
				this.stopTimer();
			}
		}

		public getFailureInfo(): string {
			return ErrorUtils.toString(this._failureInfo);
		}

		/**
		 * Set this PromiseEvent's FailureInfo to a copy of the GenericError passed in
		 * (copy to prevent altering of class internals without this setter)
		 */
		public setFailureInfo(failureInfo: OneNoteApi.GenericError): void {
			this._failureInfo = ErrorUtils.clone(failureInfo);
		}

		public getFailureType(): string {
			return Failure.Type[this._failureType];
		}

		public setFailureType(type: Failure.Type): void {
			this._failureType = type;
		}
	}

	export interface StreamEventData extends BaseEventData {
		Stream: any[];
	}

	export class StreamEvent extends BaseEvent {
		private _stream: any[] = [];

		constructor(labelOrData: Event.Label | StreamEventData) {
			super(labelOrData);

			if (this.isEventData(labelOrData)) {
				let eventData: StreamEventData = <StreamEventData>labelOrData;
				this._stream = eventData.Stream;
			}
		}

		public getEventCategory(): Event.Category {
			return Event.Category.StreamEvent;
		}

		/**
		 * Returns a copy of this StreamEvent's internal data
		 * (copy to prevent altering of class internals without setters)
		 */
		public getEventData(): Event.StreamEventData {
			return {
				Label: this._label,
				Duration: this._duration,
				Properties: this.getCustomProperties(),
				Stream: this._stream
			};
		}

		public append(streamItem: any) {
			this._stream.push(streamItem);
		}
	}

	export function createEvent(eventCategory: Event.Category, eventData: Event.BaseEventData): Event.BaseEvent {
		switch (eventCategory) {
			default:
			case Event.Category.BaseEvent:
				return new Event.BaseEvent(eventData as BaseEventData);
			case Event.Category.PromiseEvent:
				return new Event.PromiseEvent(eventData as PromiseEventData);
			case Event.Category.StreamEvent:
				return new Event.StreamEvent(eventData as StreamEventData);
		}
	}
}
