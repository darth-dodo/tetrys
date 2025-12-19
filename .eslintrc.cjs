/* eslint-env node */
require('@rushstack/eslint-patch/modern-module-resolution')

module.exports = {
  root: true,
  extends: [
    'plugin:vue/vue3-recommended',
    'eslint:recommended',
    '@vue/eslint-config-typescript',
    '@vue/eslint-config-prettier/skip-formatting',
    'plugin:security/recommended-legacy',
    'plugin:sonarjs/recommended-legacy'
  ],
  plugins: ['security', 'sonarjs'],
  parserOptions: {
    ecmaVersion: 'latest'
  },
  rules: {
    // ═══════════════════════════════════════════════════
    // DevEx: Clear errors, consistent patterns
    // ═══════════════════════════════════════════════════
    'vue/multi-word-component-names': 'off',
    'vue/component-tags-order': ['error', { order: ['template', 'script', 'style'] }],
    'vue/define-macros-order': ['error', { order: ['defineProps', 'defineEmits'] }],
    'vue/block-lang': ['error', { script: { lang: 'ts' } }],

    // ═══════════════════════════════════════════════════
    // Cleanliness: Code quality and maintainability
    // ═══════════════════════════════════════════════════
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/no-explicit-any': 'warn',
    'prefer-const': 'error',
    'no-var': 'error',
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    eqeqeq: ['error', 'always'],
    curly: ['error', 'multi-line'],
    'no-nested-ternary': 'warn',
    'max-depth': ['warn', 4],
    'max-lines-per-function': ['warn', { max: 100, skipBlankLines: true, skipComments: true }],

    // SonarJS: Cognitive complexity and code smells
    'sonarjs/cognitive-complexity': ['warn', 15],
    'sonarjs/no-duplicate-string': ['warn', { threshold: 3 }],
    'sonarjs/no-identical-functions': 'warn',
    'sonarjs/pseudo-random': 'off', // Math.random() is fine for game logic
    'sonarjs/no-nested-conditional': 'warn',
    'sonarjs/no-ignored-exceptions': 'warn', // Empty catch blocks are sometimes intentional
    'sonarjs/no-dead-store': 'warn',
    'sonarjs/use-type-alias': 'warn',
    'sonarjs/no-unused-vars': 'off', // Handled by @typescript-eslint/no-unused-vars

    // ═══════════════════════════════════════════════════
    // Security: Prevent vulnerabilities
    // ═══════════════════════════════════════════════════
    'security/detect-object-injection': 'warn',
    'security/detect-non-literal-regexp': 'warn',
    'security/detect-unsafe-regex': 'error',
    'security/detect-buffer-noassert': 'error',
    'security/detect-eval-with-expression': 'error',
    'security/detect-no-csrf-before-method-override': 'error',
    'security/detect-possible-timing-attacks': 'warn',
    'no-eval': 'error',
    'no-implied-eval': 'error',
    'no-new-func': 'error',
    'no-script-url': 'error'
  },
  overrides: [
    {
      // Relaxed rules for test files
      files: ['**/__tests__/**/*', '**/*.spec.ts', '**/*.test.ts', 'e2e/**/*'],
      rules: {
        'max-lines-per-function': 'off',
        'sonarjs/no-duplicate-string': 'off',
        'sonarjs/cognitive-complexity': 'off',
        'sonarjs/no-nested-functions': 'off',
        'sonarjs/no-identical-functions': 'off',
        'security/detect-object-injection': 'off',
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-unused-vars': 'warn',
        'no-console': 'off'
      }
    },
    {
      // Config files can use require
      files: ['*.cjs', 'vite.config.ts', 'vitest.config.ts'],
      rules: {
        '@typescript-eslint/no-require-imports': 'off'
      }
    }
  ]
}
