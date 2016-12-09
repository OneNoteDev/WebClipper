import {AuthType, UpdateReason, UserInfo} from "../userInfo";
import {BrowserUtils} from "../browserUtils";
import {ClientInfo} from "../clientInfo";
import {ClientType} from "../clientType";
import {Constants} from "../constants";
import {ObjectUtils} from "../objectUtils";

import {PageInfo} from "../pageInfo";
import {Polyfills} from "../polyfills";
import {PreviewGlobalInfo, PreviewInfo} from "../previewInfo";
import {Settings} from "../settings";
import {TooltipType} from "./tooltipType";
import {UrlUtils} from "../urlUtils";

import {Communicator} from "../communicator/communicator";
import {IFrameMessageHandler} from "../communicator/iframeMessageHandler";
import {InlineMessageHandler} from "../communicator/inlineMessageHandler";
import {SmartValue} from "../communicator/smartValue";

import {AugmentationHelper, AugmentationModel} from "../contentCapture/augmentationHelper";
import {BookmarkError, BookmarkHelper, BookmarkResult} from "../contentCapture/bookmarkHelper";
import {FullPageScreenshotHelper} from "../contentCapture/fullPageScreenshotHelper";
import {PdfScreenshotHelper, PdfScreenshotResult} from "../contentCapture/pdfScreenshotHelper";

import {DomUtils} from "../domParsers/domUtils";
import {VideoUtils} from "../domParsers/videoUtils";

import {ClipperInjectOptions} from "../extensions/clipperInject";
import {InvokeOptions, InvokeMode} from "../extensions/invokeOptions";

import {InlineExtension} from "../extensions/bookmarklet/inlineExtension";

import {CachedHttp, TimeStampedData} from "../http/cachedHttp";

import {Localization} from "../localization/localization";

import * as Log from "../logging/log";
import {CommunicatorLoggerPure} from "../logging/communicatorLoggerPure";
import {Logger} from "../logging/logger";

import {OneNoteSaveableFactory} from "../saveToOneNote/oneNoteSaveableFactory";
import {SaveToOneNote, SaveToOneNoteOptions} from "../saveToOneNote/saveToOneNote";
import {SaveToOneNoteLogger} from "../saveToOneNote/saveToOneNoteLogger";

import {ClipperStorageKeys} from "../storage/clipperStorageKeys";

import {ClipMode} from "./clipMode";
import {Clipper} from "./frontEndGlobals";
import {ClipperState} from "./clipperState";
import {ClipperStateUtilities} from "./clipperStateUtilities";
import {ComponentBase} from "./componentBase";
import {MainController} from "./mainController";
import {OneNoteApiUtils} from "./oneNoteApiUtils";
import {PreviewViewer} from "./previewViewer";
import {RatingsHelper} from "./ratingsHelper";
import {RegionSelector} from "./regionSelector";
import {Status} from "./status";

import * as _ from "lodash";

class ClipperClass extends ComponentBase<ClipperState, {}> {
	private isFullScreen = new SmartValue<boolean>(false);

	constructor(props: {}) {
		super(props);

		this.initializeCommunicators();
		this.initializeSmartValues();
	}

	getInitialState(): ClipperState {
		return {
			uiExpanded: true,
			currentMode: new SmartValue<ClipMode>(this.getDefaultClipMode()),

			userResult: { status: Status.NotStarted } ,
			fullPageResult: { status: Status.NotStarted },
			pdfResult: { data: new SmartValue<PdfScreenshotResult>(), status: Status.NotStarted },
			regionResult: { status: Status.NotStarted, data: [] },
			augmentationResult: { status: Status.NotStarted },
			oneNoteApiResult: { status: Status.NotStarted },
			bookmarkResult: { status: Status.NotStarted },

			setState: (partialState: ClipperState) => {
				this.setState(partialState);
				this.isFullScreen.set(ClipperClass.shouldShowPreviewViewer(this.state) || ClipperClass.shouldShowRegionSelector(this.state));
			},

			previewGlobalInfo: {
				annotation: "",
				fontSize: parseInt(Localization.getLocalizedString("WebClipper.FontSize.Preview.SansSerifDefault"), 10 /* radix */),
				highlighterEnabled: false,
				serif: false
			},
			augmentationPreviewInfo: {},
			selectionPreviewInfo: {},
			pdfPreviewInfo: {
				allPages: true,
				isLocalFileAndNotAllowed: true,
				selectedPageRange: "",
				shouldAttachPdf: false,
				shouldDistributePages: false,
				shouldShowPopover: false
			},
			clipSaveStatus: {
				numItemsTotal: undefined,
				numItemsCompleted: undefined
			},

			reset: () => {
				this.state.setState(this.getResetState());
			}
		};
	}

