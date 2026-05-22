/// <binding BeforeBuild='build' />
"use strict";

var fs = require("fs");
var argv = require("yargs/yargs")(process.argv.slice(2)).argv;
var browserify = require("browserify");
var concat = require("gulp-concat");
var del = require("del").deleteAsync;
var globby = require("globby");
var gulp = require("gulp");
var less = require("gulp-less");
var merge = require("merge-stream");
var mergeJSON = require("gulp-merge-json");
var minifyCSS = require("gulp-cssnano");
var plumber = require("gulp-plumber");
var rename = require("gulp-rename");
var source = require("vinyl-source-stream");
var ts = require("gulp-typescript");
var tslint = require("gulp-tslint");
var uglify = require("gulp-uglify");
var zip = require("gulp-zip").default;

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

var ARIA_LIB_VERSION = "2.8.2";

// Used for debugging glob declarations
function printGlobResults(glob) {
    globby.sync(glob).map(function(filePath) {
        console.log(filePath);
    });
}

function fileExists(path) {
    try { return fs.statSync(path).isFile(); } catch (e) { return false; }
}

////////////////////////////////////////
// CLEAN
////////////////////////////////////////
gulp.task("cleanInternal", function () {
    return del([
        PATHS.SRC.ROOT + "scripts/**/*_internal.*",
        PATHS.BUILDROOT + "scripts/**/*_internal.*",
        PATHS.BUILDROOT + "bundles/**/*_internal.*"
    ]);
});

gulp.task("clean", gulp.series("cleanInternal", function cleanRoots() {
    return del([
        PATHS.BUILDROOT,
        PATHS.BUNDLEROOT,
        PATHS.TARGET.ROOT
    ]);
}));

////////////////////////////////////////
// COMPILE CSS
////////////////////////////////////////
gulp.task("compileLess", function() {
    return gulp.src(PATHS.SRC.ROOT + "styles/renderer.less")
        .pipe(less())
        .pipe(gulp.dest(PATHS.BUILDROOT + "css"));
});

gulp.task("compileCss", gulp.series("compileLess"));

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
        }
    } else if (argv.dogfood) {
        mergeOrder.push(PATHS.SRC.SETTINGS + "dogfood.json");
        if (!argv.nointernal) {
            mergeOrder.push(PATHS.INTERNAL.SRC.SETTINGS + "dogfood.json");
        }
    }

    return gulp.src(mergeOrder)
        .pipe(mergeJSON({ fileName: "settings.json" }))
        .pipe(gulp.dest(PATHS.BUILDROOT));
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
    // gulp 4+ requires every task to signal completion — return a resolved promise on no-op.
    return Promise.resolve();
});

gulp.task("preCompileInternal", gulp.series("cleanInternal", "copyInternal"));

gulp.task("compileTypeScript", gulp.series("copyStrings", "mergeSettings", "preCompileInternal", function compileTypeScriptInner() {
    var tsProject = ts.createProject("./tsconfig.json", {
        typescript: require("typescript"),
        noEmitOnError: true
    });

    return gulp.src([PATHS.SRC.ROOT + "**/*.+(ts|tsx)"])
        .pipe(tsProject())
        .pipe(gulp.dest(PATHS.BUILDROOT));
}));

gulp.task("compile", gulp.series("compileTypeScript"));

////////////////////////////////////////
// TSLINT
////////////////////////////////////////
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
        }));
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
    return merge(generateBrowserifyTasks(PATHS.BUILDROOT + "scripts/extensions/", ["appendIsInstalledMarker.js"]));
});

gulp.task("bundleOffscreen", function () {
    return merge(generateBrowserifyTasks(PATHS.BUILDROOT + "scripts/extensions/", ["offscreen.js"]));
});

gulp.task("bundleRegionOverlay", function () {
    return merge(generateBrowserifyTasks(PATHS.BUILDROOT + "scripts/extensions/", ["regionOverlay.js"]));
});

gulp.task("bundleContentCaptureInject", function () {
    return merge(generateBrowserifyTasks(PATHS.BUILDROOT + "scripts/extensions/", ["contentCaptureInject.js"]));
});

gulp.task("bundleRenderer", function () {
    return merge(generateBrowserifyTasks(PATHS.BUILDROOT + "scripts/", ["renderer.js"]));
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
    return merge(generateBrowserifyTasks(PATHS.BUILDROOT + "scripts/extensions/chrome/", ["chromeExtension.js"]));
});

