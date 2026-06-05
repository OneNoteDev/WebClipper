export module Constants {
	export module Classes {
		// animators
		export let heightAnimator = "height-animator";
		export let panelAnimator = "panel-animator";
		export let clearfix = "clearfix";

		// changeLogPanel
		export let change = "change";
		export let changes = "changes";
		export let changeBody = "change-body";
		export let changeDescription = "change-description";
		export let changeImage = "change-image";
		export let changeTitle = "change-title";

		// checkbox
		export let checkboxCheck = "checkboxCheck";

		// textArea input control
		export let textAreaInput = "textAreaInput";
		export let textAreaInputMirror = "textAreaInputMirror";

		// popover
		export let popover = "popover";
		export let popoverArrow = "popover-arrow";

		// previewViewer
		export let deleteHighlightButton = "delete-highlight";
		export let highlightable = "highlightable";
		export let highlighted = "highlighted";
		export let regionSelection = "region-selection";
		export let regionSelectionImage = "region-selection-image";
		export let regionSelectionRemoveButton = "region-selection-remove-button";

		// pdfPreviewViewer
		export let attachmentOverlay = "attachment-overlay";
		export let centeredInCanvas = "centered-in-canvas";
		export let overlay = "overlay";
		export let overlayHidden = "overlay-hidden";
		export let overlayNumber = "overlay-number";
		export let pdfPreviewImage = "pdf-preview-image";
		export let pdfPreviewImageCanvas = "pdf-preview-image-canvas";
		export let unselected = "unselected";

		export let localPdfPanelTitle = "local-pdf-panel-title";
		export let localPdfPanelSubtitle = "local-pdf-panel-subtitle";

		// radioButton
		export let radioIndicatorFill = "radio-indicator-fill";

		// spriteAnimation
		export let spinner = "spinner";

		// Accessibility
		export let srOnly = "sr-only";

		// tooltip
		export let tooltip = "tooltip";

		// rotatingMessageSpriteAnimation
		export let centeredInPreview = "centered-in-preview";
	}

	export module Cookies {
		export let clipperInfo = "ClipperInfo";
	}

	export module Extension {
		export module NotificationIds {
			export let conflictingExtension = "conflictingExtension";
		}
	}

	export module Ids {
		// annotationInput
		export let annotationContainer = "annotationContainer";
		export let annotationField = "annotationField";
		export let annotationFieldMirror = "annotationFieldMirror";
		export let annotationPlaceholder = "annotationPlaceholder";

		// bookmarkPreview
		export let bookmarkThumbnail = "bookmarkThumbnail";
		export let bookmarkPreviewContentContainer = "bookmarkPreviewContentContainer";
		export let bookmarkPreviewInnerContainer = "bookmarkPreviewInnerContainer";

		// clippingPanel
		export let clipperApiProgressContainer = "clipperApiProgressContainer";

		// clippingPanel
		export let clipProgressDelayedMessage = "clipProgressDelayedMessage";
		export let clipProgressIndicatorMessage = "clipProgressIndicatorMessage";

		// dialogPanel
		export let dialogBackButton = "dialogBackButton";
		export let dialogButtonContainer = "dialogButtonContainer";
		export let dialogDebugMessageContainer = "dialogDebugMessageContainer";
		export let dialogMessageContainer = "dialogMessageContainer";
		export let dialogContentContainer = "dialogContentContainer";
		export let dialogMessage = "dialogMessage";
		export let dialogSignOutButton = "dialogSignoutButton";
		export let dialogTryAgainButton = "dialogTryAgainButton";

		// editorPreviewComponentBase
		export let highlightablePreviewBody = "highlightablePreviewBody";

		// failurePanel
		export let apiErrorMessage = "apiErrorMessage";
		export let backToHomeButton = "backToHomeButton";
		export let clipperFailureContainer = "clipperFailureContainer";
		export let refreshPageButton = "refreshPageButton";
		export let tryAgainButton = "tryAgainButton";

		// footer
		export let clipperFooterContainer = "clipperFooterContainer";
		export let currentUserControl = "currentUserControl";
		export let currentUserDetails = "currentUserDetails";
		export let currentUserEmail = "currentUserEmail";
		export let currentUserId = "currentUserId";
		export let currentUserName = "currentUserName";
		export let feedbackButton = "feedbackButton";
		export let feedbackImage = "feedbackImage";
		export let signOutButton = "signOutButton";
		export let userDropdownArrow = "userDropdownArrow";
		export let userSettingsContainer = "userSettingsContainer";
		export let feedbackLabel = "feedbackLabel";
		export let footerButtonsContainer = "footerButtonsContainer";

		// loadingPanel
		export let clipperLoadingContainer = "clipperLoadingContainer";

		// mainController
		export let closeButton = "closeButton";
		export let closeButtonContainer = "closeButtonContainer";
		export let mainController = "mainController";

		// OneNotePicker
		export let saveToLocationContainer = "saveToLocationContainer";

		// modeButton
		export let regionButton = "regionButton";
		export let fullPageButton = "fullPageButton";
		export let bookmarkButton = "bookmarkButton";
		export let augmentationButton = "augmentationButton";
		export let pdfButton = "pdfButton";
		export let selectionButton = "selectionButton";

		// optionsPanel
		export let clipButton = "clipButton";
		export let clipButtonContainer = "clipButtonContainer";
		export let optionLabel = "optionLabel";

		// previewViewerPdfHeader
		export let radioAllPagesLabel = "radioAllPagesLabel";
		export let radioPageRangeLabel = "radioPageRangeLabel";
		export let rangeInput = "rangeInput";

		// previewViewer
		export let previewBody = "previewBody";
		export let previewContentContainer = "previewContentContainer";
		export let previewHeader = "previewHeader";
		export let previewHeaderContainer = "previewHeaderContainer";
		export let previewHeaderInput = "previewHeaderInput";
		export let previewHeaderInputMirror = "previewHeaderInputMirror";
		export let previewTitleContainer = "previewTitleContainer";
		export let previewSubtitleContainer = "previewSubtitleContainer";
		export let previewInnerContainer = "previewInnerContainer";
		export let previewAriaLiveDiv = "previewAriaLiveDiv";
		export let previewOptionsContainer = "previewOptionsContainer";
		export let previewInnerWrapper = "previewInnerWrapper";
		export let previewOuterContainer = "previewOuterContainer";
		export let previewUrlContainer = "previewUrlContainer";
		export let previewNotesContainer = "previewNotesContainer";

		// previewViewerFullPageHeader
		export let fullPageControl = "fullPageControl";
		export let fullPageHeaderTitle = "fullPageHeaderTitle";

		// previewViewerPdfHeader
		export let localPdfFileTitle = "localPdfFileTitle";
		export let pdfControl = "pdfControl";
		export let pdfHeaderTitle = "pdfHeaderTitle";
		export let pageRangeControl = "pageRangeControl";

		// pdfClipOptions
		export let checkboxToDistributePages = "checkboxToDistributePages";
		export let pdfIsTooLargeToAttachIndicator = "pdfIsTooLargeToAttachIndicator";
		export let checkboxToAttachPdf = "checkboxToAttachPdf";
		export let moreClipOptions = "moreClipOptions";

		// previewViewerRegionHeader
		export let addAnotherRegionButton = "addAnotherRegionButton";
		export let addRegionControl = "addRegionControl";

		// previewViewerRegionTitleOnlyHeader
		export let regionControl = "regionControl";
		export let regionHeaderTitle = "regionHeaderTitle";

		// previewViewerAugmentationHeader
		export let decrementFontSize = "decrementFontSize";
		export let fontSizeControl = "fontSizeControl";
		export let highlightButton = "highlightButton";
		export let highlightControl = "highlightControl";
		export let incrementFontSize = "incrementFontSize";
		export let serifControl = "serifControl";
		export let sansSerif = "sansSerif";
		export let serif = "serif";

		// previewViewerBookmarkHeader
		export let bookmarkControl = "bookmarkControl";
		export let bookmarkHeaderTitle = "bookmarkHeaderTitle";

		// ratingsPrompt
		export let ratingsButtonFeedbackNo = "ratingsButtonFeedbackNo";
		export let ratingsButtonFeedbackYes = "ratingsButtonFeedbackYes";
		export let ratingsButtonInitNo = "ratingsButtonInitNo";
		export let ratingsButtonInitYes = "ratingsButtonInitYes";
		export let ratingsButtonRateNo = "ratingsButtonRateNo";
		export let ratingsButtonRateYes = "ratingsButtonRateYes";
		export let ratingsPromptContainer = "ratingsPromptContainer";

		// regionSelectingPanel
		export let regionInstructionsContainer = "regionInstructionsContainer";
		export let regionClipCancelButton = "regionClipCancelButton";

		// regionSelector
		export let innerFrame = "innerFrame";
		export let outerFrame = "outerFrame";
		export let regionSelectorContainer = "regionSelectorContainer";

		// rotatingMessageSpriteAnimation
		export let spinnerText = "spinnerText";

		// sectionPicker
		export let locationPickerContainer = "locationPickerContainer";
		export let sectionLocationContainer = "sectionLocationContainer";

		// signInPanel
		export let signInButtonMsa = "signInButtonMsa";
		export let signInButtonOrgId = "signInButtonOrgId";
		export let signInContainer = "signInContainer";
		export let signInErrorCookieInformation = "signInErrorCookieInformation";
		export let signInErrorDebugInformation = "signInErrorDebugInformation";
		export let signInErrorDebugInformationDescription = "signInErrorDebugInformationDescription";
		export let signInErrorDebugInformationContainer = "signInErrorDebugInformationContainer";
		export let signInErrorDebugInformationList = "signInErrorDebugInformationList";
		export let signInErrorDescription = "signInErrorDescription";
		export let signInErrorDescriptionContainer = "signInErrorDescriptionContainer";
		export let signInErrorMoreInformation = "signInErrorMoreInformation";
		export let signInLogo = "signInLogo";
		export let signInMessageLabelContainer = "signInMessageLabelContainer";
		export let signInText = "signInText";
		export let signInToggleErrorDropdownArrow = "signInToggleErrorDropdownArrow";
		export let signInToggleErrorInformationText = "signInToggleErrorInformationText";

		// successPanel
		export let clipperSuccessContainer = "clipperSuccessContainer";
		export let launchOneNoteButton = "launchOneNoteButton";

		// tooltipRenderer
		export let pageNavAnimatedTooltip = "pageNavAnimatedTooltip";

		// unsupportedBrowser
		export let unsupportedBrowserContainer = "unsupportedBrowserContainer";
		export let unsupportedBrowserPanel = "unsupportedBrowserPanel";

		// whatsNewPanel
		export let changeLogSubPanel = "changeLogSubPanel";
		export let checkOutWhatsNewButton = "checkOutWhatsNewButton";
		export let proceedToWebClipperButton = "proceedToWebClipperButton";
		export let whatsNewTitleSubPanel = "whatsNewTitleSubPanel";

		export let clipperRootScript = "oneNoteCaptureRootScript";
		export let clipperUiFrame = "oneNoteWebClipper";
		export let clipperPageNavFrame = "oneNoteWebClipperPageNav";
		export let clipperExtFrame = "oneNoteWebClipperExtension";

		// tooltips
		export let brandingContainer = "brandingContainer";
	}

	export module HeaderValues {
		export let accept = "Accept";
		export let appIdKey = "MS-Int-AppId";
		export let correlationId = "X-CorrelationId";
		export let noAuthKey = "X-NoAuth";
		export let userSessionIdKey = "X-UserSessionId";
	}

	export module FunctionKeys {
		// Only entry still referenced — by the kept-orphan
		// communicatorLoggerPure.ts, which calls callRemoteFunction with this
		// channel name. Live V3 telemetry uses Aria fetch() directly.
		export let telemetry = "TELEMETRY";
	}

	export module KeyCodes {
		// event.which is deprecated -.-
		export let tab = 9;
		export let enter = 13;
		export let esc = 27;
		export let c = 67;
		export let down = 40;
		export let up = 38;
		export let left = 37;
		export let right = 39;
		export let space = 32;
		export let home = 36;
		export let end = 35;
	}

	export module StringKeyCodes {
		export let c = "KeyC";
	}

	export module Styles {
		export let sectionPickerContainerHeight = 280;
		export let clipperUiWidth = 322;
		export let customCursorSize = 20;
		export let clipperUiTopRightOffset = 20;
		export let clipperUiDropShadowBuffer = 7;
		export let clipperUiInnerPadding = 30;

		export module Colors {
			export let oneNoteHighlightColor = "#fefe56";
		}
	}

	export module Urls {
		export let serviceDomain = "https://www.onenote.com";

		export let localizedStringsUrlBase = serviceDomain + "/strings?ids=WebClipper.";

		export let clipperInstallPageUrl = "https://support.microsoft.com/en-us/office/getting-started-with-the-onenote-web-clipper-5696609d-c5ae-4591-b3af-1f897cb6eda6";
		export let clipperFeedbackUrl = "https://feedbackportal.microsoft.com/feedback/post/c06dcc30-2e1c-ec11-b6e7-0022481f8472";
		export let msaDomain = "https://login.live.com";
		export let orgIdDomain = "https://login.microsoftonline.com";
		export let userDataBoundaryDomain = "https://odc.officeapps.live.com/odc/v2.1/federationprovider";

		export module Authentication {
			export let authRedirectUrl = serviceDomain + "/webclipper/auth";
			export let signInUrl = serviceDomain + "/webclipper/signin";
			export let signOutUrl = serviceDomain + "/webclipper/signout";
			export let userInformationUrl = serviceDomain + "/webclipper/userinfo";
		}

		export module QueryParams {
			export let authType = "authType";
			export let clipperId = "clipperId";
			export let error = "error";
			export let errorDescription = "error_?description";
			export let userSessionId = "userSessionId";
			export let domain = "domain";
		}
	}

	export module Settings {
		export let fontSizeStep = 2;
		export let maxClipSuccessForRatingsPrompt = 12;
		export let maximumJSTimeValue = 1000 * 60 * 60 * 24 * 100000000; // 100M days in milliseconds, http://ecma-international.org/ecma-262/5.1/#sec-15.9.1.1
		export let maximumFontSize = 72;
		export let maximumMimeSizeLimit = 24900000;
		export let minClipSuccessForRatingsPrompt = 4;
		export let minimumFontSize = 8;
		export let minTimeBetweenBadRatings = 1000 * 60 * 60 * 24 * 7 * 10; // 10 weeks
		export let numRetriesPerPatchRequest = 3;
		export let pdfCheckCreatePageInterval = 2000; // 2 seconds
		export let pdfClippingMessageDelay = 5000; // 5 seconds
		export let pdfExtraPageLoadEachSide = 1;
		export let pdfInitialPageLoadCount = 3;
		export let timeUntilPdfPageNumbersFadeOutAfterScroll = 1000; // 1 second
	}

	export module CustomHtmlAttributes {
		export let setNameForArrowKeyNav = "setnameforarrowkeynav";
	}

	export module AriaSet {
		export let modeButtonSet = "ariaModeButtonSet";
		export let pdfPageSelection = "pdfPageSelection";
		export let serifGroupSet = "serifGroupSet";
	}
}
