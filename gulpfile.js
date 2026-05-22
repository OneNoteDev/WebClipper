/// <binding BeforeBuild='build' />
"use strict";
var require;

var argv = require("yargs").argv;
var browserify = require("browserify");
var concat = require("gulp-concat");
var del = require("del");
var fileExists = require("file-exists");
var globby = require("globby");
var gulp = require("gulp");
var less = require("gulp-less");
var merge = require("merge-stream");
var mergeJSON = require("gulp-merge-json");
var minifyCSS = require("gulp-cssnano");
var plumber = require("gulp-plumber");
var rename = require("gulp-rename");
var rtlcss = require("gulp-rtlcss");
var runSequence = require("run-sequence");
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
    TARGET: {
        ROOT: "target/",
        CHROME: "target/chrome/",
        EDGE_ROOT: "target/edge/OneNoteWebClipper/edgeextension/",
        EDGE_EXTENSION: "target/edge/OneNoteWebClipper/edgeextension/manifest/extension/"
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

var ARIA_LIB_VERSION = "2.8.2";

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
    var clipperCss = gulp.src(PATHS.SRC.ROOT + "styles/clipper.less")
        .pipe(less())
        .pipe(gulp.dest(PATHS.BUILDROOT + "css"));
    var rendererCss = gulp.src(PATHS.SRC.ROOT + "styles/renderer.less")
        .pipe(less())
        .pipe(gulp.dest(PATHS.BUILDROOT + "css"));
    return merge(clipperCss, rendererCss);
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

gulp.task("compile", function(callback) {
    runSequence(
        "compileTypeScript",
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
        "!" + PATHS.SRC.ROOT + "**/*.d.ts",
        "!" + PATHS.SRC.ROOT + "scripts/definitions/custom/aria-web-telemetry-*.d_internal.ts"
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

gulp.task("bundleOffscreen", function () {
    var extensionRoot = PATHS.BUILDROOT + "scripts/extensions/";
    var files = ["offscreen.js"];
    var tasks = generateBrowserifyTasks(extensionRoot, files);
    return merge(tasks);
});

gulp.task("bundleRegionOverlay", function () {
    var extensionRoot = PATHS.BUILDROOT + "scripts/extensions/";
    var files = ["regionOverlay.js"];
    var tasks = generateBrowserifyTasks(extensionRoot, files);
    return merge(tasks);
});

gulp.task("bundleContentCaptureInject", function () {
    var extensionRoot = PATHS.BUILDROOT + "scripts/extensions/";
    var files = ["contentCaptureInject.js"];
    var tasks = generateBrowserifyTasks(extensionRoot, files);
    return merge(tasks);
});

gulp.task("bundleRenderer", function () {
    var scriptsRoot = PATHS.BUILDROOT + "scripts/";
    var files = ["renderer.js"];
    var tasks = generateBrowserifyTasks(scriptsRoot, files);
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

gulp.task("bundleChrome", function() {
    var extensionRoot = PATHS.BUILDROOT + "scripts/extensions/chrome/";
    var files = ["chromeExtension.js"];
    var tasks = generateBrowserifyTasks(extensionRoot, files);
    return merge(tasks);
});

gulp.task("bundleEdge", function () {
    var extensionRoot = PATHS.BUILDROOT + "scripts/extensions/edge/";
    var files = ["edgeExtension.js"];
    var tasks = generateBrowserifyTasks(extensionRoot, files);
    return merge(tasks);
});

gulp.task("bundle", function(callback) {
    runSequence(
        "bundleAppendIsInstalledMarker",
        "bundleOffscreen",
        "bundleRegionOverlay",
        "bundleContentCaptureInject",
        "bundleRenderer",
        "bundleLogManager",
        "bundleChrome",
        "bundleEdge",
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

var targetDirHasExportedCommonJs = {};
targetDirHasExportedCommonJs[PATHS.TARGET.CHROME] = false;
targetDirHasExportedCommonJs[PATHS.TARGET.EDGE_EXTENSION] = false;
function exportCommonJS(targetDir) {
    if (!targetDirHasExportedCommonJs[targetDir]) {
        // logManager.js is bundled standalone (browserify { standalone:
        // "LogManager" }) so the global LogManager is available to other
        // bundles (extensionWorkerBase calls LogManager.createExtLogger,
        // authenticationHelper calls LogManager.reInitLoggerForDataBoundary
        // Change). The internal variant is used when the WebClipper_Internal
        // sibling project is present and --nointernal is not passed; it
        // bundles the Aria/MSIT telemetry shim. Otherwise the public stub
        // logManager.js ships.
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

        var injectLibPaths = [
            PATHS.NODE_MODULES + "oneNoteApi/target/oneNoteApi.min.js"
        ];
        var injectLibsTask = gulp.src(assertModuleExists(injectLibPaths)).pipe(gulp.dest(targetDir));

        targetDirHasExportedCommonJs[targetDir] = true;

        return merge(logManagerExportTask, injectLibsTask);
    }
}

function exportCommonCSS(targetDir) {
    return gulp.src([
        PATHS.BUILDROOT + "css/*.css"
    ]).pipe(gulp.dest(targetDir));
}

function exportCommonSrcFiles(targetDir) {
    var imagesTask = gulp.src(PATHS.SRC.ROOT + "images/**/*", { base: PATHS.SRC.ROOT })
        .pipe(lowerCasePathName())
        .pipe(gulp.dest(targetDir));

    var clipperTask = gulp.src([
        PATHS.SRC.ROOT + "renderer.html"
    ]).pipe(gulp.dest(targetDir));

    return merge(imagesTask, clipperTask);
}

function exportCommonLibFiles(targetDir) {
    var libFiles = [
        PATHS.NODE_MODULES + "pdfjs-dist/build/pdf.combined.js"
    ];

    var exportTask = gulp.src(assertModuleExists(libFiles))
        .pipe(gulp.dest(targetDir));

    // The provided TextHighlighter.min.js file has a jQuery dependency so we have to use a sub-file
    var minifyAndExportTask = gulp.src(PATHS.SRC.ROOT + "scripts/highlighting/textHighlighter.js")
        .pipe(uglify({
            output: { comments: /^!|@license|@preserve|license/i }
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

function exportChromeJS() {
    var targetDir = PATHS.TARGET.CHROME;

    var commonTask = exportCommonJS(targetDir);

    var appendIsInstalledMarkerTask = gulp.src([
        PATHS.BUNDLEROOT + "appendIsInstalledMarker.js"
    ]).pipe(concat("appendIsInstalledMarker.js")).pipe(gulp.dest(targetDir));

    var offscreenTask = gulp.src([
        PATHS.BUNDLEROOT + "offscreen.js"
    ]).pipe(concat("offscreen.js")).pipe(gulp.dest(targetDir));

    var regionOverlayTask = gulp.src([
        PATHS.BUNDLEROOT + "regionOverlay.js"
    ]).pipe(concat("regionOverlay.js")).pipe(gulp.dest(targetDir));

    var contentCaptureInjectTask = gulp.src([
        PATHS.BUNDLEROOT + "contentCaptureInject.js"
    ]).pipe(concat("contentCaptureInject.js")).pipe(gulp.dest(targetDir));

    var rendererTask = gulp.src([
        PATHS.BUNDLEROOT + "renderer.js"
    ]).pipe(concat("renderer.js")).pipe(gulp.dest(targetDir));

    var chromeExtensionTask = gulp.src([
        targetDir + "logManager.js",
        targetDir + "oneNoteApi.min.js",
        PATHS.BUNDLEROOT + "chromeExtension.js"
    ]).pipe(concat("chromeExtension.js")).pipe(gulp.dest(targetDir));

    if (commonTask) {
        return merge(commonTask, appendIsInstalledMarkerTask, offscreenTask, regionOverlayTask, contentCaptureInjectTask, rendererTask, chromeExtensionTask);
    }
    return merge(chromeExtensionTask, appendIsInstalledMarkerTask, offscreenTask, regionOverlayTask, contentCaptureInjectTask, rendererTask);
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

    var offscreenTask = gulp.src([
        PATHS.SRC.ROOT + "scripts/extensions/offscreen.html"
    ]).pipe(gulp.dest(targetDir));

    return merge(srcCommonTask, commonWebExtensionFiles, chromeTask, offscreenTask);
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

    var offscreenTask = gulp.src([
        PATHS.BUNDLEROOT + "offscreen.js"
    ]).pipe(concat("offscreen.js")).pipe(gulp.dest(targetDir));

    var regionOverlayTask = gulp.src([
        PATHS.BUNDLEROOT + "regionOverlay.js"
    ]).pipe(concat("regionOverlay.js")).pipe(gulp.dest(targetDir));

    var contentCaptureInjectTask = gulp.src([
        PATHS.BUNDLEROOT + "contentCaptureInject.js"
    ]).pipe(concat("contentCaptureInject.js")).pipe(gulp.dest(targetDir));

    var rendererTask = gulp.src([
        PATHS.BUNDLEROOT + "renderer.js"
    ]).pipe(concat("renderer.js")).pipe(gulp.dest(targetDir));

    var edgeExtensionTask = gulp.src([
        targetDir + "logManager.js",
        targetDir + "oneNoteApi.min.js",
        PATHS.BUNDLEROOT + "edgeExtension.js"
    ]).pipe(concat("edgeExtension.js")).pipe(gulp.dest(targetDir));

    if (commonTask) {
        return merge(commonTask, appendIsInstalledMarkerTask, offscreenTask, regionOverlayTask, contentCaptureInjectTask, rendererTask, edgeExtensionTask);
    }
    return merge(edgeExtensionTask, appendIsInstalledMarkerTask, offscreenTask, regionOverlayTask, contentCaptureInjectTask, rendererTask);
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

    var offscreenTask = gulp.src([
        PATHS.SRC.ROOT + "scripts/extensions/offscreen.html"
    ]).pipe(gulp.dest(targetDir));

    return merge(srcCommonTask, commonWebExtensionFiles, edgeTask, offscreenTask);
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

gulp.task("exportJS", function() {
    var chromeTask = exportChromeJS();
    var edgeTask = exportEdgeJS();

    return merge(chromeTask, edgeTask);
});

gulp.task("exportCSS", function() {
    var chromeTask = exportChromeCSS();
    var edgeTask = exportEdgeCSS();

    return merge(chromeTask, edgeTask);
});

gulp.task("exportSrcFiles", function() {
    var chromeTask = exportChromeSrcFiles();
    var edgeTask = exportEdgeSrcFiles();

    return merge(chromeTask, edgeTask);
});

gulp.task("export", function(callback) {
    runSequence(
        "exportAllCommonJS",
        "exportChrome",
        "exportEdge",
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

gulp.task("package", function (callback) {
    runSequence(
        "packageChrome",
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
            PATHS.SRC.ROOT + "renderer.html",
            PATHS.SRC.ROOT + "scripts/extensions/chrome/manifest.json",
            PATHS.SRC.ROOT + "scripts/extensions/offscreen.html",
            PATHS.SRC.ROOT + "scripts/extensions/edge/edgeExtension.html",
            PATHS.SRC.ROOT + "scripts/extensions/edge/manifest.json"
        ], ["watchSrcAction"]
    );
});

gulp.task("watchSrcAction", function(callback) {
    runSequence(
        "exportSrcFiles",
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
        callback);
});

gulp.task("full", function(callback) {
    runSequence(
        "clean",
        "build",
        callback);
});

gulp.task("default", ["build"]);