	private getResetState(): ClipperState {
		return {
			currentMode: this.state.currentMode.set(this.getDefaultClipMode()),
			oneNoteApiResult: { status: Status.NotStarted }
		};
	}

	private initializeInjectCommunicator(pageInfo: SmartValue<PageInfo>, clientInfo: SmartValue<ClientInfo>) {
		// Clear the inject no-op tracker
		Clipper.getInjectCommunicator().registerFunction(Constants.FunctionKeys.noOpTracker, (trackerStartTime: number) => {
			let clearNoOpTrackerEvent = new Log.Event.BaseEvent(Log.Event.Label.ClearNoOpTracker);
			clearNoOpTrackerEvent.setCustomProperty(Log.PropertyName.Custom.TimeToClearNoOpTracker, new Date().getTime() - trackerStartTime);
			clearNoOpTrackerEvent.setCustomProperty(Log.PropertyName.Custom.Channel, Constants.CommunicationChannels.injectedAndUi);
			Clipper.logger.logEvent(clearNoOpTrackerEvent);

			return Promise.resolve();
		});

		// Register functions for Inject
		Clipper.getInjectCommunicator().registerFunction(Constants.FunctionKeys.showRefreshClipperMessage, (errorMessage: string) => {
			if (!this.state.badState) {
				Clipper.logger.logFailure(Log.Failure.Label.OrphanedWebClippersDueToExtensionRefresh, Log.Failure.Type.Expected,
					{ error: errorMessage });
				this.state.setState({
					badState: true
				});
			}
		});

		Clipper.getInjectCommunicator().registerFunction(Constants.FunctionKeys.toggleClipper, () => {
			this.state.setState({ uiExpanded: !this.state.uiExpanded });
		});

		Clipper.getInjectCommunicator().registerFunction(Constants.FunctionKeys.onSpaNavigate, () => {
			// This could have been called when the UI is already toggled off
			if (this.state.uiExpanded) {
				let hideClipperDueToSpaNavigateEvent = new Log.Event.BaseEvent(Log.Event.Label.HideClipperDueToSpaNavigate);
				Clipper.logger.logEvent(hideClipperDueToSpaNavigateEvent);
				this.state.setState({ uiExpanded: false });
			};
		});

		Clipper.getInjectCommunicator().registerFunction(Constants.FunctionKeys.setInvokeOptions, (options: InvokeOptions) => {
			this.setInvokeOptions(options);
		});

		// Register smartValues for Inject
		Clipper.getInjectCommunicator().broadcastAcrossCommunicator(this.isFullScreen, Constants.SmartValueKeys.isFullScreen);

		Clipper.getInjectCommunicator().subscribeAcrossCommunicator(pageInfo, Constants.SmartValueKeys.pageInfo, (updatedPageInfo: PageInfo) => {
			if (updatedPageInfo) {
				let newPreviewGlobalInfo = _.extend(this.state.previewGlobalInfo, {
					previewTitleText: updatedPageInfo.contentTitle
				} as PreviewGlobalInfo);

				this.state.setState({
					pageInfo: updatedPageInfo,
					previewGlobalInfo: newPreviewGlobalInfo
				});

				this.capturePdfScreenshotContent();
				this.captureFullPageScreenshotContent();
				this.captureAugmentedContent();
				this.captureBookmarkContent();

				Clipper.logger.setContextProperty(Log.Context.Custom.ContentType, OneNoteApi.ContentType[updatedPageInfo.contentType]);
				Clipper.logger.setContextProperty(Log.Context.Custom.InvokeHostname, UrlUtils.getHostname(updatedPageInfo.rawUrl));
				Clipper.logger.setContextProperty(Log.Context.Custom.PageLanguage, updatedPageInfo.contentLocale);
			}
		});

		Clipper.getInjectCommunicator().setErrorHandler((e: Error) => {
			Log.ErrorUtils.handleCommunicatorError(Constants.CommunicationChannels.injectedAndUi, e, clientInfo);
		});
	}

