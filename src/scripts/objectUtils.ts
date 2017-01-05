export class ObjectUtils {
	public static isNumeric(varToCheck: any) {
		return typeof varToCheck === "number" && !isNaN(varToCheck);
	}

	public static isNullOrUndefined(varToCheck: any) {
		/* tslint:disable:no-null-keyword */
		return varToCheck === null || varToCheck === undefined;
		/* tslint:enable:no-null-keyword */
	}
}
