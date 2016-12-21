import {ClientInfo} from "../clientInfo";
import {ClientType} from "../clientType";
import {Constants} from "../constants";
import {Experiments} from "../experiments";
import {ResponsePackage} from "../responsePackage";
import {StringUtils} from "../stringUtils";
import {UrlUtils} from "../urlUtils";

import {TooltipType} from "../clipperUI/tooltipType";

import {SmartValue} from "../communicator/smartValue";

import {HttpWithRetries} from "../http/HttpWithRetries";

import {Localization} from "../localization/localization";
import {LocalizationHelper} from "../localization/localizationHelper";

import * as Log from "../logging/log";
import {Logger} from "../logging/logger";

import {ClipperData} from "../storage/clipperData";
import {ClipperStorageKeys} from "../storage/clipperStorageKeys";

import {ChangeLog} from "../versioning/changeLog";
import {ChangeLogHelper} from "../versioning/changeLogHelper";
import {Version} from "../versioning/version";

import {AuthenticationHelper} from "./authenticationHelper";
import {ExtensionWorkerBase} from "./extensionWorkerBase";
import {TooltipHelper} from "./tooltipHelper";
import {WorkerPassthroughLogger} from "./workerPassthroughLogger";

/**
 * The abstract base class for all of the extensions
 */
export abstract class ExtensionBase<TWorker extends ExtensionWorkerBase<TTab, TTabIdentifier>, TTab, TTabIdentifier> {
	private workers: TWorker[];
	private logger: Logger;
	private static extensionId: string;

	protected clipperData: ClipperData;
	protected auth: AuthenticationHelper;
	protected tooltip: TooltipHelper;
	protected clientInfo: SmartValue<ClientInfo>;
	protected static version = "3.3.1";

