import {ClipperInject, ClipperInjectOptions} from "../clipperInject";
import {WebExtensionContentMessageHandler} from "./webExtensionMessageHandler";

export function invoke(oneNoteClipperOptions: ClipperInjectOptions) {
	ClipperInject.main(oneNoteClipperOptions);
}
