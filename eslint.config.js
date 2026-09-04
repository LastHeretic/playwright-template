import jsLint from '@eslint/js';
import tsLintPlugin from '@typescript-eslint/eslint-plugin';
import parser from '@typescript-eslint/parser';
import jsonLint from 'eslint-plugin-jsonc';
import globals from 'globals';
import * as jsoncParser from 'jsonc-eslint-parser';

export default [
    {
        ignores: ['**/node_modules/**', '**/out/**', 'dist/**', '**/*.js'],
    },
    jsLint.configs.recommended,
    ...jsonLint.configs['flat/recommended-with-json'],
    {
        files: ['**/*.json', '**/*.jsonc'],
        languageOptions: {
            parser: jsoncParser,
        },
        plugins: {
            jsonc: jsonLint,
        },
        rules: { 'jsonc/indent': ['error', 4], },
    },
    {
        files: ['**/package.json'],
        languageOptions: {
            parser: jsoncParser,
        },
        plugins: {
            jsonc: jsonLint,
        },
        rules: {
            'jsonc/sort-keys': [
                'error',
                {
                    order: { type: 'asc' },
                    pathPattern: '^(dependencies|devDependencies)$',
                },
            ],
        },
    },
    {
        files: ['**/*.ts', '**/*.mts', '**/*.cts'],
        languageOptions: {
            ecmaVersion: 'latest',
            sourceType: 'module',
            globals: {
                ...globals.browser,
                ...globals.node,
            },
            parser: parser,
            parserOptions: {
                project: './tsconfig.eslint.json',

            },
        },
        plugins: {
            '@typescript-eslint': tsLintPlugin,
        },
        rules: {
            ...tsLintPlugin.configs['recommended'].rules,
            'no-undef': 'off',
            'semi': 'error',
            'no-empty-function': 'off',
            'no-useless-constructor': 'off',
            '@typescript-eslint/no-useless-constructor': 'error',
            /** @not-supported changed in >=9 version {@link https://typescript-eslint.io/rules/ban-types/}
             * to `no-restricted-types`
             */
            // '@typescript-eslint/ban-types': 'warn',
            '@typescript-eslint/no-restricted-types': 'warn',
            '@typescript-eslint/ban-ts-comment': 'warn',
            '@typescript-eslint/adjacent-overload-signatures': 'warn',
            '@typescript-eslint/no-namespace': 'off',
            '@typescript-eslint/no-empty-function': 'off',
            '@typescript-eslint/unbound-method': ['error', {
                ignoreStatic: true,
            }],
            /**
             * @example
             * ```js
             * '@typescript-eslint/no-unused-vars': [
             *         'error',
             *         {
             *           /**
             *            * Check all args to make sure that we don't implement
             *            * methods with redundant arguments;
             *            * If an unused argument is required by function type
             *            * (e.g. when we implement parts for Angular framework like trackBy function),
             *            * we could use '_' to mark such arguments as redundant;
             *            *\/
             *           args: 'all',
             *           argsIgnorePattern: '^_.*$',
             *           caughtErrors: 'all',
             *           caughtErrorsIgnorePattern: '^_.*$',
             *           destructuredArrayIgnorePattern: '^_.*$',
             *           varsIgnorePattern: '^_.*$',
             *           ignoreRestSiblings: true,
             *         },
             *        ]
             * ```
             *  */
            '@typescript-eslint/no-unused-vars': 'warn',
            '@typescript-eslint/no-inferrable-types': 'error',
            '@typescript-eslint/explicit-module-boundary-types': 'off',
            '@typescript-eslint/explicit-function-return-type': 'warn',
            '@typescript-eslint/no-explicit-any': 'warn',
            'no-inner-declarations': 'warn',
            'space-unary-ops': ['error'],
            'object-curly-spacing': ['error', 'always'],
            'indent': [
                'error',
                4,
                {
                    SwitchCase: 1,
                    VariableDeclarator: 'first',
                },
            ],
            'no-empty': 'off',
            'import/no-unresolved': 'off',
            'import/prefer-default-export': 'off',
            'class-methods-use-this': 'off',
            'no-constant-condition': 'off',
            'lines-between-class-members': [
                'warn',
                'always',
                {
                    exceptAfterSingleLine: true,
                },
            ],
            'max-len': 'off',
            'prefer-const': 'warn',
            'array-bracket-newline': 'off',
            'array-bracket-spacing': ['error', 'never'],
            'no-mixed-spaces-and-tabs': ['error'],
            'space-before-blocks': ['warn', 'always'],
            'block-spacing': 'error',
            'padding-line-between-statements': [
                'error',
                {
                    blankLine: 'always',
                    prev: ['function', 'block-like'],
                    next: '*',
                },
                {
                    blankLine: 'any', prev: 'case', next: ['case', 'default'],
                },
            ],
            'brace-style': [
                'error',
                '1tbs',
                {
                    allowSingleLine: true,
                },
            ],
            'comma-style': ['error'],
            'comma-dangle': ['error', 'always-multiline'],
            'comma-spacing': ['error', { after: true }],
            'func-call-spacing': ['error', 'never'],
            'implicit-arrow-linebreak': ['error', 'beside'],
            'key-spacing': ['error', {
                singleLine: {
                    beforeColon: false, afterColon: true,
                }, multiLine: {
                    beforeColon: false, afterColon: true,
                },
            }],
            'newline-per-chained-call': ['error', { ignoreChainWithDepth: 2 }],
            'no-multiple-empty-lines': ['warn', { max: 1, maxEOF: 0 }],
            'no-trailing-spaces': 'error',
            'no-whitespace-before-property': 'error',
            'keyword-spacing': ['error'],
            'quote-props': ['error', 'consistent-as-needed'],
            'quotes': ['error', 'single', { avoidEscape: true }],
            'space-infix-ops': 'error',
            'switch-colon-spacing': 'error',
            'no-multi-spaces': ['error', {
                exceptions: {
                    VariableDeclarator: true,
                },
            }],
            'no-console': ['warn', { allow: ['warn', 'error'] }],
            '@typescript-eslint/member-ordering': [
                'error',
                {
                    default: [
                        'signature',
                        'call-signature',
                        'public-static-field',
                        'protected-static-field',
                        'private-static-field',
                        'public-decorated-field',
                        'protected-decorated-field',
                        'private-decorated-field',
                        'static-field',
                        'field',

                        'static-initialization',
                        'public-constructor',
                        'protected-constructor',
                        'private-constructor',
                        'constructor',
                        'public-static-method',
                        'protected-static-method',
                        'private-static-method',
                        'public-decorated-method',
                        'protected-decorated-method',
                        'private-decorated-method',
                        'public-instance-method',
                        'protected-instance-method',
                        'private-instance-method',
                        'public-abstract-method',
                        'protected-abstract-method',
                        'public-method',
                        'protected-method',
                        'private-method',
                        'static-method',
                        'instance-method',
                        'abstract-method',
                        'decorated-method',
                        'method',
                    ],
                },
            ],
            '@typescript-eslint/explicit-member-accessibility': [
                'error',
                {
                    accessibility: 'no-public',
                }
            ],
            'no-nested-ternary': 'error',
            'no-param-reassign': 'error',
            'no-case-declarations': 'warn',
            '@typescript-eslint/no-require-imports': 'warn',
            '@typescript-eslint/naming-convention': [
                'error',
                {
                    selector: ['interface', 'typeAlias', 'typeParameter', 'class'],
                    format: ['StrictPascalCase'],
                },
            ],
            '@typescript-eslint/triple-slash-reference': 'warn',
            '@typescript-eslint/return-await': 'error',
            '@typescript-eslint/no-misused-promises': 'warn',
            '@typescript-eslint/await-thenable': 'error',
            '@typescript-eslint/promise-function-async': 'warn'
        },
    },
];