	private capturePdfScreenshotContent() {
		// We don't capture anything. If the type is not EnhancedUrl, the mode will never show.
		if (this.state.pageInfo.contentType !== OneNoteApi.ContentType.EnhancedUrl) {
			return;
		}

		// The PDF isn't going to change on the same url, so we avoid multiple GETs in the same page
		if (this.state.pdfResult.status === Status.NotStarted) {
			// If network file, send XHR, get bytes back, convert to PDFDocumentProxy
			// If local file, get bytes back, convert to PDFDocumentProxy
			this.state.setState({ pdfResult: { data: new SmartValue<PdfScreenshotResult>(undefined), status: Status.InProgress } });
			this.getPdfScreenshotResultFromRawUrl(this.state.pageInfo.rawUrl)
				.then((pdfScreenshotResult: PdfScreenshotResult) => {
					this.state.pdfResult.data.set(pdfScreenshotResult);
					this.state.setState({
						pdfResult: {
							data: this.state.pdfResult.data,
							status: Status.Succeeded
						}
					});
				})
				.catch(() => {
					this.state.pdfResult.data.set({
						failureMessage: Localization.getLocalizedString("WebClipper.Preview.FullPageModeGenericError")
					});
					this.state.setState({
						pdfResult: {
							data: this.state.pdfResult.data,
							status: Status.Failed
						}
					});
					// The clip action might be waiting on the result, so do this to consistently trigger its callback
					this.state.pdfResult.data.forceUpdate();
				});
		}
	}

	private getPdfScreenshotResultFromRawUrl(rawUrl: string): Promise<PdfScreenshotResult> {
		if (rawUrl.indexOf("file:///") === 0) {
			return PdfScreenshotHelper.getLocalPdfData(rawUrl);
		} else {
			return PdfScreenshotHelper.getPdfData(rawUrl);
		}
	}

	private captureFullPageScreenshotContent() {
		if (this.state.pageInfo.contentType === OneNoteApi.ContentType.EnhancedUrl) {
			this.state.setState({
				fullPageResult: {
					data: {
						failureMessage: Localization.getLocalizedString("WebClipper.Preview.NoContentFound")
					},
					status: Status.Failed
				}
			});
		} else {
			this.state.setState({ fullPageResult: { status: Status.InProgress } });

			FullPageScreenshotHelper.getFullPageScreenshot(this.state.pageInfo.contentData).then((result) => {
				this.state.setState({ fullPageResult: { data: result, status: Status.Succeeded } });
			}, () => {
				this.state.setState({
					fullPageResult: {
						data: {
							failureMessage: Localization.getLocalizedString("WebClipper.Preview.NoFullPageScreenshotFound")
						},
						status: Status.Failed
					}
				});
			});
		}
	}

	private captureAugmentedContent() {
		if (this.state.pageInfo.contentType === OneNoteApi.ContentType.EnhancedUrl) {
			this.state.setState({
				augmentationResult: {
					data: {
						failureMessage: Localization.getLocalizedString("WebClipper.Preview.NoContentFound")
					},
					status: Status.Failed
				}
			});
		} else {
			this.state.setState({ augmentationResult: { status: Status.InProgress } });

			let pageInfo = this.state.pageInfo;

			let augmentationUrl = pageInfo.canonicalUrl;
			if (pageInfo.rawUrl.indexOf("youtube.com") > -1 || pageInfo.rawUrl.indexOf("vimeo.com") > -1) {
				augmentationUrl = pageInfo.rawUrl;
			}

			AugmentationHelper.augmentPage(augmentationUrl, pageInfo.contentLocale, pageInfo.contentData).then((result) => {
				result.ContentInHtml = DomUtils.cleanHtml(result.ContentInHtml);
				this.state.setState({
					augmentationResult: { data: result, status: Status.Succeeded },
					augmentationPreviewInfo: { previewBodyHtml: result.ContentInHtml }
				});
			}, () => {
				this.state.setState({
					augmentationResult: {
						data: {
							failureMessage: Localization.getLocalizedString("WebClipper.Preview.AugmentationModeGenericError")
						},
						status: Status.Failed
					}
				});
			});
		}
	}

