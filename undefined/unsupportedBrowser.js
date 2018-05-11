(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";
var Status;
(function (Status) {
    Status[Status["NotStarted"] = 0] = "NotStarted";
    Status[Status["InProgress"] = 1] = "InProgress";
    Status[Status["Succeeded"] = 2] = "Succeeded";
    Status[Status["Failed"] = 3] = "Failed";
})(Status = exports.Status || (exports.Status = {}));

},{}],2:[function(require,module,exports){
"use strict";
var invokeSource_1 = require("../extensions/invokeSource");
var TooltipType;
(function (TooltipType) {
    TooltipType[TooltipType["ChangeLog"] = 0] = "ChangeLog";
    TooltipType[TooltipType["Pdf"] = 1] = "Pdf";
    TooltipType[TooltipType["Product"] = 2] = "Product";
    TooltipType[TooltipType["Recipe"] = 3] = "Recipe";
    TooltipType[TooltipType["Video"] = 4] = "Video";
    TooltipType[TooltipType["WhatsNew"] = 5] = "WhatsNew";
})(TooltipType = exports.TooltipType || (exports.TooltipType = {}));
var TooltipTypeUtils;
(function (TooltipTypeUtils) {
    function toInvokeSource(tooltipType) {
        switch (tooltipType) {
            case TooltipType.Pdf:
                return invokeSource_1.InvokeSource.PdfTooltip;
            case TooltipType.Product:
                return invokeSource_1.InvokeSource.ProductTooltip;
            case TooltipType.Recipe:
                return invokeSource_1.InvokeSource.RecipeTooltip;
            case TooltipType.Video:
                return invokeSource_1.InvokeSource.VideoTooltip;
            case TooltipType.WhatsNew:
                return invokeSource_1.InvokeSource.WhatsNewTooltip;
            default:
                throw Error("Invalid TooltipType passed in TooltipType.toInvokeSource");
        }
    }
    TooltipTypeUtils.toInvokeSource = toInvokeSource;
})(TooltipTypeUtils = exports.TooltipTypeUtils || (exports.TooltipTypeUtils = {}));

},{"../extensions/invokeSource":6}],3:[function(require,module,exports){
"use strict";
var constants_1 = require("../constants");
var polyfills_1 = require("../polyfills");
var extensionUtils_1 = require("../extensions/extensionUtils");
var localization_1 = require("../localization/localization");
var localizationHelper_1 = require("../localization/localizationHelper");
var status_1 = require("./status");
/**
 * A very browser-compliant class that notifies the user that their browser is unsupported
 * by the Web Clipper.
 */
var UnsupportedBrowserClass = (function () {
    function UnsupportedBrowserClass() {
        this.state = this.getInitialState();
    }
    UnsupportedBrowserClass.prototype.getInitialState = function () {
        return {
            localizedStringFetchAttemptCompleted: status_1.Status.NotStarted
        };
    };
    UnsupportedBrowserClass.prototype.setState = function (newPartialState) {
        m.startComputation();
        for (var key in newPartialState) {
            if (newPartialState.hasOwnProperty(key)) {
                this.state[key] = newPartialState[key];
            }
        }
        m.endComputation();
    };
    UnsupportedBrowserClass.componentize = function () {
        var _this = this;
        var returnValue = function () { };
        returnValue.controller = function (props) {
            return new _this(props);
        };
        returnValue.view = function (controller, props) {
            controller.props = props;
            return controller.render();
        };
        return returnValue;
    };
    UnsupportedBrowserClass.prototype.fetchLocalizedStrings = function (locale) {
        var _this = this;
        this.setState({
            localizedStringFetchAttemptCompleted: status_1.Status.InProgress
        });
        localizationHelper_1.LocalizationHelper.makeLocStringsFetchRequest(locale).then(function (responsePackage) {
            try {
                localization_1.Localization.setLocalizedStrings(JSON.parse(responsePackage.parsedResponse));
                _this.setState({
                    localizedStringFetchAttemptCompleted: status_1.Status.Succeeded
                });
            }
            catch (e) {
                _this.setState({
                    localizedStringFetchAttemptCompleted: status_1.Status.Failed
                });
            }
        })["catch"](function () {
            _this.setState({
                localizedStringFetchAttemptCompleted: status_1.Status.Failed
            });
        });
    };
    UnsupportedBrowserClass.prototype.attemptingFetchLocalizedStrings = function () {
        return this.state.localizedStringFetchAttemptCompleted === status_1.Status.NotStarted ||
            this.state.localizedStringFetchAttemptCompleted === status_1.Status.InProgress;
    };
    UnsupportedBrowserClass.prototype.render = function () {
        if (this.state.localizedStringFetchAttemptCompleted === status_1.Status.NotStarted) {
            // navigator.userLanguage is only available in IE, and Typescript will not recognize this property
            this.fetchLocalizedStrings(navigator.language || navigator.userLanguage);
        }
        // In IE8 and below, 'class' is a reserved keyword and cannot be used as a key in a JSON object
        return ({ tag: "div", attrs: { id: constants_1.Constants.Ids.unsupportedBrowserContainer }, children: [
                { tag: "div", attrs: { id: constants_1.Constants.Ids.unsupportedBrowserPanel, "class": "panelContent" }, children: [
                        { tag: "div", attrs: { className: constants_1.Constants.Classes.heightAnimator, style: "min-height: 276px; max-height: 276px;" }, children: [
                                { tag: "div", attrs: { className: constants_1.Constants.Classes.panelAnimator, style: "left: 0px; opacity: 1;" }, children: [
                                        { tag: "div", attrs: { id: constants_1.Constants.Ids.signInContainer }, children: [
                                                { tag: "div", attrs: { className: "signInPadding" }, children: [
                                                        { tag: "img", attrs: { id: constants_1.Constants.Ids.signInLogo, src: extensionUtils_1.ExtensionUtils.getImageResourceUrl("onenote_logo_clipper.png") } },
                                                        { tag: "div", attrs: { id: constants_1.Constants.Ids.signInMessageLabelContainer, "class": "messageLabelContainer" }, children: [
                                                                { tag: "span", attrs: { "class": "messageLabel", style: localization_1.Localization.getFontFamilyAsStyle(localization_1.Localization.FontFamily.Regular) }, children: [
                                                                        this.attemptingFetchLocalizedStrings() ? "" : localization_1.Localization.getLocalizedString("WebClipper.Label.OneNoteClipper")
                                                                    ] }
                                                            ] },
                                                        { tag: "div", attrs: { "class": "signInDescription" }, children: [
                                                                { tag: "span", attrs: { id: constants_1.Constants.Ids.signInText, style: localization_1.Localization.getFontFamilyAsStyle(localization_1.Localization.FontFamily.Light) }, children: [
                                                                        this.attemptingFetchLocalizedStrings() ? "" : localization_1.Localization.getLocalizedString("WebClipper.Label.UnsupportedBrowser")
                                                                    ] }
                                                            ] }
                                                    ] }
                                            ] }
                                    ] }
                            ] }
                    ] }
            ] });
    };
    return UnsupportedBrowserClass;
}());
polyfills_1.Polyfills.init();
var component = UnsupportedBrowserClass.componentize();
exports.UnsupportedBrowser = component;
m.mount(document.getElementById("clipperUIPlaceholder"), component);

},{"../constants":4,"../extensions/extensionUtils":5,"../localization/localization":9,"../localization/localizationHelper":10,"../polyfills":12,"./status":1}],4:[function(require,module,exports){
"use strict";
var Constants;
(function (Constants) {
    var Classes;
    (function (Classes) {
        // animators
        Classes.heightAnimator = "height-animator";
        Classes.panelAnimator = "panel-animator";
        Classes.clearfix = "clearfix";
        // changeLogPanel
        Classes.change = "change";
        Classes.changes = "changes";
        Classes.changeBody = "change-body";
        Classes.changeDescription = "change-description";
        Classes.changeImage = "change-image";
        Classes.changeTitle = "change-title";
        // checkbox
        Classes.checkboxCheck = "checkboxCheck";
        // textArea input control
        Classes.textAreaInput = "textAreaInput";
        Classes.textAreaInputMirror = "textAreaInputMirror";
        // popover
        Classes.popover = "popover";
        Classes.popoverArrow = "popover-arrow";
        // previewViewer
        Classes.deleteHighlightButton = "delete-highlight";
        Classes.highlightable = "highlightable";
        Classes.highlighted = "highlighted";
        Classes.regionSelection = "region-selection";
        Classes.regionSelectionImage = "region-selection-image";
        Classes.regionSelectionRemoveButton = "region-selection-remove-button";
        // pdfPreviewViewer
        Classes.attachmentOverlay = "attachment-overlay";
        Classes.centeredInCanvas = "centered-in-canvas";
        Classes.overlay = "overlay";
        Classes.overlayHidden = "overlay-hidden";
        Classes.overlayNumber = "overlay-number";
        Classes.pdfPreviewImage = "pdf-preview-image";
        Classes.pdfPreviewImageCanvas = "pdf-preview-image-canvas";
        Classes.unselected = "unselected";
        Classes.localPdfPanelTitle = "local-pdf-panel-title";
        Classes.localPdfPanelSubtitle = "local-pdf-panel-subtitle";
        // radioButton
        Classes.radioIndicatorFill = "radio-indicator-fill";
        // spriteAnimation
        Classes.spinner = "spinner";
        // Accessibility 
        Classes.srOnly = "sr-only";
        // tooltip
        Classes.tooltip = "tooltip";
        // rotatingMessageSpriteAnimation
        Classes.centeredInPreview = "centered-in-preview";
    })(Classes = Constants.Classes || (Constants.Classes = {}));
    var Cookies;
    (function (Cookies) {
        Cookies.clipperInfo = "ClipperInfo";
    })(Cookies = Constants.Cookies || (Constants.Cookies = {}));
    var Extension;
    (function (Extension) {
        var NotificationIds;
        (function (NotificationIds) {
            NotificationIds.conflictingExtension = "conflictingExtension";
        })(NotificationIds = Extension.NotificationIds || (Extension.NotificationIds = {}));
    })(Extension = Constants.Extension || (Constants.Extension = {}));
    var Ids;
    (function (Ids) {
        // annotationInput
        Ids.annotationContainer = "annotationContainer";
        Ids.annotationField = "annotationField";
        Ids.annotationFieldMirror = "annotationFieldMirror";
        Ids.annotationPlaceholder = "annotationPlaceholder";
        // bookmarkPreview
        Ids.bookmarkThumbnail = "bookmarkThumbnail";
        Ids.bookmarkPreviewContentContainer = "bookmarkPreviewContentContainer";
        Ids.bookmarkPreviewInnerContainer = "bookmarkPreviewInnerContainer";
        // clippingPanel
        Ids.clipperApiProgressContainer = "clipperApiProgressContainer";
        // clippingPanel
        Ids.clipProgressDelayedMessage = "clipProgressDelayedMessage";
        Ids.clipProgressIndicatorMessage = "clipProgressIndicatorMessage";
        // dialogPanel
        Ids.dialogBackButton = "dialogBackButton";
        Ids.dialogButtonContainer = "dialogButtonContainer";
        Ids.dialogDebugMessageContainer = "dialogDebugMessageContainer";
        Ids.dialogMessageContainer = "dialogMessageContainer";
        Ids.dialogContentContainer = "dialogContentContainer";
        Ids.dialogMessage = "dialogMessage";
        Ids.dialogSignOutButton = "dialogSignoutButton";
        Ids.dialogTryAgainButton = "dialogTryAgainButton";
        // editorPreviewComponentBase
        Ids.highlightablePreviewBody = "highlightablePreviewBody";
        // failurePanel
        Ids.apiErrorMessage = "apiErrorMessage";
        Ids.backToHomeButton = "backToHomeButton";
        Ids.clipperFailureContainer = "clipperFailureContainer";
        Ids.refreshPageButton = "refreshPageButton";
        Ids.tryAgainButton = "tryAgainButton";
        // footer
        Ids.clipperFooterContainer = "clipperFooterContainer";
        Ids.currentUserControl = "currentUserControl";
        Ids.currentUserDetails = "currentUserDetails";
        Ids.currentUserEmail = "currentUserEmail";
        Ids.currentUserId = "currentUserId";
        Ids.currentUserName = "currentUserName";
        Ids.feedbackButton = "feedbackButton";
        Ids.feedbackImage = "feedbackImage";
        Ids.signOutButton = "signOutButton";
        Ids.userDropdownArrow = "userDropdownArrow";
        Ids.userSettingsContainer = "userSettingsContainer";
        // loadingPanel
        Ids.clipperLoadingContainer = "clipperLoadingContainer";
        // mainController
        Ids.closeButton = "closeButton";
        Ids.closeButtonContainer = "closeButtonContainer";
        Ids.mainController = "mainController";
        // OneNotePicker
        Ids.saveToLocationContainer = "saveToLocationContainer";
        // optionsPanel
        Ids.clipButton = "clipButton";
        Ids.clipButtonContainer = "clipButtonContainer";
        Ids.optionLabel = "optionLabel";
        // previewViewerPdfHeader
        Ids.radioAllPagesLabel = "radioAllPagesLabel";
        Ids.radioPageRangeLabel = "radioPageRangeLabel";
        Ids.rangeInput = "rangeInput";
        // previewViewer
        Ids.previewBody = "previewBody";
        Ids.previewContentContainer = "previewContentContainer";
        Ids.previewHeader = "previewHeader";
        Ids.previewHeaderContainer = "previewHeaderContainer";
        Ids.previewHeaderInput = "previewHeaderInput";
        Ids.previewHeaderInputMirror = "previewHeaderInputMirror";
        Ids.previewTitleContainer = "previewTitleContainer";
        Ids.previewSubtitleContainer = "previewSubtitleContainer";
        Ids.previewInnerContainer = "previewInnerContainer";
        Ids.previewOptionsContainer = "previewOptionsContainer";
        Ids.previewInnerWrapper = "previewInnerWrapper";
        Ids.previewOuterContainer = "previewOuterContainer";
        Ids.previewUrlContainer = "previewUrlContainer";
        Ids.previewNotesContainer = "previewNotesContainer";
        // previewViewerFullPageHeader
        Ids.fullPageControl = "fullPageControl";
        Ids.fullPageHeaderTitle = "fullPageHeaderTitle";
        // previewViewerPdfHeader
        Ids.localPdfFileTitle = "localPdfFileTitle";
        Ids.pdfControl = "pdfControl";
        Ids.pdfHeaderTitle = "pdfHeaderTitle";
        Ids.pageRangeControl = "pageRangeControl";
        // pdfClipOptions
        Ids.checkboxToDistributePages = "checkboxToDistributePages";
        Ids.pdfIsTooLargeToAttachIndicator = "pdfIsTooLargeToAttachIndicator";
        Ids.checkboxToAttachPdf = "checkboxToAttachPdf";
        Ids.moreClipOptions = "moreClipOptions";
        // previewViewerRegionHeader
        Ids.addAnotherRegionButton = "addAnotherRegionButton";
        Ids.addRegionControl = "addRegionControl";
        // previewViewerRegionTitleOnlyHeader
        Ids.regionControl = "regionControl";
        Ids.regionHeaderTitle = "regionHeaderTitle";
        // previewViewerAugmentationHeader
        Ids.decrementFontSize = "decrementFontSize";
        Ids.fontSizeControl = "fontSizeControl";
        Ids.highlightButton = "highlightButton";
        Ids.highlightControl = "highlightControl";
        Ids.incrementFontSize = "incrementFontSize";
        Ids.serifControl = "serifControl";
        Ids.sansSerif = "sansSerif";
        Ids.serif = "serif";
        // previewViewerBookmarkHeader
        Ids.bookmarkControl = "bookmarkControl";
        Ids.bookmarkHeaderTitle = "bookmarkHeaderTitle";
        // ratingsPrompt
        Ids.ratingsButtonFeedbackNo = "ratingsButtonFeedbackNo";
        Ids.ratingsButtonFeedbackYes = "ratingsButtonFeedbackYes";
        Ids.ratingsButtonInitNo = "ratingsButtonInitNo";
        Ids.ratingsButtonInitYes = "ratingsButtonInitYes";
        Ids.ratingsButtonRateNo = "ratingsButtonRateNo";
        Ids.ratingsButtonRateYes = "ratingsButtonRateYes";
        Ids.ratingsPromptContainer = "ratingsPromptContainer";
        // regionSelectingPanel
        Ids.regionInstructionsContainer = "regionInstructionsContainer";
        Ids.regionClipCancelButton = "regionClipCancelButton";
        // regionSelector
        Ids.innerFrame = "innerFrame";
        Ids.outerFrame = "outerFrame";
        Ids.regionSelectorContainer = "regionSelectorContainer";
        // rotatingMessageSpriteAnimation
        Ids.spinnerText = "spinnerText";
        // sectionPicker
        Ids.locationPickerContainer = "locationPickerContainer";
        // signInPanel
        Ids.signInButtonMsa = "signInButtonMsa";
        Ids.signInButtonOrgId = "signInButtonOrgId";
        Ids.signInContainer = "signInContainer";
        Ids.signInErrorCookieInformation = "signInErrorCookieInformation";
        Ids.signInErrorDebugInformation = "signInErrorDebugInformation";
        Ids.signInErrorDebugInformationDescription = "signInErrorDebugInformationDescription";
        Ids.signInErrorDebugInformationContainer = "signInErrorDebugInformationContainer";
        Ids.signInErrorDebugInformationList = "signInErrorDebugInformationList";
        Ids.signInErrorDescription = "signInErrorDescription";
        Ids.signInErrorDescriptionContainer = "signInErrorDescriptionContainer";
        Ids.signInErrorMoreInformation = "signInErrorMoreInformation";
        Ids.signInLogo = "signInLogo";
        Ids.signInMessageLabelContainer = "signInMessageLabelContainer";
        Ids.signInText = "signInText";
        Ids.signInToggleErrorDropdownArrow = "signInToggleErrorDropdownArrow";
        Ids.signInToggleErrorInformationText = "signInToggleErrorInformationText";
        // successPanel
        Ids.clipperSuccessContainer = "clipperSuccessContainer";
        Ids.launchOneNoteButton = "launchOneNoteButton";
        // tooltipRenderer
        Ids.pageNavAnimatedTooltip = "pageNavAnimatedTooltip";
        // unsupportedBrowser
        Ids.unsupportedBrowserContainer = "unsupportedBrowserContainer";
        Ids.unsupportedBrowserPanel = "unsupportedBrowserPanel";
        // whatsNewPanel
        Ids.changeLogSubPanel = "changeLogSubPanel";
        Ids.checkOutWhatsNewButton = "checkOutWhatsNewButton";
        Ids.proceedToWebClipperButton = "proceedToWebClipperButton";
        Ids.whatsNewTitleSubPanel = "whatsNewTitleSubPanel";
        Ids.clipperRootScript = "oneNoteCaptureRootScript";
        Ids.clipperUiFrame = "oneNoteWebClipper";
        Ids.clipperPageNavFrame = "oneNoteWebClipperPageNav";
        Ids.clipperExtFrame = "oneNoteWebClipperExtension";
        // tooltips
        Ids.brandingContainer = "brandingContainer";
    })(Ids = Constants.Ids || (Constants.Ids = {}));
    var HeaderValues;
    (function (HeaderValues) {
        HeaderValues.accept = "Accept";
        HeaderValues.appIdKey = "MS-Int-AppId";
        HeaderValues.correlationId = "X-CorrelationId";
        HeaderValues.noAuthKey = "X-NoAuth";
        HeaderValues.userSessionIdKey = "X-UserSessionId";
    })(HeaderValues = Constants.HeaderValues || (Constants.HeaderValues = {}));
    var CommunicationChannels;
    (function (CommunicationChannels) {
        // Debug Logging
        CommunicationChannels.debugLoggingInjectedAndExtension = "DEBUGLOGGINGINJECTED_AND_EXTENSION";
        // Web Clipper
        CommunicationChannels.extensionAndUi = "EXTENSION_AND_UI";
        CommunicationChannels.injectedAndUi = "INJECTED_AND_UI";
        CommunicationChannels.injectedAndExtension = "INJECTED_AND_EXTENSION";
        // What's New
        CommunicationChannels.extensionAndPageNavUi = "EXTENSION_AND_PAGENAVUI";
        CommunicationChannels.pageNavInjectedAndPageNavUi = "PAGENAVINJECTED_AND_PAGENAVUI";
        CommunicationChannels.pageNavInjectedAndExtension = "PAGENAVINJECTED_AND_EXTENSION";
    })(CommunicationChannels = Constants.CommunicationChannels || (Constants.CommunicationChannels = {}));
    var FunctionKeys;
    (function (FunctionKeys) {
        FunctionKeys.clipperStrings = "CLIPPER_STRINGS";
        FunctionKeys.clipperStringsFrontLoaded = "CLIPPER_STRINGS_FRONT_LOADED";
        FunctionKeys.closePageNavTooltip = "CLOSE_PAGE_NAV_TOOLTIP";
        FunctionKeys.createHiddenIFrame = "CREATE_HIDDEN_IFRAME";
        FunctionKeys.ensureFreshUserBeforeClip = "ENSURE_FRESH_USER_BEFORE_CLIP";
        FunctionKeys.escHandler = "ESC_HANDLER";
        FunctionKeys.getInitialUser = "GET_INITIAL_USER";
        FunctionKeys.getPageNavTooltipProps = "GET_PAGE_NAV_TOOLTIP_PROPS";
        FunctionKeys.getStorageValue = "GET_STORAGE_VALUE";
        FunctionKeys.getMultipleStorageValues = "GET_MULTIPLE_STORAGE_VALUES";
        FunctionKeys.getTooltipToRenderInPageNav = "GET_TOOLTIP_TO_RENDER_IN_PAGE_NAV";
        FunctionKeys.hideUi = "HIDE_UI";
        FunctionKeys.invokeClipper = "INVOKE_CLIPPER";
        FunctionKeys.invokeClipperFromPageNav = "INVOKE_CLIPPER_FROM_PAGE_NAV";
        FunctionKeys.invokeDebugLogging = "INVOKE_DEBUG_LOGGING";
        FunctionKeys.invokePageNav = "INVOKE_PAGE_NAV";
        FunctionKeys.extensionNotAllowedToAccessLocalFiles = "EXTENSION_NOT_ALLOWED_TO_ACCESS_LOCAL_FILES";
        FunctionKeys.noOpTracker = "NO_OP_TRACKER";
        FunctionKeys.onSpaNavigate = "ON_SPA_NAVIGATE";
        FunctionKeys.refreshPage = "REFRESH_PAGE";
        FunctionKeys.showRefreshClipperMessage = "SHOW_REFRESH_CLIPPER_MESSAGE";
        FunctionKeys.setInjectOptions = "SET_INJECT_OPTIONS";
        FunctionKeys.setInvokeOptions = "SET_INVOKE_OPTIONS";
        FunctionKeys.setStorageValue = "SET_STORAGE_VALUE";
        FunctionKeys.signInUser = "SIGN_IN_USER";
        FunctionKeys.signOutUser = "SIGN_OUT_USER";
        FunctionKeys.tabToLowestIndexedElement = "TAB_TO_LOWEST_INDEXED_ELEMENT";
        FunctionKeys.takeTabScreenshot = "TAKE_TAB_SCREENSHOT";
        FunctionKeys.telemetry = "TELEMETRY";
        FunctionKeys.toggleClipper = "TOGGLE_CLIPPER";
        FunctionKeys.unloadHandler = "UNLOAD_HANDLER";
        FunctionKeys.updateFrameHeight = "UPDATE_FRAME_HEIGHT";
        FunctionKeys.updatePageInfoIfUrlChanged = "UPDATE_PAGE_INFO_IF_URL_CHANGED";
    })(FunctionKeys = Constants.FunctionKeys || (Constants.FunctionKeys = {}));
    var KeyCodes;
    (function (KeyCodes) {
        // event.which is deprecated -.-
        KeyCodes.tab = 9;
        KeyCodes.enter = 13;
        KeyCodes.esc = 27;
        KeyCodes.c = 67;
    })(KeyCodes = Constants.KeyCodes || (Constants.KeyCodes = {}));
    var StringKeyCodes;
    (function (StringKeyCodes) {
        StringKeyCodes.c = "KeyC";
    })(StringKeyCodes = Constants.StringKeyCodes || (Constants.StringKeyCodes = {}));
    var SmartValueKeys;
    (function (SmartValueKeys) {
        SmartValueKeys.clientInfo = "CLIENT_INFO";
        SmartValueKeys.isFullScreen = "IS_FULL_SCREEN";
        SmartValueKeys.pageInfo = "PAGE_INFO";
        SmartValueKeys.sessionId = "SESSION_ID";
        SmartValueKeys.user = "USER";
    })(SmartValueKeys = Constants.SmartValueKeys || (Constants.SmartValueKeys = {}));
    var Styles;
    (function (Styles) {
        Styles.sectionPickerContainerHeight = 280;
        Styles.clipperUiWidth = 322;
        Styles.clipperUiTopRightOffset = 20;
        Styles.clipperUiDropShadowBuffer = 7;
        Styles.clipperUiInnerPadding = 30;
        var Colors;
        (function (Colors) {
            Colors.oneNoteHighlightColor = "#fefe56";
        })(Colors = Styles.Colors || (Styles.Colors = {}));
    })(Styles = Constants.Styles || (Constants.Styles = {}));
    var Urls;
    (function (Urls) {
        Urls.serviceDomain = "https://www.onenote.com";
        Urls.augmentationApiUrl = Urls.serviceDomain + "/onaugmentation/clipperextract/v1.0/";
        Urls.changelogUrl = Urls.serviceDomain + "/whatsnext/webclipper";
        Urls.clipperFeedbackUrl = Urls.serviceDomain + "/feedback";
        Urls.clipperInstallPageUrl = Urls.serviceDomain + "/clipper/installed";
        Urls.fullPageScreenshotUrl = Urls.serviceDomain + "/onaugmentation/clipperDomEnhancer/v1.0/";
        Urls.localizedStringsUrlBase = Urls.serviceDomain + "/strings?ids=WebClipper.";
        Urls.userFlightingEndpoint = Urls.serviceDomain + "/webclipper/userflight";
        Urls.msaDomain = "https://login.live.com";
        Urls.orgIdDomain = "https://login.microsoftonline.com";
        var Authentication;
        (function (Authentication) {
            Authentication.authRedirectUrl = Urls.serviceDomain + "/webclipper/auth";
            Authentication.signInUrl = Urls.serviceDomain + "/webclipper/signin";
            Authentication.signOutUrl = Urls.serviceDomain + "/webclipper/signout";
            Authentication.userInformationUrl = Urls.serviceDomain + "/webclipper/userinfo";
        })(Authentication = Urls.Authentication || (Urls.Authentication = {}));
        var QueryParams;
        (function (QueryParams) {
            QueryParams.authType = "authType";
            QueryParams.category = "category";
            QueryParams.changelogLocale = "omkt";
            QueryParams.channel = "channel";
            QueryParams.clientType = "clientType";
            QueryParams.clipperId = "clipperId";
            QueryParams.clipperVersion = "clipperVersion";
            QueryParams.correlationId = "correlationId";
            QueryParams.error = "error";
            QueryParams.errorDescription = "error_?description";
            QueryParams.event = "event";
            QueryParams.eventName = "eventName";
            QueryParams.failureId = "failureId";
            QueryParams.failureInfo = "failureInfo";
            QueryParams.failureType = "failureType";
            QueryParams.inlineInstall = "inlineInstall";
            QueryParams.label = "label";
            QueryParams.noOpType = "noOpType";
            QueryParams.stackTrace = "stackTrace";
            QueryParams.timeoutInMs = "timeoutInMs";
            QueryParams.url = "url";
            QueryParams.userSessionId = "userSessionId";
            QueryParams.wdFromClipper = "wdfromclipper"; // This naming convention is standard in OneNote Online
        })(QueryParams = Urls.QueryParams || (Urls.QueryParams = {}));
    })(Urls = Constants.Urls || (Constants.Urls = {}));
    var LogCategories;
    (function (LogCategories) {
        LogCategories.oneNoteClipperUsage = "OneNoteClipperUsage";
    })(LogCategories = Constants.LogCategories || (Constants.LogCategories = {}));
    var Settings;
    (function (Settings) {
        Settings.fontSizeStep = 2;
        Settings.maxClipSuccessForRatingsPrompt = 12;
        Settings.maximumJSTimeValue = 1000 * 60 * 60 * 24 * 100000000; // 100M days in milliseconds, http://ecma-international.org/ecma-262/5.1/#sec-15.9.1.1
        Settings.maximumFontSize = 72;
        Settings.maximumNumberOfTimesToShowTooltips = 3;
        Settings.maximumMimeSizeLimit = 24900000;
        Settings.minClipSuccessForRatingsPrompt = 4;
        Settings.minimumFontSize = 8;
        Settings.minTimeBetweenBadRatings = 1000 * 60 * 60 * 24 * 7 * 10; // 10 weeks
        Settings.noOpTrackerTimeoutDuration = 20 * 1000; // 20 seconds
        Settings.numRetriesPerPatchRequest = 3;
        Settings.pdfCheckCreatePageInterval = 2000; // 2 seconds
        Settings.pdfClippingMessageDelay = 5000; // 5 seconds
        Settings.pdfExtraPageLoadEachSide = 1;
        Settings.pdfInitialPageLoadCount = 3;
        Settings.timeBetweenDifferentTooltips = 1000 * 60 * 60 * 24 * 7 * 1; // 1 week
        Settings.timeBetweenSameTooltip = 1000 * 60 * 60 * 24 * 7 * 3; // 3 weeks
        Settings.timeBetweenTooltips = 1000 * 60 * 60 * 24 * 7 * 3; // 21 days
        Settings.timeUntilPdfPageNumbersFadeOutAfterScroll = 1000; // 1 second
    })(Settings = Constants.Settings || (Constants.Settings = {}));
})(Constants = exports.Constants || (exports.Constants = {}));

},{}],5:[function(require,module,exports){
"use strict";
var ExtensionUtils;
(function (ExtensionUtils) {
    /*
     * Returns the relative path to the images directory.
     */
    function getImageResourceUrl(imageName) {
        // Since Chromebook has case-sensitive urls, we always go with lowercase image names.
        // See the use of "lowerCasePathName" in gulpfile.js where the images names are lower-cased
        // when copied)
        return ("images/" + imageName).toLowerCase();
    }
    ExtensionUtils.getImageResourceUrl = getImageResourceUrl;
})(ExtensionUtils = exports.ExtensionUtils || (exports.ExtensionUtils = {}));

},{}],6:[function(require,module,exports){
"use strict";
var InvokeSource;
(function (InvokeSource) {
    InvokeSource[InvokeSource["Bookmarklet"] = 0] = "Bookmarklet";
    InvokeSource[InvokeSource["ContextMenu"] = 1] = "ContextMenu";
    InvokeSource[InvokeSource["ExtensionButton"] = 2] = "ExtensionButton";
    InvokeSource[InvokeSource["WhatsNewTooltip"] = 3] = "WhatsNewTooltip";
    InvokeSource[InvokeSource["PdfTooltip"] = 4] = "PdfTooltip";
    InvokeSource[InvokeSource["ProductTooltip"] = 5] = "ProductTooltip";
    InvokeSource[InvokeSource["RecipeTooltip"] = 6] = "RecipeTooltip";
    InvokeSource[InvokeSource["VideoTooltip"] = 7] = "VideoTooltip";
})(InvokeSource = exports.InvokeSource || (exports.InvokeSource = {}));

},{}],7:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var http_1 = require("./http");
var objectUtils_1 = require("../objectUtils");
var promiseUtils_1 = require("../promiseUtils");
/**
 * Helper class which extends the Http class in order to allow automatic retries.
 */
