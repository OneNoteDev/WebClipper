import {LogMethods} from "../log";

export interface LogDataPackage {
	methodName: LogMethods;
	methodArgs: IArguments | Array<any>;
}
