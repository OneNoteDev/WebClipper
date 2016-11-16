let require;

require("./arrayUtils_tests");
require("./clipperUrls_tests");
require("./experiments_tests");
require("./objectUtils_tests");
require("./promiseUtils_tests");
require("./settings_tests");
require("./stringUtils_tests");
require("./urlUtils_tests");

require("./clipperUI/components/annotationInput_tests");
require("./clipperUI/components/footer_tests");
require("./clipperUI/components/modeButtonSelector_tests");
require("./clipperUI/components/modeButton_tests");
require("./clipperUI/components/previewViewer/augmentationPreview_tests");
require("./clipperUI/components/previewViewer/fullPagePreview_tests");
require("./clipperUI/components/previewViewer/pdfDataUrls");
require("./clipperUI/components/previewViewer/pdfPageViewport_tests");
require("./clipperUI/components/previewViewer/pdfPreviewPage_tests");
require("./clipperUI/components/previewViewer/pdfPreview_tests");
require("./clipperUI/components/previewViewer/previewViewerAugmentationHeader_tests");
require("./clipperUI/components/previewViewer/previewViewerPdfHeader_tests");
require("./clipperUI/components/previewViewer/previewViewerRegionHeader_tests");
require("./clipperUI/components/previewViewer/regionPreview_tests");
require("./clipperUI/components/previewViewer/selectionPreview_tests");
require("./clipperUI/components/sectionPicker_tests");
require("./clipperUI/panels/changeLogPanel_tests");
// TODO: These haven't been running for a while, and either need to be fixed or removed
////require("./clipperUI/panels/clippingPanelWithDelayedMessage_tests");
require("./clipperUI/panels/clippingPanel_tests");
require("./clipperUI/panels/dialogPanel_tests");
require("./clipperUI/panels/optionsPanel_tests");
require("./clipperUI/panels/ratingsPanel_tests");
require("./clipperUI/panels/signInPanel_tests");
require("./clipperUI/mainController_tests");
require("./clipperUI/oneNoteApiUtils_tests");
// TODO: These haven't been running for a while, and either need to be fixed or removed
////require("./clipperUI/previewViewer_tests");
require("./clipperUI/ratingsHelper_tests");
require("./clipperUI/regionSelector_tests");

require("./communicator/communicator_tests");
require("./communicator/iframeMessageHandler_tests");
require("./communicator/smartValue_tests");

require("./contentCapture/augmentationHelper_tests");
require("./contentCapture/bookmarkHelper_tests");

require("./domParsers/domUtils_tests");
require("./domParsers/khanAcademyVideo_tests");
require("./domParsers/videoUtils_tests");
require("./domParsers/vimeoVideo_tests");
require("./domParsers/youtubeVideo_tests");

require("./extensions/authenticationHelper_tests");
require("./extensions/extensionBase_tests");
require("./extensions/injectHelper_tests");
require("./extensions/tooltipHelper_tests");

require("./highlighting/highlighter_tests");

require("./http/cachedHttp_tests");
require("./http/clipperCachedHttp_tests");
require("./http/http_tests");

require("./localization/localization_tests");
require("./localization/rtl_tests");

require("./logging/communicatorLoggerPure_tests");
require("./logging/consoleLoggerShell_tests");
require("./logging/context_tests");
require("./logging/loggerDecorator_tests");
require("./logging/logger_tests");
require("./logging/logHelpers_tests");
require("./logging/sessionLogger_tests");

require("./saveToOneNote/oneNoteSaveablePage_tests");
require("./saveToOneNote/oneNoteSaveablePdf_tests");
require("./saveToOneNote/saveToOneNote_tests");

require("./storage/clipperData_tests");
require("./storage/clipperStorageGateStrategy_tests");

require("./versioning/changeLogHelper_tests");
require("./versioning/version_tests");
