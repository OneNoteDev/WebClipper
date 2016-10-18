import * as _ from "lodash";

export module StringUtils {
	// Takes a range of the form 1,3-6,7,8,13,1,3,4,a-b, etc. and then returns an array
	// corresponding to the numbers in that range. It ignores invalid input, sorts it, and removes duplicates
	export function parsePageRange(text: string): number[] {
		let initialRange = text.split(",").reduce((previousValue, currentValue) => {
			let valueToAppend: number[] = [], matches;
			// The value could be a single digit
			if (/^\d+$/.test(currentValue)) {
				valueToAppend = [parseInt(currentValue, 10 /* radix */)];
				// ... or it could a range of the form [#]-[#]
			} else if (matches = /^(\d+)-(\d+)$/.exec(currentValue)) {
				let lhs = parseInt(matches[1], 10), rhs = parseInt(matches[2], 10) + 1;
				// TODO: what do we do if start > end? This is a behavior question, not an implementation one
				valueToAppend = _.range(lhs, rhs);
			}
			return previousValue = previousValue.concat(valueToAppend);
		}, []);
		return _(initialRange).sortBy().sortedUniq().map((page) => { return page - 1; }).value();
	}
}
