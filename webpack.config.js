const {join, resolve} = require('path');

//plugins
// const CleanWebpackPlugin = require('clean-webpack-plugin');
// const ExtractTextPlugin = require('extract-text-webpack-plugin');
const webpack = require('webpack');

const PATHS = {
    SRC: {
        ROOT: "./src/",
        SETTINGS: "./src/settings/"
    },
    BUILDROOT: "build/",
    GENERATEDROOT: "generated/",
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
            SCRIPTS: "../WebClipper_Internal/./src/scripts/",
            SETTINGS: "../WebClipper_Internal/./src/settings/"
        },
        LIBROOT: "../WebClipper_Internal/lib/"
    }
};

// let internalPaths = [
//     PATHS.SRC.ROOT + "scripts/**/*_internal.*",
//     PATHS.BUILDROOT + "scripts/**/*_internal.*",
//     PATHS.BUILDROOT + "bundles/**/*_internal.*"
// ];
//
// let buildBundleTargetPaths = [
//     PATHS.BUILDROOT,
//     PATHS.BUNDLEROOT,
//     PATHS.TARGET.ROOT,
//     PATHS.GENERATEDROOT
//
// ];

const CHROME_ENTRYPOINTS = {
    chromeExtension: './src/scripts/extensions/chrome/chromeExtension.ts',
    chromeDebugLoggingInject: './src/scripts/extensions/chrome/chromeDebugLoggingInject.ts',
    chromeInject: './src/scripts/extensions/chrome/chromeInject.ts',
    chromePageNavInject: './src/scripts/extensions/chrome/chromePageNavInject.ts'
};

const EDGE_ENTRYPOINTS = {
    edgeExtension: './src/scripts/extensions/edge/edgeExtension.ts',
    edgeDebugLoggingInject: './src/scripts/extensions/edge/edgeDebugLoggingInject.ts',
    edgeInject: './src/scripts/extensions/edge/edgeInject.ts',
    edgeePageNavInject: './src/scripts/extensions/edge/edgePageNavInject.ts'
};

const FIREFOX_ENTRYPOINTS = {
    firefoxExtension: './src/scripts/extensions/firefox/firefoxExtension.ts',
    firefoxDebugLoggingInject: './src/scripts/extensions/firefox/firefoxDebugLoggingInject.ts',
    firefoxInject: './src/scripts/extensions/firefox/firefoxInject.ts',
    firefoxPageNavInject: './src/scripts/extensions/firefox/firefoxPageNavInject.ts'
};

const SAFARI_ENTRYPOINTS = {
    safariExtension: './src/scripts/extensions/safari/safariExtension.ts',
    safariDebugLoggingInject: './src/scripts/extensions/safari/safariDebugLoggingInject.ts',
    safariInject: './src/scripts/extensions/safari/safariInject.ts',
    safariPageNavInject: './src/scripts/extensions/safari/safariPageNavInject.ts'
};

// let pathsToClean = [...internalPaths, ...buildBundleTargetPaths];

const ENTRYPOINTS = {
    ...CHROME_ENTRYPOINTS,
    ...EDGE_ENTRYPOINTS,
    ...FIREFOX_ENTRYPOINTS,
    ...SAFARI_ENTRYPOINTS,
    AppendIsInstalledMarker: './src/scripts/extensions/appendIsInstalledMarker.ts',
    // ClipperUI:[
    //     './src/scripts/clipperUI/clipper.tsx',
    //     './src/scripts/clipperUI/pageNav.tsx',
    //     './src/scripts/clipperUI/localeSpecificTasks.ts',
    //     './src/scripts/clipperUI/unsupportedBrowser.ts'
    // ],
    LogManager:'./src/scripts/logging/logManager.ts',
    Bookmarklet: './src/scripts/extensions/bookmarklet/bookmarkletInject.ts',
};


const settings = JSON.stringify(require('./src/settings/settings.prod'));
console.error('----------------------------');
console.error(settings);

const webpackConfiguration = {
    context: join(__dirname, '.'),
    mode: "development",
    entry: ENTRYPOINTS,
    output: {
        filename: '[name].js',
        libraryTarget: 'umd',
        umdNamedDefine: true
    },
    resolve: {
        extensions: ['.js', '.ts', '.tsx'],
    },
    module: {
        rules: [
            {
                test: /\.ts(x?)$/,
                use: ['ts-loader'],
                exclude: /node_modules/
            }
        ]
    },
    plugins: [
        new webpack.DefinePlugin({
            'SETTINGS': JSON.stringify(settings)
        })
    ]
};

module.exports = webpackConfiguration;