	private captureBookmarkContent() {
		this.state.setState({ bookmarkResult: { status: Status.InProgress } });

		let pageInfo = this.state.pageInfo;
		let pageUrl = pageInfo.rawUrl;
		let pageTitle = pageInfo.contentTitle;

		let doc = DomUtils.getDocumentFromDomString(pageInfo.contentData);

		let metadataElements: Element[] = BookmarkHelper.getElementsByTagName(doc, BookmarkHelper.metadataTagNames);

		let imageElements: HTMLImageElement[] = BookmarkHelper.getElementsByTagName(doc.body, [DomUtils.Tags.img]) as HTMLImageElement[];

		// because we are cleaning the document in order to get the cleanest text possible in our description,
		// make sure this is the last operation being performed on the document
		let textElements: Text[] = [];
		try {
			textElements = BookmarkHelper.getNonWhiteSpaceTextElements(doc, true /* cleanDoc */);
		} catch (e) {
			// IE11 has a weird issue where walk.nextNode() returns a non-descript exception, so we can't use our fallback logic
		}

		BookmarkHelper.bookmarkPage(pageUrl, pageTitle, metadataElements, true /* allowFallback */, imageElements, textElements).then((result: BookmarkResult) => {
			this.state.setState({
				bookmarkResult: { data: result, status: Status.Succeeded }
			});
		}, (error: BookmarkError) => {
			this.state.setState({
				bookmarkResult: {
					data: {
						url: error.url,
						title: pageTitle,
						description: error.description,
						thumbnailSrc: error.thumbnailSrc,
						failureMessage: Localization.getLocalizedString("WebClipper.Preview.BookmarkModeGenericError")
					},
					status: Status.Failed
				}
			});
		});
	}

	private setInvokeOptions(options: InvokeOptions) {
		this.setState({	invokeOptions: options });

		// This needs to happen after the invokeOptions set as it is reliant on that order
		this.setState({	currentMode: this.state.currentMode.set(this.getDefaultClipMode()) });

		// We assume that invokeDataForMode is always a non-undefined value where it makes sense
		// and that it's the background's responsibility to ensure that is the case
		switch (options.invokeMode) {
			case InvokeMode.ContextImage:
				// invokeDataForMode is the src url
				this.setState({
					regionResult: {
						data: [options.invokeDataForMode],
						status: Status.Succeeded
					}
				});
				break;
			case InvokeMode.ContextTextSelection:
				// invokeDataForMode is scrubbed selected html as a string
				this.state.setState({
					selectionPreviewInfo: {
						previewBodyHtml: options.invokeDataForMode
					}
				});
				break;
			default:
				break;
		}
	}

