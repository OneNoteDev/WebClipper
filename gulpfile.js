/// <binding BeforeBuild='build' />
"use strict";
var require;

var argv = require("yargs").argv;
var browserify = require("browserify");
var concat = require("gulp-concat");
var del = require("del");
var fileExists = require("file-exists");
var forever = require("forever");
var globby = require("globby");
var gulp = require("gulp");
var less = require("gulp-less");
var merge = require("merge-stream");
var mergeJSON = require("gulp-merge-json");
var minifyCSS = require("gulp-cssnano");
var msx = require("gulp-msx");
var open = require("gulp-open");
var plumber = require("gulp-plumber");
var qunit = require("node-qunit-phantomjs");
var rename = require("gulp-rename");
var rtlcss = require("gulp-rtlcss");
var runSequence = require("run-sequence");
var shell = require("gulp-shell");
var source = require("vinyl-source-stream");
var ts = require("gulp-typescript");
var tslint = require("gulp-tslint");
var uglify = require("gulp-uglify");
var zip = require("gulp-zip");

var PATHS = {
    SRC: {
        ROOT: "src/",
        SETTINGS: "src/settings/"
    },
    BUILDROOT: "build/",
    BUNDLEROOT: "build/bundles/",
    LIBROOT: "lib/",
    TARGET: {
        ROOT: "target/",
        BOOKMARKLET: "target/bookmarklet/",
        CHROME: "target/chrome/",
        EDGE_ROOT: "target/edge/OneNoteWebClipper/edgeextension/",
        EDGE_EXTENSION: "target/edge/OneNoteWebClipper/edgeextension/manifest/extension/",
        FIREFOX: "target/firefox/",
        // Note: The Safari extension folder MUST end in ".safariextension"
        SAFARI: "target/clipper.safariextension/",
        TESTS: "target/tests/"
    },
    NODE_MODULES: "node_modules/",
    INTERNAL: {
        SRC: {
            SCRIPTS: "../WebClipper_Internal/src/scripts/",
            SETTINGS: "../WebClipper_Internal/src/settings/"
        },
        LIBROOT: "../WebClipper_Internal/lib/"
    }
};

var RTL_SUFFIX = "-rtl";

var ARIA_LIB_VERSION = "2.7.1";

// Used for debugging glob declarations
function printGlobResults(glob) {
    globby.sync(glob).map(function(filePath) {
        console.log(filePath);
    });
}

////////////////////////////////////////
// CLEAN
////////////////////////////////////////
gulp.task("clean", ["cleanInternal"], function(callback) {
    return del([
        PATHS.BUILDROOT,
        PATHS.BUNDLEROOT,
        PATHS.TARGET.ROOT
    ], callback);
});

////////////////////////////////////////
// COMPILE CSS
////////////////////////////////////////
gulp.task("compileLess", function() {
    return gulp.src(PATHS.SRC.ROOT + "styles/clipper.less")
        .pipe(less())
        .pipe(gulp.dest(PATHS.BUILDROOT + "css"));
});

gulp.task("compileRtlCss", function() {
    return gulp.src(PATHS.BUILDROOT + "css/clipper.css")
        .pipe(rtlcss())
        .pipe(rename({ suffix: RTL_SUFFIX }))
        .pipe(gulp.dest(PATHS.BUILDROOT + "css"));
});

gulp.task("compileCss", function(callback) {
    runSequence(
        "compileLess",
        "compileRtlCss",
        callback);
});

////////////////////////////////////////
// COMPILE
////////////////////////////////////////
gulp.task("copyStrings", function() {
    return gulp.src(PATHS.SRC.ROOT + "strings.json")
        .pipe(gulp.dest(PATHS.BUILDROOT));
});

gulp.task("mergeSettings", function() {
    // note that overwriting of objects depends on ordering in array (last wins)
    var mergeOrder = [PATHS.SRC.SETTINGS + "default.json"];
    if (!argv.nointernal) {
        mergeOrder.push(PATHS.INTERNAL.SRC.SETTINGS + "default.json");
    }

    if (argv.production) {
        mergeOrder.push(PATHS.SRC.SETTINGS + "production.json");
        if (!argv.nointernal) {
            mergeOrder.push(PATHS.INTERNAL.SRC.SETTINGS + "production.json");
        };
    } else if (argv.dogfood) {
        mergeOrder.push(PATHS.SRC.SETTINGS + "dogfood.json");
        if (!argv.nointernal) {
            mergeOrder.push(PATHS.INTERNAL.SRC.SETTINGS + "dogfood.json");
        }
    }

    return gulp.src(mergeOrder)
        .pipe(mergeJSON("settings.json"))
        .pipe(gulp.dest(PATHS.BUILDROOT));
});

gulp.task("cleanInternal", function () {
    return del([
        PATHS.SRC.ROOT + "scripts/**/*_internal.*",
        PATHS.BUILDROOT + "scripts/**/*_internal.*",
        PATHS.BUILDROOT + "bundles/**/*_internal.*"
    ]);
});

gulp.task("copyInternal", function () {
    if (fileExists(PATHS.INTERNAL.SRC.SCRIPTS + "logging/logManager.ts") && !argv.nointernal) {
        return gulp.src(PATHS.INTERNAL.SRC.SCRIPTS + "**/*.+(ts|tsx|d.ts)")
            .pipe(rename(function (path) {
                path.basename += "_internal";
            }))
            .pipe(gulp.dest(function (file) {
                // Note: if anyone names their folders unconventionally this won't work
                return file.base.replace(/webclipper_internal/i, "webclipper");
            }));
    }
});