gulp.task("bundleEdge", function () {
    return merge(generateBrowserifyTasks(PATHS.BUILDROOT + "scripts/extensions/edge/", ["edgeExtension.js"]));
});

gulp.task("bundle", gulp.series(
    "bundleAppendIsInstalledMarker",
    "bundleOffscreen",
    "bundleRegionOverlay",
    "bundleContentCaptureInject",
    "bundleRenderer",
    "bundleLogManager",
    "bundleChrome",
    "bundleEdge"
));

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
    if (targetDirHasExportedCommonJs[targetDir]) {
        return Promise.resolve();
    }
    targetDirHasExportedCommonJs[targetDir] = true;

    // logManager.js is bundled standalone (browserify { standalone: "LogManager" })
    // so the global LogManager is available to other bundles. The internal
    // variant is used when WebClipper_Internal is present; it bundles the
    // Aria/MSIT telemetry shim. Otherwise the public stub logManager.js ships.
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

    var injectLibPaths = [PATHS.NODE_MODULES + "oneNoteApi/target/oneNoteApi.min.js"];
    var injectLibsTask = gulp.src(assertModuleExists(injectLibPaths)).pipe(gulp.dest(targetDir));

    return streamsToPromise(logManagerExportTask, injectLibsTask);
}

function exportCommonCSS(targetDir) {
    return streamToPromise(gulp.src([PATHS.BUILDROOT + "css/*.css"]).pipe(gulp.dest(targetDir)));
}

function exportCommonSrcFiles(targetDir) {
    return streamsToPromise(
        gulp.src(PATHS.SRC.ROOT + "images/**/*", { base: PATHS.SRC.ROOT, encoding: false })
            .pipe(lowerCasePathName())
            .pipe(gulp.dest(targetDir)),
        gulp.src([PATHS.SRC.ROOT + "renderer.html"]).pipe(gulp.dest(targetDir))
    );
}

function exportCommonLibFiles(targetDir) {
    var libFiles = [PATHS.NODE_MODULES + "pdfjs-dist/build/pdf.combined.js"];

    var exportTask = gulp.src(assertModuleExists(libFiles)).pipe(gulp.dest(targetDir));

    // The provided TextHighlighter.min.js file has a jQuery dependency so we have to use a sub-file
    var minifyAndExportTask = gulp.src(PATHS.SRC.ROOT + "scripts/highlighting/textHighlighter.js")
        .pipe(uglify({
            output: { comments: /^!|@license|@preserve|license/i }
        }))
        .pipe(gulp.dest(targetDir));

    return streamsToPromise(exportTask, minifyAndExportTask);
}

function exportCommonWebExtensionFiles(targetDir) {
    return streamsToPromise(
        gulp.src(PATHS.SRC.ROOT + "icons/*", { base: PATHS.SRC.ROOT, encoding: false })
            .pipe(gulp.dest(targetDir)),
        gulp.src(PATHS.SRC.ROOT + "_locales/**/*", { base: PATHS.SRC.ROOT })
            .pipe(lowerCasePathName())
            .pipe(gulp.dest(targetDir))
    );
}

function exportChromeJS() {
    var targetDir = PATHS.TARGET.CHROME;

    var bundles = ["appendIsInstalledMarker.js", "offscreen.js", "regionOverlay.js", "contentCaptureInject.js", "renderer.js"];
    var bundleStreams = bundles.map(function(name) {
        return gulp.src([PATHS.BUNDLEROOT + name]).pipe(concat(name)).pipe(gulp.dest(targetDir));
    });

    var chromeExtensionTask = gulp.src([
        targetDir + "logManager.js",
        targetDir + "oneNoteApi.min.js",
        PATHS.BUNDLEROOT + "chromeExtension.js"
    ]).pipe(concat("chromeExtension.js")).pipe(gulp.dest(targetDir));

    return exportCommonJS(targetDir).then(function() {
        return streamsToPromise.apply(null, bundleStreams.concat([chromeExtensionTask]));
    });
}

function exportChromeCSS() {
    return exportCommonCSS(PATHS.TARGET.CHROME);
}

