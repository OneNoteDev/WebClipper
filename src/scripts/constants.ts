export module Constants {
	export module Classes {
		// animators
		export var heightAnimator = "height-animator";
		export var panelAnimator = "panel-animator";
		export var clearfix = "clearfix";

		// changeLogPanel
		export var change = "change";
		export var changes = "changes";
		export var changeBody = "change-body";
		export var changeDescription = "change-description";
		export var changeImage = "change-image";
		export var changeTitle = "change-title";

		// checkbox
		export var checkboxCheck = "checkboxCheck";

		// textArea input control
		export var textAreaInput = "textAreaInput";
		export var textAreaInputMirror = "textAreaInputMirror";

		// popover
		export var popover = "popover";
		export var popoverArrow = "popover-arrow";

		// previewViewer
		export var deleteHighlightButton = "delete-highlight";
		export var highlightable = "highlightable";
		export var highlighted = "highlighted";
		export var regionSelection = "region-selection";
		export var regionSelectionImage = "region-selection-image";
		export var regionSelectionRemoveButton = "region-selection-remove-button";

		// pdfPreviewViewer
		export var attachmentOverlay = "attachment-overlay";
		export var centeredInCanvas = "centered-in-canvas";
		export var overlay = "overlay";
		export var overlayHidden = "overlay-hidden";
		export var overlayNumber = "overlay-number";
		export var pdfPreviewImage = "pdf-preview-image";
		export var pdfPreviewImageCanvas = "pdf-preview-image-canvas";
		export var unselected = "unselected";

		export var localPdfPanelTitle = "local-pdf-panel-title";
		export var localPdfPanelSubtitle = "local-pdf-panel-subtitle";

		// radioButton
		export var radioIndicatorFill = "radio-indicator-fill";

		// spriteAnimation
		export var spinner = "spinner";

		// Accessibility 
		export var srOnly = "sr-only";

		// tooltip
		export var tooltip = "tooltip";

		// rotatingMessageSpriteAnimation
		export var centeredInPreview = "centered-in-preview";
	}

	export module Cookies {
		export var clipperInfo = "ClipperInfo";
	}

	export module Extension {
		export module NotificationIds {
			export var conflictingExtension = "conflictingExtension";
		}
	}

	export module Ids {
		// annotationInput
		export var annotationContainer = "annotationContainer";
		export var annotationField = "annotationField";
		export var annotationFieldMirror = "annotationFieldMirror";
		export var annotationPlaceholder = "annotationPlaceholder";

		// bookmarkPreview
		export var bookmarkThumbnail = "bookmarkThumbnail";
		export var bookmarkPreviewContentContainer = "bookmarkPreviewContentContainer";
		export var bookmarkPreviewInnerContainer = "bookmarkPreviewInnerContainer";

		// clippingPanel
		export var clipperApiProgressContainer = "clipperApiProgressContainer";

		// clippingPanel
		export var clipProgressDelayedMessage = "clipProgressDelayedMessage";
		export var clipProgressIndicatorMessage = "clipProgressIndicatorMessage";

		// dialogPanel
		export var dialogBackButton = "dialogBackButton";
		export var dialogButtonContainer = "dialogButtonContainer";
		export var dialogDebugMessageContainer = "dialogDebugMessageContainer";
		export var dialogMessageContainer = "dialogMessageContainer";
		export var dialogContentContainer = "dialogContentContainer";
		export var dialogMessage = "dialogMessage";
		export var dialogSignOutButton = "dialogSignoutButton";
		export var dialogTryAgainButton = "dialogTryAgainButton";

		// editorPreviewComponentBase
		export var highlightablePreviewBody = "highlightablePreviewBody";

		// failurePanel
		export var apiErrorMessage = "apiErrorMessage";
		export var backToHomeButton = "backToHomeButton";
		export var clipperFailureContainer = "clipperFailureContainer";
		export var refreshPageButton = "refreshPageButton";
		export var tryAgainButton = "tryAgainButton";

		// footer
		export var clipperFooterContainer = "clipperFooterContainer";
		export var currentUserControl = "currentUserControl";
		export var currentUserDetails = "currentUserDetails";
		export var currentUserEmail = "currentUserEmail";
		export var currentUserId = "currentUserId";
		export var currentUserName = "currentUserName";
		export var feedbackButton = "feedbackButton";
		export var feedbackImage = "feedbackImage";
		export var signOutButton = "signOutButton";
		export var userDropdownArrow = "userDropdownArrow";
		export var userSettingsContainer = "userSettingsContainer";
		export var feedbackLabel = "feedbackLabel";
		export var footerButtonsContainer = "footerButtonsContainer";

		// loadingPanel
		export var clipperLoadingContainer = "clipperLoadingContainer";

		// mainController
		export var closeButton = "closeButton";
		export var closeButtonContainer = "closeButtonContainer";
		export var mainController = "mainController";

		// OneNotePicker
		export var saveToLocationContainer = "saveToLocationContainer";

		// optionsPanel
		export var clipButton = "clipButton";
		export var clipButtonContainer = "clipButtonContainer";
		export var optionLabel = "optionLabel";

		// previewViewerPdfHeader
		export var radioAllPagesLabel = "radioAllPagesLabel";
		export var radioPageRangeLabel = "radioPageRangeLabel";
		export var rangeInput = "rangeInput";

		// previewViewer
		export var previewBody = "previewBody";
		export var previewContentContainer = "previewContentContainer";
		export var previewHeader = "previewHeader";
		export var previewHeaderContainer = "previewHeaderContainer";
		export var previewHeaderInput = "previewHeaderInput";
		export var previewHeaderInputMirror = "previewHeaderInputMirror";
		export var previewTitleContainer = "previewTitleContainer";
		export var previewSubtitleContainer = "previewSubtitleContainer";
		export var previewInnerContainer = "previewInnerContainer";
		export var previewAriaLiveDiv = "previewAriaLiveDiv";
		export var previewOptionsContainer = "previewOptionsContainer";
		export var previewInnerWrapper = "previewInnerWrapper";
		export var previewOuterContainer = "previewOuterContainer";
		export var previewUrlContainer = "previewUrlContainer";
		export var previewNotesContainer = "previewNotesContainer";

		// previewViewerFullPageHeader
		export var fullPageControl = "fullPageControl";
		export var fullPageHeaderTitle = "fullPageHeaderTitle";

		// previewViewerPdfHeader
		export var localPdfFileTitle = "localPdfFileTitle";
		export var pdfControl = "pdfControl";
		export var pdfHeaderTitle = "pdfHeaderTitle";
		export var pageRangeControl = "pageRangeControl";

		// pdfClipOptions
		export var checkboxToDistributePages = "checkboxToDistributePages";
		export var pdfIsTooLargeToAttachIndicator = "pdfIsTooLargeToAttachIndicator";
		export var checkboxToAttachPdf = "checkboxToAttachPdf";
		export var moreClipOptions = "moreClipOptions";

		// previewViewerRegionHeader
		export var addAnotherRegionButton = "addAnotherRegionButton";
		export var addRegionControl = "addRegionControl";

		// previewViewerRegionTitleOnlyHeader
		export var regionControl = "regionControl";
		export var regionHeaderTitle = "regionHeaderTitle";

		// previewViewerAugmentationHeader
		export var decrementFontSize = "decrementFontSize";
		export var fontSizeControl = "fontSizeControl";
		export var highlightButton = "highlightButton";
		export var highlightControl = "highlightControl";
		export var incrementFontSize = "incrementFontSize";
		export var serifControl = "serifControl";
		export var sansSerif = "sansSerif";
		export var serif = "serif";

		// previewViewerBookmarkHeader
		export var bookmarkControl = "bookmarkControl";
		export var bookmarkHeaderTitle = "bookmarkHeaderTitle";

		// ratingsPrompt
		export var ratingsButtonFeedbackNo = "ratingsButtonFeedbackNo";
		export var ratingsButtonFeedbackYes = "ratingsButtonFeedbackYes";
		export var ratingsButtonInitNo = "ratingsButtonInitNo";
		export var ratingsButtonInitYes = "ratingsButtonInitYes";
		export var ratingsButtonRateNo = "ratingsButtonRateNo";
		export var ratingsButtonRateYes = "ratingsButtonRateYes";
		export var ratingsPromptContainer = "ratingsPromptContainer";

		// regionSelectingPanel
		export var regionInstructionsContainer = "regionInstructionsContainer";
		export var regionClipCancelButton = "regionClipCancelButton";

		// regionSelector
		export var innerFrame = "innerFrame";
		export var outerFrame = "outerFrame";
		export var regionSelectorContainer = "regionSelectorContainer";

		// rotatingMessageSpriteAnimation
		export var spinnerText = "spinnerText";

		// sectionPicker
		export var locationPickerContainer = "locationPickerContainer";
		export var sectionLocationContainer = "sectionLocationContainer";

		// signInPanel
		export var signInButtonMsa = "signInButtonMsa";
		export var signInButtonOrgId = "signInButtonOrgId";
		export var signInContainer = "signInContainer";
		export var signInErrorCookieInformation = "signInErrorCookieInformation";
		export var signInErrorDebugInformation = "signInErrorDebugInformation";
		export var signInErrorDebugInformationDescription = "signInErrorDebugInformationDescription";
		export var signInErrorDebugInformationContainer = "signInErrorDebugInformationContainer";
		export var signInErrorDebugInformationList = "signInErrorDebugInformationList";
		export var signInErrorDescription = "signInErrorDescription";
		export var signInErrorDescriptionContainer = "signInErrorDescriptionContainer";
		export var signInErrorMoreInformation = "signInErrorMoreInformation";
		export var signInLogo = "signInLogo";
		export var signInMessageLabelContainer = "signInMessageLabelContainer";
		export var signInText = "signInText";
		export var signInToggleErrorDropdownArrow = "signInToggleErrorDropdownArrow";
		export var signInToggleErrorInformationText = "signInToggleErrorInformationText";

		// successPanel
		export var clipperSuccessContainer = "clipperSuccessContainer";
		export var launchOneNoteButton = "launchOneNoteButton";

		// tooltipRenderer
		export var pageNavAnimatedTooltip = "pageNavAnimatedTooltip";

		// unsupportedBrowser
		export var unsupportedBrowserContainer = "unsupportedBrowserContainer";
		export var unsupportedBrowserPanel = "unsupportedBrowserPanel";

		// whatsNewPanel
		export var changeLogSubPanel = "changeLogSubPanel";
		export var checkOutWhatsNewButton = "checkOutWhatsNewButton";
		export var proceedToWebClipperButton = "proceedToWebClipperButton";
		export var whatsNewTitleSubPanel = "whatsNewTitleSubPanel";

		export var clipperRootScript = "oneNoteCaptureRootScript";
		export var clipperUiFrame = "oneNoteWebClipper";
		export var clipperPageNavFrame = "oneNoteWebClipperPageNav";
		export var clipperExtFrame = "oneNoteWebClipperExtension";

		// tooltips
		export var brandingContainer = "brandingContainer";
	}

	export module HeaderValues {
		export var accept = "Accept";
		export var appIdKey = "MS-Int-AppId";
		export var correlationId = "X-CorrelationId";
		export var noAuthKey = "X-NoAuth";
		export var userSessionIdKey = "X-UserSessionId";
	}

	export module CommunicationChannels {
		// Debug Logging
		export var debugLoggingInjectedAndExtension = "DEBUGLOGGINGINJECTED_AND_EXTENSION";

		// Web Clipper
		export var extensionAndUi = "EXTENSION_AND_UI";
		export var injectedAndUi = "INJECTED_AND_UI";
		export var injectedAndExtension = "INJECTED_AND_EXTENSION";

		// What's New
		export var extensionAndPageNavUi = "EXTENSION_AND_PAGENAVUI";
		export var pageNavInjectedAndPageNavUi = "PAGENAVINJECTED_AND_PAGENAVUI";
		export var pageNavInjectedAndExtension = "PAGENAVINJECTED_AND_EXTENSION";
	}

	export module FunctionKeys {
		export var clipperStrings = "CLIPPER_STRINGS";
		export var clipperStringsFrontLoaded = "CLIPPER_STRINGS_FRONT_LOADED";
		export var closePageNavTooltip = "CLOSE_PAGE_NAV_TOOLTIP";
		export var createHiddenIFrame = "CREATE_HIDDEN_IFRAME";
		export var ensureFreshUserBeforeClip = "ENSURE_FRESH_USER_BEFORE_CLIP";
		export var escHandler = "ESC_HANDLER";
		export var getInitialUser = "GET_INITIAL_USER";
		export var getPageNavTooltipProps = "GET_PAGE_NAV_TOOLTIP_PROPS";
		export var getStorageValue = "GET_STORAGE_VALUE";
		export var getMultipleStorageValues = "GET_MULTIPLE_STORAGE_VALUES";
		export var getTooltipToRenderInPageNav = "GET_TOOLTIP_TO_RENDER_IN_PAGE_NAV";
		export var hideUi = "HIDE_UI";
		export var invokeClipper = "INVOKE_CLIPPER";
		export var invokeClipperFromPageNav = "INVOKE_CLIPPER_FROM_PAGE_NAV";
		export var invokeDebugLogging = "INVOKE_DEBUG_LOGGING";
		export var invokePageNav = "INVOKE_PAGE_NAV";
		export var extensionNotAllowedToAccessLocalFiles = "EXTENSION_NOT_ALLOWED_TO_ACCESS_LOCAL_FILES";
		export var noOpTracker = "NO_OP_TRACKER";
		export var onSpaNavigate = "ON_SPA_NAVIGATE";
		export var refreshPage = "REFRESH_PAGE";
		export var showRefreshClipperMessage = "SHOW_REFRESH_CLIPPER_MESSAGE";
		export var setInjectOptions = "SET_INJECT_OPTIONS";
		export var setInvokeOptions = "SET_INVOKE_OPTIONS";
		export var setStorageValue = "SET_STORAGE_VALUE";
		export var signInUser = "SIGN_IN_USER";
		export var signOutUser = "SIGN_OUT_USER";
		export var tabToLowestIndexedElement = "TAB_TO_LOWEST_INDEXED_ELEMENT";
		export var takeTabScreenshot = "TAKE_TAB_SCREENSHOT";
		export var telemetry = "TELEMETRY";
		export var toggleClipper = "TOGGLE_CLIPPER";
		export var unloadHandler = "UNLOAD_HANDLER";
		export var updateFrameHeight = "UPDATE_FRAME_HEIGHT";
		export var updatePageInfoIfUrlChanged = "UPDATE_PAGE_INFO_IF_URL_CHANGED";
	}

	export module KeyCodes {
		// event.which is deprecated -.-
		export var tab = 9;
		export var enter = 13;
		export var esc = 27;
		export var c = 67;
		export var down = 40;
		export var up = 38;
		export var left = 37;
		export var right = 39;
		export var space = 32;
		export var home = 36;
		export var end = 35;
	}

	export module StringKeyCodes {
		export var c = "KeyC";
	}

	export module SmartValueKeys {
		export var clientInfo = "CLIENT_INFO";
		export var isFullScreen = "IS_FULL_SCREEN";
		export var pageInfo = "PAGE_INFO";
		export var sessionId = "SESSION_ID";
		export var user = "USER";
	}

	export module Styles {
		export var sectionPickerContainerHeight = 280;
		export var clipperUiWidth = 322;
		export var customCursorSize = 20;
		export var clipperUiTopRightOffset = 20;
		export var clipperUiDropShadowBuffer = 7;
		export var clipperUiInnerPadding = 30;

		export module Colors {
			export var oneNoteHighlightColor = "#fefe56";
		}
	}

	export module Urls {
		export var serviceDomain = "https://www.onenote.com";

		export var augmentationApiUrl = serviceDomain + "/onaugmentation/clipperextract/v1.0/";
		export var changelogUrl = serviceDomain + "/whatsnext/webclipper";
		export var clipperFeedbackUrl = serviceDomain + "/feedback";
		export var clipperInstallPageUrl = serviceDomain + "/clipper/installed";
		export var fullPageScreenshotUrl = serviceDomain + "/onaugmentation/clipperDomEnhancer/v1.0/";
		export var localizedStringsUrlBase = serviceDomain + "/strings?ids=WebClipper.";

		export var msaDomain = "https://login.live.com";
		export var orgIdDomain = "https://login.microsoftonline.com";

		export module Authentication {
			export var authRedirectUrl = serviceDomain + "/webclipper/auth";
			export var signInUrl = serviceDomain + "/webclipper/signin";
			export var signOutUrl = serviceDomain + "/webclipper/signout";
			export var userInformationUrl = serviceDomain + "/webclipper/userinfo";
		}

		export module QueryParams {
			export var authType = "authType";
			export var category = "category";
			export var changelogLocale = "omkt";
			export var channel = "channel";
			export var clientType = "clientType";
			export var clipperId = "clipperId";
			export var clipperVersion = "clipperVersion";
			export var correlationId = "correlationId";
			export var error = "error";
			export var errorDescription = "error_?description";
			export var event = "event";
			export var eventName = "eventName";
			export var failureId = "failureId";
			export var failureInfo = "failureInfo";
			export var failureType = "failureType";
			export var inlineInstall = "inlineInstall";
			export var label = "label";
			export var noOpType = "noOpType";
			export var stackTrace = "stackTrace";
			export var timeoutInMs = "timeoutInMs";
			export var url = "url";
			export var userSessionId = "userSessionId";
			export var wdFromClipper = "wdfromclipper"; // This naming convention is standard in OneNote Online
		}
	}

	export module LogCategories {
		export var oneNoteClipperUsage = "OneNoteClipperUsage";
	}

	export module Settings {
		export var fontSizeStep = 2;
		export var maxClipSuccessForRatingsPrompt = 12;
		export var maximumJSTimeValue = 1000 * 60 * 60 * 24 * 100000000; // 100M days in milliseconds, http://ecma-international.org/ecma-262/5.1/#sec-15.9.1.1
		export var maximumFontSize = 72;
		export var maximumNumberOfTimesToShowTooltips = 3;
		export var maximumMimeSizeLimit = 24900000;
		export var minClipSuccessForRatingsPrompt = 4;
		export var minimumFontSize = 8;
		export var minTimeBetweenBadRatings = 1000 * 60 * 60 * 24 * 7 * 10; // 10 weeks
		export var noOpTrackerTimeoutDuration = 20 * 1000; // 20 seconds
		export var numRetriesPerPatchRequest = 3;
		export var pdfCheckCreatePageInterval = 2000; // 2 seconds
		export var pdfClippingMessageDelay = 5000; // 5 seconds
		export var pdfExtraPageLoadEachSide = 1;
		export var pdfInitialPageLoadCount = 3;
		export var timeBetweenDifferentTooltips = 1000 * 60 * 60 * 24 * 7 * 1; // 1 week
		export var timeBetweenSameTooltip = 1000 * 60 * 60 * 24 * 7 * 3; // 3 weeks
		export var timeBetweenTooltips = 1000 * 60 * 60 * 24 * 7 * 3; // 21 days
		export var timeUntilPdfPageNumbersFadeOutAfterScroll = 1000; // 1 second
	}

	export module CustomHtmlAttributes {
		export var setNameForArrowKeyNav = "setnameforarrowkeynav";
	}

	export module AriaSet {
		export var modeButtonSet = "ariaModeButtonSet";
		export var pdfPageSelection = "pdfPageSelection";
		export var serifGroupSet = "serifGroupSet";
	}
}
