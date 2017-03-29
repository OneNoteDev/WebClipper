var path = require('path');

var PATHS = {
	SRC: {
		SCRIPTS: 'src/scripts/',
		SETTINGS: 'src/settings/',
		STYLES: 'src/styles/'
	},
	BUILDROOT: 'build/',
	BUNDLEROOT: 'build/bundles/',
	LIBROOT: 'lib/',
	TARGET: {
		ROOT: 'target/',
		BOOKMARKLET: 'target/bookmarklet/',
		CHROME: 'target/chrome/',
		EDGE_ROOT: 'target/edge/OneNoteWebClipper/edgeextension/',
		EDGE_EXTENSION: 'target/edge/OneNoteWebClipper/edgeextension/manifest/extension/',
		FIREFOX: 'target/firefox/',
		// Note: The Safari extension folder MUST end in '.safariextension'
		SAFARI: 'target/clipper.safariextension/',
		TESTS: 'target/tests/'
	},
	NODE_MODULES: 'node_modules/',
	INTERNAL: {
		SRC: {
			SCRIPTS: '../WebClipper_Internal/src/scripts/',
			SETTINGS: '../WebClipper_Internal/src/settings/'
		},
		LIBROOT: '../WebClipper_Internal/lib/'
	}
};

module.exports = function(env) {
	// TODO env.production, env.dogfood, env.nointernal, env.nominify

	return {
		entry: [
			path.join(__dirname, PATHS.SRC.SCRIPTS, 'clipperUI/clipper.tsx'),
			path.join(__dirname, PATHS.SRC.STYLES, 'clipper.less')
		],
		output: {
			path: path.join(__dirname, PATHS.TARGET.CHROME),
			filename: 'clipper.js',
		},

		// Enable sourcemaps for debugging webpack's output.
		devtool: 'source-map',

		resolve: {
			// Add '.ts' and '.tsx' to list of default resolvable extensions.
			extensions: ['.js', '.json', '.ts', '.tsx']
		},

		module: {
			rules: [
				// All files with a '.ts' or '.tsx' extension will be handled by 'awesome-typescript-loader'.
				{ test: /\.tsx?$/, exclude: /(node_modules)/, loader: 'awesome-typescript-loader' },
				{ test: /\.less$/, use: [ 'style-loader', 'css-loader?-url', 'less-loader' ] },
				// All output '.js' files will have any sourcemaps re-processed by 'source-map-loader'.
				{ test: /\.js$/, exclude: /(node_modules)/, enforce: 'pre', loader: 'source-map-loader' },
				{ test: /\settings.json$/, use: [ { loader: 'file-loader' }, { loader: 'i18n-loader', options: { locales: [ 'default' ] } } ] }
			]
		}
	};
};
