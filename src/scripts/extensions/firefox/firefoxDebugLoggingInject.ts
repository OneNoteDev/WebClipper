import {invoke} from "../webExtensionBase/webExtensionDebugLoggingInject";
import {WebExtension} from "../webExtensionBase/webExtension";
import {WebExtensionContentMessageHandler} from "../webExtensionBase/webExtensionMessageHandler";

WebExtension.browser = chrome;

invoke({ extMessageHandlerThunk: () => { return new WebExtensionContentMessageHandler(); } });
