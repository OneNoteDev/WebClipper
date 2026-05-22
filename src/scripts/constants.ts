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

		// modeButton
		export var regionButton = "regionButton";
		export var fullPageButton = "fullPageButton";
		export var bookmarkButton = "bookmarkButton";
		export var augmentationButton = "augmentationButton";
		export var pdfButton = "pdfButton";
		export var selectionButton = "selectionButton";

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

	export module FunctionKeys {
		// Only entry still referenced — by the kept-orphan
		// communicatorLoggerPure.ts, which calls callRemoteFunction with this
		// channel name. Live V3 telemetry uses Aria fetch() directly.
		export var telemetry = "TELEMETRY";
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

		export var localizedStringsUrlBase = serviceDomain + "/strings?ids=WebClipper.";

		export var clipperInstallPageUrl = "https://support.microsoft.com/en-us/office/getting-started-with-the-onenote-web-clipper-5696609d-c5ae-4591-b3af-1f897cb6eda6";
		export var clipperFeedbackUrl = "https://feedbackportal.microsoft.com/feedback/post/c06dcc30-2e1c-ec11-b6e7-0022481f8472";
		export var msaDomain = "https://login.live.com";
		export var orgIdDomain = "https://login.microsoftonline.com";
		export var userDataBoundaryDomain = "https://odc.officeapps.live.com/odc/v2.1/federationprovider";

		export module Authentication {
			export var authRedirectUrl = serviceDomain + "/webclipper/auth";
			export var signInUrl = serviceDomain + "/webclipper/signin";
			export var signOutUrl = serviceDomain + "/webclipper/signout";
			export var userInformationUrl = serviceDomain + "/webclipper/userinfo";
		}

		export module QueryParams {
			export var authType = "authType";
			export var clipperId = "clipperId";
			export var error = "error";
			export var errorDescription = "error_?description";
			export var userSessionId = "userSessionId";
			export var domain = "domain";
		}
	}

	export module Settings {
		export var fontSizeStep = 2;
		export var maxClipSuccessForRatingsPrompt = 12;
		export var maximumJSTimeValue = 1000 * 60 * 60 * 24 * 100000000; // 100M days in milliseconds, http://ecma-international.org/ecma-262/5.1/#sec-15.9.1.1
		export var maximumFontSize = 72;
		export var maximumMimeSizeLimit = 24900000;
		export var minClipSuccessForRatingsPrompt = 4;
		export var minimumFontSize = 8;
		export var minTimeBetweenBadRatings = 1000 * 60 * 60 * 24 * 7 * 10; // 10 weeks
		export var numRetriesPerPatchRequest = 3;
		export var pdfCheckCreatePageInterval = 2000; // 2 seconds
		export var pdfClippingMessageDelay = 5000; // 5 seconds
		export var pdfExtraPageLoadEachSide = 1;
		export var pdfInitialPageLoadCount = 3;
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