	private initializeExtensionCommunicator(clientInfo: SmartValue<ClientInfo>) {
		// Clear the extension no-op tracker
		Clipper.getExtensionCommunicator().registerFunction(Constants.FunctionKeys.noOpTracker, (trackerStartTime: number) => {
			let clearNoOpTrackerEvent = new Log.Event.BaseEvent(Log.Event.Label.ClearNoOpTracker);
			clearNoOpTrackerEvent.setCustomProperty(Log.PropertyName.Custom.TimeToClearNoOpTracker, new Date().getTime() - trackerStartTime);
			clearNoOpTrackerEvent.setCustomProperty(Log.PropertyName.Custom.Channel, Constants.CommunicationChannels.extensionAndUi);
			Clipper.logger.logEvent(clearNoOpTrackerEvent);

			return Promise.resolve();
		});

		Clipper.getExtensionCommunicator().registerFunction(Constants.FunctionKeys.createHiddenIFrame, (url: string) => {
			BrowserUtils.appendHiddenIframeToDocument(url);
		});

		let userInfoUpdateCb = (updatedUser: UserInfo) => {
			if (updatedUser) {
				let userInfoUpdatedEvent = new Log.Event.BaseEvent(Log.Event.Label.UserInfoUpdated);
				userInfoUpdatedEvent.setCustomProperty(Log.PropertyName.Custom.UserUpdateReason, UpdateReason[updatedUser.updateReason]);
				userInfoUpdatedEvent.setCustomProperty(Log.PropertyName.Custom.LastUpdated, new Date(updatedUser.lastUpdated).toUTCString());
				Clipper.logger.logEvent(userInfoUpdatedEvent);
			}

			if (updatedUser && updatedUser.user) {
				let timeStampedData: TimeStampedData = {
					data: updatedUser.user,
					lastUpdated: updatedUser.lastUpdated
				};

				// The user SV should never be set with expired user information
				let tokenHasExpiredForLoggedInUser = CachedHttp.valueHasExpired(timeStampedData, (updatedUser.user.accessTokenExpiration * 1000) - 180000);
				if (tokenHasExpiredForLoggedInUser) {
					Clipper.logger.logFailure(Log.Failure.Label.UserSetWithInvalidExpiredData, Log.Failure.Type.Unexpected);
				}

				this.state.setState({ userResult: { status: Status.Succeeded, data: updatedUser } });
				Clipper.logger.setContextProperty(Log.Context.Custom.AuthType, updatedUser.user.authType);
				Clipper.logger.setContextProperty(Log.Context.Custom.UserInfoId, updatedUser.user.cid);
			} else {
				this.state.setState({ userResult: { status: Status.Failed, data: updatedUser } });
			}
		};

		this.state.setState({ userResult: { status: Status.InProgress } });
		Clipper.getExtensionCommunicator().callRemoteFunction(Constants.FunctionKeys.getInitialUser, {
			callback: (freshInitialUser: UserInfo) => {
				if (freshInitialUser && freshInitialUser.user) {
					Clipper.logger.logUserFunnel(Log.Funnel.Label.AuthAlreadySignedIn);
				} else if (!freshInitialUser) {
					userInfoUpdateCb(freshInitialUser);
				}
				Clipper.getExtensionCommunicator().subscribeAcrossCommunicator(new SmartValue<UserInfo>(), Constants.SmartValueKeys.user, (updatedUser: UserInfo) => {
					userInfoUpdateCb(updatedUser);
				});
			}
		});

		this.state.setState({ fetchLocStringStatus: Status.InProgress });
		Clipper.getExtensionCommunicator().callRemoteFunction(Constants.FunctionKeys.clipperStrings, {
			callback: (data: Object) => {
				if (data) {
					Localization.setLocalizedStrings(data);
				}
				this.state.setState({ fetchLocStringStatus: Status.Succeeded });
			}
		});

		Clipper.getExtensionCommunicator().registerFunction(Constants.FunctionKeys.extensionNotAllowedToAccessLocalFiles, () => {
			// We only want to log one time per session
			if (this.state.pdfPreviewInfo.isLocalFileAndNotAllowed) {
				Clipper.logger.logEvent(new Log.Event.BaseEvent(Log.Event.Label.LocalFilesNotAllowedPanelShown));
			}

			_.assign(_.extend(this.state.pdfPreviewInfo, {
				isLocalFileAndNotAllowed: false
			}), this.state.setState);
		});

		Clipper.getExtensionCommunicator().subscribeAcrossCommunicator(clientInfo, Constants.SmartValueKeys.clientInfo, (updatedClientInfo: ClientInfo) => {
			if (updatedClientInfo) {
				this.state.setState({
					clientInfo: updatedClientInfo
				});
			}
		});

		Clipper.getExtensionCommunicator().setErrorHandler((e: Error) => {
			Log.ErrorUtils.handleCommunicatorError(Constants.CommunicationChannels.extensionAndUi, e, clientInfo);
		});
	}

	private initializeCommunicators() {
		let pageInfo = new SmartValue<PageInfo>();
		let clientInfo = new SmartValue<ClientInfo>();

		Clipper.setInjectCommunicator(new Communicator(new IFrameMessageHandler(() => parent), Constants.CommunicationChannels.injectedAndUi));

		// Check the options passed in to determine what kind of Communicator we need to talk to the background task
		Clipper.getInjectCommunicator().registerFunction(Constants.FunctionKeys.setInjectOptions, (options: ClipperInjectOptions) => {
			this.setState({ injectOptions: options });

			if (this.state.injectOptions.useInlineBackgroundWorker) {
				let background = new InlineExtension();
				let backgroundMessageHandler = background.getInlineMessageHandler();
				let uiMessageHandler = new InlineMessageHandler(backgroundMessageHandler);
				backgroundMessageHandler.setOtherSide(uiMessageHandler);
				Clipper.setExtensionCommunicator(new Communicator(uiMessageHandler, Constants.CommunicationChannels.extensionAndUi));
			} else {
				Clipper.setExtensionCommunicator(new Communicator(new IFrameMessageHandler(() => parent), Constants.CommunicationChannels.extensionAndUi));
			}
			this.initializeExtensionCommunicator(clientInfo);
			Clipper.getExtensionCommunicator().subscribeAcrossCommunicator(Clipper.sessionId, Constants.SmartValueKeys.sessionId);
			Clipper.logger = new CommunicatorLoggerPure(Clipper.getExtensionCommunicator());

			this.initializeInjectCommunicator(pageInfo, clientInfo);

			// When tabbing from outside the iframe, we want to set focus to the lowest tabindex element in our iframe
			Clipper.getInjectCommunicator().registerFunction(Constants.FunctionKeys.tabToLowestIndexedElement, () => {
				let tabbables = document.querySelectorAll("[tabindex]");
				let lowestTabIndexElement: HTMLElement;
				if (tabbables.length > 0) {
					for (let i = 0; i < tabbables.length; i++) {
						let tabbable = tabbables[i] as HTMLElement;
						if (!lowestTabIndexElement || tabbable.tabIndex < lowestTabIndexElement.tabIndex) {
							lowestTabIndexElement = tabbable;
						}
					}

					lowestTabIndexElement.focus();
				}
			});

			// initialize here since it depends on storage in the extension
			this.initializeNumSuccessfulClips();
			RatingsHelper.preCacheNeededValues();
		});

		clientInfo.subscribe((updatedClientInfo) => {
			if (updatedClientInfo) {
				// The default Clip mode now also depends on clientInfo, in addition to pageInfo
				// TODO: Don't do this if they already have a mode chosen (once we are updating the pageInfo more object more often)
				this.state.setState({ currentMode: this.state.currentMode.set(this.getDefaultClipMode()) });
			}
		});
	}

