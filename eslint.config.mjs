// eslint.config.mjs (完全修正版)
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { FlatCompat } from '@eslint/eslintrc';
import js from '@eslint/js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
});

const eslintConfig = [
  {
    ignores: [
      'node_modules/**',
      '.next/**',
      'out/**',
      'build/**',
      'dist/**',
      // 設定ファイルを除外
      'next.config.js',
      'next.config.mjs',
      'tailwind.config.js',
      'postcss.config.js',
      '*.config.js',
      '*.config.mjs',
    ],
  },
  ...compat.extends('next/core-web-vitals'),
  {
    rules: {
      // TypeScriptルールを無効化（プラグインがない場合）
      'react/no-unescaped-entities': 'off',
      '@next/next/no-page-custom-font': 'off',
      // 未使用変数の警告を無効化
      'no-unused-vars': 'off',
      // TypeScriptルールを無効化
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/ban-ts-comment': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
];

export default eslintConfig;