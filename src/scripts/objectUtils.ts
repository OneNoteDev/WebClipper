export module ObjectUtils {
	export function isNumeric(varToCheck: any) {
		return typeof varToCheck === "number" && !isNaN(varToCheck);
	}

	export function isNullOrUndefined(varToCheck: any) {
		/* tslint:disable:no-null-keyword */
		return varToCheck === null || varToCheck === undefined;
		/* tslint:enable:no-null-keyword */
	}
}