	private initializeSmartValues() {
		this.state.currentMode.subscribe((newMode: ClipMode) => {
			switch (newMode) {
				case ClipMode.FullPage:
				case ClipMode.Augmentation:
					Clipper.getInjectCommunicator().callRemoteFunction(Constants.FunctionKeys.updatePageInfoIfUrlChanged);
					break;
				default:
					break;
			}
		}, { callOnSubscribe: false });
	}

	private initializeNumSuccessfulClips(): void {
		Clipper.getStoredValue(ClipperStorageKeys.numSuccessfulClips, (numClipsAsStr: string) => {
			let numClips: number = parseInt(numClipsAsStr, 10);
			this.state.numSuccessfulClips = ObjectUtils.isNullOrUndefined(numClips) || isNaN(numClips) ? 0 : numClips;
		});
	}

	private getDefaultClipMode(): ClipMode {
		if (this.state && this.state.invokeOptions) {
			switch (this.state.invokeOptions.invokeMode) {
				case InvokeMode.ContextImage:
					// We don't want to be stuck in region mode if there are 0 images
					if (this.state.regionResult.data.length > 0) {
						return ClipMode.Region;
					}
					break;
				case InvokeMode.ContextTextSelection:
					return ClipMode.Selection;
				default:
					break;
			}
		}

		if (this.state && this.state.pageInfo) {
			if (UrlUtils.onWhitelistedDomain(this.state.pageInfo.rawUrl)) {
				return ClipMode.Augmentation;
			} else if (this.state.pageInfo.contentType === OneNoteApi.ContentType.EnhancedUrl) {
				return ClipMode.Pdf;
			}
		}

		return ClipMode.FullPage;
	}

	private updateFrameHeight(newContainerHeight: number) {
		Clipper.getInjectCommunicator().callRemoteFunction(Constants.FunctionKeys.updateFrameHeight, { param: newContainerHeight });
	}

	private handleSignIn(authType: AuthType) {
		Clipper.logger.logUserFunnel(Log.Funnel.Label.AuthAttempted);
		let handleSignInEvent = new Log.Event.PromiseEvent(Log.Event.Label.HandleSignInEvent);

		this.setState({ userResult: { status: Status.InProgress } });
		type ErrorObject = { correlationId?: string, error: string, errorDescription: string };
		Clipper.getExtensionCommunicator().callRemoteFunction(Constants.FunctionKeys.signInUser, { param: authType, callback: (data: UserInfo | ErrorObject) => {
			// For cleaner referencing
			let updatedUser = data as UserInfo;
			let errorObject = data as ErrorObject;

			// Unexpected errors
			let errorPrefix = AuthType[authType] + "; ";
			let error: string;
			if (!updatedUser) {
				error = errorPrefix + "The " + Constants.FunctionKeys.signInUser + " remote function incorrectly returned an undefined object";
			} else if (errorObject.error || errorObject.errorDescription) {
				// Something went wrong on the auth server
				error = errorPrefix + errorObject.error + ": " + errorObject.errorDescription;
				handleSignInEvent.setCustomProperty(Log.PropertyName.Custom.CorrelationId, errorObject.correlationId);
			}

			if (error) {
				handleSignInEvent.setStatus(Log.Status.Failed);
				handleSignInEvent.setFailureInfo({ error: error });

				errorObject.errorDescription = error;
				this.state.setState({ userResult: { status: Status.Failed, data: updatedUser } });

				Clipper.logger.logUserFunnel(Log.Funnel.Label.AuthSignInFailed);
			}

			let userInfoReturned = updatedUser && !!updatedUser.user;
			if (userInfoReturned) {
				// Sign in succeeded
				Clipper.storeValue(ClipperStorageKeys.hasPatchPermissions, "true");
				Clipper.logger.logUserFunnel(Log.Funnel.Label.AuthSignInCompleted);
			}
			handleSignInEvent.setCustomProperty(Log.PropertyName.Custom.UserInformationReturned, userInfoReturned);
			handleSignInEvent.setCustomProperty(Log.PropertyName.Custom.SignInCancelled, !error && !userInfoReturned);
			Clipper.logger.logEvent(handleSignInEvent);
		}});
	}

