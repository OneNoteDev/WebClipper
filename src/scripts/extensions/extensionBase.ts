import {ClientInfo} from "../clientInfo";
import {ClientType} from "../clientType";
import {Constants} from "../constants";
import {StringUtils} from "../stringUtils";

import {SmartValue} from "../communicator/smartValue";

import {Localization} from "../localization/localization";
import {LocalizationHelper} from "../localization/localizationHelper";

import * as Log from "../logging/log";
import {Logger} from "../logging/logger";

import {ClipperData} from "../storage/clipperData";
import {ClipperStorageKeys} from "../storage/clipperStorageKeys";

import {AuthenticationHelper} from "./authenticationHelper";
import {ExtensionWorkerBase} from "./extensionWorkerBase";
import {WorkerPassthroughLogger} from "./workerPassthroughLogger";

/**
 * The abstract base class for all of the extensions
 */
export abstract class ExtensionBase<TWorker extends ExtensionWorkerBase<TTab, TTabIdentifier>, TTab, TTabIdentifier> {
	private workers: TWorker[];
	private logger: Logger;
	private static extensionId: string;

	protected clipperIdProcessed: Promise<void>;
	protected clipperData: ClipperData;
	protected auth: AuthenticationHelper;
	protected clientInfo: SmartValue<ClientInfo>;
	protected static version = "3.11.1";

	constructor(clipperType: ClientType, clipperData: ClipperData) {
		this.workers = [];
		this.logger = new WorkerPassthroughLogger(this.workers);
		this.setUnhandledExceptionLogging();
		ExtensionBase.extensionId = StringUtils.generateGuid();

		this.clipperData = clipperData;
		this.clipperData.setLogger(this.logger);
		this.auth = new AuthenticationHelper(this.clipperData, this.logger);

		this.clipperIdProcessed = this.clipperData.getValue(ClipperStorageKeys.clipperId).then((clipperId) => {
			let clipperFirstRun = false;
			if (!clipperId) {
				clipperFirstRun = true;
				clipperId = ExtensionBase.generateClipperId();
				this.clipperData.setValue(ClipperStorageKeys.clipperId, clipperId);
			}

			this.clientInfo = new SmartValue<ClientInfo>({
				clipperType: clipperType,
				clipperVersion: ExtensionBase.getExtensionVersion(),
				clipperId: clipperId
			});

			if (clipperFirstRun) {
				this.onFirstRun();
			}

			this.initializeUserFlighting();
		});
	}

	protected abstract getIdFromTab(tab: TTab): TTabIdentifier;
	protected abstract createWorker(tab: TTab): TWorker;
	protected abstract onFirstRun();

	public static getExtensionId(): string {
		return ExtensionBase.extensionId;
	}

	public static getExtensionVersion(): string {
		try {
			return chrome.runtime.getManifest().version;
		} catch (e) {
			return ExtensionBase.version;
		}
	}

	public addWorker(worker: TWorker) {
		this.workers.push(worker);
	}

	public getWorkers(): TWorker[] {
		return this.workers;
	}

	public removeWorker(worker: TWorker) {
		let index = this.workers.indexOf(worker);
		if (index > -1) {
			this.workers.splice(index, 1);
		}
	}

	/**
	 * Determines if the url is on our domain or not
	 */
	protected static isOnOneNoteDomain(url: string): boolean {
		return url.indexOf("onenote.com") >= 0 || url.indexOf("onenote-int.com") >= 0;
	}

	protected fetchAndStoreLocStrings(): Promise<{}> {
		// navigator.userLanguage is only available in IE, and Typescript will not recognize this property
		let locale = navigator.language || (<any>navigator).userLanguage;

		return LocalizationHelper.makeLocStringsFetchRequest(locale).then((responsePackage) => {
			try {
				let locStringsDict = JSON.parse(responsePackage.parsedResponse);
				if (locStringsDict) {
					this.clipperData.setValue(ClipperStorageKeys.locale, locale);
					// Match the TimeStampedData shape used by CachedHttp.getFreshValue so a
					// later per-click locStrings refresh can compare lastUpdated and skip the
					// network if this boot fetch is still within the 12h TTL.
					let timeStampedValue = JSON.stringify({ data: locStringsDict, lastUpdated: Date.now() });
					this.clipperData.setValue(ClipperStorageKeys.locStrings, timeStampedValue);
					Localization.setLocalizedStrings(locStringsDict);
				}
				return Promise.resolve(locStringsDict);
			} catch (e) {
				return Promise.reject(undefined);
			}
		});
	}

	/**
	 * Returns the URL for more information about the Clipper
	 */
	protected getClipperInstalledPageUrl(clipperId: string, clipperType: ClientType, isInlineInstall: boolean): string {
		let installUrl: string = Constants.Urls.clipperInstallPageUrl;

		this.logger.logTrace(Log.Trace.Label.RequestForClipperInstalledPageUrl, Log.Trace.Level.Information, installUrl);

		return installUrl;
	}

	protected getExistingWorkerForTab(tabUniqueId: TTabIdentifier): TWorker {
		let workers = this.getWorkers();
		for (let worker of workers) {
			if (worker.getUniqueId() === tabUniqueId) {
				return worker;
			}
		}
		return undefined;
	}

	protected getOrCreateWorkerForTab(tab: TTab, tabToIdMapping: (tab: TTab) => TTabIdentifier): TWorker {
		let tabId = tabToIdMapping(tab);
		let worker = this.getExistingWorkerForTab(tabId);
		if (!worker) {
			worker = this.createWorker(tab);
			this.addWorker(worker);
		}
		return worker;
	}

	/**
	 * Generates a new clipperId, should only be called on first run
	 */
	private static generateClipperId(): string {
		let clipperPrefix = "ON";
		return clipperPrefix + "-" + StringUtils.generateGuid();
	}

	/**
	 * Initializes the flighting info for the user.
	 */
	private initializeUserFlighting() {
		// We don't have any flights
		this.updateClientInfoWithFlightInformation([]);
	}

	private setUnhandledExceptionLogging() {
		let oldOnError = self.onerror;
		self.onerror = (message: string, filename?: string, lineno?: number, colno?: number, error?: Error) => {
			let callStack = error ? Log.Failure.getStackTrace(error) : "[unknown stacktrace]";

			Log.ErrorUtils.sendFailureLogRequest(this.logger, {
				label: Log.Failure.Label.UnhandledExceptionThrown,
				properties: {
					failureType: Log.Failure.Type.Unexpected,
					failureInfo: { error: JSON.stringify({ error: error.toString(), message: message, lineno: lineno, colno: colno }) },
					failureId: "ExtensionBase",
					stackTrace: callStack
				},
				clientInfo: this.clientInfo
			});

			if (oldOnError) {
				oldOnError(message, filename, lineno, colno, error);
			}
		};
	}

	/**
	 * Updates the ClientInfo with the given flighting info.
	 */
	private updateClientInfoWithFlightInformation(flightingInfo: string[]) {
		this.clientInfo.set({
			clipperType: this.clientInfo.get().clipperType,
			clipperVersion: this.clientInfo.get().clipperVersion,
			clipperId: this.clientInfo.get().clipperId,
			flightingInfo: flightingInfo
		});
	}
}