gulp.task("preCompileInternal", function (callback) {
    runSequence(
        "cleanInternal",
        "copyInternal",
        callback);
});

gulp.task("compileTypeScript", ["copyStrings", "mergeSettings", "preCompileInternal"], function () {
    var tsProject = ts.createProject("./tsconfig.json", {
        typescript: require('typescript'),
        noEmitOnError: true
    })

    return gulp.src([PATHS.SRC.ROOT + "**/*.+(ts|tsx)"])
        .pipe(tsProject())
        .pipe(gulp.dest(PATHS.BUILDROOT));
});

gulp.task("mithrilify", function() {
    return gulp.src(PATHS.BUILDROOT + "**/*.jsx")
        .pipe(msx())
        .pipe(gulp.dest(PATHS.BUILDROOT));
});

gulp.task("compile", function(callback) {
    runSequence(
        "compileTypeScript",
        "mithrilify",
        callback);
});

////////////////////////////////////////
// TSLINT
////////////////////////////////////////
//The actual task to run
gulp.task("tslint", function() {
    var tsFiles = [
        PATHS.SRC.ROOT + "**/*.ts",
        PATHS.SRC.ROOT + "**/*.tsx",
        "!" + PATHS.SRC.ROOT + "**/*.d.ts"
    ];

    return gulp.src(tsFiles)
        .pipe(plumber())
        .pipe(tslint({
            formatter: "verbose"
        }))
        .pipe(tslint.report({
            emitError: false,
            summarizeFailureOutput: true
        }))
});

////////////////////////////////////////
// BUNDLE
////////////////////////////////////////
function generateBrowserifyTasks(folderPath, files) {
    var tasks = [];
    for (var i = 0; i < files.length; i++) {
        tasks.push(browserify(folderPath + files[i])
            .bundle()
            .pipe(source(files[i]))
            .pipe(gulp.dest(PATHS.BUNDLEROOT)));
    }
    return tasks;
}

gulp.task("bundleAppendIsInstalledMarker", function () {
    var extensionRoot = PATHS.BUILDROOT + "scripts/extensions/";
    var files = ["appendIsInstalledMarker.js"];
    var tasks = generateBrowserifyTasks(extensionRoot, files);
    return merge(tasks);
});

gulp.task("bundleClipperUI", function () {
    var extensionRoot = PATHS.BUILDROOT + "scripts/clipperUI/";
    var files = ["clipper.js", "pageNav.js", "localeSpecificTasks.js", "unsupportedBrowser.js"];
    var tasks = generateBrowserifyTasks(extensionRoot, files);
    return merge(tasks);
});

gulp.task("bundleLogManager", function () {
    var defaultLogManager = browserify(PATHS.BUILDROOT + "scripts/logging/logManager.js", { standalone: "LogManager" })
        .bundle()
        .pipe(source("logManager.js"))
        .pipe(gulp.dest(PATHS.BUNDLEROOT));

    if (fileExists(PATHS.BUILDROOT + "scripts/logging/logManager_internal.js") && !argv.nointernal) {
        var internalLogManager = browserify(PATHS.BUILDROOT + "scripts/logging/logManager_internal.js", { standalone: "LogManager" })
            .bundle()
            .pipe(source("logManager_internal.js"))
            .pipe(gulp.dest(PATHS.BUNDLEROOT));

        return merge(defaultLogManager, internalLogManager);
    }

    return defaultLogManager;
});

gulp.task("bundleBookmarklet", function() {
    return browserify(PATHS.BUILDROOT + "scripts/extensions/bookmarklet/bookmarkletInject.js")
        .bundle()
        .pipe(source("bookmarklet.js"))
        .pipe(gulp.dest(PATHS.BUNDLEROOT));
});

gulp.task("bundleChrome", function() {
    var extensionRoot = PATHS.BUILDROOT + "scripts/extensions/chrome/";
    var files = ["chromeExtension.js", "chromeDebugLoggingInject.js", "chromeInject.js", "chromePageNavInject.js"];
    var tasks = generateBrowserifyTasks(extensionRoot, files);
    return merge(tasks);
});

gulp.task("bundleEdge", function () {
    var extensionRoot = PATHS.BUILDROOT + "scripts/extensions/edge/";
    var files = ["edgeExtension.js", "edgeDebugLoggingInject.js", "edgeInject.js", "edgePageNavInject.js"];
    var tasks = generateBrowserifyTasks(extensionRoot, files);
    return merge(tasks);
});

gulp.task("bundleFirefox", function () {
    var extensionRoot = PATHS.BUILDROOT + "scripts/extensions/firefox/";
    var files = ["firefoxExtension.js", "firefoxDebugLoggingInject.js", "firefoxInject.js", "firefoxPageNavInject.js"];
    var tasks = generateBrowserifyTasks(extensionRoot, files);
    return merge(tasks);
});

gulp.task("bundleSafari", function () {
    var extensionRoot = PATHS.BUILDROOT + "scripts/extensions/safari/";
    var files = ["safariExtension.js", "safariDebugLoggingInject.js", "safariInject.js", "safariPageNavInject.js"];
    var tasks = generateBrowserifyTasks(extensionRoot, files);
    return merge(tasks);
});

gulp.task("bundleTests", function () {
    return browserify(PATHS.BUILDROOT + "tests/tests.js")
        .bundle()
        .pipe(source("tests.js"))
        .pipe(gulp.dest(PATHS.BUNDLEROOT));
});

