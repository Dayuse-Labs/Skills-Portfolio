/**
 * Configuration Vitest pour les projets Vibe Coding
 *
 * Tests avec couverture de code et seuils de qualité
 */

import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    // === Environnement ===
    globals: true,
    environment: 'node',

    // === Fichiers de Test ===
    include: ['src/**/*.test.ts', 'src/**/*.spec.ts'],
    exclude: ['node_modules', 'dist', 'e2e/**'],

    // === Alias (correspondant au tsconfig) ===
    alias: {
      '@domain': path.resolve(__dirname, './src/domain'),
      '@application': path.resolve(__dirname, './src/application'),
      '@infrastructure': path.resolve(__dirname, './src/infrastructure'),
      '@interfaces': path.resolve(__dirname, './src/interfaces'),
      '@shared': path.resolve(__dirname, './src/shared'),
    },

    // === Timeouts ===
    testTimeout: 10000,
    hookTimeout: 10000,

    // === Couverture de Code ===
    coverage: {
      provider: 'v8',
      enabled: false, // Activer avec --coverage

      // Répertoires à inclure/exclure
      include: ['src/**/*.ts'],
      exclude: [
        'node_modules',
        'dist',
        'src/**/*.test.ts',
        'src/**/*.spec.ts',
        'src/**/*.d.ts',
        'src/**/index.ts', // Fichiers barrel
        '*.config.*',
      ],

      // Formats de rapport
      reporter: ['text', 'text-summary', 'html', 'lcov', 'json'],

      // Seuils de couverture (échoue si en dessous)
      thresholds: {
        statements: 80,
        branches: 80,
        functions: 80,
        lines: 80,
      },

      // Répertoire de sortie
      reportsDirectory: './coverage',

      // Afficher les lignes non couvertes
      all: true,
    },

    // === Reporters ===
    reporters: ['default'],

    // === Watch Mode ===
    watch: false,

    // === Isolation ===
    isolate: true,
    pool: 'threads',

    // === Setup Files (si nécessaire) ===
    // setupFiles: ['./src/test/setup.ts'],

    // === Mock ===
    mockReset: true,
    clearMocks: true,
    restoreMocks: true,
  },

  // === Résolution des Modules ===
  resolve: {
    alias: {
      '@domain': path.resolve(__dirname, './src/domain'),
      '@application': path.resolve(__dirname, './src/application'),
      '@infrastructure': path.resolve(__dirname, './src/infrastructure'),
      '@interfaces': path.resolve(__dirname, './src/interfaces'),
      '@shared': path.resolve(__dirname, './src/shared'),
    },
  },
});
