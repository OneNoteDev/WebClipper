const {join} = require('path');

//plugins
// const CleanWebpackPlugin = require('clean-webpack-plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');

const PATHS = {
    SRC: {
        ROOT: "./src/",
        SETTINGS: "./src/settings/"
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
            SCRIPTS: "../WebClipper_Internal/./src/scripts/",
            SETTINGS: "../WebClipper_Internal/./src/settings/"
        },
        LIBROOT: "../WebClipper_Internal/lib/"
    }
};

const OUT_DIR = join(__dirname, './target');

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

// let pathsToClean = [...internalPaths, ...buildBundleTargetPaths];

const ENTRYPOINTS = {
    AppendIsInstalledMarker: './src/scripts/extensions/appendIsInstalledMarker.ts',
    // ClipperUI:[
    //     './src/scripts/clipperUI/clipper.tsx',
    //     './src/scripts/pageNav.tsx',
    //     './src/scripts/clipperUI/localeSpecificTasks.ts',
    //     './src/unsupportedBrowser.html'
    // ],
    // LogManager:'./src/scripts/logging/logManager.ts',
    // Bookmarklet: './src/scripts/extensions/bookmarklet/bookmarkletInject.ts',
    // Chrome: [
    //     './src/scripts/extensions/chromeExtension.ts',
    //     './src/scripts/extensions/chromeDebugLoggingInject.ts',
    //     './src/scripts/extensions/chromeInject.ts',
    //     './src/scripts/extensions/chromePageNavInject.ts'
    // ],
    // Edge: [
    //     './src/scripts/extensions/edge/edgeExtension.ts',
    //     './src/scripts/extensions/edge/edgeDebugLoggingInject.ts',
    //     './src/scripts/extensions/edge/edgeInject.ts',
    //     './src/scripts/extensions/edge/edgePageNavInject.ts'
    // ],
    // Firefox: [
    //     './src/scripts/extensions/firefox/firefoxExtension.ts',
    //     './src/scripts/extensions/firefox/firefoxDebugLoggingInject.ts',
    //     './src/scripts/extensions/firefox/firefoxInject.ts',
    //     './src/scripts/extensions/firefox/firefoxPageNavInject.ts'
    // ],
    // Safari: [
    //     './src/scripts/extensions/safari/safariExtension.ts',
    //     './src/scripts/extensions/safari/safariDebugLoggingInject.ts',
    //     './src/scripts/extensions/safari/safariInject.ts',
    //     './src/scripts/extensions/safari/safariPageNavInject.ts'
    // ],
};

const webpackConfiguration =  {
        entry: ENTRYPOINTS,
        output: {
            filename: '[name].js',
            path: OUT_DIR,
            publicPath: '/target/',
            libraryTarget: 'umd',
            umdNamedDefine: true
        },
        resolve: {
            extensions: ['.js', '.ts', '.tsx', '.html'],
        },
        // plugins: [
        //     new CleanWebpackPlugin(pathsToClean),
        // ],
        module: {
            rules: [
                {
                    test: /\.ts$/,
                    use: 'ts-loader'
                },
                {
                    test: /\.tsx?$/,
                    use: 'ts-loader'
                },
                {
                    test:/\.html$/,
                    use: 'html-loader'
                }
            ]
        },
};

module.exports = webpackConfiguration;