gulp.task("bundle", function(callback) {
    runSequence(
        "bundleAppendIsInstalledMarker",
        "bundleClipperUI",
        "bundleLogManager",
        "bundleBookmarklet",
        "bundleChrome",
        "bundleEdge",
        "bundleFirefox",
        "bundleSafari",
        "bundleTests",
        callback);
});

////////////////////////////////////////
// EXPORT - HELPER FUNCTIONS
////////////////////////////////////////
function lowerCasePathName() {
    return rename(function (path) {
        path.dirname = path.dirname.toLowerCase();
        path.basename = path.basename.toLowerCase();
        path.extname = path.extname.toLowerCase();
    });
}

function exportPickerFiles(targetDir) {
    var pickerImages = gulp.src(PATHS.NODE_MODULES + "onenotepicker/target/images/*",
        { base: PATHS.NODE_MODULES + "onenotepicker/target/" })
        .pipe(gulp.dest(targetDir));

    var pickerCss = gulp.src(PATHS.NODE_MODULES + "onenotepicker/target/css/*")
        .pipe(gulp.dest(targetDir));

    var pickerRtlCss = gulp.src(PATHS.NODE_MODULES + "onenotepicker/target/css/*")
        .pipe(rtlcss())
        .pipe(rename({ suffix: RTL_SUFFIX }))
        .pipe(gulp.dest(targetDir));

    return merge(pickerImages, pickerCss, pickerRtlCss);
}

var targetDirHasExportedCommonJs = {};
targetDirHasExportedCommonJs[PATHS.TARGET.BOOKMARKLET] = false;
targetDirHasExportedCommonJs[PATHS.TARGET.CHROME] = false;
targetDirHasExportedCommonJs[PATHS.TARGET.EDGE_EXTENSION] = false;
targetDirHasExportedCommonJs[PATHS.TARGET.FIREFOX] = false;
targetDirHasExportedCommonJs[PATHS.TARGET.SAFARI] = false;
targetDirHasExportedCommonJs[PATHS.TARGET.TESTS] = false;
function exportCommonJS(targetDir) {
    if (!targetDirHasExportedCommonJs[targetDir]) {
        var defaultExportTask = gulp.src([
            PATHS.BUNDLEROOT + "clipper.js",
            PATHS.BUNDLEROOT + "pageNav.js",
            PATHS.BUNDLEROOT + "localeSpecificTasks.js",
            PATHS.BUNDLEROOT + "unsupportedBrowser.js"
        ]).pipe(gulp.dest(targetDir));

        var logManagerExportTask;
        if (fileExists(PATHS.BUNDLEROOT + "logManager_internal.js") && !argv.nointernal) {
            var ariaFileName = "aria-web-telemetry-";
            var unminifiedAriaLibraryFileName = ariaFileName + ARIA_LIB_VERSION + ".js";
            var minifiedAriaLibraryFileName = ariaFileName + ARIA_LIB_VERSION + ".min.js";
            var ariaLibToInclude = argv.nominify ? unminifiedAriaLibraryFileName : minifiedAriaLibraryFileName;
            logManagerExportTask = gulp.src([
                PATHS.INTERNAL.LIBROOT + ariaLibToInclude,
                PATHS.BUNDLEROOT + "logManager_internal.js"
            ]).pipe(concat("logManager.js")).pipe(gulp.dest(targetDir));
        } else {
            logManagerExportTask = gulp.src(PATHS.BUNDLEROOT + "logManager.js").pipe(gulp.dest(targetDir));
        }

        // This is exported from the node modules folder directly as it does not go through bundling
        var injectLibPaths = [
            PATHS.NODE_MODULES + "oneNoteApi/target/oneNoteApi.min.js",
            PATHS.NODE_MODULES + "rangy/lib/rangy-core.js",
            PATHS.NODE_MODULES + "urijs/src/URI.min.js",
            PATHS.LIBROOT + "sanitize-html.js"
        ];
        var injectLibsTask = gulp.src(assertModuleExists(injectLibPaths)).pipe(gulp.dest(targetDir));

        targetDirHasExportedCommonJs[targetDir] = true;

        return merge(defaultExportTask, logManagerExportTask, injectLibsTask);
    }
}

function exportCommonCSS(targetDir) {
    return gulp.src([
        PATHS.BUILDROOT + "css/*.css"
    ]).pipe(gulp.dest(targetDir));
}

function exportCommonSrcFiles(targetDir) {
    var pickerTask = exportPickerFiles(targetDir);

    var imagesTask = gulp.src(PATHS.SRC.ROOT + "images/**/*", { base: PATHS.SRC.ROOT })
        .pipe(lowerCasePathName())
        .pipe(gulp.dest(targetDir));

    var clipperTask = gulp.src([
        PATHS.SRC.ROOT + "clipper.html",
        PATHS.SRC.ROOT + "unsupportedBrowser.html",
        PATHS.SRC.ROOT + "pageNav.html"
    ]).pipe(gulp.dest(targetDir));

    return merge(pickerTask, imagesTask, clipperTask);
}

