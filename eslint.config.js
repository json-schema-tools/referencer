// ESLint flat config (migrated from .eslintrc.js for ESLint 9)
const js = require('@eslint/js');
const tseslint = require('@typescript-eslint/eslint-plugin');

module.exports = [
  // Generated output was never linted by the old `eslint . --ext .ts` invocation
  {
    ignores: ['build/**', 'coverage/**', 'docs/**'],
  },
  {
    files: ['**/*.ts'],
    ...js.configs.recommended,
  },
  ...tseslint.configs['flat/recommended'],
  // CJS config files legitimately use require()
  {
    files: ['eslint.config.js', 'jest.config.js'],
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
  {
    files: ['**/*.test.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
    },
  },
];
