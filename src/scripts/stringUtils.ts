import {ObjectUtils} from "./objectUtils";
import {OperationResult} from "./operationResult";

import {Localization} from "./localization/localization";

import {Status} from "./clipperUI/status";

import * as _ from "lodash";

export interface ParsedPageRange {
	status: OperationResult;
	result: number[] | string;
}

export class StringUtils {
	/**
	 * Takes a range of the form 1,3-6,7,8,13,1,3,4,a-b, etc. and then returns an array
	 * corresponding to the numbers in that range. It ignores invalid input, sorts it, and removes duplicates
	 */
	public static parsePageRange(text: string, maxRange?: number): ParsedPageRange {
		if (ObjectUtils.isNullOrUndefined(text)) {
			return this.asFailedOperation("");
		}

		text = text.trim();

		if (text === "") {
			return this.asFailedOperation("");
		}

		let splitText = text.split(",");
		let range: number[] = [];

		for (let page of splitText) {
			let valueToAppend: number[] = [];
			let matches: RegExpExecArray;
			let currentValue = page.trim();

			if (currentValue === "") {
				// We relax the restriction by allowing and ignoring whitespace between commas
				continue;
			}

			if (/^\d+$/.test(currentValue)) {
				let digit = parseInt(currentValue, 10 /* radix */);
				if (digit === 0 || !ObjectUtils.isNullOrUndefined(maxRange) && digit > maxRange) {
					return this.asFailedOperation(currentValue);
				}
				valueToAppend = [digit];
				// ... or it could a range of the form [#]-[#]
			} else if (matches = /^(\d+)\s*-\s*(\d+)$/.exec(currentValue)) {
				let lhs = parseInt(matches[1], 10), rhs = parseInt(matches[2], 10);
				// Try and catch an invalid range as soon as possible, before we compute the range
				// We also define a maxRangeAllowed as 2^32, which is the max size of an array in JS
				const maxRangeSizeAllowed = 4294967295;
				if (lhs >= rhs || lhs === 0 || rhs === 0 || lhs >= maxRangeSizeAllowed || rhs >= maxRangeSizeAllowed ||
					rhs - lhs + 1 > maxRangeSizeAllowed || (!ObjectUtils.isNullOrUndefined(maxRange) && rhs > maxRange)) {
					return this.asFailedOperation(currentValue);
				}
				valueToAppend = _.range(lhs, rhs + 1);
			} else {
				// The currentValue is not a single digit or a valid range
				return this.asFailedOperation(currentValue);
			}

			range = range.concat(valueToAppend);
		}

		let parsedPageRange = _(range).sortBy().sortedUniq().value();

		if (parsedPageRange.length === 0) {
			return this.asFailedOperation(text);
		}

		const last = _.last(parsedPageRange);
		if (!ObjectUtils.isNullOrUndefined(maxRange) && last > maxRange) {
			return this.asFailedOperation(last.toString());
		}

		return this.asSucceededOperation(parsedPageRange);
	}

	public static countPageRange(text: string): number {
		let operation = this.parsePageRange(text);
		if (operation.status !== OperationResult.Succeeded) {
			return 0;
		}

		const pages = operation.result;
		return pages ? pages.length : 0;
	}

	public static getBatchedPageTitle(titleOfDocument: string, pageIndex: number): string {
		const firstPageNumberAsString = (pageIndex + 1).toString();
		return titleOfDocument + ": " + Localization.getLocalizedString("WebClipper.Label.Page") + " " + firstPageNumberAsString;
	}

	public static generateGuid(): string {
		return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
			let r = Math.random() * 16 | 0, v = c === "x" ? r : (r & 0x3 | 0x8);
			return v.toString(16);
		});
	}

	private static asSucceededOperation<T>(obj: T): { status: OperationResult, result: T } {
		return {
			status: OperationResult.Succeeded,
			result: obj
		};
	}

	private static asFailedOperation<T>(obj: T): { status: OperationResult, result: T } {
		return {
			status: OperationResult.Failed,
			result: obj
		};
	}
}