function exportCommonLibFiles(targetDir) {
    var libFiles = [
        PATHS.NODE_MODULES + "json3/lib/json3.min.js",
        PATHS.NODE_MODULES + "es5-shim/es5-shim.min.js",
        PATHS.NODE_MODULES + "mithril/mithril.min.js",
        PATHS.NODE_MODULES + "onenoteapi/target/oneNoteApi.min.js",
        PATHS.NODE_MODULES + "onenotepicker/target/oneNotePicker.min.js",
        PATHS.NODE_MODULES + "pdfjs-dist/build/pdf.combined.js",
        PATHS.NODE_MODULES + "rangy/lib/rangy-core.js",
        PATHS.NODE_MODULES + "urijs/src/URI.min.js",
        PATHS.NODE_MODULES + "velocity-animate/velocity.min.js",
        PATHS.LIBROOT + "sanitize-html.js"
    ];

    var exportTask = gulp.src(assertModuleExists(libFiles))
        .pipe(gulp.dest(targetDir));

    // The provided TextHighlighter.min.js file has a jQuery dependency so we have to use a sub-file
    var minifyAndExportTask = gulp.src(PATHS.SRC.ROOT + "scripts/highlighting/textHighlighter.js")
        .pipe(uglify({
            preserveComments: "license"
        }))
        .pipe(gulp.dest(targetDir));

    return merge(exportTask, minifyAndExportTask);
}

function exportCommonWebExtensionFiles(targetDir) {
    var iconsTask = gulp.src(PATHS.SRC.ROOT + "icons/*", { base: PATHS.SRC.ROOT })
        .pipe(gulp.dest(targetDir));

    var localesTask = gulp.src(PATHS.SRC.ROOT + "_locales/**/*", { base: PATHS.SRC.ROOT })
        .pipe(lowerCasePathName())
        .pipe(gulp.dest(targetDir));

    return merge(iconsTask, localesTask);
}

function exportBookmarkletJS(targetDir) {
    var jsCommonTask = exportCommonJS(targetDir);

    var invokeTask = gulp.src([
        targetDir + "logManager.js",
        targetDir + "oneNoteApi.min.js",
        targetDir + "rangy-core.js",
        targetDir + "sanitize-html.js",
        targetDir + "URI.min.js",
        PATHS.BUNDLEROOT + "bookmarklet.js"
    ]).pipe(concat("invoke.js")).pipe(gulp.dest(targetDir));

    if (jsCommonTask) {
        return merge(jsCommonTask, invokeTask);
    }
    return merge(invokeTask);
}

function exportBookmarkletCSS(targetDir) {
    return exportCommonCSS(targetDir);
}

function exportBookmarkletSrcFiles(targetDir) {
    var srcCommonTask = exportCommonSrcFiles(targetDir);

    var authHtmlTask = gulp.src(PATHS.SRC.ROOT + "auth.html")
        .pipe(rename("index.html"))
        .pipe(gulp.dest(targetDir + "auth/"));

    return merge(srcCommonTask, authHtmlTask);
}

function exportBookmarkletLibFiles(targetDir) {
    return exportCommonLibFiles(targetDir);
}

function exportBookmarkletFiles(targetDir) {
    var jsTask = exportBookmarkletJS(targetDir);
    var cssTask = exportBookmarkletCSS(targetDir);
    var srcTask = exportBookmarkletSrcFiles(targetDir);
    var libTask = exportBookmarkletLibFiles(targetDir);

    return merge(jsTask, cssTask, srcTask, libTask);
}

function exportWebExtensionJs(targetDir, nameOfExtensionScript, nameOfInjectionScript) {
    var commonTask = exportCommonJS(targetDir);

    var extensionTask = gulp.src([
        targetDir + "logManager.js",
        PATHS.BUNDLEROOT + nameOfExtensionScript
    ]).pipe(concat(nameOfExtensionScript)).pipe(gulp.dest(targetDir));

    var injectTask = gulp.src([
        targetDir + "logManager.js",
        PATHS.BUNDLEROOT + nameOfInjectionScript
    ]).pipe(concat(nameOfInjectionScript)).pipe(gulp.dest(targetDir));

    return commonTask.pipe(merge(extensionTask, injectTask));
}

function exportChromeJS() {
    var targetDir = PATHS.TARGET.CHROME;

    var commonTask = exportCommonJS(targetDir);

    var appendIsInstalledMarkerTask = gulp.src([
        PATHS.BUNDLEROOT + "appendIsInstalledMarker.js"
    ]).pipe(concat("appendIsInstalledMarker.js")).pipe(gulp.dest(targetDir));

    var chromeExtensionTask = gulp.src([
        targetDir + "logManager.js",
        targetDir + "oneNoteApi.min.js",
        PATHS.BUNDLEROOT + "chromeExtension.js"
    ]).pipe(concat("chromeExtension.js")).pipe(gulp.dest(targetDir));

    var chromeDebugLoggingInjectTask = gulp.src([
        PATHS.BUNDLEROOT + "chromeDebugLoggingInject.js"
    ]).pipe(concat("chromeDebugLoggingInject.js")).pipe(gulp.dest(targetDir));

    var chromeInjectTask = gulp.src([
        targetDir + "logManager.js",
        targetDir + "oneNoteApi.min.js",
        targetDir + "rangy-core.js",
        targetDir + "sanitize-html.js",
        targetDir + "URI.min.js",
        PATHS.BUNDLEROOT + "chromeInject.js"
    ]).pipe(concat("chromeInject.js")).pipe(gulp.dest(targetDir));

    var chromePageNavInjectTask = gulp.src([
        targetDir + "oneNoteApi.min.js",
        PATHS.BUNDLEROOT + "chromePageNavInject.js"
    ]).pipe(concat("chromePageNavInject.js")).pipe(gulp.dest(targetDir));

    if (commonTask) {
        return merge(commonTask, appendIsInstalledMarkerTask, chromeExtensionTask, chromeDebugLoggingInjectTask, chromeInjectTask, chromePageNavInjectTask);
    }
    return merge(chromeExtensionTask, appendIsInstalledMarkerTask, chromeDebugLoggingInjectTask, chromeInjectTask, chromePageNavInjectTask);
}