	constructor(clipperType: ClientType, clipperData: ClipperData) {
		this.setUnhandledExceptionLogging();

		this.workers = [];
		this.logger = new WorkerPassthroughLogger(this.workers);
		ExtensionBase.extensionId = StringUtils.generateGuid();

		this.clipperData = clipperData;
		this.clipperData.setLogger(this.logger);
		this.auth = new AuthenticationHelper(this.clipperData, this.logger);
		this.tooltip = new TooltipHelper(this.clipperData);

		let clipperFirstRun = false;

		let clipperId = this.clipperData.getValue(ClipperStorageKeys.clipperId);
		if (!clipperId) {
			// New install
			clipperFirstRun = true;
			clipperId = ExtensionBase.generateClipperId();
			this.clipperData.setValue(ClipperStorageKeys.clipperId, clipperId);

			// Ensure fresh installs don't trigger thats What's New experience
			this.updateLastSeenVersionInStorageToCurrent();
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

		this.listenForOpportunityToShowPageNavTooltip();
	}

	protected abstract addPageNavListener(callback: (tab: TTab) => void);
	protected abstract checkIfTabIsOnWhitelistedUrl(tab: TTab): boolean;
	protected abstract getIdFromTab(tab: TTab): TTabIdentifier;
	protected abstract createWorker(tab: TTab): TWorker;
	protected abstract onFirstRun();

	public static getExtensionId(): string {
		return ExtensionBase.extensionId;
	}

	public static getExtensionVersion(): string {
		return ExtensionBase.version;
	}

	public static shouldCheckForMajorUpdates(lastSeenVersion: Version, currentVersion: Version) {
		return !!currentVersion && (!lastSeenVersion || lastSeenVersion.isLesserThan(currentVersion));
	};

	public addWorker(worker: TWorker) {
		worker.setOnUnloading(() => {
			worker.destroy();
			this.removeWorker(worker);
		});
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
					this.clipperData.setValue(ClipperStorageKeys.locStrings, responsePackage.parsedResponse);
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

		installUrl = UrlUtils.addUrlQueryValue(installUrl, Constants.Urls.QueryParams.clientType, ClientType[clipperType]);
		installUrl = UrlUtils.addUrlQueryValue(installUrl, Constants.Urls.QueryParams.clipperId, clipperId);
		installUrl = UrlUtils.addUrlQueryValue(installUrl, Constants.Urls.QueryParams.clipperVersion,  ExtensionBase.getExtensionVersion());
		installUrl = UrlUtils.addUrlQueryValue(installUrl, Constants.Urls.QueryParams.inlineInstall, isInlineInstall.toString());

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

	/**
	 * Gets the last seen version from storage, and returns undefined if there is none in storage
	 */
	protected getLastSeenVersion(): Version {
		let lastSeenVersionStr = this.clipperData.getValue(ClipperStorageKeys.lastSeenVersion);
		return lastSeenVersionStr ? new Version(lastSeenVersionStr) : undefined;
	}

	protected getNewUpdates(lastSeenVersion: Version, currentVersion: Version): Promise<ChangeLog.Update[]> {
		return new Promise<ChangeLog.Update[]>((resolve, reject) => {
			let localeOverride = this.clipperData.getValue(ClipperStorageKeys.displayLanguageOverride);
			let localeToGet = localeOverride || navigator.language || (<any>navigator).userLanguage;
			let changelogUrl = UrlUtils.addUrlQueryValue(Constants.Urls.changelogUrl, Constants.Urls.QueryParams.changelogLocale, localeToGet);
			HttpWithRetries.get(changelogUrl).then((request: XMLHttpRequest) => {
				try {
					let schemas: ChangeLog.Schema[] = JSON.parse(request.responseText);
					let allUpdates: ChangeLog.Update[];
					for (let i = 0; i < schemas.length; i++) {
						if (schemas[i].schemaVersion === ChangeLog.schemaVersionSupported) {
							allUpdates = schemas[i].updates;
							break;
						}
					}

					if (allUpdates) {
						let updatesSinceLastVersion = ChangeLogHelper.getUpdatesBetweenVersions(allUpdates, lastSeenVersion, currentVersion);
						resolve(updatesSinceLastVersion);
					} else {
						throw new Error("No matching schemas were found.");
					}
				} catch (error) {
					reject(error);
				}
			}, (error) => {
				reject(error);
			});
		});
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
		let getFlightingEvent: Log.Event.PromiseEvent = new Log.Event.PromiseEvent(Log.Event.Label.GetFlightingAssignments);

		this.getFlightingAssignments(this.clientInfo.get().clipperId).then((flights: string[]) => {
			this.updateClientInfoWithFlightInformation(flights);
		}).catch((error: OneNoteApi.GenericError) => {
			this.updateClientInfoWithFlightInformation([]);

			getFlightingEvent.setStatus(Log.Status.Failed);
			getFlightingEvent.setFailureInfo(error);
		}).then(() => {
			this.logger.logEvent(getFlightingEvent);
		});
	}

	/**
	 * Returns the current flighting assignment for the user
	 */
	private getFlightingAssignments(clipperId: string): Promise<any> {
		let fetchNonLocalData = () => {
			return new Promise<ResponsePackage<string>>((resolve, reject) => {
				let userFlightUrl = UrlUtils.addUrlQueryValue(Constants.Urls.userFlightingEndpoint, Constants.Urls.QueryParams.clipperId, clipperId);
				HttpWithRetries.get(userFlightUrl).then((request) => {
					resolve({
						request: request,
						parsedResponse: request.responseText
					});
				});
			});
		};

		return this.clipperData.getFreshValue(ClipperStorageKeys.flightingInfo, fetchNonLocalData, Experiments.updateIntervalForFlights).then((successfulResponse) => {
			// The response comes as a string array in the form [flight1, flight2, flight3],
			// needs to be in CSV format for ODIN cooker, so we rejoin w/o spaces
			let parsedResponse: string[] = successfulResponse.data.Features ? successfulResponse.data.Features : [];
			return Promise.resolve(parsedResponse);
		});
	}

	private shouldShowTooltip(tab: TTab, tooltipTypes: TooltipType[]): TooltipType {
		let type = this.checkIfTabMatchesATooltipType(tab, tooltipTypes);

		if (!type) {
			return;
		}

		if (!this.tooltip.tooltipDelayIsOver(type, Date.now())) {
			return;
		}

		return type;
	}

	private shouldShowVideoTooltip(tab: TTab): boolean {
		if (this.checkIfTabIsAVideoDomain(tab) && this.tooltip.tooltipDelayIsOver(TooltipType.Video, Date.now())) {
			return true;
		}
		return false;
	}

	private showTooltip(tab: TTab, tooltipType: TooltipType): void {
		let worker = this.getOrCreateWorkerForTab(tab, this.getIdFromTab);
		let tooltipImpressionEvent = new Log.Event.BaseEvent(Log.Event.Label.TooltipImpression);
		tooltipImpressionEvent.setCustomProperty(Log.PropertyName.Custom.TooltipType, TooltipType[tooltipType]);
		tooltipImpressionEvent.setCustomProperty(Log.PropertyName.Custom.LastSeenTooltipTime, this.tooltip.getTooltipInformation(ClipperStorageKeys.lastSeenTooltipTimeBase, tooltipType));
		tooltipImpressionEvent.setCustomProperty(Log.PropertyName.Custom.NumTimesTooltipHasBeenSeen, this.tooltip.getTooltipInformation(ClipperStorageKeys.numTimesTooltipHasBeenSeenBase, tooltipType));
		worker.invokeTooltip(tooltipType).then((wasInvoked) => {
			if (wasInvoked) {
				this.tooltip.setTooltipInformation(ClipperStorageKeys.lastSeenTooltipTimeBase, tooltipType, Date.now().toString());
				let numSeenStorageKey = ClipperStorageKeys.numTimesTooltipHasBeenSeenBase;
				let numTimesSeen = this.tooltip.getTooltipInformation(numSeenStorageKey, tooltipType) + 1;
				this.tooltip.setTooltipInformation(ClipperStorageKeys.numTimesTooltipHasBeenSeenBase, tooltipType, numTimesSeen.toString());
			}
			tooltipImpressionEvent.setCustomProperty(Log.PropertyName.Custom.FeatureEnabled, wasInvoked);
			worker.getLogger().logEvent(tooltipImpressionEvent);
		});
	}

	private shouldShowWhatsNewTooltip(tab: TTab, lastSeenVersion: Version, extensionVersion: Version): boolean {
		// We explicitly check for control group as well so we prevent updating lastSeenVersion on everyone before the experiment starts
		return this.checkIfTabIsOnWhitelistedUrl(tab) && ExtensionBase.shouldCheckForMajorUpdates(lastSeenVersion, extensionVersion);
	}

	private showWhatsNewTooltip(tab: TTab, lastSeenVersion: Version, extensionVersion: Version): void {
		this.getNewUpdates(lastSeenVersion, extensionVersion).then((newUpdates) => {
			let filteredUpdates = ChangeLogHelper.filterUpdatesThatDontApplyToBrowser(newUpdates, ClientType[this.clientInfo.get().clipperType]);
			if (!!filteredUpdates && filteredUpdates.length > 0) {
				let worker: TWorker = this.getOrCreateWorkerForTab(tab, this.getIdFromTab);
				worker.invokeWhatsNewTooltip(filteredUpdates).then((wasInvoked) => {
					if (wasInvoked) {
						let whatsNewImpressionEvent = new Log.Event.BaseEvent(Log.Event.Label.WhatsNewImpression);
						whatsNewImpressionEvent.setCustomProperty(Log.PropertyName.Custom.FeatureEnabled, wasInvoked);
						worker.getLogger().logEvent(whatsNewImpressionEvent);

						// We don't want to do this if the tooltip was not invoked (e.g., on about:blank) so we can show it at the next opportunity
						this.updateLastSeenVersionInStorageToCurrent();
					}
				});
			} else {
				this.updateLastSeenVersionInStorageToCurrent();
			}
		}, (error) => {
			Log.ErrorUtils.sendFailureLogRequest({
				label: Log.Failure.Label.GetChangeLog,
				properties: {
					failureType: Log.Failure.Type.Unexpected,
					failureInfo: { error: error },
					failureId: "GetChangeLog",
					stackTrace: error
				},
				clientInfo: this.clientInfo
			});
		});
	}

	/**
	 * Skeleton method that sets a listener that listens for the opportunity to show a tooltip,
	 * then invokes it when appropriate.
	 */
	private listenForOpportunityToShowPageNavTooltip() {
		this.addPageNavListener((tab: TTab) => {
			// Fallback behavior for if the last seen version in storage is somehow in a corrupted format
			let lastSeenVersion: Version;
			try {
				lastSeenVersion = this.getLastSeenVersion();
			} catch (e) {
				this.updateLastSeenVersionInStorageToCurrent();
				return;
			}

			let extensionVersion = new Version(ExtensionBase.getExtensionVersion());

			if (this.clientInfo.get().clipperType !== ClientType.FirefoxExtension) {
				let tooltips = [TooltipType.Pdf, TooltipType.Product, TooltipType.Recipe];
				// Returns the Type of tooltip to show IF the delay is over and the tab has the correct content type
				let typeToShow = this.shouldShowTooltip(tab, tooltips);
				if (typeToShow) {
					this.showTooltip(tab, typeToShow);
					return;
				}

				if (this.shouldShowVideoTooltip(tab)) {
					this.showTooltip(tab, TooltipType.Video);
					return;
				}
			}

			// We don't show updates more recent than the local version for now, as it is easy
			// for a changelog to be released before a version is actually out
			if (this.shouldShowWhatsNewTooltip(tab, lastSeenVersion, extensionVersion)) {
				this.showWhatsNewTooltip(tab, lastSeenVersion, extensionVersion);
				return;
			}
		});
	}

	private setUnhandledExceptionLogging() {
		let oldOnError = window.onerror;
		window.onerror = (message: string, filename?: string, lineno?: number, colno?: number, error?: Error) => {
			let callStack = error ? Log.Failure.getStackTrace(error) : "[unknown stacktrace]";

			Log.ErrorUtils.sendFailureLogRequest({
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
	 * Returns True if the Extension determines the tab is a Product, Recipe, or PDF. False otherwise
	 */
	protected abstract checkIfTabMatchesATooltipType(tab: TTab, tooltipTypes: TooltipType[]): TooltipType;

	/**
	 * Returns True if the Extension determines the tab is a Video, false otherwise
	 */
	protected abstract checkIfTabIsAVideoDomain(tab: TTab): boolean;

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

	private updateLastSeenVersionInStorageToCurrent() {
		this.clipperData.setValue(ClipperStorageKeys.lastSeenVersion, ExtensionBase.getExtensionVersion());
	}
}
