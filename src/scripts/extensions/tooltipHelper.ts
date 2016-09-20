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

	public tooltipDelayIsOver(tooltipType: TooltipType, time: number): boolean {
		if (Utils.isNullOrUndefined(tooltipType) || Utils.isNullOrUndefined(time)) {
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

		let timeBetweenTooltips = Constants.Settings.timeBetweenTooltips;

		// If the user has seen any of the tooltips in the last timeBetweenTooltips
		if (this.hasAnyTooltipBeenSeenInLastTimePeriod(time, this.validTypes, Constants.Settings.timeBetweenTooltips)) {
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
	public hasAnyTooltipBeenSeenInLastTimePeriod(curTime: number, typesToCheck: TooltipType[], timePeriod): boolean {
		return this.validTypes.some((tooltipType) => {
			let tooltipWasSeen = this.tooltipHasBeenSeenInLastTimePeriod(tooltipType, curTime, timePeriod);
			return tooltipWasSeen;
		});
	}
}