function exportChromeCSS() {
    var targetDir = PATHS.TARGET.CHROME;
    return exportCommonCSS(targetDir);
}

function exportChromeSrcFiles() {
    var targetDir = PATHS.TARGET.CHROME;

    var srcCommonTask = exportCommonSrcFiles(targetDir);
    var commonWebExtensionFiles = exportCommonWebExtensionFiles(targetDir);

    var chromeTask = gulp.src([
        PATHS.SRC.ROOT + "scripts/extensions/chrome/manifest.json"
    ]).pipe(gulp.dest(targetDir));

    return merge(srcCommonTask, commonWebExtensionFiles, chromeTask);
}

function exportChromeLibFiles() {
    var targetDir = PATHS.TARGET.CHROME;
    return exportCommonLibFiles(targetDir);
}

function exportEdgeJS() {
    var targetDir = PATHS.TARGET.EDGE_EXTENSION;

    var commonTask = exportCommonJS(targetDir);

    var appendIsInstalledMarkerTask = gulp.src([
        PATHS.BUNDLEROOT + "appendIsInstalledMarker.js"
    ]).pipe(concat("appendIsInstalledMarker.js")).pipe(gulp.dest(targetDir));

    var edgeExtensionTask = gulp.src([
        targetDir + "logManager.js",
        targetDir + "oneNoteApi.min.js",
        PATHS.BUNDLEROOT + "edgeExtension.js"
    ]).pipe(concat("edgeExtension.js")).pipe(gulp.dest(targetDir));

    var edgeDebugLoggingInjectTask = gulp.src([
        PATHS.BUNDLEROOT + "edgeDebugLoggingInject.js"
    ]).pipe(concat("edgeDebugLoggingInject.js")).pipe(gulp.dest(targetDir));

    var edgeInjectTask = gulp.src([
        targetDir + "logManager.js",
        targetDir + "oneNoteApi.min.js",
        targetDir + "rangy-core.js",
        targetDir + "sanitize-html.js",
        targetDir + "URI.min.js",
        PATHS.BUNDLEROOT + "edgeInject.js"
    ]).pipe(concat("edgeInject.js")).pipe(gulp.dest(targetDir));

    var edgePageNavInjectTask = gulp.src([
        targetDir + "oneNoteApi.min.js",
        PATHS.BUNDLEROOT + "edgePageNavInject.js"
    ]).pipe(concat("edgePageNavInject.js")).pipe(gulp.dest(targetDir));

    if (commonTask) {
        return merge(commonTask, appendIsInstalledMarkerTask, edgeExtensionTask, edgeDebugLoggingInjectTask, edgeInjectTask, edgePageNavInjectTask);
    }
    return merge(edgeExtensionTask, appendIsInstalledMarkerTask, edgeDebugLoggingInjectTask, edgeInjectTask, edgePageNavInjectTask);
}

function exportEdgeCSS() {
    var targetDir = PATHS.TARGET.EDGE_EXTENSION;
    return exportCommonCSS(targetDir);
}

function exportEdgeSrcFiles() {
    var targetDir = PATHS.TARGET.EDGE_EXTENSION;

    var srcCommonTask = exportCommonSrcFiles(targetDir);
    var commonWebExtensionFiles = exportCommonWebExtensionFiles(targetDir);

    var edgeTask = gulp.src([
        PATHS.SRC.ROOT + "scripts/extensions/edge/edgeExtension.html",
        PATHS.SRC.ROOT + "scripts/extensions/edge/manifest.json"
    ]).pipe(gulp.dest(targetDir));

    return merge(srcCommonTask, commonWebExtensionFiles, edgeTask);
}

function exportEdgePackageFiles() {
    var edgeAssetsTask = gulp.src([
        PATHS.SRC.ROOT + "scripts/extensions/edge/package/assets/*"
    ]).pipe(gulp.dest(PATHS.TARGET.EDGE_ROOT + "manifest/assets"));

    var edgeResourcesTask = gulp.src([
        PATHS.SRC.ROOT + "scripts/extensions/edge/package/resources/**"
    ]).pipe(gulp.dest(PATHS.TARGET.EDGE_ROOT + "manifest/resources"));

    var edgeManifestTask = gulp.src([
        PATHS.SRC.ROOT + "scripts/extensions/edge/package/appxmanifest.xml",
        PATHS.SRC.ROOT + "scripts/extensions/edge/package/priconfig.xml"
    ]).pipe(gulp.dest(PATHS.TARGET.EDGE_ROOT + "manifest"));

    var edgePriconfigTask = gulp.src([
        PATHS.SRC.ROOT + "scripts/extensions/edge/package/generationInfo.json"
    ]).pipe(gulp.dest(PATHS.TARGET.EDGE_ROOT));

    return merge(edgeAssetsTask, edgeManifestTask, edgePriconfigTask, edgeResourcesTask);
}

function exportEdgeLibFiles() {
    var targetDir = PATHS.TARGET.EDGE_EXTENSION;
    return exportCommonLibFiles(targetDir);
}

