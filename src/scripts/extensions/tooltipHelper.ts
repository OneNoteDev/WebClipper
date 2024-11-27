import {Constants} from "../constants";
import {ObjectUtils} from "../objectUtils";

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

	public async getTooltipInformation(storageKeyBase: string, tooltipType: TooltipType): Promise<number> {
		if (ObjectUtils.isNullOrUndefined(storageKeyBase) || ObjectUtils.isNullOrUndefined(tooltipType)) {
			throw new Error("Invalid argument passed to getTooltipInformation");
		}

		let storageKey = TooltipHelper.getStorageKeyForTooltip(storageKeyBase, tooltipType);
		let tooltipInfoAsString = await this.storage.getValue(storageKey)
		let info = parseInt(tooltipInfoAsString, 10 /* radix */);
		return !isNaN(info) ? info : 0;
	}

	public setTooltipInformation(storageKeyBase: string, tooltipType: TooltipType, value: string): void {
		if (ObjectUtils.isNullOrUndefined(storageKeyBase) || ObjectUtils.isNullOrUndefined(tooltipType)) {
			throw new Error("Invalid argument passed to setTooltipInformation");
		}

		let storageKey = TooltipHelper.getStorageKeyForTooltip(storageKeyBase, tooltipType);
		this.storage.setValue(storageKey, value);
	}

	public async tooltipDelayIsOver(tooltipType: TooltipType, curTime: number): Promise<boolean> {
		if (ObjectUtils.isNullOrUndefined(tooltipType) || ObjectUtils.isNullOrUndefined(curTime)) {
			throw new Error("Invalid argument passed to tooltipDelayIsOver");
		}

		// If the user has clipped this content type
		let lastClipTime = await this.getTooltipInformation(ClipperStorageKeys.lastClippedTooltipTimeBase, tooltipType);
		if (lastClipTime !== 0) {
			return false;
		}

		// If the user has seen enough of our tooltips :P 
		let numTimesTooltipHasBeenSeen = await this.getTooltipInformation(ClipperStorageKeys.numTimesTooltipHasBeenSeenBase, tooltipType);
		if (numTimesTooltipHasBeenSeen >= Constants.Settings.maximumNumberOfTimesToShowTooltips) {
			return false;
		}

		// If not enough time has passed since the user saw this specific tooltip, return false
		if (await this.tooltipHasBeenSeenInLastTimePeriod(tooltipType, curTime, Constants.Settings.timeBetweenSameTooltip)) {
			return false;
		}

		// If not enough time has been since the user saw ANY OTHER tooltip, then return false
		let indexOfThisTooltip = this.validTypes.indexOf(tooltipType);
		let validTypesWithCurrentTypeRemoved = this.validTypes.slice();
		validTypesWithCurrentTypeRemoved.splice(indexOfThisTooltip, 1);
		if (await this.hasAnyTooltipBeenSeenInLastTimePeriod(curTime, validTypesWithCurrentTypeRemoved, Constants.Settings.timeBetweenDifferentTooltips)) {
			return false;
		}
		return true;
	}

	public static getStorageKeyForTooltip(storageKeyBase: string, tooltipType: TooltipType): string {
		if (ObjectUtils.isNullOrUndefined(storageKeyBase) || ObjectUtils.isNullOrUndefined(tooltipType)) {
			throw new Error("Invalid argument passed to getStorageKeyForTooltip");
		}

		return storageKeyBase + TooltipType[tooltipType];
	}

	/** 
	 * Returns true if the lastSeenTooltipTime of @tooltipType is within @timePeriod of @curTime
	 */
	public async tooltipHasBeenSeenInLastTimePeriod(tooltipType: TooltipType, curTime: number, timePeriod: number): Promise<boolean> {
		let lastSeenTooltipTime = await this.getTooltipInformation(ClipperStorageKeys.lastSeenTooltipTimeBase, tooltipType);
		if (lastSeenTooltipTime === 0) {
			return false;
		}

		return (curTime - lastSeenTooltipTime) < timePeriod;
	}

	/**
	 * Returns true if any of the @tooltipTypesToCheck have been seen in the last @timePeriod, given the current @time
	 */
	public async hasAnyTooltipBeenSeenInLastTimePeriod(curTime: number, typesToCheck: TooltipType[], timePeriod: number): Promise<boolean> {
		for (const tooltipType of typesToCheck) {
			const seen = await this.tooltipHasBeenSeenInLastTimePeriod(tooltipType, curTime, timePeriod);
			if (seen) {
				return true;
			}
		}
		return false;
	}
}
