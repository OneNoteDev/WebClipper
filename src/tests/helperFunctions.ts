/// <reference path="../../node_modules/onenoteapi/target/oneNoteApi.d.ts" />

import * as sinon from "sinon";

import {ClientType} from "../scripts/clientType";

import {ClipMode} from "../scripts/clipperUI/clipMode";
import {ClipperState} from "../scripts/clipperUI/clipperState";
import {Clipper} from "../scripts/clipperUI/frontEndGlobals";
import {MainControllerProps} from "../scripts/clipperUI/mainController";
import {Status} from "../scripts/clipperUI/status";

import {ModeButtonProps} from "../scripts/clipperUI/components/modeButton";

import {Communicator} from "../scripts/communicator/communicator";
import {SmartValue} from "../scripts/communicator/smartValue";

import {PdfScreenshotResult} from "../scripts/contentCapture/pdfScreenshotHelper";

import {InvokeMode} from "../scripts/extensions/invokeOptions";

import {Localization} from "../scripts/localization/localization";

import * as Log from "../scripts/logging/log";
import {ConsoleLoggerDecorator} from "../scripts/logging/consoleLoggerDecorator";
import {StubSessionLogger} from "../scripts/logging/stubSessionLogger";
import {ProductionRequirements} from "../scripts/logging/context";

import {ChangeLog} from "../scripts/versioning/changeLog";

import {Settings} from "../scripts/settings";
import {UpdateReason} from "../scripts/userInfo";

import {MockMessageHandler} from "./communicator/mockMessageHandler";

import {MockConsole} from "./logging/mockConsole";

let theRealSetTimeout;
declare let setTimeout;

/**
 * Common functions required across multiple test files
 */
export module HelperFunctions {
	export function getMockRequiredContextProperties(): any {
		let requiredContextProperties = { };
		requiredContextProperties[Log.Context.toString(Log.Context.Custom.BrowserLanguage)] = "en-US";
		requiredContextProperties[Log.Context.toString(Log.Context.Custom.ClipperType)] = "ChromeExtension";
		requiredContextProperties[Log.Context.toString(Log.Context.Custom.FlightInfo)] = "muidflt60-clprin;premuidflt104-oit1;didfloatie";
		requiredContextProperties[Log.Context.toString(Log.Context.Custom.InvokeHostname)] = "www.onenote.com";
		requiredContextProperties[Log.Context.toString(Log.Context.Custom.PageLanguage)] = "en";
		return requiredContextProperties;
	}

	export function getMockRequiredApplicationProperties(): any {
		let requiredApplicationProperties = { };
		requiredApplicationProperties[Log.Context.toString(Log.Context.Custom.AppInfoId)] = Settings.getSetting("App_Id");
		requiredApplicationProperties[Log.Context.toString(Log.Context.Custom.AppInfoVersion)] = "3.0.0";
		requiredApplicationProperties[Log.Context.toString(Log.Context.Custom.DeviceInfoId)] = "ON-a47884e1-f64c-4dfd-ad49-49508f0ae05f";
		return requiredApplicationProperties;
	}

	export function mockSetTimeout() {
		theRealSetTimeout = setTimeout;
		setTimeout = (func: (...args: any[]) => void, timeout: number) => {
			return theRealSetTimeout(func, 0);
		};
	}

	export function restoreSetTimeout() {
		setTimeout = theRealSetTimeout;
	}

	export function mockFrontEndGlobals(mockStorageRef: { [key: string]: string }, mockStorageCacheRef: { [key: string]: string }) {
		Clipper.getStoredValue = (key: string, callback: (value: string) => void, cacheValue?: boolean) => {
			if (cacheValue) {
				mockStorageCacheRef[key] = mockStorageRef[key];
			}
			callback(mockStorageRef[key]);
		};
		Clipper.storeValue = (key: string, value: string) => {
			if (key in mockStorageCacheRef) {
				mockStorageCacheRef[key] = value;
			}
			mockStorageRef[key] = value;
		};
		Clipper.preCacheStoredValues = (storageKeys: string[]) => {
			for (let key of storageKeys) {
				Clipper.getStoredValue(key, () => { }, true);
			}
		};
		Clipper.getCachedValue = (key: string) => {
			return mockStorageCacheRef[key];
		};
		Clipper.logger = new StubSessionLogger();
	}
}
