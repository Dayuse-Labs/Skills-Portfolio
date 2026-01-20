/**
 * Configuration Prettier pour les projets Vibe Coding
 *
 * Formatage cohérent et automatique du code
 */

/** @type {import('prettier').Config} */
export default {
  // === Ponctuation ===
  semi: true,
  singleQuote: true,
  quoteProps: 'as-needed',
  trailingComma: 'es5',

  // === Indentation ===
  tabWidth: 2,
  useTabs: false,

  // === Largeur ===
  printWidth: 80,

  // === Espacement ===
  bracketSpacing: true,

  // === Fonctions Fléchées ===
  arrowParens: 'always',

  // === JSX (si utilisé) ===
  jsxSingleQuote: false,
  bracketSameLine: false,

  // === Markdown ===
  proseWrap: 'preserve',

  // === Fin de Ligne ===
  endOfLine: 'lf',

  // === HTML ===
  htmlWhitespaceSensitivity: 'css',

  // === Embedded Languages ===
  embeddedLanguageFormatting: 'auto',

  // === Single Attribute Per Line (JSX/Vue) ===
  singleAttributePerLine: false,
};
