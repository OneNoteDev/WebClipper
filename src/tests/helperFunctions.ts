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
	export function mockSetTimeout() {
		theRealSetTimeout = setTimeout;
		setTimeout = (func: (...args: any[]) => void, timeout: number) => {
			return theRealSetTimeout(func, 0);
		};
	}

	export function restoreSetTimeout() {
		setTimeout = theRealSetTimeout;
	}
}