function exportFirefoxJS() {
    var targetDir = PATHS.TARGET.FIREFOX;

    var commonTask = exportCommonJS(targetDir);

    var appendIsInstalledMarkerTask = gulp.src([
        PATHS.BUNDLEROOT + "appendIsInstalledMarker.js"
    ]).pipe(concat("appendIsInstalledMarker.js")).pipe(gulp.dest(targetDir));

    var firefoxExtensionTask = gulp.src([
        targetDir + "logManager.js",
        targetDir + "oneNoteApi.min.js",
        PATHS.BUNDLEROOT + "firefoxExtension.js"
    ]).pipe(concat("firefoxExtension.js")).pipe(gulp.dest(targetDir));

    var firefoxDebugLoggingInjectTask = gulp.src([
        PATHS.BUNDLEROOT + "firefoxDebugLoggingInject.js"
    ]).pipe(concat("firefoxDebugLoggingInject.js")).pipe(gulp.dest(targetDir));

    var firefoxInjectTask = gulp.src([
        targetDir + "logManager.js",
        targetDir + "oneNoteApi.min.js",
        targetDir + "rangy-core.js",
        targetDir + "sanitize-html.js",
        targetDir + "URI.min.js",
        PATHS.BUNDLEROOT + "firefoxInject.js"
    ]).pipe(concat("firefoxInject.js")).pipe(gulp.dest(targetDir));

    var firefoxPageNavInjectTask = gulp.src([
        targetDir + "oneNoteApi.min.js",
        PATHS.BUNDLEROOT + "firefoxPageNavInject.js"
    ]).pipe(concat("firefoxPageNavInject.js")).pipe(gulp.dest(targetDir));

    if (commonTask) {
        return merge(commonTask, appendIsInstalledMarkerTask, firefoxExtensionTask, firefoxDebugLoggingInjectTask, firefoxInjectTask, firefoxPageNavInjectTask);
    }
    return merge(firefoxExtensionTask, appendIsInstalledMarkerTask, firefoxDebugLoggingInjectTask, firefoxInjectTask, firefoxPageNavInjectTask);
}

function exportFirefoxCSS() {
    var targetDir = PATHS.TARGET.FIREFOX;
    return exportCommonCSS(targetDir);
}

function exportFirefoxSrcFiles() {
    var targetDir = PATHS.TARGET.FIREFOX;

    var srcCommonTask = exportCommonSrcFiles(targetDir);
    var commonWebExtensionFiles = exportCommonWebExtensionFiles(targetDir);

    var chromeTask = gulp.src([
        PATHS.SRC.ROOT + "scripts/extensions/firefox/manifest.json"
    ]).pipe(gulp.dest(targetDir));

    return merge(srcCommonTask, commonWebExtensionFiles, chromeTask);
}

function exportFirefoxLibFiles() {
    var targetDir = PATHS.TARGET.FIREFOX;
    return exportCommonLibFiles(targetDir);
}

function exportSafariJS() {
    var targetDir = PATHS.TARGET.SAFARI;

    var commonTask = exportCommonJS(targetDir);

    var appendIsInstalledMarkerTask = gulp.src([
        PATHS.BUNDLEROOT + "appendIsInstalledMarker.js"
    ]).pipe(concat("appendIsInstalledMarker.js")).pipe(gulp.dest(targetDir));

    var safariExtensionTask = gulp.src([
        targetDir + "logManager.js",
        targetDir + "oneNoteApi.min.js",
        PATHS.BUNDLEROOT + "safariExtension.js"
    ]).pipe(concat("safariExtension.js")).pipe(gulp.dest(targetDir));

    var safariDebugLoggingInjectTask = gulp.src([
        PATHS.BUNDLEROOT + "safariDebugLoggingInject.js"
    ]).pipe(concat("safariDebugLoggingInject.js")).pipe(gulp.dest(targetDir));

    var safariInjectTask = gulp.src([
        targetDir + "logManager.js",
        targetDir + "oneNoteApi.min.js",
        targetDir + "rangy-core.js",
        targetDir + "sanitize-html.js",
        targetDir + "URI.min.js",
        PATHS.BUNDLEROOT + "safariInject.js"
    ]).pipe(concat("safariInject.js")).pipe(gulp.dest(targetDir));

    var safariPageNavInjectTask = gulp.src([
        targetDir + "oneNoteApi.min.js",
        PATHS.BUNDLEROOT + "safariPageNavInject.js"
    ]).pipe(concat("safariPageNavInject.js")).pipe(gulp.dest(targetDir));

    if (commonTask) {
        return merge(commonTask, appendIsInstalledMarkerTask, safariExtensionTask, safariDebugLoggingInjectTask, safariInjectTask, safariPageNavInjectTask);
    }
    return merge(safariExtensionTask, appendIsInstalledMarkerTask, safariDebugLoggingInjectTask, safariInjectTask, safariPageNavInjectTask);
}

function exportSafariCSS() {
    var targetDir = PATHS.TARGET.SAFARI;
    return exportCommonCSS(targetDir);
}

function exportSafariSrcFiles() {
    var targetDir = PATHS.TARGET.SAFARI;

    var srcCommonTask = exportCommonSrcFiles(targetDir);

    var iconsTask = gulp.src(PATHS.SRC.ROOT + "icons/*")
        .pipe(gulp.dest(targetDir));

    var safariTask = gulp.src([
        PATHS.SRC.ROOT + "scripts/extensions/safari/Info.plist",
        PATHS.SRC.ROOT + "scripts/extensions/safari/safariExtension.html"
    ]).pipe(gulp.dest(targetDir));

    return merge(srcCommonTask, iconsTask, safariTask);
}

function exportSafariLibFiles() {
    var targetDir = PATHS.TARGET.SAFARI;
    return exportCommonLibFiles(targetDir);
}

