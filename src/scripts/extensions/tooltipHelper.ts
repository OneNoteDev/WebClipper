import {Constants} from "../constants";
import {Utils} from "../utils";

import {TooltipType} from "../clipperUI/tooltipType";

import {ClipperStorageKeys} from "../storage/clipperStorageKeys";
import {Storage} from "../storage/storage";

export class TooltipHelper {
	private storage: Storage;

	constructor(storage: Storage) {
		this.storage = storage;
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

	public tooltipDelayIsOver(tooltipType: TooltipType, time: number) {
		if (Utils.isNullOrUndefined(tooltipType) || Utils.isNullOrUndefined(time)) {
			throw new Error("Invalid argument passed to tooltipDelayIsOver");
		}

		let lastSeenTooltipTime = this.getTooltipInformation(ClipperStorageKeys.lastSeenTooltipTimeBase, tooltipType);
		let lastSeenClipTime = this.getTooltipInformation(ClipperStorageKeys.lastClippedTooltipTimeBase, tooltipType);

		let timeBetweenTooltips = Constants.Settings.timeBetweenTooltips;

		let isTooltipShownDelayOver = (time - lastSeenTooltipTime) >= timeBetweenTooltips;
		let isClipDelayOver = (time - lastSeenClipTime) >= timeBetweenTooltips;

		// Only shows if it has been >= 3 weeks since the User saw a tooltip AND it has been >= 3 weeks
		// since their last Clip of this specific TooltipType
		return isTooltipShownDelayOver && isClipDelayOver;
	}

	public static getStorageKeyForTooltip(storageKeyBase: string, tooltipType: TooltipType): string {
		if (Utils.isNullOrUndefined(storageKeyBase) || Utils.isNullOrUndefined(tooltipType)) {
			throw new Error("Invalid argument passed to getStorageKeyForTooltip");
		}

		return storageKeyBase + TooltipType[tooltipType];
	}
}