function exportChromeSrcFiles() {
    var targetDir = PATHS.TARGET.CHROME;
    return Promise.all([
        exportCommonSrcFiles(targetDir),
        exportCommonWebExtensionFiles(targetDir),
        streamToPromise(gulp.src([PATHS.SRC.ROOT + "scripts/extensions/chrome/manifest.json"]).pipe(gulp.dest(targetDir))),
        streamToPromise(gulp.src([PATHS.SRC.ROOT + "scripts/extensions/offscreen.html"]).pipe(gulp.dest(targetDir)))
    ]);
}

function exportChromeLibFiles() {
    return exportCommonLibFiles(PATHS.TARGET.CHROME);
}

function exportEdgeJS() {
    var targetDir = PATHS.TARGET.EDGE_EXTENSION;

    var bundles = ["appendIsInstalledMarker.js", "offscreen.js", "regionOverlay.js", "contentCaptureInject.js", "renderer.js"];
    var bundleStreams = bundles.map(function(name) {
        return gulp.src([PATHS.BUNDLEROOT + name]).pipe(concat(name)).pipe(gulp.dest(targetDir));
    });

    var edgeExtensionTask = gulp.src([
        targetDir + "logManager.js",
        targetDir + "oneNoteApi.min.js",
        PATHS.BUNDLEROOT + "edgeExtension.js"
    ]).pipe(concat("edgeExtension.js")).pipe(gulp.dest(targetDir));

    return exportCommonJS(targetDir).then(function() {
        return streamsToPromise.apply(null, bundleStreams.concat([edgeExtensionTask]));
    });
}

function exportEdgeCSS() {
    return exportCommonCSS(PATHS.TARGET.EDGE_EXTENSION);
}

function exportEdgeSrcFiles() {
    var targetDir = PATHS.TARGET.EDGE_EXTENSION;
    return Promise.all([
        exportCommonSrcFiles(targetDir),
        exportCommonWebExtensionFiles(targetDir),
        streamToPromise(gulp.src([
            PATHS.SRC.ROOT + "scripts/extensions/edge/edgeExtension.html",
            PATHS.SRC.ROOT + "scripts/extensions/edge/manifest.json"
        ]).pipe(gulp.dest(targetDir))),
        streamToPromise(gulp.src([PATHS.SRC.ROOT + "scripts/extensions/offscreen.html"]).pipe(gulp.dest(targetDir)))
    ]);
}

function exportEdgePackageFiles() {
    return streamsToPromise(
        gulp.src([PATHS.SRC.ROOT + "scripts/extensions/edge/package/assets/*"], { encoding: false })
            .pipe(gulp.dest(PATHS.TARGET.EDGE_ROOT + "manifest/assets")),
        gulp.src([PATHS.SRC.ROOT + "scripts/extensions/edge/package/resources/**"], { encoding: false })
            .pipe(gulp.dest(PATHS.TARGET.EDGE_ROOT + "manifest/resources")),
        gulp.src([
            PATHS.SRC.ROOT + "scripts/extensions/edge/package/appxmanifest.xml",
            PATHS.SRC.ROOT + "scripts/extensions/edge/package/priconfig.xml"
        ]).pipe(gulp.dest(PATHS.TARGET.EDGE_ROOT + "manifest")),
        gulp.src([PATHS.SRC.ROOT + "scripts/extensions/edge/package/generationInfo.json"])
            .pipe(gulp.dest(PATHS.TARGET.EDGE_ROOT))
    );
}

function exportEdgeLibFiles() {
    return exportCommonLibFiles(PATHS.TARGET.EDGE_EXTENSION);
}