function exportTestJS() {
    var targetDir = PATHS.TARGET.TESTS;
    var defaultExportJSTask = gulp.src(PATHS.BUNDLEROOT + "tests.js")
        .pipe(gulp.dest(targetDir));

    var logManagerExportJSTask = gulp.src(PATHS.BUNDLEROOT + "logManager.js")
        .pipe(gulp.dest(targetDir + "libs"));

    return merge(defaultExportJSTask, logManagerExportJSTask);
}

function exportTestSrcFiles() {
    var targetDir = PATHS.TARGET.TESTS;

    return gulp.src(PATHS.SRC.ROOT + "tests/tests.html")
        .pipe(rename("index.html"))
        .pipe(gulp.dest(targetDir));
}

function exportTestLibFiles() {
    var targetDir = PATHS.TARGET.TESTS;

    var testLibFiles = [
        PATHS.LIBROOT + "tests/bind_polyfill.js",
        PATHS.LIBROOT + "tests/jquery-2.2.0.min.js",
        PATHS.NODE_MODULES + "mithril/mithril.js",
        PATHS.NODE_MODULES + "oneNoteApi/target/oneNoteApi.js",
        PATHS.NODE_MODULES + "oneNotePicker/target/oneNotePicker.js",
        PATHS.NODE_MODULES + "pdfjs-dist/build/pdf.combined.js",
        PATHS.NODE_MODULES + "rangy/lib/rangy-core.js",
        PATHS.NODE_MODULES + "sinon/pkg/sinon.js",
        PATHS.NODE_MODULES + "sinon-qunit/lib/sinon-qunit.js",
        PATHS.NODE_MODULES + "urijs/src/URI.min.js",
        PATHS.SRC.ROOT + "scripts/highlighting/textHighlighter.js",
        PATHS.NODE_MODULES + "velocity-animate/velocity.js",
        PATHS.LIBROOT + "sanitize-html.js"
    ];

    var testLibFileRegexes = [PATHS.NODE_MODULES + "qunitjs/qunit/qunit.+(css|js)"];

    return gulp.src(testLibFileRegexes.concat(assertModuleExists(testLibFiles)))
        .pipe(gulp.dest(targetDir + "libs"));
}

// Checks if a file path or list of file paths exists. Throws an error if one or more files don't exist,
// and returns itself otherwise.
function assertModuleExists(filePath) {
    var paths = [];
    if (typeof filePath === "string") {
        paths.push(filePath);
    } else {
        // Assume this is a list of paths
        paths = filePath;
    }

    for (var i = 0; i < paths.length; i++) {
        if (!fileExists(paths[i])) {
            throw new Error("Missing file (" + paths[i] + "). Run 'npm install' before building.");
        }
    }

    return paths;
}

////////////////////////////////////////
// EXPORT - TASKS
////////////////////////////////////////
gulp.task("exportAllCommonJS", function () {
    var exportCommonJsTasks = [];
    for (var dir in targetDirHasExportedCommonJs) {
        if (targetDirHasExportedCommonJs.hasOwnProperty(dir)) {
            exportCommonJsTasks.push(exportCommonJS(dir));
        }
    }

    return merge(exportCommonJsTasks);
});

gulp.task("exportBookmarklet", function() {
    var targetDir = PATHS.TARGET.BOOKMARKLET;
    return exportBookmarkletFiles(targetDir);
});

gulp.task("exportChrome", function() {
    var jsTask = exportChromeJS();
    var cssTask = exportChromeCSS();
    var srcTask = exportChromeSrcFiles();
    var libTask = exportChromeLibFiles();

    return merge(jsTask, cssTask, srcTask, libTask);
});

gulp.task("exportEdge", function() {
    var jsTask = exportEdgeJS();
    var cssTask = exportEdgeCSS();
    var srcTask = exportEdgeSrcFiles();
    var packageTask = exportEdgePackageFiles();
    var libTask = exportEdgeLibFiles();

    return merge(jsTask, cssTask, srcTask, packageTask, libTask);
});

gulp.task("exportFirefox", function () {
    var jsTask = exportFirefoxJS();
    var cssTask = exportFirefoxCSS();
    var srcTask = exportFirefoxSrcFiles();
    var libTask = exportFirefoxLibFiles();

    return merge(jsTask, cssTask, srcTask, libTask);
});

gulp.task("exportSafari", function() {
    var jsTask = exportSafariJS();
    var cssTask = exportSafariCSS();
    var srcTask = exportSafariSrcFiles();
    var libTask = exportSafariLibFiles();

    return merge(jsTask, cssTask, srcTask, libTask);
});

gulp.task("exportTests", function() {
    var jsTask = exportTestJS();
    var srcTask = exportTestSrcFiles();
    var libTask = exportTestLibFiles();
    return merge(jsTask, srcTask, libTask);
});

gulp.task("exportJS", function() {
    var bookmarkletTask = exportBookmarkletJS(PATHS.TARGET.BOOKMARKLET);
    var chromeTask = exportChromeJS();
    var edgeTask = exportEdgeJS();
    var firefoxTask = exportFirefoxJS();
    var safariTask = exportSafariJS();
    var testTask = exportTestJS();

    return merge(bookmarkletTask, chromeTask, edgeTask, firefoxTask, safariTask, testTask);
});

gulp.task("exportCSS", function() {
    var bookmarkletTask = exportBookmarkletCSS(PATHS.TARGET.BOOKMARKLET);
    var chromeTask = exportChromeCSS();
    var edgeTask = exportEdgeCSS();
    var safariTask = exportSafariCSS();

    return merge(bookmarkletTask, chromeTask, edgeTask, safariTask);
});