	private handleSignOut(authType: string): void {
		this.state.setState(this.getSignOutState());
		Clipper.getExtensionCommunicator().callRemoteFunction(Constants.FunctionKeys.signOutUser, { param: AuthType[authType] });

		Clipper.logger.logUserFunnel(Log.Funnel.Label.SignOut);
		Clipper.logger.logSessionEnd(Log.Session.EndTrigger.SignOut);
		Clipper.logger.logSessionStart();
	}

	private getSignOutState(): ClipperState {
		let signOutState = this.getResetState();
		signOutState.saveLocation = undefined;
		signOutState.userResult = undefined;
		return signOutState;
	}

	private handleStartClip(): void {
		Clipper.logger.logUserFunnel(Log.Funnel.Label.ClipAttempted);

		this.state.setState({ userResult: { status: Status.InProgress, data: this.state.userResult.data } });
		Clipper.getExtensionCommunicator().callRemoteFunction(Constants.FunctionKeys.ensureFreshUserBeforeClip, { callback: (updatedUser: UserInfo) => {
			if (updatedUser && updatedUser.user) {
				let currentMode = this.state.currentMode.get();
				if (currentMode === ClipMode.FullPage) {
					// A page info refresh needs to be triggered if the url has changed right before the clip action
					Clipper.getInjectCommunicator().callRemoteFunction(Constants.FunctionKeys.updatePageInfoIfUrlChanged, {
						callback: () => {
							this.startClip();
						}
					});
				} else if (currentMode === ClipMode.Bookmark) {
					// set the rendered bookmark preview HTML as the exact HTML to send to OneNote
					let previewBodyHtml = document.getElementById("previewBody").innerHTML;
					this.state.setState({
						bookmarkPreviewInfo: { previewBodyHtml: previewBodyHtml }
					});

					this.startClip();
				} else {
					this.startClip();
				}
			}
		}});
	}

	private startClip(): void {
		this.state.setState({ oneNoteApiResult: { status: Status.InProgress } });

		this.storeLastClippedInformation();
		SaveToOneNoteLogger.logClip(this.state);

		let clipEvent = new Log.Event.PromiseEvent(Log.Event.Label.ClipToOneNoteAction);

		(new OneNoteSaveableFactory(this.state)).getSaveable().then((saveable) => {
			let saveOptions: SaveToOneNoteOptions = {
				page: saveable,
				saveLocation: this.state.saveLocation,
				progressCallback: this.updateClipSaveProgress.bind(this)
			};

			let saveToOneNote = new SaveToOneNote(this.state.userResult.data.user.accessToken);
			saveToOneNote.save(saveOptions).then((responsePackage: OneNoteApi.ResponsePackage<any>) => {
				let createPageResponse = Array.isArray(responsePackage) ? responsePackage[0] : responsePackage;
				clipEvent.setCustomProperty(Log.PropertyName.Custom.CorrelationId, createPageResponse.request.getResponseHeader(Constants.HeaderValues.correlationId));

				let numSuccessfulClips = this.state.numSuccessfulClips + 1;
				Clipper.storeValue(ClipperStorageKeys.numSuccessfulClips, numSuccessfulClips.toString());
				this.state.setState({
					oneNoteApiResult: { data: createPageResponse.parsedResponse, status: Status.Succeeded },
					numSuccessfulClips: numSuccessfulClips,
					showRatingsPrompt: RatingsHelper.shouldShowRatingsPrompt(this.state)
				});
			}).catch((error: OneNoteApi.RequestError) => {
				OneNoteApiUtils.logOneNoteApiRequestError(clipEvent, error);
				this.state.setState({ oneNoteApiResult: { data: error, status: Status.Failed } });
			}).then(() => {
				Clipper.logger.logEvent(clipEvent);
			});
		});
	}

