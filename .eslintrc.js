module.exports = {
    root: true,
    parser: '@typescript-eslint/parser',
    plugins: ['@typescript-eslint', 'react', 'react-hooks'],
    extends: [
        'eslint:recommended',
        'plugin:@typescript-eslint/recommended',
        'plugin:react/recommended',
        'plugin:react-hooks/recommended',
        'next/core-web-vitals',
    ],
    rules: {
        // 未使用変数のルールを調整
        '@typescript-eslint/no-unused-vars': ['warn', {
            // 変数名が_で始まるものは警告しない
            argsIgnorePattern: '^_',
            varsIgnorePattern: '^_',
            // destructuringで使用されない変数も警告しない
            ignoreRestSiblings: true,
        }],
        // React v17以降ではimportが不要になったため
        'react/react-in-jsx-scope': 'off',
        // propsの型チェックはTypeScriptで行うため
        'react/prop-types': 'off',
        // 改行コードはLFに統一
        'linebreak-style': ['error', 'unix'],
        // セミコロンは省略可能
        'semi': ['warn', 'always'],
        // 文字列はシングルクォーテーションで統一
        'quotes': ['warn', 'single', { 'allowTemplateLiterals': true }],
        // コンソールログを残すと警告
        'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
    settings: {
        react: {
            version: 'detect',
        },
    },
    env: {
        browser: true,
        node: true,
        es6: true,
    },
    globals: {
        React: 'writable',
    },
};