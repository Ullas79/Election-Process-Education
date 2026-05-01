import js from '@eslint/js';
import globals from 'globals';

/** @type {import('eslint').Linter.Config[]} */
export default [
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.node,
        ...globals.jest,
      },
    },
    rules: {
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'eqeqeq': 'error',
      'no-var': 'error',
      'prefer-const': 'warn',
      'no-throw-literal': 'error',
      'curly': ['error', 'multi-line'],
      'no-eval': 'error',
      'no-implied-eval': 'error',
    },
  },
  {
    // Frontend specific overrides
    files: ['frontend/**/*.js'],
    languageOptions: {
      globals: {
        ...globals.browser,
        Quiz: 'readonly',
        Chat: 'readonly',
        Accessibility: 'readonly',
        ThemeManager: 'readonly',
        Navigation: 'readonly',
        ParticleSystem: 'readonly',
        FactTicker: 'readonly',
        DataLoader: 'readonly',
        ScrollAnimations: 'readonly',
        navigateTo: 'readonly',
        startQuiz: 'readonly',
        sendMessage: 'readonly',
        sendSuggestion: 'readonly',
        showToast: 'readonly',
        YouTubeLoader: 'readonly',
        Analytics: 'readonly',
      },
    },
  }
];
