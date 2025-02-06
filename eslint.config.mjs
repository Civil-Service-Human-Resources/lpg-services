// @ts-check
import tseslintplugin from '@typescript-eslint/eslint-plugin'
import tsParser from '@typescript-eslint/parser';
import tseslint from 'typescript-eslint';
import jsdoc from 'eslint-plugin-jsdoc';
import preferArrow from 'eslint-plugin-prefer-arrow-functions'
const __dirname = import.meta.url

export default tseslint.config(
	{
		ignores: [
			`**/dist/*`,
			'**/node_modules/*'
		],
	},
	{
		languageOptions: {
			parser: tsParser,
			parserOptions: {
				projectService: true,
				tsconfigRootDir: __dirname
			}
		},
		files: [
			"src/**/*.ts",
			"test/**/*.ts",
		],
		plugins: {
			'jsdoc': jsdoc,
			'prefer-arrow': preferArrow,
			'typescript-eslint': tseslintplugin
		},
		rules: {
			"typescript-eslint/adjacent-overload-signatures": "error",

			"typescript-eslint/array-type": ["error", {
				default: "array",
			}],

			"typescript-eslint/consistent-type-assertions": "error",
			"typescript-eslint/dot-notation": "error",
			"typescript-eslint/explicit-function-return-type": "off",

			"typescript-eslint/explicit-member-accessibility": ["off", {
				accessibility: "explicit",
			}],

			"typescript-eslint/explicit-module-boundary-types": "off",

			"typescript-eslint/naming-convention": ["error", {
				selector: ["variable", "typeProperty"],
				format: ["camelCase", "UPPER_CASE", "PascalCase"],
				leadingUnderscore: "allow",
				trailingUnderscore: "forbid",
			}],

			"typescript-eslint/no-empty-function": "error",
			"typescript-eslint/no-empty-interface": "error",
			"typescript-eslint/no-explicit-any": "off",
			"typescript-eslint/no-misused-new": "error",
			"typescript-eslint/no-namespace": "error",
			"typescript-eslint/no-parameter-properties": "off",

			"typescript-eslint/no-shadow": ["error", {
				hoist: "all",
			}],

			"typescript-eslint/no-unused-expressions": "error",
			"typescript-eslint/no-unused-vars": ["error",
				{
					args: "none"
				}],
			"typescript-eslint/no-use-before-define": "off",
			"typescript-eslint/no-var-requires": "error",
			"typescript-eslint/prefer-for-of": "error",
			"typescript-eslint/prefer-function-type": "error",
			"typescript-eslint/prefer-namespace-keyword": "error",

			"typescript-eslint/triple-slash-reference": ["error", {
				path: "always",
				types: "prefer-import",
				lib: "always",
			}],

			"typescript-eslint/typedef": "off",
			"typescript-eslint/unified-signatures": "error",
			"arrow-parens": ["error", "as-needed"],

			complexity: "off",
			"constructor-super": "error",
			"dot-notation": "off",
			eqeqeq: ["error", "smart"],
			"guard-for-in": "error",

			"id-denylist": [
				"error",
				"any",
				"Number",
				"String",
				"string",
				"Boolean",
				"boolean",
				"Undefined",
				"undefined",
			],

			"id-match": "error",
			indent: "off",
			"jsdoc/check-alignment": "error",
			"jsdoc/check-indentation": "error",
			"max-classes-per-file": "off",
			"new-parens": "error",
			"no-bitwise": "error",
			"no-caller": "error",
			"no-cond-assign": "error",
			"no-console": "off",
			"no-debugger": "error",
			"no-empty": "error",
			"no-empty-function": "off",
			"no-eval": "error",
			"no-fallthrough": "off",
			"no-invalid-this": "off",
			"no-new-wrappers": "error",
			"no-shadow": "off",
			"no-throw-literal": "error",
			"no-trailing-spaces": "error",
			"no-undef-init": "error",
			"no-underscore-dangle": "off",
			"no-unsafe-finally": "error",
			"no-unused-expressions": "off",
			"no-unused-labels": "error",
			"no-unused-vars": "off",
			"no-use-before-define": "off",
			"no-var": "error",
			"object-shorthand": "error",
			"one-var": ["error", "never"],

			"prefer-arrow/prefer-arrow-functions": ["error", {
				allowNamedFunctions: true,
			}],

			"prefer-const": ["error", {
				destructuring: "all",
			}],

			quotes: "off",
			semi: "off",
			"use-isnan": "error",
			"valid-typeof": "off",
		}
	}
)