gulp.task("exportSrcFiles", function() {
    var bookmarkletTask = exportBookmarkletSrcFiles(PATHS.TARGET.BOOKMARKLET);
    var chromeTask = exportChromeSrcFiles();
    var edgeTask = exportEdgeSrcFiles();
    var safariTask = exportSafariSrcFiles();
    var testTask = exportTestSrcFiles();

    return merge(bookmarkletTask, chromeTask, edgeTask, safariTask, testTask);
});

gulp.task("export", function(callback) {
    runSequence(
        "exportAllCommonJS",
        "exportBookmarklet",
        "exportChrome",
        "exportEdge",
        "exportFirefox",
        "exportSafari",
        "exportTests",
        callback);
});

////////////////////////////////////////
// PACKAGING TASKS
////////////////////////////////////////
gulp.task("packageChrome", function() {
    return gulp.src([PATHS.TARGET.CHROME + "/**/*", "!" + PATHS.TARGET.CHROME + "/OneNoteWebClipper.zip"]).
    pipe(zip("OneNoteWebClipper.zip")).
    pipe(gulp.dest(PATHS.TARGET.CHROME));
});

gulp.task("packageFirefox", function() {
    return gulp.src([PATHS.TARGET.FIREFOX + "/**/*", "!" + PATHS.TARGET.FIREFOX + "/OneNoteWebClipper.xpi"]).
    pipe(zip("OneNoteWebClipper.xpi")).
    pipe(gulp.dest(PATHS.TARGET.FIREFOX));
});

gulp.task("package", function (callback) {
    runSequence(
        "packageChrome",
        "packageFirefox",
        callback);
});

////////////////////////////////////////
// PRODUCTION-ONLY TASKS
////////////////////////////////////////
gulp.task("minifyCss", function() {
    return gulp.src(PATHS.BUILDROOT + "css/**/*.css")
        .pipe(minifyCSS())
        .pipe(gulp.dest(PATHS.BUILDROOT + "css"));
});

gulp.task("minifyJs", function() {
    return gulp.src(PATHS.BUNDLEROOT + "**/*.js")
        .pipe(uglify())
        .pipe(gulp.dest(PATHS.BUNDLEROOT));
});

gulp.task("minify", function(callback) {
    runSequence(
        "minifyCss",
        "minifyJs",
        callback);
});

////////////////////////////////////////
// RUN
////////////////////////////////////////
gulp.task("runTests", function() {
    return qunit(PATHS.TARGET.TESTS + "index.html", {timeout: 10});
});

////////////////////////////////////////
// WATCH TASKS
////////////////////////////////////////
gulp.task("watchTS", function() {
    gulp.watch([
        PATHS.SRC.ROOT + "strings.json",
        PATHS.SRC.ROOT + "settings.json",
        PATHS.SRC.ROOT + "**/*.+(ts|tsx)",
        PATHS.SRC.ROOT + "!**/*.d.ts"
    ], ["watchTSAction"]);
});

gulp.task("watchTSAction", function(callback) {
    runSequence(
        "compile",
        "bundle",
        "exportJS",
        "runTests",
        "tslint",
        callback);
});

gulp.task("watchLess", function() {
    gulp.watch(PATHS.SRC.ROOT + "styles/*.less",
        ["watchLessAction"]
    );
});

gulp.task("watchLessAction", function(callback) {
    runSequence(
        "compileCss",
        "exportCSS",
        callback);
});

gulp.task("watchSrcFiles", function() {
    gulp.watch([
            PATHS.SRC.ROOT + "_locales/*",
            PATHS.SRC.ROOT + "icons/*",
            PATHS.SRC.ROOT + "images/*",
            PATHS.SRC.ROOT + "auth.html",
            PATHS.SRC.ROOT + "clipper.html",
            PATHS.SRC.ROOT + "unsupportedBrowser.html",
            PATHS.SRC.ROOT + "pageNav.html",
            PATHS.SRC.ROOT + "scripts/extensions/chrome/manifest.json",
            PATHS.SRC.ROOT + "scripts/extensions/edge/edgeExtension.html",
            PATHS.SRC.ROOT + "scripts/extensions/edge/manifest.json",
            PATHS.SRC.ROOT + "scripts/extensions/safari/Info.plist",
            PATHS.SRC.ROOT + "scripts/extensions/safari/safariExtension.html",
            PATHS.SRC.ROOT + "tests/tests.html"
        ], ["watchSrcAction"]
    );
});

gulp.task("watchSrcAction", function(callback) {
    runSequence(
        "exportSrcFiles",
        "runTests",
        callback);
});

////////////////////////////////////////
// SHORTCUT TASKS
////////////////////////////////////////
gulp.task("buildOnly", function(callback) {
    var tasks = ["compileCss", "compile", "bundle"];
    if (argv.production && !argv.nominify) {
        tasks.push("minify");
    }
    tasks.push("export", "package", callback);

    runSequence.apply(null, tasks);
});

gulp.task("watch", function(callback) {
    runSequence(
        "buildOnly",
        "watchTS",
        "watchLess",
        "watchSrcFiles",
        callback);
});

gulp.task("build", function(callback) {
    runSequence(
        "buildOnly",
        "tslint",
        "runTests",
        callback);
});

gulp.task("full", function(callback) {
    runSequence(
        "clean",
        "build",
        callback);
});

gulp.task("default", ["build"]);