	private updateClipSaveProgress(numItemsCompleted: number, numItemsTotal: number): void {
		this.state.setState({
			clipSaveStatus: {
				numItemsCompleted: numItemsCompleted,
				numItemsTotal: numItemsTotal
			}
		});
	}

	private storeLastClippedInformation() {
		Clipper.storeValue(ClipperStorageKeys.lastClippedDate, Date.now().toString());

		if (this.state.currentMode.get() === ClipMode.Pdf) {
			Clipper.storeValue(ClipperStorageKeys.lastClippedTooltipTimeBase + TooltipType[TooltipType.Pdf], Date.now().toString());
		}

		if (this.state.currentMode.get() === ClipMode.Augmentation) {
			// Record lastClippedDate for each different augmentationMode so we can upsell the augmentation mode
			// to users who haven't Clipped this mode in a while
			let augmentationTypeAsString = AugmentationHelper.getAugmentationType(this.state);
			Clipper.storeValue(ClipperStorageKeys.lastClippedTooltipTimeBase + augmentationTypeAsString, Date.now().toString());
		}

		if (VideoUtils.videoDomainIfSupported(this.state.pageInfo.rawUrl)) {
			Clipper.storeValue(ClipperStorageKeys.lastClippedTooltipTimeBase + TooltipType[TooltipType.Video], Date.now().toString());
		}
	}

	private static shouldShowOptions(state: ClipperState): boolean {
		return (state.uiExpanded &&
			ClipperStateUtilities.isUserLoggedIn(state) &&
			state.oneNoteApiResult.status === Status.NotStarted &&
			!state.badState);
	}

	private static shouldShowPreviewViewer(state: ClipperState): boolean {
		return (this.shouldShowOptions(state) &&
			(state.currentMode.get() !== ClipMode.Region ||
			state.regionResult.status === Status.Succeeded));
	}

	private static shouldShowRegionSelector(state: ClipperState): boolean {
		return (this.shouldShowOptions(state) &&
			state.currentMode.get() === ClipMode.Region &&
			state.regionResult.status !== Status.Succeeded);
	}

	private static shouldShowMainController(state: ClipperState): boolean {
		return state.regionResult.status !== Status.InProgress || state.badState;
	}

	render() {
		let previewViewerItem = ClipperClass.shouldShowPreviewViewer(this.state) ?
			<PreviewViewer clipperState={this.state} /> :
			undefined;
		let regionSelectorItem = ClipperClass.shouldShowRegionSelector(this.state) ? <RegionSelector clipperState={this.state} /> : undefined;
		let mainControllerStyle = ClipperClass.shouldShowMainController(this.state) ? { } : { display: "none" };

		return (
			<div>
				{previewViewerItem}
				{regionSelectorItem}
				<div style={mainControllerStyle} >
					<MainController clipperState={this.state}
						onSignInInvoked={this.handleSignIn.bind(this) }
						onSignOutInvoked={this.handleSignOut.bind(this) }
						updateFrameHeight={this.updateFrameHeight.bind(this) }
						onStartClip={this.handleStartClip.bind(this) } />
				</div>
			</div>
		);
	}
}

Polyfills.init();

// Catch any unhandled exceptions and log them
let oldOnError = window.onerror;
window.onerror = (message: string, filename?: string, lineno?: number, colno?: number, error?: Error) => {
	let callStack = error ? Log.Failure.getStackTrace(error) : "[unknown stacktrace]";

	Clipper.logger.logFailure(Log.Failure.Label.UnhandledExceptionThrown, Log.Failure.Type.Unexpected,
		{ error: message + " (" + filename + ":" + lineno + ":" + colno + ") at " + callStack }, "ClipperUI");

	if (oldOnError) {
		oldOnError(message, filename, lineno, colno, error);
	}
};

let component = ClipperClass.componentize();
m.mount(document.getElementById("clipperUIPlaceholder"), component);
export {component as Clipper}
