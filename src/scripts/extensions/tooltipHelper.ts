import {Constants} from "../constants";
import {Utils} from "../utils";

import {TooltipType} from "../clipperUI/tooltipType";

import {ClipperStorageKeys} from "../storage/clipperStorageKeys";
import {Storage} from "../storage/storage";

export class TooltipHelper {
	private storage: Storage;
	private validTypes: TooltipType[];

	constructor(storage: Storage) {
		this.storage = storage;
		this.validTypes = [TooltipType.Pdf, TooltipType.Product, TooltipType.Recipe, TooltipType.Video];
	}

	public getTooltipInformation(storageKeyBase: string, tooltipType: TooltipType): number {
		if (Utils.isNullOrUndefined(storageKeyBase) || Utils.isNullOrUndefined(tooltipType)) {
			throw new Error("Invalid argument passed to getTooltipInformation");
		}

		let storageKey = TooltipHelper.getStorageKeyForTooltip(storageKeyBase, tooltipType);
		let tooltipInfoAsString = this.storage.getValue(storageKey);
		let info = parseInt(tooltipInfoAsString, 10 /* radix */);
		return !isNaN(info) ? info : 0;
	}

	public setTooltipInformation(storageKeyBase: string, tooltipType: TooltipType, value: string): void {
		if (Utils.isNullOrUndefined(storageKeyBase) || Utils.isNullOrUndefined(tooltipType)) {
			throw new Error("Invalid argument passed to setTooltipInformation");
		}

		let storageKey = TooltipHelper.getStorageKeyForTooltip(storageKeyBase, tooltipType);
		this.storage.setValue(storageKey, value);
	}

	public tooltipDelayIsOver(tooltipType: TooltipType, curTime: number): boolean {
		if (Utils.isNullOrUndefined(tooltipType) || Utils.isNullOrUndefined(curTime)) {
			throw new Error("Invalid argument passed to tooltipDelayIsOver");
		}

		let numTimesTooltipHasBeenSeen = this.getTooltipInformation(ClipperStorageKeys.numTimesTooltipHasBeenSeenBase, tooltipType);
		let lastSeenTooltipTime = this.getTooltipInformation(ClipperStorageKeys.lastSeenTooltipTimeBase, tooltipType);
		let lastClipTime = this.getTooltipInformation(ClipperStorageKeys.lastClippedTooltipTimeBase, tooltipType);

		// If the user has clipped this content type
		if (lastClipTime !== 0) {
			return false;
		}

		// If the user has seen enough of our tooltips :P 
		if (numTimesTooltipHasBeenSeen >= Constants.Settings.maximumNumberOfTimesToShowTooltips) {
			return false;
		}

		// If it has been less than 3 weeks since the user saw this specific tooltip, return false
		if (this.tooltipHasBeenSeenInLastTimePeriod(tooltipType, curTime, Constants.Settings.timeBetweenSameTooltip)) {
			return false;
		}

		// If it has been less than 7 days since the user saw any tooltip, then return false
		let indexOfThisTooltip = this.validTypes.indexOf(tooltipType);
		let tooltipsWithoutCurrentType = this.validTypes.splice(indexOfThisTooltip, 1);
		if (this.hasAnyTooltipBeenSeenInLastTimePeriod(curTime, tooltipsWithoutCurrentType, Constants.Settings.timeBetweenDifferentTooltips)) {
			return false;
		}
		
		return true;
	}

	public static getStorageKeyForTooltip(storageKeyBase: string, tooltipType: TooltipType): string {
		if (Utils.isNullOrUndefined(storageKeyBase) || Utils.isNullOrUndefined(tooltipType)) {
			throw new Error("Invalid argument passed to getStorageKeyForTooltip");
		}

		return storageKeyBase + TooltipType[tooltipType];
	}

	/** 
	 * Returns true if the lastSeenTooltipTime of @tooltipType is within @timePeriod of @curTime
	 */
	public tooltipHasBeenSeenInLastTimePeriod(tooltipType: TooltipType, curTime: number, timePeriod: number): boolean {
		let lastSeenTooltipTime = this.getTooltipInformation(ClipperStorageKeys.lastSeenTooltipTimeBase, tooltipType);
		if (lastSeenTooltipTime === 0) {
			return false;
		}

		return (curTime - lastSeenTooltipTime) < timePeriod;
	}

	/**
	 * Returns true if any of the @tooltipTypesToCheck have been seen in the last @timePeriod, given the current @time
	 */
	public hasAnyTooltipBeenSeenInLastTimePeriod(curTime: number, typesToCheck: TooltipType[], timePeriod: number): boolean {
		return this.validTypes.some((tooltipType) => {
			let tooltipWasSeen = this.tooltipHasBeenSeenInLastTimePeriod(tooltipType, curTime, timePeriod);
			return tooltipWasSeen;
		});
	}
}
