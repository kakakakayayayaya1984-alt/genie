// eslint.config.js (root, flat config)
import js from '@eslint/js';
import globals from 'globals';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import next from '@next/eslint-plugin-next';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default [
  // Ignore build artifacts everywhere
  { ignores: ['**/node_modules/**', '**/.next/**', '**/dist/**', '**/build/**'] },

  // Base JS recommended
  js.configs.recommended,

  // =========================
  // API: Express (Node only)
  // =========================
  {
    files: ['api/**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        // Node globals only. No browser here.
        ...globals.node,
      },
    },
    rules: {
      // Let server logs through
      'no-console': 'off',
      // Typical Node style relaxations
      'no-process-env': 'off', // in case a shared rule appears

      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    },
  },

  // =====================================
  // WEBAPP: Next.js client and config
  // =====================================
  {
    files: ['webapp/**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      parser: tsParser,
      parserOptions: {
        tsconfigRootDir: __dirname, // repo root
        project: ['./webapp/tsconfig.json'], // path from repo root
        ecmaFeatures: { jsx: true },
      },
      globals: {
        ...globals.browser,
        process: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
      react,
      'react-hooks': reactHooks,
      'jsx-a11y': jsxA11y,
    },
    settings: { react: { version: 'detect' } },
    rules: {
      // React (spread first)
      ...react.configs.recommended.rules,

      // Hooks
      ...reactHooks.configs.recommended.rules,

      // A11y
      ...jsxA11y.configs.recommended.rules,

      // TypeScript
      ...tseslint.configs.recommended.rules,

      // Now override:
      'react/react-in-jsx-scope': 'off',
      'react/jsx-uses-react': 'off',

      // Prefer TS-aware unused-vars
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],

      'no-console': ['warn', { allow: ['warn', 'error', 'log', 'info'] }],
      'react/prop-types': 'off',
    },
  },

  // ==================================
  // WEBSITE: Next.js client and config
  // ==================================
  {
    files: ['website/**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: { ecmaFeatures: { jsx: true } },
      globals: {
        ...globals.browser,
        process: 'readonly',
      },
    },
    plugins: {
      react,
      'react-hooks': reactHooks,
      'jsx-a11y': jsxA11y,
      '@next/next': next,
      '@typescript-eslint': tseslint,
    },
    settings: { react: { version: 'detect' } },
    rules: {
      ...react.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      ...jsxA11y.configs.recommended.rules,
      // Next recommended plus Core Web Vitals
      ...next.configs.recommended.rules,
      ...next.configs['core-web-vitals'].rules,

      'react/jsx-uses-react': 'off',
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      // You’re on /app router, not /pages
      '@next/next/no-html-link-for-pages': 'off',

      // Work around the plugin crash in your stack
      '@next/next/no-duplicate-head': 'off',

      // Prefer TS-aware unused-vars
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },

  // Optionally, restrict test envs
  {
    files: ['**/*.{test,spec}.{js,jsx}'],
    languageOptions: {
      globals: {
        ...globals.jest,
        ...globals.node,
        ...globals.browser,
      },
    },
  },
];
