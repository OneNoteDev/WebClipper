import {invoke} from "../webExtensionBase/webExtensionDebugLoggingInject";
import {WebExtension} from "../webExtensionBase/webExtension";
import {WebExtensionContentMessageHandler} from "../webExtensionBase/webExtensionMessageHandler";

declare var browser;
WebExtension.browser = browser;

invoke({ extMessageHandlerThunk: () => { return new WebExtensionContentMessageHandler(); } });
