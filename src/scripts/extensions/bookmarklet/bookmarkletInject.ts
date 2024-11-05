declare var frameUrl: string;
declare var bookmarkletRoot: string;

import {IFrameMessageHandler} from "../../communicator/iframeMessageHandler";

import {ClipperInject, ClipperInjectOptions} from "../../extensions/clipperInject";
import {DebugLoggingInject} from "../../extensions/debugLoggingInject";
import {UnsupportedBrowserInject} from "../../extensions/unsupportedBrowserInject";
import {BrowserUtils} from "../../browserUtils";

import {InjectHelper} from "../injectHelper";

if (BrowserUtils.browserNotSupported()) {
	UnsupportedBrowserInject.main();
} else if (InjectHelper.isKnownUninjectablePage(self.location.href)) {
	InjectHelper.alertUserOfUnclippablePage();
} else {
	let clipperUrl = bookmarkletRoot + "/clipper.html";
	let options: ClipperInjectOptions = {
		frameUrl: clipperUrl,
		enableAddANote: false,
		enableEditableTitle: false,
		enableRegionClipping: false,
		useInlineBackgroundWorker: true
	};

	// We don't pass a messageHandler for the background Extension since we set useInlineBackgroundWorker above
	let clipperInject = ClipperInject.main(options);

	// We need to pass the frame of the Clipper into the debug logging inject code as that's where the extension lives
	DebugLoggingInject.main({
		extMessageHandlerThunk: () => {
			return new IFrameMessageHandler(() => { return clipperInject.getFrame().contentWindow; });
		}
	});
}
