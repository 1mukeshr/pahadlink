import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  // Frontend (browser)
  {
    files: ['src/**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    rules: {
      // Data-fetch / URL-sync effects are intentional in this app
      'react-hooks/set-state-in-effect': 'off',
      'react-refresh/only-export-components': 'warn',
    },
  },
  // Backend + shared domain + root scripts (Node)
  {
    files: ['server/**/*.{js,mjs}', 'shared/**/*.js', 'scripts/**/*.{js,mjs}', 'vite.config.js'],
    extends: [js.configs.recommended],
    languageOptions: {
      globals: globals.node,
      sourceType: 'module',
    },
  },
])
