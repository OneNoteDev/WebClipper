import tseslint from "typescript-eslint";

export default tseslint.config(
	{
		ignores: [
			"build/**",
			"target/**",
			"node_modules/**",
			"src/**/*.d.ts",
			// Copies sourced from WebClipper_Internal via the copyInternal gulp
			// task (basename + "_internal"). Lint those in their own repo.
			"src/scripts/**/*_internal.ts",
			"src/scripts/**/*_internal.tsx",
			"src/scripts/definitions/custom/aria-web-telemetry-*.d_internal.ts"
		]
	},
	{
		files: ["src/**/*.ts", "src/**/*.tsx"],
		languageOptions: {
			parser: tseslint.parser,
			ecmaVersion: 2022,
			sourceType: "module"
		},
		plugins: {
			"@typescript-eslint": tseslint.plugin
		},
		rules: {
			"spaced-comment": ["error", "always"],
			"curly": "error",
			"eol-last": "error",
			"indent": ["error", "tab", { "SwitchCase": 1 }],
			"no-multiple-empty-lines": ["error", { "max": 1 }],
			"no-console": "error",
			"@typescript-eslint/no-inferrable-types": "error",
			"@typescript-eslint/no-shadow": "error",
			"dot-notation": "error",
			"no-fallthrough": "error",
			"no-trailing-spaces": "error",
			"no-unreachable": "error",
			"@typescript-eslint/no-unused-expressions": ["error", { "allowTernary": true, "allowShortCircuit": true }],
			"no-var": "error",
			"brace-style": ["error", "1tbs", { "allowSingleLine": true }],
			"quotes": ["error", "double", { "avoidEscape": true }],
			"radix": "error",
			"semi": ["error", "always"],
			"default-case": "error",
			"eqeqeq": "error"
		}
	}
);