var HttpWithRetries = (function (_super) {
    __extends(HttpWithRetries, _super);
    function HttpWithRetries() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    HttpWithRetries.get = function (url, headers, timeout, expectedCodes, retryOptions) {
        var _this = this;
        if (timeout === void 0) { timeout = http_1.Http.defaultTimeout; }
        if (expectedCodes === void 0) { expectedCodes = [200]; }
        var func = function () {
            return _super.createAndSendRequest.call(_this, "GET", url, headers, expectedCodes, timeout);
        };
        return promiseUtils_1.PromiseUtils.execWithRetry(func, retryOptions);
    };
    HttpWithRetries.post = function (url, data, headers, expectedCodes, timeout, retryOptions) {
        var _this = this;
        if (expectedCodes === void 0) { expectedCodes = [200]; }
        if (timeout === void 0) { timeout = http_1.Http.defaultTimeout; }
        if (objectUtils_1.ObjectUtils.isNullOrUndefined(data)) {
            throw new Error("data must be a non-undefined object, but was: " + data);
        }
        var func = function () {
            return _super.createAndSendRequest.call(_this, "POST", url, headers, expectedCodes, timeout, data);
        };
        return promiseUtils_1.PromiseUtils.execWithRetry(func, retryOptions);
    };
    return HttpWithRetries;
}(http_1.Http));
exports.HttpWithRetries = HttpWithRetries;

},{"../objectUtils":11,"../promiseUtils":13,"./http":8}],8:[function(require,module,exports){
"use strict";
var objectUtils_1 = require("../objectUtils");
/**
 * Helper class for performing http requests. For each of the http methods, resolve(request) is only
 * called if the status code is an unexpected one, defined by the caller (defaulting to 200 only).
 *
 * TODO: Wean this off OneNoteApi.ErrorUtils once we move the general http logic into its own package.
 */
var Http = (function () {
    function Http() {
    }
    Http.get = function (url, headers, timeout, expectedCodes) {
        if (timeout === void 0) { timeout = Http.defaultTimeout; }
        if (expectedCodes === void 0) { expectedCodes = [200]; }
        return Http.createAndSendRequest("GET", url, headers, expectedCodes, timeout);
    };
    Http.post = function (url, data, headers, expectedCodes, timeout) {
        if (expectedCodes === void 0) { expectedCodes = [200]; }
        if (timeout === void 0) { timeout = Http.defaultTimeout; }
        if (objectUtils_1.ObjectUtils.isNullOrUndefined(data)) {
            throw new Error("data must be a non-undefined object, but was: " + data);
        }
        return Http.createAndSendRequest("POST", url, headers, expectedCodes, timeout, data);
    };
    Http.createAndSendRequest = function (method, url, headers, expectedCodes, timeout, data) {
        if (expectedCodes === void 0) { expectedCodes = [200]; }
        if (timeout === void 0) { timeout = Http.defaultTimeout; }
        if (!url) {
            throw new Error("url must be a non-empty string, but was: " + url);
        }
        return new Promise(function (resolve, reject) {
            var request = new XMLHttpRequest();
            request.open(method, url);
            request.onload = function () {
                if (expectedCodes.indexOf(request.status) > -1) {
                    resolve(request);
                }
                else {
                    reject(OneNoteApi.ErrorUtils.createRequestErrorObject(request, OneNoteApi.RequestErrorType.UNEXPECTED_RESPONSE_STATUS));
                }
            };
            request.onerror = function () {
                reject(OneNoteApi.ErrorUtils.createRequestErrorObject(request, OneNoteApi.RequestErrorType.NETWORK_ERROR));
            };
            request.ontimeout = function () {
                reject(OneNoteApi.ErrorUtils.createRequestErrorObject(request, OneNoteApi.RequestErrorType.REQUEST_TIMED_OUT));
            };
            Http.setHeaders(request, headers);
            request.timeout = timeout;
            request.send(data);
        });
    };
    Http.setHeaders = function (request, headers) {
        if (headers) {
            for (var key in headers) {
                request.setRequestHeader(key, headers[key]);
            }
        }
    };
    return Http;
}());
Http.defaultTimeout = 30000;
exports.Http = Http;

},{"../objectUtils":11}],9:[function(require,module,exports){
"use strict";
var Localization;
(function (Localization) {
    var FontFamily;
    (function (FontFamily) {
        FontFamily[FontFamily["Regular"] = 0] = "Regular";
        FontFamily[FontFamily["Bold"] = 1] = "Bold";
        FontFamily[FontFamily["Light"] = 2] = "Light";
        FontFamily[FontFamily["Semibold"] = 3] = "Semibold";
        FontFamily[FontFamily["Semilight"] = 4] = "Semilight";
    })(FontFamily = Localization.FontFamily || (Localization.FontFamily = {}));
    var localizedStrings;
    var formattedFontFamilies = {};
    // The fallback for when we are unable to fetch locstrings from our server
    var backupStrings = require("../../strings.json");
    /*
     * Gets the matching localized string, or the fallback (unlocalized) string if
     * unavailable.
     */
    function getLocalizedString(stringId) {
        if (!stringId) {
            throw new Error("stringId must be a non-empty string, but was: " + stringId);
        }
        if (localizedStrings) {
            var localResult = localizedStrings[stringId];
            if (localResult) {
                return localResult;
            }
        }
        var backupResult = backupStrings[stringId];
        if (backupResult) {
            return backupResult;
        }
        throw new Error("getLocalizedString could not find a localized or fallback string: " + stringId);
    }
    Localization.getLocalizedString = getLocalizedString;
    function setLocalizedStrings(localizedStringsAsJson) {
        localizedStrings = localizedStringsAsJson;
    }
    Localization.setLocalizedStrings = setLocalizedStrings;
    function getFontFamilyAsStyle(family) {
        return "font-family: " + getFontFamily(family) + ";";
    }
    Localization.getFontFamilyAsStyle = getFontFamilyAsStyle;
    function getFontFamily(family) {
        // Check cache first
        if (formattedFontFamilies[family]) {
            return formattedFontFamilies[family];
        }
        var stringId = "WebClipper.FontFamily." + FontFamily[family].toString();
        var fontFamily = getLocalizedString(stringId);
        formattedFontFamilies[family] = formatFontFamily(fontFamily);
        return formattedFontFamilies[family];
    }
    Localization.getFontFamily = getFontFamily;
    /*
     * If we want to set font families through JavaScript, it uses a specific
     * format. This helper function returns the formatted font family input.
     */
    function formatFontFamily(fontFamily) {
        if (!fontFamily) {
            return "";
        }
        var splits = fontFamily.split(",");
        for (var i = 0; i < splits.length; i++) {
            splits[i] = splits[i].trim();
            if (splits[i].length > 0 && splits[i].indexOf(" ") >= 0 && splits[i][0] !== "'" && splits[i][splits.length - 1] !== "'") {
                splits[i] = "'" + splits[i] + "'";
            }
        }
        return splits.join(",");
    }
    Localization.formatFontFamily = formatFontFamily;
})(Localization = exports.Localization || (exports.Localization = {}));

},{"../../strings.json":17}],10:[function(require,module,exports){
"use strict";
var constants_1 = require("../constants");
var urlUtils_1 = require("../urlUtils");
var HttpWithRetries_1 = require("../http/HttpWithRetries");
var LocalizationHelper = (function () {
    function LocalizationHelper() {
    }
    LocalizationHelper.makeLocStringsFetchRequest = function (locale) {
        var url = urlUtils_1.UrlUtils.addUrlQueryValue(constants_1.Constants.Urls.localizedStringsUrlBase, "locale", locale);
        return HttpWithRetries_1.HttpWithRetries.get(url).then(function (request) {
            return Promise.resolve({
                request: request,
                parsedResponse: request.responseText
            });
        });
    };
    return LocalizationHelper;
}());
exports.LocalizationHelper = LocalizationHelper;

},{"../constants":4,"../http/HttpWithRetries":7,"../urlUtils":15}],11:[function(require,module,exports){
"use strict";
var ObjectUtils;
(function (ObjectUtils) {
    function isNumeric(varToCheck) {
        return typeof varToCheck === "number" && !isNaN(varToCheck);
    }
    ObjectUtils.isNumeric = isNumeric;
    function isNullOrUndefined(varToCheck) {
        /* tslint:disable:no-null-keyword */
        return varToCheck === null || varToCheck === undefined;
        /* tslint:enable:no-null-keyword */
    }
    ObjectUtils.isNullOrUndefined = isNullOrUndefined;
})(ObjectUtils = exports.ObjectUtils || (exports.ObjectUtils = {}));

},{}],12:[function(require,module,exports){
"use strict";
var promise = require("es6-promise");
var Polyfills;
(function (Polyfills) {
    function init() {
        endsWithPoly();
        objectAssignPoly();
        promisePoly();
        requestAnimationFramePoly();
    }
    Polyfills.init = init;
    // See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/endsWith
    function endsWithPoly() {
        if (!String.prototype.endsWith) {
            String.prototype.endsWith = function (searchString, position) {
                var subjectString = this.toString();
                if (typeof position !== "number" || !isFinite(position) || Math.floor(position) !== position || position > subjectString.length) {
                    position = subjectString.length;
                }
                position -= searchString.length;
                var lastIndex = subjectString.lastIndexOf(searchString, position);
                return lastIndex !== -1 && lastIndex === position;
            };
        }
    }
    // See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/assign
    function objectAssignPoly() {
        if (typeof Object.assign !== "function") {
            Object.assign = function (target) {
                if (!target) {
                    throw new TypeError("Cannot convert undefined to object");
                }
                var output = Object(target);
                for (var index = 1; index < arguments.length; index++) {
                    var source = arguments[index];
                    if (source) {
                        for (var nextKey in source) {
                            if (source.hasOwnProperty(nextKey)) {
                                output[nextKey] = source[nextKey];
                            }
                        }
                    }
                }
                return output;
            };
        }
    }
    function promisePoly() {
        if (typeof Promise === "undefined") {
            promise.polyfill();
        }
    }
    function requestAnimationFramePoly() {
        if (!window.requestAnimationFrame) {
            window.requestAnimationFrame = window.msRequestAnimationFrame || window.mozRequestAnimationFrame
                || window.webkitRequestAnimationFrame || window.oRequestAnimationFrame || (function (callback) {
                setTimeout(function () {
                    callback(Date.now());
                }, 16);
            });
        }
    }
})(Polyfills = exports.Polyfills || (exports.Polyfills = {}));

},{"es6-promise":18}],13:[function(require,module,exports){
"use strict";
var PromiseUtils;
(function (PromiseUtils) {
    /**
     * Returns a promise that simply resolves after the specified time period
     */
    function wait(millieseconds) {
        return new Promise(function (resolve) {
            setTimeout(function () {
                resolve();
            }, millieseconds);
        });
    }
    PromiseUtils.wait = wait;
    /**
     * Executes the given function and retries on failure.
     */
    function execWithRetry(func, retryOptions) {
        if (retryOptions === void 0) { retryOptions = { retryCount: 3, retryWaitTimeInMs: 3000 }; }
        return func()["catch"](function (error1) {
            if (retryOptions.retryCount > 0) {
                return new Promise(function (resolve, reject) {
                    setTimeout(function () {
                        retryOptions.retryCount--;
                        execWithRetry(func, retryOptions).then(function (response) {
                            resolve(response);
                        })["catch"](function (error2) {
                            reject(error2);
                        });
                    }, retryOptions.retryWaitTimeInMs);
                });
            }
            else {
                return Promise.reject(error1);
            }
        });
    }
    PromiseUtils.execWithRetry = execWithRetry;
})(PromiseUtils = exports.PromiseUtils || (exports.PromiseUtils = {}));

},{}],14:[function(require,module,exports){
"use strict";
// Load up the settings file
var settings = require("../settings.json");
var Settings;
(function (Settings) {
    function getSetting(name) {
        var localResult = settings[name];
        if (!localResult || !localResult.Value) {
            return undefined;
        }
        return localResult.Value;
    }
    Settings.getSetting = getSetting;
    function setSettingsJsonForTesting(jsonObject) {
        if (jsonObject) {
            settings = jsonObject;
        }
        else {
            // revert to default
            settings = require("../settings.json");
        }
    }
    Settings.setSettingsJsonForTesting = setSettingsJsonForTesting;
})(Settings = exports.Settings || (exports.Settings = {}));

},{"../settings.json":16}],15:[function(require,module,exports){
"use strict";
var objectUtils_1 = require("./objectUtils");
var settings_1 = require("./settings");
var tooltipType_1 = require("./clipperUI/tooltipType");
var UrlUtils;
(function (UrlUtils) {
    function checkIfUrlMatchesAContentType(url, tooltipTypes) {
        for (var i = 0; i < tooltipTypes.length; ++i) {
            var tooltipType = tooltipTypes[i];
            var contentTypeAsString = tooltipType_1.TooltipType[tooltipType];
            var contentTypeRegexes = settings_1.Settings.getSetting(contentTypeAsString + "Domains");
            var concatenatedRegExes = new RegExp(contentTypeRegexes.join("|"), "i");
            if (concatenatedRegExes.test(url)) {
                return tooltipType;
            }
        }
        return;
    }
    UrlUtils.checkIfUrlMatchesAContentType = checkIfUrlMatchesAContentType;
    function getFileNameFromUrl(url, fallbackResult) {
        if (!url) {
            return fallbackResult;
        }
        var regexResult = /\/(?=[^\/]+\.\w{3,4}$).+/g.exec(url);
        return regexResult && regexResult[0] ? regexResult[0].slice(1) : fallbackResult;
    }
    UrlUtils.getFileNameFromUrl = getFileNameFromUrl;
    function getHostname(url) {
        var l = document.createElement("a");
        l.href = url;
        return l.protocol + "//" + l.host + "/";
    }
    UrlUtils.getHostname = getHostname;
    function getPathname(url) {
        var l = document.createElement("a");
        l.href = url;
        var urlPathName = l.pathname;
        // We need to ensure the leading forward slash to make it consistant across all browsers.
        return ensureLeadingForwardSlash(urlPathName);
    }
    UrlUtils.getPathname = getPathname;
    function ensureLeadingForwardSlash(url) {
        url = objectUtils_1.ObjectUtils.isNullOrUndefined(url) ? "/" : url;
        return (url.length > 0 && url.charAt(0) === "/") ? url : "/" + url;
    }
    /**
     * Gets the query value of the given url and key.
     *
     * @param url The URL to get the query value from
     * @param key The query key in the URL to get the query value from
     * @return Undefined if the key does not exist; "" if the key exists but has no matching
     * value; otherwise the query value
     */
    function getQueryValue(url, key) {
        if (!url || !key) {
            return undefined;
        }
        var escapedKey = key.replace(/[\[\]]/g, "\\$&");
        var regex = new RegExp("[?&]" + escapedKey + "(=([^&#]*)|&|#|$)", "i");
        var results = regex.exec(url);
        if (!results) {
            return undefined;
        }
        if (!results[2]) {
            return "";
        }
        return decodeURIComponent(results[2].replace(/\+/g, " "));
    }
    UrlUtils.getQueryValue = getQueryValue;
    /**
     * Add a name/value pair to the query string of a URL.
     * If the name already exists, simply replace the value (there is no existing standard
     * for the usage of multiple identical names in the same URL, so we assume adding a
     * duplicate name is unintended).
     *
     * @param originalUrl The URL to add the name/value to
     * @param name New value name
     * @param value New value
     * @return Resulting URL
     */
    function addUrlQueryValue(originalUrl, key, value, keyToCamelCase) {
        if (keyToCamelCase === void 0) { keyToCamelCase = false; }
        if (!originalUrl || !key || !value) {
            return originalUrl;
        }
        if (keyToCamelCase) {
            key = key.charAt(0).toUpperCase() + key.slice(1);
        }
        // The fragment refers to the last part of the url consisting of "#" and everything after it
        var regexResult = originalUrl.match(/^([^#]*)(#.*)?$/);
        var beforeFragment = regexResult[1];
        var fragment = regexResult[2] ? regexResult[2] : "";
        var queryStartIndex = beforeFragment.indexOf("?");
        if (queryStartIndex === -1) {
            // There is no query string, so create a new one
            return beforeFragment + "?" + key + "=" + value + fragment;
        }
        else if (queryStartIndex === beforeFragment.length - 1) {
            // Sometimes for some reason there are no name/value pairs specified after the '?'
            return beforeFragment + key + "=" + value + fragment;
        }
        else {
            // Check that name does not already exist
            var pairs = beforeFragment.substring(queryStartIndex + 1).split("&");
            for (var i = 0; i < pairs.length; i++) {
                var splitPair = pairs[i].split("=");
                if (splitPair[0] === key) {
                    // Replace the value
                    pairs[i] = splitPair[0] + "=" + value;
                    return beforeFragment.substring(0, queryStartIndex + 1) + pairs.join("&") + fragment;
                }
            }
            // No existing name found
            return beforeFragment + "&" + key + "=" + value + fragment;
        }
    }
    UrlUtils.addUrlQueryValue = addUrlQueryValue;
    function onBlacklistedDomain(url) {
        return urlMatchesRegexInSettings(url, ["PageNav_BlacklistedDomains"]);
    }
    UrlUtils.onBlacklistedDomain = onBlacklistedDomain;
    function onWhitelistedDomain(url) {
        return urlMatchesRegexInSettings(url, ["AugmentationDefault_WhitelistedDomains", "ProductDomains", "RecipeDomains"]);
    }
    UrlUtils.onWhitelistedDomain = onWhitelistedDomain;
    function urlMatchesRegexInSettings(url, settingNames) {
        if (!url) {
            return false;
        }
        var domains = [];
        settingNames.forEach(function (settingName) {
            domains = domains.concat(settings_1.Settings.getSetting(settingName));
        });
        for (var _i = 0, domains_1 = domains; _i < domains_1.length; _i++) {
            var identifier = domains_1[_i];
            if (new RegExp(identifier).test(url)) {
                return true;
            }
        }
        return false;
    }
})(UrlUtils = exports.UrlUtils || (exports.UrlUtils = {}));

},{"./clipperUI/tooltipType":2,"./objectUtils":11,"./settings":14}],16:[function(require,module,exports){
module.exports={
	"DummyObjectForTestingPurposes": {
		"Description": "Do not remove under any circumstances!",
		"Value": "Testing."
	},
	"AugmentationDefault_WhitelistedDomains": {
		"Description": "The set of domains on which we are changing the default clip mode to Augmentation.",
		"Value": [
			"^https?:\\/\\/www\\.onenote\\.com",
			"[^\\w]wikipedia",
			"[^\\w]nytimes",
			"[^\\w]lifehacker",
			"[^\\w]msn",
			"[^\\w]theguardian",
			"[^\\w]forbes",
			"[^\\w]bbc",
			"[^\\w]huffingtonpost",
			"[^\\w]businessinsider",
			"[^\\w]washingtonpost",
			"[^\\w]medium",
			"[^\\w]buzzfeed",
			"[^\\w]bbc",
			"[^\\w]theverge",
			"[^\\w]techcrunch",
			"[^\\w]amazon",
			"[^\\w]allrecipes",
			"[^\\w]foodnetwork",
			"[^\\w]seriouseats",
			"[^\\w]epicurious",
			"[^\\w]support.office.com",
			"[^\\w]blogs.office.com",
			"[^\\w]blogs.technet.com",
			"[^\\w]youtube\\.com\\/watch(\\?v=(\\w+)|.*\\&v=(\\w+))",
			"[^\\w]youtube\\.com\\/embed\\/(\\w+)",
			"[^\\w]vimeo\\.com.*?\\/(\\d+)($|\\?|\\#|\\/$)",
			"[^\\w]vimeo\\.com.*?\\/(\\d+)\\/\\w+:\\w+(\\/|$)",
			"[^\\w]vimeo\\.com.*?\\/ondemand\\/\\w+$",
			"[^\\w]khanacademy\\.org(.*)/v/(.*)",
			"\\/(\\d{2}|\\d{4})\\/\\d{1,2}\\/",
			"\\/(\\d{2}|\\d{4})-\\d{1,2}-\\d{1,2}\\/"
		]
	},
	"PageNav_BlacklistedDomains": {
		"Description": "The set of domains where we do not want to show any PageNav tooltip experience",
		"Value": [
			"^(http(s)?)://(login\\.live\\.com)",
			"^(http(s)?)://(login\\.microsoftonline\\.com)"
		]
	},
	"PdfDomains": {
		"Description": "PDF regexes",
		"Value": [
			"^.*(\\.pdf)$"
		]
	},
	"RecipeDomains": {
		"Description": "The set of domains where we want to show a Recipe tooltip",
		"Value": [
			"^(http(s)?)://(12tomatoes\\.com/)()([^/]*-[^/]*)/$",
			"^(http(s)?)://(abc\\.go\\.com/shows/the-chew/recipes/)([^/]*-[^/]*)$",
			"^(http(s)?)://(([^ ]{1,18})?)(allrecipes\\.com)()/(recipe/.*)$",
			"^(http(s)?)://((\\.{1,18}\\.)?)(allrecipes\\.)(com)/(recipe/[^/]+(/)?(/detail\\.aspx\\??)?)$",
			"^(http(s)?)://()(allrecipes\\.com)()/([r|R]ecipe/[^/]+/Detail\\.aspx)$",
			"^(http(s)?)://()(allrecipes\\.com)()/(recipe/.*)$",
			"^(http(s)?)://(cookieandkate\\.com)()/(\\d{4})/(.+)$",
			"^(http(s)?)://(cooking\\.)(nytimes\\.com)()/(recipes/(.*))$",
			"^(http(s)?)://()(cookpad\\.com)()/(recipe/[0-9]+$)$",
			"^(http(s)?)://()(damndelicious\\.net)()/\\d+/\\d+/\\d+/.+/$",
			"^(http(s)?)://(food52\\.com)()/recipes/[0-9]+-.+$",
			"^(http(s)?)://(minimalistbaker.com)/([^/]*-[^/]*)/$",
			"^(http(s)?)://(paleoleap.com)/([^/]*-[^/]*)/$",
			"^(http(s)?)://(pinchofyum.com)/([^/]*-[^/]*)$",
			"^(http(s)?)://(recipe\\.rakuten\\.co\\.jp)()/recipe/[0-9]+/$",
			"^(http(s)?)://()(thepioneerwoman\\.com)()/(cooking/.+/)$",
			"^(http(s)?)://((www\\.)?)(allrecipes\\.com)()/([r|R]ecipe/[^/]+/(Detail\\.aspx)?)$",
			"^(http(s)?)://((www\\.)?)(allrecipes\\.com)()/([R|r]ecipe/.*)$",
			"^(http(s)?)://(www\\.)(bbc\\.co\\.uk/food/recipes/[^/]*_\\d+)$",
			"^(http(s)?)://(www\\.)(bbcgoodfood\\.com)()/(recipes/[0-9]+/(.*))$",
			"^(http(s)?)://(www\\.)(bbcgoodfood\\.com)/recipes/([^/]*-[^/]*)$",
			"^(http(s)?)://(www\\.)(bettycrocker\\.com)()/(recipes/[^\\/]+/[0-9a-f-]{36}/?)$",
			"^(http(s)?)://(www\\.)(bonappetit\\.com)()/(recipe/(.*))$",
			"^(http(s)?)://(www\\.budgetbytes\\.com)/\\d{4}/\\d{2}/(.*)/",
			"^(http(s)?)://((www\\.)?)(chowhound\\.com)()/(recipes/.*)$",
			"^(http(s)?)://(www\\.cookingclassy\\.com)/\\d{4}/\\d{2}/(.*)/",
			"^(http(s)?)://(www\\.delish\\.com)/cooking/recipe-ideas/recipes/a\\d+/[^/]*-[^/]*/",
			"^(http(s)?)://(www\\.)(eatingwell\\.com)()/(recipe/\\d+/.+/)$",
			"^(http(s)?)://(www\\.)(epicurious\\.com)()/(recipes/food/views/.*)$",
			"^(http(s)?)://(www\\.)(food\\.com)()/(recipe/.*)$",
			"^(http(s)?)://(www\\.)(foodandwine\\.com)()/(recipes\\/.+)$",
			"^(http(s)?)://(www\\.)(foodnetwork)(\\.ca)/(recipe/(.*))$",
			"^(http(s)?)://(www\\.)(foodnetwork\\.com)()/(recipe-collections/.*)$",
			"^(http(s)?)://(www\\.)(foodnetwork\\.com)()/(recipes.*)$",
			"^(http(s)?)://(www\\.)(foodnetwork\\.com)()/(recipes/.*)$",
			"^(http(s)?)://(www\\.)(marthastewart\\.com)()/(([0-9]+|recipe)/.*)$",
			"^(http(s)?)://(www\\.)(marthastewart\\.com)()/([0-9]+/[^/]+)$",
			"^(http(s)?)://(www\\.)(myrecipes\\.com)()/(recipe/.*)$",
			"^(http(s)?)://(www\\.)(myrecipes\\.com)()/(recipe/.*-[0-9]*/)$",
			"^(http(s)?)://(www\\.)(myrecipes\\.com)()/(recipe/.*)$",
			"^(http(s)?)://(www\\.)(myrecipes\\.com)()/(recipe/[^/]+.*)$",
			"^(http(s)?)://(www\\.)(realsimple\\.com)()/(food-recipes/browse-all-recipes/[^\\/]+/index\\.html)$",
			"^(http(s)?)://((www)?\\.)(seriouseats\\.com)()/([Rr]ecipes\\/.*\\.(html|HTML)(.*)?)$",
			"^(http(s)?)://(www\\.)(simplyrecipes\\.com)()/(recipes/[^/]*/)$",
			"^(http(s)?)://((www\\.)?)(simplyrecipes\\.com)()/(recipes/[^/]*/)$",
			"^(http(s)?)://((www\\.)?)(simplyrecipes\\.com)()/(recipes/.*)$",
			"^(http(s)?)://(www\\.)(tasteofhome\\.com)()/([R|r]ecipes/[^/]+$)$",
			"^(http(s)?)://(www\\.)(tasteofhome\\.com)()/(recipes/[^/]*/?)$",
			"^(http(s)?)://(www\\.)(tasteofhome\\.com)()/(recipes/[^\\/]+/?)$",
			"^(http(s)?)://(www\\.)(yummly\\.com)()/(recipe/[^/]+)$",
			"^(http(s)?)://((www\\.)?)(yummly\\.com)()/(recipe/.*)$",
			"^(http(s)?)://(.*)(yummly\\.com)()/(recipe/.+)$"
		]
	},
	"ProductDomains": {
		"Description": "The set of domains where we want to show a Product tooltip",
		"Value": [
			"^(http(s)?)://store\\.steampowered.com/app/\\d+/.*$",
			"^(http(s)?)://(www\\.)(amazon\\.com)()/(gp/product/[^/]+/.*)$",
			"^(http(s)?)://(www\\.)(amazon\\.com)()/(dp/[^/]+.*)$",
			"^(http(s)?)://(www\\.)(amazon\\.com)()/([^/]+/dp/[^/]+)$",
			"^(http(s)?)://(www\\.)(amazon\\.in)()/((.+/)?(dp|gp/product)\\/\\w{10,13}([^\\w].*)?)$",
			"^(http(s)?)://(www\\.)(amazon\\.)([a-zA-Z\\.]+)/([^/]+/dp/.*)$",
			"^(http(s)?)://(www\\.)(bedbathandbeyond\\.com)(/store/product/)([^/]*-[^/]*/)(\\d+.*)",
			"^(http(s)?)://(www\\.)(ebay\\.com)()/(itm/[^/]+/.*)$",
			"^(http(s)?)://(www\\.)(etsy\\.com)()/(listing)/(\\d+/.*)$",
			"^(http(s)?)://(www\\.)(homedepot\\.com)()/(p/[^/]+/.*)$",
			"^(http(s)?)://(www\\.)(newegg\\.com)()/(Product/Product\\.aspx\\?Item=.+)$",
			"^(http(s)?)://(www\\.)(overstock\\.com)()/(.+/.+/[0-9]+/product\\.html.*)$",
			"^(http(s)?)://(www\\.)(staples\\.com)()/(.*/product_[^/]+)$",
			"^(http(s)?)://(www\\.)(target\\.com)()/(p/.+)$",
			"^(http(s)?)://(www\\.)(walmart\\.com)()/(ip/.*)$"
		]
	},
	"App_Id": {
		"Description": "For identifying the Clipper during interaction with external services",
		"Value": "OneNote Clipper OSS"
	}
}
},{}],17:[function(require,module,exports){
module.exports={
	"WebClipper.Accessibility.ScreenReader.CurrentModeHasChanged": "The current clipping mode is now '{0}'",
	"WebClipper.Accessibility.ScreenReader.ClippingPageToOneNote": "Clipping the current page to OneNote",
	"WebClipper.Accessibility.ScreenReader.ChangeFontToSansSerif": "Change font to Sans-Serif",
	"WebClipper.Accessibility.ScreenReader.ChangeFontToSerif": "Change font to Serif",
	"WebClipper.Accessibility.ScreenReader.DecreaseFontSize": "Decrease font size",
	"WebClipper.Accessibility.ScreenReader.IncreaseFontSize": "Increase font size",
	"WebClipper.Accessibility.ScreenReader.ToggleHighlighterForArticleMode": "Toggle Highlighter Mode For Article",
	"WebClipper.Accessibility.ScreenReader.InputBoxToChangeTitleOfOneNotePage": "Text input to edit the title of the page you want to save",
	"WebClipper.Action.BackToHome": "Back",
	"WebClipper.Action.Cancel": "Cancel",
	"WebClipper.Action.Clip": "Clip",
	"WebClipper.Action.CloseTheClipper": "Close the Clipper",
	"WebClipper.Action.Feedback": "Feedback?",
	"WebClipper.Action.RefreshPage": "Refresh Page",
	"WebClipper.Action.Signin": "Sign In",
	"WebClipper.Action.SigninMsa": "Sign in with a Microsoft account",
	"WebClipper.Action.SigninOrgId": "Sign in with a work or school account",
	"WebClipper.Action.SignOut": "Sign Out",
	"WebClipper.Action.TryAgain": "Try Again",
	"WebClipper.Action.ViewInOneNote": "View in OneNote",
	"WebClipper.Action.Less": "Less",
	"WebClipper.Action.More": "More",
	"WebClipper.BetaTag": "beta",
	"WebClipper.ClipType.Article.Button": "Article",
	"WebClipper.ClipType.Article.ProgressLabel": "Clipping Article",
	"WebClipper.ClipType.Bookmark.Button": "Bookmark",
	"WebClipper.ClipType.Bookmark.Button.Tooltip": "Clip just the title, thumbnail, synopsis, and link.",
	"WebClipper.ClipType.Bookmark.ProgressLabel": "Clipping Bookmark",
	"WebClipper.ClipType.Button.Tooltip": "Clip just the {0} in an easy-to-read format.",
	"WebClipper.ClipType.Image.Button": "Image",
	"WebClipper.ClipType.ImageSnippet.Button": "Image Snippet",
	"WebClipper.ClipType.MultipleRegions.Button.Tooltip": "Take screenshots of parts of the page you\u0027ll select.",
	"WebClipper.ClipType.Pdf.Button": "PDF Document",
	"WebClipper.ClipType.Pdf.AskPermissionToClipLocalFile": "We need your permission to clip PDF files stored on your computer",
	"WebClipper.ClipType.Pdf.InstructionsForClippingLocalFiles": "In Chrome, right-click the OneNote icon in the toolbar and choose \u0022Manage Extension\u0027. Then, for OneNote Web Clipper, check \u0027Allow access to file URLs.\u0027",
	"WebClipper.ClipType.Pdf.ProgressLabel": "Clipping PDF File",
	"WebClipper.ClipType.Pdf.ProgressLabelDelay": "PDFs can take a little while to upload. Still clipping.”",
	"WebClipper.ClipType.Pdf.IncrementalProgressMessage": "Clipping page {0} of {1}...",
	"WebClipper.ClipType.Pdf.Button.Tooltip": "Take a screenshot of the whole PDF file and save a copy of the attachment.",
	"WebClipper.ClipType.Product.Button": "Product",
	"WebClipper.ClipType.Product.ProgressLabel": "Clipping Product",
	"WebClipper.ClipType.Recipe.Button": "Recipe",
	"WebClipper.ClipType.Recipe.ProgressLabel": "Clipping Recipe",
	"WebClipper.ClipType.Region.Button": "Region",
	"WebClipper.ClipType.Region.Button.Tooltip": "Take a screenshot of the part of the page you\u0027ll select.",
	"WebClipper.ClipType.Region.ProgressLabel": "Clipping Region",
	"WebClipper.ClipType.ScreenShot.Button": "Full Page",
	"WebClipper.ClipType.ScreenShot.Button.Tooltip": "Take a screenshot of the whole page, just like you see it.",
	"WebClipper.ClipType.ScreenShot.ProgressLabel": "Clipping Page",
	"WebClipper.ClipType.Selection.Button": "Selection",
	"WebClipper.ClipType.Selection.Button.Tooltip": "Clip the selection you made on the web page.",
	"WebClipper.ClipType.Selection.ProgressLabel": "Clipping Selection",
	"WebClipper.Error.ConflictingExtension": "Your PDF viewer or another extension might be blocking the OneNote Web Clipper. You could temporarily disable the following extension and try clipping again.",
	"WebClipper.Error.CannotClipPage": "Sorry, this type of page can\u0027t be clipped.",
	"WebClipper.Error.CookiesDisabled.Line1": "Cookies must be enabled in order for OneNote Web Clipper to work correctly.",
	"WebClipper.Error.CookiesDisabled.Line2": "Please allow third-party cookies in your browser or add the onenote.com and live.com domains as an exception.",
	"WebClipper.Error.CookiesDisabled.Chrome": "Please allow third-party cookies in your browser or add the [*.]onenote.com and [*.]live.com domains as an exception.",
	"WebClipper.Error.CookiesDisabled.Edge": "Please allow third-party cookies in your browser.",
	"WebClipper.Error.CookiesDisabled.Firefox": "Please allow third-party cookies in your browser or add the https://onenote.com and https://live.com domains as an exception.",
	"WebClipper.Error.CorruptedSection": "Your clip can\u0027t be saved here because the section is corrupt.",
	"WebClipper.Error.GenericError": "Something went wrong. Please try clipping the page again.",
	"WebClipper.Error.GenericExpiredTokenRefreshError": "Your login session has ended and we were unable to clip the page. Please sign in again.",
	"WebClipper.Error.NoOpError":  "Sorry, we can\u0027t clip this page right now",
	"WebClipper.Error.NotProvisioned": "Your clip can\u0027t be saved because your OneDrive for Business account isn\u0027t set up.",
	"WebClipper.Error.OrphanedWebClipperDetected": "Something went wrong. Please refresh this page, and try to clip again.",
	"WebClipper.Error.PasswordProtected": "Your clip can\u0027t be saved here because the section is password protected.",
	"WebClipper.Error.QuotaExceeded": "Your clip can\u0027t be saved because your OneDrive account has reached its size limit.",
	"WebClipper.Error.ResourceDoesNotExist": "Your clip can\u0027t be saved here because the location no longer exists. Please try clipping to another location.",
	"WebClipper.Error.SectionTooLarge": "Your clip can\u0027t be saved here because the section has reached its size limit.",
	"WebClipper.Error.SignInUnsuccessful": "We couldn\u0027t sign you in. Please try again.",
	"WebClipper.Error.ThirdPartyCookiesDisabled": "For OneNote Web Clipper to work correctly, please allow third-party cookies in your browser, or add the onenote.com domain as an exception.",
	"WebClipper.Error.UserAccountSuspended": "Your clip can\u0027t be saved because your Microsoft account has been suspended.",
	"WebClipper.Error.UserAccountSuspendedResetText": "Reset Your Account",
	"WebClipper.Error.UserDoesNotHaveUpdatePermission": "We\u0027ve added features to the Web Clipper that require new permissions. To accept them, please sign out and sign back in.",
	"WebClipper.Extension.RefreshTab": "Please refresh this page, and try to clip again.",
	"WebClipper.FromCitation": "Clipped from: {0}",
	"WebClipper.Label.Annotation": "Note",
	"WebClipper.Label.AnnotationPlaceholder": "Add a note...",
	"WebClipper.Label.AttachPdfFile": "Attach PDF file",
	"WebClipper.Label.AttachPdfFileSubText": "(all pages)",
	"WebClipper.Label.ClipImageToOneNote": "Clip Image to OneNote",
	"WebClipper.Label.ClipLocation": "Location",
	"WebClipper.Label.ClipSelectionToOneNote": "Clip Selection to OneNote",
	"WebClipper.Label.ClipSuccessful": "Clip Successful!",
	"WebClipper.Label.DragAndRelease": "Drag and release to capture a screenshot",
	"WebClipper.Label.OneNoteClipper": "OneNote Clipper",
	"WebClipper.Label.OneNoteWebClipper": "OneNote Web Clipper",
	"WebClipper.Label.OpenChangeLogFromTooltip": "Check out what\u0027s new",
	"WebClipper.Label.Page": "Page",
	"WebClipper.Label.PdfAllPagesRadioButton": "All pages",
	"WebClipper.Label.PdfDistributePagesCheckbox": "New note for each PDF page",
	"WebClipper.Label.PdfOptions": "PDF Options",
	"WebClipper.Label.PdfTooLargeToAttach": "PDF too large to attach",
	"WebClipper.Label.PdfTooltip": "Clip this PDF to OneNote, and read it later",
	"WebClipper.Label.ProceedToWebClipper": "Proceed to the Web Clipper",
	"WebClipper.Label.ProceedToWebClipperFun": "Try it out!",
	"WebClipper.Label.ProductTooltip": "Clip and save product details like this to OneNote",
	"WebClipper.Label.Ratings.Message.End": "Thanks for your feedback!",
	"WebClipper.Label.Ratings.Message.Feedback": "Help us improve",
	"WebClipper.Label.Ratings.Message.Init": "Enjoying the Web Clipper?",
	"WebClipper.Label.Ratings.Message.Rate": "Glad you like it!",
	"WebClipper.Label.Ratings.Button.Feedback": "Provide feedback",
	"WebClipper.Label.Ratings.Button.Init.Positive": "Yes, it\u0027s great!",
	"WebClipper.Label.Ratings.Button.Init.Negative": "Not really...",
	"WebClipper.Label.Ratings.Button.NoThanks": "No thanks",
	"WebClipper.Label.Ratings.Button.Rate": "Rate us 5 stars",
	"WebClipper.Label.RecipeTooltip": "Save clutter-free recipes right to OneNote",
	"WebClipper.Label.SignedIn": "Signed in",
	"WebClipper.Label.SignInDescription": "Save anything on the web to OneNote in one click",
	"WebClipper.Label.SignInUnsuccessfulMoreInformation": "More information",
	"WebClipper.Label.SignInUnsuccessfulLessInformation": "Less information",
	"WebClipper.Label.UnsupportedBrowser": "Sorry, your browser version is unsupported.",
	"WebClipper.Label.WebClipper": "Web Clipper",
	"WebClipper.Label.WebClipperWasUpdated": "OneNote Web Clipper has been updated",
	"WebClipper.Label.WebClipperWasUpdatedFun": "OneNote Web Clipper is now better than ever!",
	"WebClipper.Label.WhatsNew": "What's New",
	"WebClipper.Label.VideoTooltip": "Clip this video and watch it anytime in OneNote",
	"WebClipper.Popover.PdfInvalidPageRange": "We couldn't find page '{0}'",
	"WebClipper.Preview.AugmentationModeGenericError": "Something went wrong creating the preview. Try again, or choose a different clipping mode.",
	"WebClipper.Preview.BookmarkModeGenericError": "Something went wrong creating the bookmark. Try again, or choose a different clipping mode.",
	"WebClipper.Preview.FullPageModeGenericError": "A preview isn't available, but you can still clip your page.",
	"WebClipper.Preview.FullPageModeScreenshotDescription": "A full page screenshot of '{0}'",
	"WebClipper.Preview.LoadingMessage": "Loading preview...",
	"WebClipper.Preview.NoFullPageScreenshotFound": "No content found. Try another clipping mode.",
	"WebClipper.Preview.NoContentFound": "No article found. Try another clipping mode.",
	"WebClipper.Preview.UnableToClipLocalFile": "Local files can only be clipped using Region mode.",
	"WebClipper.Preview.Header.AddAnotherRegionButtonLabel": "Add another region",
	"WebClipper.Preview.Header.SansSerifButtonLabel": "Sans-serif",
	"WebClipper.Preview.Header.SerifButtonLabel": "Serif",
	"WebClipper.Preview.Spinner.ClipAnyTimeInFullPage": "In a hurry? You can clip any time in Full Page mode!",
	"WebClipper.SectionPicker.DefaultLocation":  "Default location",
	"WebClipper.SectionPicker.LoadingNotebooks": "Loading notebooks...",
	"WebClipper.SectionPicker.NoNotebooksFound": "You don't have any notebooks yet, so we'll create your default notebook when you clip this page.",
	"WebClipper.SectionPicker.NotebookLoadFailureMessage": "OneNote couldn't load your notebooks. Please try again later.",
	"WebClipper.SectionPicker.NotebookLoadUnretryableFailureMessage": "OneNote couldn't load your notebooks.",
	"WebClipper.SectionPicker.NotebookLoadUnretryableFailureMessageWithExplanation": "We couldn't load your notebooks because a list limit was exceeded in OneDrive.",
	"WebClipper.SectionPicker.NotebookLoadUnretryableFailureLinkMessage": "Learn more",
	"WebClipper.FontFamily.Regular": "Segoe UI Regular,Segoe UI,Segoe,Segoe WP,Helvetica Neue,Roboto,Helvetica,Arial,Tahoma,Verdana,sans-serif",
	"WebClipper.FontFamily.Bold": "Segoe UI Bold,Segoe UI,Segoe,Segoe WP,Helvetica Neue,Roboto,Helvetica,Arial,Tahoma,Verdana,sans-serif",
	"WebClipper.FontFamily.Light": "Segoe UI Light,Segoe WP Light,Segoe UI,Segoe,Segoe WP,Helvetica Neue,Roboto,Helvetica,Arial,Tahoma,Verdana,sans-serif",
	"WebClipper.FontFamily.Preview.SerifDefault": "Georgia",
	"WebClipper.FontFamily.Preview.SansSerifDefault": "Verdana",
	"WebClipper.FontFamily.Semibold": "Segoe UI Semibold,Segoe UI,Segoe,Segoe WP,Helvetica Neue,Roboto,Helvetica,Arial,Tahoma,Verdana,sans-serif",
	"WebClipper.FontFamily.Semilight": "Segoe UI Semilight,Segoe UI Light,Segoe WP Light,Segoe UI,Segoe,Segoe WP,Helvetica Neue,Roboto,Helvetica,Arial,Tahoma,Verdana,sans-serif",
	"WebClipper.FontSize.Preview.SerifDefault": "16px",
	"WebClipper.FontSize.Preview.SansSerifDefault": "16px"
}

},{}],18:[function(require,module,exports){
(function (process,global){
/*!
 * @overview es6-promise - a tiny implementation of Promises/A+.
 * @copyright Copyright (c) 2014 Yehuda Katz, Tom Dale, Stefan Penner and contributors (Conversion to ES6 API by Jake Archibald)
 * @license   Licensed under MIT license
 *            See https://raw.githubusercontent.com/stefanpenner/es6-promise/master/LICENSE
 * @version   4.0.5
 */

(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    (global.ES6Promise = factory());
}(this, (function () { 'use strict';

function objectOrFunction(x) {
  return typeof x === 'function' || typeof x === 'object' && x !== null;
}

function isFunction(x) {
  return typeof x === 'function';
}

var _isArray = undefined;
if (!Array.isArray) {
  _isArray = function (x) {
    return Object.prototype.toString.call(x) === '[object Array]';
  };
} else {
  _isArray = Array.isArray;
}

var isArray = _isArray;

var len = 0;
var vertxNext = undefined;
var customSchedulerFn = undefined;

var asap = function asap(callback, arg) {
  queue[len] = callback;
  queue[len + 1] = arg;
  len += 2;
  if (len === 2) {
    // If len is 2, that means that we need to schedule an async flush.
    // If additional callbacks are queued before the queue is flushed, they
    // will be processed by this flush that we are scheduling.
    if (customSchedulerFn) {
      customSchedulerFn(flush);
    } else {
      scheduleFlush();
    }
  }
};

function setScheduler(scheduleFn) {
  customSchedulerFn = scheduleFn;
}

function setAsap(asapFn) {
  asap = asapFn;
}

var browserWindow = typeof window !== 'undefined' ? window : undefined;
var browserGlobal = browserWindow || {};
var BrowserMutationObserver = browserGlobal.MutationObserver || browserGlobal.WebKitMutationObserver;
var isNode = typeof self === 'undefined' && typeof process !== 'undefined' && ({}).toString.call(process) === '[object process]';

// test for web worker but not in IE10
var isWorker = typeof Uint8ClampedArray !== 'undefined' && typeof importScripts !== 'undefined' && typeof MessageChannel !== 'undefined';

// node
function useNextTick() {
  // node version 0.10.x displays a deprecation warning when nextTick is used recursively
  // see https://github.com/cujojs/when/issues/410 for details
  return function () {
    return process.nextTick(flush);
  };
}

// vertx
function useVertxTimer() {
  if (typeof vertxNext !== 'undefined') {
    return function () {
      vertxNext(flush);
    };
  }

  return useSetTimeout();
}

function useMutationObserver() {
  var iterations = 0;
  var observer = new BrowserMutationObserver(flush);
  var node = document.createTextNode('');
  observer.observe(node, { characterData: true });

  return function () {
    node.data = iterations = ++iterations % 2;
  };
}

// web worker
function useMessageChannel() {
  var channel = new MessageChannel();
  channel.port1.onmessage = flush;
  return function () {
    return channel.port2.postMessage(0);
  };
}

function useSetTimeout() {
  // Store setTimeout reference so es6-promise will be unaffected by
  // other code modifying setTimeout (like sinon.useFakeTimers())
  var globalSetTimeout = setTimeout;
  return function () {
    return globalSetTimeout(flush, 1);
  };
}

var queue = new Array(1000);
function flush() {
  for (var i = 0; i < len; i += 2) {
    var callback = queue[i];
    var arg = queue[i + 1];

    callback(arg);

    queue[i] = undefined;
    queue[i + 1] = undefined;
  }

  len = 0;
}

function attemptVertx() {
  try {
    var r = require;
    var vertx = r('vertx');
    vertxNext = vertx.runOnLoop || vertx.runOnContext;
    return useVertxTimer();
  } catch (e) {
    return useSetTimeout();
  }
}

var scheduleFlush = undefined;
// Decide what async method to use to triggering processing of queued callbacks:
if (isNode) {
  scheduleFlush = useNextTick();
} else if (BrowserMutationObserver) {
  scheduleFlush = useMutationObserver();
} else if (isWorker) {
  scheduleFlush = useMessageChannel();
} else if (browserWindow === undefined && typeof require === 'function') {
  scheduleFlush = attemptVertx();
} else {
  scheduleFlush = useSetTimeout();
}

function then(onFulfillment, onRejection) {
  var _arguments = arguments;

  var parent = this;

  var child = new this.constructor(noop);

  if (child[PROMISE_ID] === undefined) {
    makePromise(child);
  }

  var _state = parent._state;

  if (_state) {
    (function () {
      var callback = _arguments[_state - 1];
      asap(function () {
        return invokeCallback(_state, child, callback, parent._result);
      });
    })();
  } else {
    subscribe(parent, child, onFulfillment, onRejection);
  }

  return child;
}

/**
  `Promise.resolve` returns a promise that will become resolved with the
  passed `value`. It is shorthand for the following:

  ```javascript
  let promise = new Promise(function(resolve, reject){
    resolve(1);
  });

  promise.then(function(value){
    // value === 1
  });
  ```

  Instead of writing the above, your code now simply becomes the following:

  ```javascript
  let promise = Promise.resolve(1);

  promise.then(function(value){
    // value === 1
  });
  ```

  @method resolve
  @static
  @param {Any} value value that the returned promise will be resolved with
  Useful for tooling.
  @return {Promise} a promise that will become fulfilled with the given
  `value`
*/
function resolve(object) {
  /*jshint validthis:true */
  var Constructor = this;

  if (object && typeof object === 'object' && object.constructor === Constructor) {
    return object;
  }

  var promise = new Constructor(noop);
  _resolve(promise, object);
  return promise;
}

var PROMISE_ID = Math.random().toString(36).substring(16);

function noop() {}

var PENDING = void 0;
var FULFILLED = 1;
var REJECTED = 2;

var GET_THEN_ERROR = new ErrorObject();

function selfFulfillment() {
  return new TypeError("You cannot resolve a promise with itself");
}

function cannotReturnOwn() {
  return new TypeError('A promises callback cannot return that same promise.');
}

function getThen(promise) {
  try {
    return promise.then;
  } catch (error) {
    GET_THEN_ERROR.error = error;
    return GET_THEN_ERROR;
  }
}

function tryThen(then, value, fulfillmentHandler, rejectionHandler) {
  try {
    then.call(value, fulfillmentHandler, rejectionHandler);
  } catch (e) {
    return e;
  }
}

function handleForeignThenable(promise, thenable, then) {
  asap(function (promise) {
    var sealed = false;
    var error = tryThen(then, thenable, function (value) {
      if (sealed) {
        return;
      }
      sealed = true;
      if (thenable !== value) {
        _resolve(promise, value);
      } else {
        fulfill(promise, value);
      }
    }, function (reason) {
      if (sealed) {
        return;
      }
      sealed = true;

      _reject(promise, reason);
    }, 'Settle: ' + (promise._label || ' unknown promise'));

    if (!sealed && error) {
      sealed = true;
      _reject(promise, error);
    }
  }, promise);
}

function handleOwnThenable(promise, thenable) {
  if (thenable._state === FULFILLED) {
    fulfill(promise, thenable._result);
  } else if (thenable._state === REJECTED) {
    _reject(promise, thenable._result);
  } else {
    subscribe(thenable, undefined, function (value) {
      return _resolve(promise, value);
    }, function (reason) {
      return _reject(promise, reason);
    });
  }
}

function handleMaybeThenable(promise, maybeThenable, then$$) {
  if (maybeThenable.constructor === promise.constructor && then$$ === then && maybeThenable.constructor.resolve === resolve) {
    handleOwnThenable(promise, maybeThenable);
  } else {
    if (then$$ === GET_THEN_ERROR) {
      _reject(promise, GET_THEN_ERROR.error);
    } else if (then$$ === undefined) {
      fulfill(promise, maybeThenable);
    } else if (isFunction(then$$)) {
      handleForeignThenable(promise, maybeThenable, then$$);
    } else {
      fulfill(promise, maybeThenable);
    }
  }
}

function _resolve(promise, value) {
  if (promise === value) {
    _reject(promise, selfFulfillment());
  } else if (objectOrFunction(value)) {
    handleMaybeThenable(promise, value, getThen(value));
  } else {
    fulfill(promise, value);
  }
}

function publishRejection(promise) {
  if (promise._onerror) {
    promise._onerror(promise._result);
  }

  publish(promise);
}

function fulfill(promise, value) {
  if (promise._state !== PENDING) {
    return;
  }

  promise._result = value;
  promise._state = FULFILLED;

  if (promise._subscribers.length !== 0) {
    asap(publish, promise);
  }
}

function _reject(promise, reason) {
  if (promise._state !== PENDING) {
    return;
  }
  promise._state = REJECTED;
  promise._result = reason;

  asap(publishRejection, promise);
}

function subscribe(parent, child, onFulfillment, onRejection) {
  var _subscribers = parent._subscribers;
  var length = _subscribers.length;

  parent._onerror = null;

  _subscribers[length] = child;
  _subscribers[length + FULFILLED] = onFulfillment;
  _subscribers[length + REJECTED] = onRejection;

  if (length === 0 && parent._state) {
    asap(publish, parent);
  }
}

function publish(promise) {
  var subscribers = promise._subscribers;
  var settled = promise._state;

  if (subscribers.length === 0) {
    return;
  }

  var child = undefined,
      callback = undefined,
      detail = promise._result;

  for (var i = 0; i < subscribers.length; i += 3) {
    child = subscribers[i];
    callback = subscribers[i + settled];

    if (child) {
      invokeCallback(settled, child, callback, detail);
    } else {
      callback(detail);
    }
  }

  promise._subscribers.length = 0;
}

function ErrorObject() {
  this.error = null;
}

var TRY_CATCH_ERROR = new ErrorObject();

function tryCatch(callback, detail) {
  try {
    return callback(detail);
  } catch (e) {
    TRY_CATCH_ERROR.error = e;
    return TRY_CATCH_ERROR;
  }
}

function invokeCallback(settled, promise, callback, detail) {
  var hasCallback = isFunction(callback),
      value = undefined,
      error = undefined,
      succeeded = undefined,
      failed = undefined;

  if (hasCallback) {
    value = tryCatch(callback, detail);

    if (value === TRY_CATCH_ERROR) {
      failed = true;
      error = value.error;
      value = null;
    } else {
      succeeded = true;
    }

    if (promise === value) {
      _reject(promise, cannotReturnOwn());
      return;
    }
  } else {
    value = detail;
    succeeded = true;
  }

  if (promise._state !== PENDING) {
    // noop
  } else if (hasCallback && succeeded) {
      _resolve(promise, value);
    } else if (failed) {
      _reject(promise, error);
    } else if (settled === FULFILLED) {
      fulfill(promise, value);
    } else if (settled === REJECTED) {
      _reject(promise, value);
    }
}

function initializePromise(promise, resolver) {
  try {
    resolver(function resolvePromise(value) {
      _resolve(promise, value);
    }, function rejectPromise(reason) {
      _reject(promise, reason);
    });
  } catch (e) {
    _reject(promise, e);
  }
}

var id = 0;
function nextId() {
  return id++;
}

function makePromise(promise) {
  promise[PROMISE_ID] = id++;
  promise._state = undefined;
  promise._result = undefined;
  promise._subscribers = [];
}

function Enumerator(Constructor, input) {
  this._instanceConstructor = Constructor;
  this.promise = new Constructor(noop);

  if (!this.promise[PROMISE_ID]) {
    makePromise(this.promise);
  }

  if (isArray(input)) {
    this._input = input;
    this.length = input.length;
    this._remaining = input.length;

    this._result = new Array(this.length);

    if (this.length === 0) {
      fulfill(this.promise, this._result);
    } else {
      this.length = this.length || 0;
      this._enumerate();
      if (this._remaining === 0) {
        fulfill(this.promise, this._result);
      }
    }
  } else {
    _reject(this.promise, validationError());
  }
}

function validationError() {
  return new Error('Array Methods must be provided an Array');
};

Enumerator.prototype._enumerate = function () {
  var length = this.length;
  var _input = this._input;

  for (var i = 0; this._state === PENDING && i < length; i++) {
    this._eachEntry(_input[i], i);
  }
};

Enumerator.prototype._eachEntry = function (entry, i) {
  var c = this._instanceConstructor;
  var resolve$$ = c.resolve;

  if (resolve$$ === resolve) {
    var _then = getThen(entry);

    if (_then === then && entry._state !== PENDING) {
      this._settledAt(entry._state, i, entry._result);
    } else if (typeof _then !== 'function') {
      this._remaining--;
      this._result[i] = entry;
    } else if (c === Promise) {
      var promise = new c(noop);
      handleMaybeThenable(promise, entry, _then);
      this._willSettleAt(promise, i);
    } else {
      this._willSettleAt(new c(function (resolve$$) {
        return resolve$$(entry);
      }), i);
    }
  } else {
    this._willSettleAt(resolve$$(entry), i);
  }
};

Enumerator.prototype._settledAt = function (state, i, value) {
  var promise = this.promise;

  if (promise._state === PENDING) {
    this._remaining--;

    if (state === REJECTED) {
      _reject(promise, value);
    } else {
      this._result[i] = value;
    }
  }

  if (this._remaining === 0) {
    fulfill(promise, this._result);
  }
};

Enumerator.prototype._willSettleAt = function (promise, i) {
  var enumerator = this;

  subscribe(promise, undefined, function (value) {
    return enumerator._settledAt(FULFILLED, i, value);
  }, function (reason) {
    return enumerator._settledAt(REJECTED, i, reason);
  });
};

/**
  `Promise.all` accepts an array of promises, and returns a new promise which
  is fulfilled with an array of fulfillment values for the passed promises, or
  rejected with the reason of the first passed promise to be rejected. It casts all
  elements of the passed iterable to promises as it runs this algorithm.

  Example:

  ```javascript
  let promise1 = resolve(1);
  let promise2 = resolve(2);
  let promise3 = resolve(3);
  let promises = [ promise1, promise2, promise3 ];

  Promise.all(promises).then(function(array){
    // The array here would be [ 1, 2, 3 ];
  });
  ```

  If any of the `promises` given to `all` are rejected, the first promise
  that is rejected will be given as an argument to the returned promises's
  rejection handler. For example:

  Example:

  ```javascript
  let promise1 = resolve(1);
  let promise2 = reject(new Error("2"));
  let promise3 = reject(new Error("3"));
  let promises = [ promise1, promise2, promise3 ];

  Promise.all(promises).then(function(array){
    // Code here never runs because there are rejected promises!
  }, function(error) {
    // error.message === "2"
  });
  ```

  @method all
  @static
  @param {Array} entries array of promises
  @param {String} label optional string for labeling the promise.
  Useful for tooling.
  @return {Promise} promise that is fulfilled when all `promises` have been
  fulfilled, or rejected if any of them become rejected.
  @static
*/
function all(entries) {
  return new Enumerator(this, entries).promise;
}

/**
  `Promise.race` returns a new promise which is settled in the same way as the
  first passed promise to settle.

  Example:

  ```javascript
  let promise1 = new Promise(function(resolve, reject){
    setTimeout(function(){
      resolve('promise 1');
    }, 200);
  });

  let promise2 = new Promise(function(resolve, reject){
    setTimeout(function(){
      resolve('promise 2');
    }, 100);
  });

  Promise.race([promise1, promise2]).then(function(result){
    // result === 'promise 2' because it was resolved before promise1
    // was resolved.
  });
  ```

  `Promise.race` is deterministic in that only the state of the first
  settled promise matters. For example, even if other promises given to the
  `promises` array argument are resolved, but the first settled promise has
  become rejected before the other promises became fulfilled, the returned
  promise will become rejected:

  ```javascript
  let promise1 = new Promise(function(resolve, reject){
    setTimeout(function(){
      resolve('promise 1');
    }, 200);
  });

  let promise2 = new Promise(function(resolve, reject){
    setTimeout(function(){
      reject(new Error('promise 2'));
    }, 100);
  });

  Promise.race([promise1, promise2]).then(function(result){
    // Code here never runs
  }, function(reason){
    // reason.message === 'promise 2' because promise 2 became rejected before
    // promise 1 became fulfilled
  });
  ```

  An example real-world use case is implementing timeouts:

  ```javascript
  Promise.race([ajax('foo.json'), timeout(5000)])
  ```

  @method race
  @static
  @param {Array} promises array of promises to observe
  Useful for tooling.
  @return {Promise} a promise which settles in the same way as the first passed
  promise to settle.
*/
function race(entries) {
  /*jshint validthis:true */
  var Constructor = this;

  if (!isArray(entries)) {
    return new Constructor(function (_, reject) {
      return reject(new TypeError('You must pass an array to race.'));
    });
  } else {
    return new Constructor(function (resolve, reject) {
      var length = entries.length;
      for (var i = 0; i < length; i++) {
        Constructor.resolve(entries[i]).then(resolve, reject);
      }
    });
  }
}

/**
  `Promise.reject` returns a promise rejected with the passed `reason`.
  It is shorthand for the following:

  ```javascript
  let promise = new Promise(function(resolve, reject){
    reject(new Error('WHOOPS'));
  });

  promise.then(function(value){
    // Code here doesn't run because the promise is rejected!
  }, function(reason){
    // reason.message === 'WHOOPS'
  });
  ```

  Instead of writing the above, your code now simply becomes the following:

  ```javascript
  let promise = Promise.reject(new Error('WHOOPS'));

  promise.then(function(value){
    // Code here doesn't run because the promise is rejected!
  }, function(reason){
    // reason.message === 'WHOOPS'
  });
  ```

  @method reject
  @static
  @param {Any} reason value that the returned promise will be rejected with.
  Useful for tooling.
  @return {Promise} a promise rejected with the given `reason`.
*/
function reject(reason) {
  /*jshint validthis:true */
  var Constructor = this;
  var promise = new Constructor(noop);
  _reject(promise, reason);
  return promise;
}

function needsResolver() {
  throw new TypeError('You must pass a resolver function as the first argument to the promise constructor');
}

function needsNew() {
  throw new TypeError("Failed to construct 'Promise': Please use the 'new' operator, this object constructor cannot be called as a function.");
}

/**
  Promise objects represent the eventual result of an asynchronous operation. The
  primary way of interacting with a promise is through its `then` method, which
  registers callbacks to receive either a promise's eventual value or the reason
  why the promise cannot be fulfilled.

  Terminology
  -----------

  - `promise` is an object or function with a `then` method whose behavior conforms to this specification.
  - `thenable` is an object or function that defines a `then` method.
  - `value` is any legal JavaScript value (including undefined, a thenable, or a promise).
  - `exception` is a value that is thrown using the throw statement.
  - `reason` is a value that indicates why a promise was rejected.
  - `settled` the final resting state of a promise, fulfilled or rejected.

  A promise can be in one of three states: pending, fulfilled, or rejected.

  Promises that are fulfilled have a fulfillment value and are in the fulfilled
  state.  Promises that are rejected have a rejection reason and are in the
  rejected state.  A fulfillment value is never a thenable.

  Promises can also be said to *resolve* a value.  If this value is also a
  promise, then the original promise's settled state will match the value's
  settled state.  So a promise that *resolves* a promise that rejects will
  itself reject, and a promise that *resolves* a promise that fulfills will
  itself fulfill.


  Basic Usage:
  ------------

  ```js
  let promise = new Promise(function(resolve, reject) {
    // on success
    resolve(value);

    // on failure
    reject(reason);
  });

  promise.then(function(value) {
    // on fulfillment
  }, function(reason) {
    // on rejection
  });
  ```

  Advanced Usage:
  ---------------

  Promises shine when abstracting away asynchronous interactions such as
  `XMLHttpRequest`s.

  ```js
  function getJSON(url) {
    return new Promise(function(resolve, reject){
      let xhr = new XMLHttpRequest();

      xhr.open('GET', url);
      xhr.onreadystatechange = handler;
      xhr.responseType = 'json';
      xhr.setRequestHeader('Accept', 'application/json');
      xhr.send();

      function handler() {
        if (this.readyState === this.DONE) {
          if (this.status === 200) {
            resolve(this.response);
          } else {
            reject(new Error('getJSON: `' + url + '` failed with status: [' + this.status + ']'));
          }
        }
      };
    });
  }

  getJSON('/posts.json').then(function(json) {
    // on fulfillment
  }, function(reason) {
    // on rejection
  });
  ```

  Unlike callbacks, promises are great composable primitives.

  ```js
  Promise.all([
    getJSON('/posts'),
    getJSON('/comments')
  ]).then(function(values){
    values[0] // => postsJSON
    values[1] // => commentsJSON

    return values;
  });
  ```

  @class Promise
  @param {function} resolver
  Useful for tooling.
  @constructor
*/
function Promise(resolver) {
  this[PROMISE_ID] = nextId();
  this._result = this._state = undefined;
  this._subscribers = [];

  if (noop !== resolver) {
    typeof resolver !== 'function' && needsResolver();
    this instanceof Promise ? initializePromise(this, resolver) : needsNew();
  }
}

Promise.all = all;
Promise.race = race;
Promise.resolve = resolve;
Promise.reject = reject;
Promise._setScheduler = setScheduler;
Promise._setAsap = setAsap;
Promise._asap = asap;

Promise.prototype = {
  constructor: Promise,

  /**
    The primary way of interacting with a promise is through its `then` method,
    which registers callbacks to receive either a promise's eventual value or the
    reason why the promise cannot be fulfilled.
  
    ```js
    findUser().then(function(user){
      // user is available
    }, function(reason){
      // user is unavailable, and you are given the reason why
    });
    ```
  
    Chaining
    --------
  
    The return value of `then` is itself a promise.  This second, 'downstream'
    promise is resolved with the return value of the first promise's fulfillment
    or rejection handler, or rejected if the handler throws an exception.
  
    ```js
    findUser().then(function (user) {
      return user.name;
    }, function (reason) {
      return 'default name';
    }).then(function (userName) {
      // If `findUser` fulfilled, `userName` will be the user's name, otherwise it
      // will be `'default name'`
    });
  
    findUser().then(function (user) {
      throw new Error('Found user, but still unhappy');
    }, function (reason) {
      throw new Error('`findUser` rejected and we're unhappy');
    }).then(function (value) {
      // never reached
    }, function (reason) {
      // if `findUser` fulfilled, `reason` will be 'Found user, but still unhappy'.
      // If `findUser` rejected, `reason` will be '`findUser` rejected and we're unhappy'.
    });
    ```
    If the downstream promise does not specify a rejection handler, rejection reasons will be propagated further downstream.
  
    ```js
    findUser().then(function (user) {
      throw new PedagogicalException('Upstream error');
    }).then(function (value) {
      // never reached
    }).then(function (value) {
      // never reached
    }, function (reason) {
      // The `PedgagocialException` is propagated all the way down to here
    });
    ```
  
    Assimilation
    ------------
  
    Sometimes the value you want to propagate to a downstream promise can only be
    retrieved asynchronously. This can be achieved by returning a promise in the
    fulfillment or rejection handler. The downstream promise will then be pending
    until the returned promise is settled. This is called *assimilation*.
  
    ```js
    findUser().then(function (user) {
      return findCommentsByAuthor(user);
    }).then(function (comments) {
      // The user's comments are now available
    });
    ```
  
    If the assimliated promise rejects, then the downstream promise will also reject.
  
    ```js
    findUser().then(function (user) {
      return findCommentsByAuthor(user);
    }).then(function (comments) {
      // If `findCommentsByAuthor` fulfills, we'll have the value here
    }, function (reason) {
      // If `findCommentsByAuthor` rejects, we'll have the reason here
    });
    ```
  
    Simple Example
    --------------
  
    Synchronous Example
  
    ```javascript
    let result;
  
    try {
      result = findResult();
      // success
    } catch(reason) {
      // failure
    }
    ```
  
    Errback Example
  
    ```js
    findResult(function(result, err){
      if (err) {
        // failure
      } else {
        // success
      }
    });
    ```
  
    Promise Example;
  
    ```javascript
    findResult().then(function(result){
      // success
    }, function(reason){
      // failure
    });
    ```
  
    Advanced Example
    --------------
  
    Synchronous Example
  
    ```javascript
    let author, books;
  
    try {
      author = findAuthor();
      books  = findBooksByAuthor(author);
      // success
    } catch(reason) {
      // failure
    }
    ```
  
    Errback Example
  
    ```js
  
    function foundBooks(books) {
  
    }
  
    function failure(reason) {
  
    }
  
    findAuthor(function(author, err){
      if (err) {
        failure(err);
        // failure
      } else {
        try {
          findBoooksByAuthor(author, function(books, err) {
            if (err) {
              failure(err);
            } else {
              try {
                foundBooks(books);
              } catch(reason) {
                failure(reason);
              }
            }
          });
        } catch(error) {
          failure(err);
        }
        // success
      }
    });
    ```
  
    Promise Example;
  
    ```javascript
    findAuthor().
      then(findBooksByAuthor).
      then(function(books){
        // found books
    }).catch(function(reason){
      // something went wrong
    });
    ```
  
    @method then
    @param {Function} onFulfilled
    @param {Function} onRejected
    Useful for tooling.
    @return {Promise}
  */
  then: then,

  /**
    `catch` is simply sugar for `then(undefined, onRejection)` which makes it the same
    as the catch block of a try/catch statement.
  
    ```js
    function findAuthor(){
      throw new Error('couldn't find that author');
    }
  
    // synchronous
    try {
      findAuthor();
    } catch(reason) {
      // something went wrong
    }
  
    // async with promises
    findAuthor().catch(function(reason){
      // something went wrong
    });
    ```
  
    @method catch
    @param {Function} onRejection
    Useful for tooling.
    @return {Promise}
  */
  'catch': function _catch(onRejection) {
    return this.then(null, onRejection);
  }
};

function polyfill() {
    var local = undefined;

    if (typeof global !== 'undefined') {
        local = global;
    } else if (typeof self !== 'undefined') {
        local = self;
    } else {
        try {
            local = Function('return this')();
        } catch (e) {
            throw new Error('polyfill failed because global object is unavailable in this environment');
        }
    }

    var P = local.Promise;

    if (P) {
        var promiseToString = null;
        try {
            promiseToString = Object.prototype.toString.call(P.resolve());
        } catch (e) {
            // silently ignored
        }

        if (promiseToString === '[object Promise]' && !P.cast) {
            return;
        }
    }

    local.Promise = Promise;
}

// Strange compat..
Promise.polyfill = polyfill;
Promise.Promise = Promise;

return Promise;

})));

}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"_process":19}],19:[function(require,module,exports){
// shim for using process in browser
var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout () {
    throw new Error('clearTimeout has not been defined');
}
(function () {
    try {
        if (typeof setTimeout === 'function') {
            cachedSetTimeout = setTimeout;
        } else {
            cachedSetTimeout = defaultSetTimout;
        }
    } catch (e) {
        cachedSetTimeout = defaultSetTimout;
    }
    try {
        if (typeof clearTimeout === 'function') {
            cachedClearTimeout = clearTimeout;
        } else {
            cachedClearTimeout = defaultClearTimeout;
        }
    } catch (e) {
        cachedClearTimeout = defaultClearTimeout;
    }
} ())
function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch(e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch(e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }


}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout.call(this, marker);
        }
    }



}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = runTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        runTimeout(drainQueue);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;
process.prependListener = noop;
process.prependOnceListener = noop;

process.listeners = function (name) { return [] }

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}]},{},[3]);
