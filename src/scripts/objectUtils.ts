export module ObjectUtils {
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
