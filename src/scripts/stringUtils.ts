import { Utils } from "./utils";
import * as _ from "lodash";

export module StringUtils {

	// Takes a range of the form 1,3-6,7,8,13,1,3,4,a-b, etc. and then returns an array
	// corresponding to the numbers in that range. It ignores invalid input, sorts it, and removes duplicates
	export function parsePageRange(text: string): number[] {
		if (Utils.isNullOrUndefined(text)) {
			return;
		}

		text = text.trim();

		if (text === "") {
			return [];
		}

		let splitText = text.split(",");
		let range: number[] = [];

		for (let i = 0; i < splitText.length; ++i) {
			let valueToAppend: number[] = [], matches;
			let currentValue = splitText[i].trim();

			if (/^\d+$/.test(currentValue)) {
				let digit = parseInt(currentValue, 10 /* radix */);
				if (digit === 0) {
					return undefined;
				}
				valueToAppend = [digit];
				// ... or it could a range of the form [#]-[#]
			} else if (matches = /^(\d+)\s*-\s*(\d+)$/.exec(currentValue)) {
				let lhs = parseInt(matches[1], 10), rhs = parseInt(matches[2], 10) + 1;
				// Disallow ranges like 5-3, or 10-1
				if (lhs >= rhs || lhs === 0 || rhs === 0) {
					return undefined;
				}
				valueToAppend = _.range(lhs, rhs);
			} else {
				// The currentValue is not a single digit or a valid range
				return undefined;
			}

			range = range.concat(valueToAppend);
		}

		return _(range).sortBy().sortedUniq().value();
	}

	export function countPageRange(text: string): number {
		let pages = parsePageRange(text);
		return pages ? pages.length : 0;
	}
}
