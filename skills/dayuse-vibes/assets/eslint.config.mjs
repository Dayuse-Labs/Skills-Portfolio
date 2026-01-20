/**
 * Configuration ESLint pour les projets Vibe Coding
 *
 * Règles strictes pour :
 * - Interdire le type `any`
 * - Forcer les types explicites
 * - Garantir la qualité du code
 */

import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import eslintConfigPrettier from 'eslint-config-prettier';
import importPlugin from 'eslint-plugin-import';

export default tseslint.config(
  // Configurations de base
  eslint.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  eslintConfigPrettier,

  // Configuration principale
  {
    languageOptions: {
      parserOptions: {
        project: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },

    plugins: {
      import: importPlugin,
    },

    rules: {
      // =====================================================================
      // CRITIQUE : INTERDICTION DU TYPE ANY
      // =====================================================================
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unsafe-assignment': 'error',
      '@typescript-eslint/no-unsafe-call': 'error',
      '@typescript-eslint/no-unsafe-member-access': 'error',
      '@typescript-eslint/no-unsafe-return': 'error',
      '@typescript-eslint/no-unsafe-argument': 'error',

      // =====================================================================
      // TYPES EXPLICITES REQUIS
      // =====================================================================
      '@typescript-eslint/explicit-function-return-type': [
        'error',
        {
          allowExpressions: true,
          allowTypedFunctionExpressions: true,
          allowHigherOrderFunctions: true,
          allowDirectConstAssertionInArrowFunctions: true,
        },
      ],
      '@typescript-eslint/explicit-module-boundary-types': 'error',
      '@typescript-eslint/typedef': [
        'error',
        {
          arrayDestructuring: false,
          arrowParameter: false,
          memberVariableDeclaration: true,
          objectDestructuring: false,
          parameter: true,
          propertyDeclaration: true,
          variableDeclaration: false,
        },
      ],

      // =====================================================================
      // QUALITÉ DU CODE
      // =====================================================================
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/await-thenable': 'error',
      '@typescript-eslint/no-misused-promises': [
        'error',
        {
          checksVoidReturn: {
            arguments: false,
          },
        },
      ],
      '@typescript-eslint/promise-function-async': 'error',
      '@typescript-eslint/require-await': 'error',

      // =====================================================================
      // STYLE ET LISIBILITÉ
      // =====================================================================
      '@typescript-eslint/prefer-nullish-coalescing': 'error',
      '@typescript-eslint/prefer-optional-chain': 'error',
      '@typescript-eslint/prefer-readonly': 'error',
      '@typescript-eslint/prefer-as-const': 'error',
      '@typescript-eslint/no-unnecessary-condition': 'error',
      '@typescript-eslint/no-unnecessary-type-assertion': 'error',
      '@typescript-eslint/consistent-type-imports': [
        'error',
        {
          prefer: 'type-imports',
          fixStyle: 'inline-type-imports',
        },
      ],
      '@typescript-eslint/consistent-type-exports': [
        'error',
        {
          fixMixedExportsWithInlineTypeSpecifier: true,
        },
      ],

      // =====================================================================
      // ORGANISATION DES IMPORTS
      // =====================================================================
      'import/order': [
        'error',
        {
          groups: [
            'builtin',
            'external',
            'internal',
            ['parent', 'sibling'],
            'index',
            'type',
          ],
          'newlines-between': 'always',
          alphabetize: {
            order: 'asc',
            caseInsensitive: true,
          },
          pathGroups: [
            {
              pattern: '@domain/**',
              group: 'internal',
              position: 'before',
            },
            {
              pattern: '@application/**',
              group: 'internal',
              position: 'before',
            },
            {
              pattern: '@infrastructure/**',
              group: 'internal',
              position: 'before',
            },
            {
              pattern: '@interfaces/**',
              group: 'internal',
              position: 'before',
            },
            {
              pattern: '@shared/**',
              group: 'internal',
              position: 'before',
            },
          ],
          pathGroupsExcludedImportTypes: ['type'],
        },
      ],
      'import/no-duplicates': ['error', { 'prefer-inline': true }],
      'import/no-cycle': 'error',

      // =====================================================================
      // RÈGLES DÉSACTIVÉES (gérées par TypeScript)
      // =====================================================================
      'no-unused-vars': 'off',
      'no-undef': 'off',
    },
  },

  // Configuration pour les fichiers de test
  {
    files: ['**/*.test.ts', '**/*.spec.ts'],
    rules: {
      // Relâcher certaines règles pour les tests
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'warn',
    },
  },

  // Fichiers ignorés
  {
    ignores: [
      'dist/',
      'node_modules/',
      '*.config.*',
      'coverage/',
      '.husky/',
      '*.d.ts',
    ],
  }
);
