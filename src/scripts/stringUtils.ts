import {ObjectUtils} from "./objectUtils";
import {OperationResult} from "./operationResult";

import {Localization} from "./localization/localization";

import {Status} from "./clipperUI/status";

import * as _ from "lodash";

export module StringUtils {
	export interface ParsedPageRange {
		status: OperationResult;
		result: number[] | string;
	}

	/**
	 * Takes a range of the form 1,3-6,7,8,13,1,3,4,a-b, etc. and then returns an array
	 * corresponding to the numbers in that range. It ignores invalid input, sorts it, and removes duplicates
	 */
	export function parsePageRange(text: string, maxRange?: number): ParsedPageRange {
		if (ObjectUtils.isNullOrUndefined(text)) {
			return {
				status: OperationResult.Failed,
				result: ""
			};
		}

		text = text.trim();

		if (text === "") {
			return {
				status: OperationResult.Failed,
				result: ""
			};
		}

		let splitText = text.split(",");
		let range: number[] = [];

		for (let i = 0; i < splitText.length; ++i) {
			let valueToAppend: number[] = [], matches;
			let currentValue = splitText[i].trim();

			if (currentValue === "") {
				// We relax the restriction by allowing and ignoring whitespace between commas
				continue;
			}

			if (/^\d+$/.test(currentValue)) {
				let digit = parseInt(currentValue, 10 /* radix */);
				if (digit === 0) {
					return {
						status: OperationResult.Failed,
						result: currentValue
					};
				}
				valueToAppend = [digit];
				// ... or it could a range of the form [#]-[#]
			} else if (matches = /^(\d+)\s*-\s*(\d+)$/.exec(currentValue)) {
				let lhs = parseInt(matches[1], 10), rhs = parseInt(matches[2], 10) + 1;
				// Disallow ranges like 5-3, or 10-1
				if (lhs >= rhs || lhs === 0 || rhs === 0) {
					return {
						status: OperationResult.Failed,
						result: currentValue
					};
				}
				valueToAppend = _.range(lhs, rhs);
			} else {
				// The currentValue is not a single digit or a valid range
				return {
					status: OperationResult.Failed,
					result: currentValue
				};
			}

			range = range.concat(valueToAppend);
		}

		let parsedPageRange = _(range).sortBy().sortedUniq().value();
		const last = _.last(parsedPageRange);
		if (maxRange && (_.last(parsedPageRange) > maxRange)) {
			return {
				status: OperationResult.Failed,
				result: last.toString()
			};
		}

		return {
			status: OperationResult.Succeeded,
			result: parsedPageRange
		};
	}

	export function countPageRange(text: string): number {
		let operation = parsePageRange(text);
		if (operation.status !== OperationResult.Succeeded) {
			return 0;
		}

		const pages = operation.result;
		return pages ? pages.length : 0;
	}

	export function getBatchedPageTitle(titleOfDocument: string, pageIndex: number): string {
		const firstPageNumberAsString = (pageIndex + 1).toString();
		return titleOfDocument + ": " + Localization.getLocalizedString("WebClipper.Label.Page") + " " + firstPageNumberAsString;
	}

	export function generateGuid(): string {
		return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, c => {
			let r = Math.random() * 16 | 0, v = c === "x" ? r : (r & 0x3 | 0x8);
			return v.toString(16);
		});
	}
}
