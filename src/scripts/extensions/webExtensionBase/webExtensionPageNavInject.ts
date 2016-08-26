import {FrameInjectOptions} from "../injectOptions";
import {PageNavInject} from "../pageNavInject";

export function invoke(options: FrameInjectOptions) {
	PageNavInject.main(options);
}
