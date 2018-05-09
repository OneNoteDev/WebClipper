const gulp = require('gulp');
const multiDest  = require('gulp-multi-dest');
const del = require("del");
const argv = require("yargs").argv;
const runSequence = require("run-sequence");
const mergeJSON = require("gulp-merge-json");
const fileExists = require("file-exists");
const rename = require("gulp-rename");

const webpack_stream = require('webpack-stream');
const webpackConfig  = require('./webpack.config.js');

const PATHS = {
    SRC: {
        ROOT: "src/",
        SETTINGS: "src/settings/"
    },
    BUILDROOT: "build/",
	GENERATEDROOT:"generated/",
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

const destOptions = {
    mode: 0o755
};

gulp.task("clean", ["cleanInternal"], function(callback) {
    return del([
        PATHS.BUILDROOT,
        PATHS.BUNDLEROOT,
        PATHS.TARGET.ROOT,
        PATHS.GENERATEDROOT
    ], callback);
});

gulp.task("cleanInternal", function () {
    return del([
        PATHS.SRC.ROOT + "scripts/**/*_internal.*",
        PATHS.BUILDROOT + "scripts/**/*_internal.*",
        PATHS.BUILDROOT + "bundles/**/*_internal.*"
    ]);
});

gulp.task("copyStrings", function() {
    return gulp.src(PATHS.SRC.ROOT + "strings.json")
        .pipe(multiDest([PATHS.BUILDROOT, PATHS.GENERATEDROOT], destOptions));
});

gulp.task("mergeSettings", function() {
    // note that overwriting of objects depends on ordering in array (last wins)
    const mergeOrder = [PATHS.SRC.SETTINGS + "default.json"];
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
        .pipe(mergeJSON("settings.json"))
        .pipe(multiDest([PATHS.BUILDROOT, PATHS.GENERATEDROOT], destOptions));
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

gulp.task('webpack', () => {
    return webpack_stream(webpackConfig, require("webpack"))
        .pipe(multiDest([PATHS.BUILDROOT, PATHS.GENERATEDROOT]));
});

gulp.task("robinfiletasks", function(callback){
    runSequence(
        "clean",
        "copyStrings",
        "mergeSettings",
        "copyInternal",
        "webpack",
        callback
    );
});