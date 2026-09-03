import {ClientType} from "../../clientType";
import {WebExtension} from "../webExtensionBase/webExtension";

// Firefox exposes the callback-based chrome namespace used by the shared implementation.
WebExtension.browser = chrome;
let clipperBackground = new WebExtension(ClientType.FirefoxExtension);
