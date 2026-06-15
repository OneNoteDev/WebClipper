/// <binding BeforeBuild='build' />
"use strict";

var fs = require("fs");
var argv = require("yargs/yargs")(process.argv.slice(2)).argv;
var concat = require("gulp-concat");
var del = require("del").deleteAsync;
var esbuild = require("esbuild");
var gulp = require("gulp");
var less = require("gulp-less");
var mergeJSON = require("gulp-merge-json");
var cssnano = require("cssnano");
var postcss = require("gulp-postcss");
var rename = require("gulp-rename");
var spawn = require("child_process").spawn;
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

    // allowEmpty restores gulp 4's behavior of silently tolerating missing
    // production.json / dogfood.json overrides (only the internal repo
    // ships those by default).
    return gulp.src(mergeOrder, { allowEmpty: true })
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

gulp.task("compileTypeScript", gulp.series("copyStrings", "mergeSettings", "preCompileInternal", function compileTypeScriptInner(done) {
    var tscBin = require.resolve("typescript/bin/tsc");
    var tsc = spawn(process.execPath, [tscBin, "-p", "tsconfig.json"], { stdio: "inherit" });
    tsc.on("close", function (code) {
        done(code === 0 ? null : new Error("tsc exited with code " + code));
    });
}));

gulp.task("compile", gulp.series("compileTypeScript"));

////////////////////////////////////////
// LINT (eslint)
////////////////////////////////////////
gulp.task("lint", function (done) {
    // require.resolve("eslint") is blocked by eslint's "exports" field; resolve
    // via package.json (always exported) and walk to the bin entry instead.
    var path = require("path");
    var eslintPkgDir = path.dirname(require.resolve("eslint/package.json"));
    var eslintBin = path.join(eslintPkgDir, "bin", "eslint.js");
    var eslint = spawn(process.execPath, [eslintBin, "--no-error-on-unmatched-pattern", "src/**/*.ts", "src/**/*.tsx"], { stdio: "inherit" });
    eslint.on("close", function (code) {
        done(code === 0 ? null : new Error("eslint exited with code " + code));
    });
});

// Preserve the legacy task name for any external callers / pipeline references.
gulp.task("tslint", gulp.series("lint"));

////////////////////////////////////////
// BUNDLE
////////////////////////////////////////
function bundleEntry(folderPath, file, options) {
    options = options || {};
    var buildOptions = {
        entryPoints: [folderPath + file],
        outfile: PATHS.BUNDLEROOT + file,
        bundle: true,
        platform: "browser",
        format: "iife",
        target: "es2022",
        logLevel: "warning"
    };
    if (options.globalName) {
        buildOptions.globalName = options.globalName;
    }
    return esbuild.build(buildOptions);
}

gulp.task("bundleAppendIsInstalledMarker", function () {
    return bundleEntry(PATHS.BUILDROOT + "scripts/extensions/", "appendIsInstalledMarker.js");
});

gulp.task("bundleOffscreen", function () {
    return bundleEntry(PATHS.BUILDROOT + "scripts/extensions/", "offscreen.js");
});

gulp.task("bundleRegionOverlay", function () {
    return bundleEntry(PATHS.BUILDROOT + "scripts/extensions/", "regionOverlay.js");
});

gulp.task("bundleContentCaptureInject", function () {
    return bundleEntry(PATHS.BUILDROOT + "scripts/extensions/", "contentCaptureInject.js");
});

gulp.task("bundleTranscriptCaptureInject", function () {
    return bundleEntry(PATHS.BUILDROOT + "scripts/contentCapture/", "transcriptCaptureInject.js");
});

gulp.task("bundleRenderer", function () {
    return bundleEntry(PATHS.BUILDROOT + "scripts/", "renderer.js");
});

gulp.task("bundleLogManager", function () {
    var tasks = [bundleEntry(PATHS.BUILDROOT + "scripts/logging/", "logManager.js", { globalName: "LogManager" })];
    if (fileExists(PATHS.BUILDROOT + "scripts/logging/logManager_internal.js") && !argv.nointernal) {
        tasks.push(bundleEntry(PATHS.BUILDROOT + "scripts/logging/", "logManager_internal.js", { globalName: "LogManager" }));
    }
    return Promise.all(tasks);
});

gulp.task("bundleChrome", function () {
    return bundleEntry(PATHS.BUILDROOT + "scripts/extensions/chrome/", "chromeExtension.js");
});

gulp.task("bundleEdge", function () {
    return bundleEntry(PATHS.BUILDROOT + "scripts/extensions/edge/", "edgeExtension.js");
});

gulp.task("bundle", gulp.series(
    "bundleAppendIsInstalledMarker",
    "bundleOffscreen",
    "bundleRegionOverlay",
    "bundleContentCaptureInject",
    "bundleTranscriptCaptureInject",
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

    return streamToPromise(logManagerExportTask);
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
    var libFiles = [
        PATHS.NODE_MODULES + "pdfjs-dist/legacy/build/pdf.mjs",
        PATHS.NODE_MODULES + "pdfjs-dist/legacy/build/pdf.worker.mjs"
    ];

    var exportTask = gulp.src(assertModuleExists(libFiles)).pipe(gulp.dest(targetDir));

    var pdfLoaderTask = gulp.src(PATHS.SRC.ROOT + "pdfLoader.mjs").pipe(gulp.dest(targetDir));

    // The provided TextHighlighter.min.js file has a jQuery dependency so we have to use a sub-file
    var minifyAndExportTask = gulp.src(PATHS.SRC.ROOT + "scripts/highlighting/textHighlighter.js")
        .pipe(uglify({
            output: { comments: /^!|@license|@preserve|license/i }
        }))
        .pipe(gulp.dest(targetDir));

    return streamsToPromise(exportTask, pdfLoaderTask, minifyAndExportTask);
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

    var bundles = ["appendIsInstalledMarker.js", "offscreen.js", "regionOverlay.js", "contentCaptureInject.js", "transcriptCaptureInject.js", "renderer.js"];
    var bundleStreams = bundles.map(function(name) {
        return gulp.src([PATHS.BUNDLEROOT + name]).pipe(concat(name)).pipe(gulp.dest(targetDir));
    });

    var chromeExtensionTask = gulp.src([
        targetDir + "logManager.js",
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

    var bundles = ["appendIsInstalledMarker.js", "offscreen.js", "regionOverlay.js", "contentCaptureInject.js", "transcriptCaptureInject.js", "renderer.js"];
    var bundleStreams = bundles.map(function(name) {
        return gulp.src([PATHS.BUNDLEROOT + name]).pipe(concat(name)).pipe(gulp.dest(targetDir));
    });

    var edgeExtensionTask = gulp.src([
        targetDir + "logManager.js",
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
        .pipe(postcss([cssnano()]))
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