// Checks if a file path or list of file paths exists. Throws an error if one or more files don't exist,
// and returns itself otherwise.
function assertModuleExists(filePath) {
    var paths = typeof filePath === "string" ? [filePath] : filePath;

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
function streamToPromise(stream) {
    return new Promise(function (resolve, reject) {
        stream.on("close", resolve);
        stream.on("end", resolve);
        stream.on("finish", resolve);
        stream.on("error", reject);
    });
}

function streamsToPromise() {
    var args = Array.prototype.slice.call(arguments);
    return Promise.all(args.map(streamToPromise));
}

gulp.task("exportAllCommonJS", function () {
    var promises = [];
    for (var dir in targetDirHasExportedCommonJs) {
        if (targetDirHasExportedCommonJs.hasOwnProperty(dir)) {
            promises.push(exportCommonJS(dir));
        }
    }
    return Promise.all(promises);
});

gulp.task("exportChromeJS", function() { return exportChromeJS(); });
gulp.task("exportChromeCSS", function() { return exportChromeCSS(); });
gulp.task("exportChromeSrcFiles", function() { return exportChromeSrcFiles(); });
gulp.task("exportChromeLibFiles", function() { return exportChromeLibFiles(); });
gulp.task("exportChrome", gulp.series("exportChromeJS", "exportChromeCSS", "exportChromeSrcFiles", "exportChromeLibFiles"));

gulp.task("exportEdgeJS", function() { return exportEdgeJS(); });
gulp.task("exportEdgeCSS", function() { return exportEdgeCSS(); });
gulp.task("exportEdgeSrcFiles", function() { return exportEdgeSrcFiles(); });
gulp.task("exportEdgePackageFiles", function() { return exportEdgePackageFiles(); });
gulp.task("exportEdgeLibFiles", function() { return exportEdgeLibFiles(); });
gulp.task("exportEdge", gulp.series("exportEdgeJS", "exportEdgeCSS", "exportEdgeSrcFiles", "exportEdgePackageFiles", "exportEdgeLibFiles"));

gulp.task("exportJS", gulp.series("exportChromeJS", "exportEdgeJS"));
gulp.task("exportCSS", gulp.series("exportChromeCSS", "exportEdgeCSS"));
gulp.task("exportSrcFiles", gulp.series("exportChromeSrcFiles", "exportEdgeSrcFiles"));

gulp.task("export", gulp.series("exportAllCommonJS", "exportChrome", "exportEdge"));

////////////////////////////////////////
// PACKAGING TASKS
////////////////////////////////////////
gulp.task("packageChrome", function() {
    return gulp.src([PATHS.TARGET.CHROME + "/**/*", "!" + PATHS.TARGET.CHROME + "/OneNoteWebClipper.zip"], { encoding: false })
        .pipe(zip("OneNoteWebClipper.zip"))
        .pipe(gulp.dest(PATHS.TARGET.CHROME));
});

gulp.task("package", gulp.series("packageChrome"));

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

gulp.task("minify", gulp.series("minifyCss", "minifyJs"));

////////////////////////////////////////
// WATCH TASKS
////////////////////////////////////////
gulp.task("watchTSAction", gulp.series("compile", "bundle", "exportJS", "tslint"));

gulp.task("watchTS", function() {
    return gulp.watch([
        PATHS.SRC.ROOT + "strings.json",
        PATHS.SRC.ROOT + "settings.json",
        PATHS.SRC.ROOT + "**/*.+(ts|tsx)",
        PATHS.SRC.ROOT + "!**/*.d.ts"
    ], gulp.series("watchTSAction"));
});

gulp.task("watchLessAction", gulp.series("compileCss", "exportCSS"));

gulp.task("watchLess", function() {
    return gulp.watch(PATHS.SRC.ROOT + "styles/*.less", gulp.series("watchLessAction"));
});

gulp.task("watchSrcAction", gulp.series("exportSrcFiles"));

gulp.task("watchSrcFiles", function() {
    return gulp.watch([
        PATHS.SRC.ROOT + "_locales/*",
        PATHS.SRC.ROOT + "icons/*",
        PATHS.SRC.ROOT + "images/*",
        PATHS.SRC.ROOT + "renderer.html",
        PATHS.SRC.ROOT + "scripts/extensions/chrome/manifest.json",
        PATHS.SRC.ROOT + "scripts/extensions/offscreen.html",
        PATHS.SRC.ROOT + "scripts/extensions/edge/edgeExtension.html",
        PATHS.SRC.ROOT + "scripts/extensions/edge/manifest.json"
    ], gulp.series("watchSrcAction"));
});

////////////////////////////////////////
// SHORTCUT TASKS
////////////////////////////////////////
gulp.task("buildOnly", function buildOnlyDispatch(done) {
    var tasks = ["compileCss", "compile", "bundle"];
    if (argv.production && !argv.nominify) {
        tasks.push("minify");
    }
    tasks.push("export", "package");

    gulp.series.apply(gulp, tasks)(done);
});

gulp.task("watch", gulp.series("buildOnly", "watchTS", "watchLess", "watchSrcFiles"));

gulp.task("build", gulp.series("buildOnly", "tslint"));

gulp.task("full", gulp.series("clean", "build"));

gulp.task("default", gulp.series("build"));
