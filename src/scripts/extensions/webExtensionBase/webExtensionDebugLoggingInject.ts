import {DebugLoggingInject} from "../debugLoggingInject";
import {InjectOptions} from "../injectOptions";

export function invoke(options: InjectOptions) {
	DebugLoggingInject.main(options);
}
