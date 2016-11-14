export module ObjectUtils {
	// TODO replace with _extend
	export function createUpdatedObject(old: {}, additions: {}): {} {
		let retVal = {};
		if (old) {
			for (let key in old) {
				if (old.hasOwnProperty(key)) {
					retVal[key] = old[key];
				}
			}
		}
		if (additions) {
			for (let key in additions) {
				if (additions.hasOwnProperty(key)) {
					retVal[key] = additions[key];
				}
			}
		}
		return retVal;
	}

	export function isNumeric(varToCheck: any) {
		return typeof varToCheck === "number" && !isNaN(varToCheck);
	}

	export function isNullOrUndefined(varToCheck: any) {
		/* tslint:disable:no-null-keyword */
		if (varToCheck === null || varToCheck === undefined) {
			return true;
		}
		return false;
		/* tslint:enable:no-null-keyword */
	}
}
