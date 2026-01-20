# Configuration Linting et Formatage

Ce guide explique comment configurer et utiliser ESLint et Prettier.

## Pourquoi Linter ?

Le linting :
- Attrape les bugs avant l'exécution
- Impose un style de code cohérent
- Empêche le type `any`
- Facilite les revues de code

---

## Installation

```bash
npm install -D eslint @eslint/js typescript-eslint prettier eslint-config-prettier eslint-plugin-import
```

---

## Configuration ESLint

Créer `eslint.config.mjs` :

```javascript
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import eslintConfigPrettier from 'eslint-config-prettier';
import importPlugin from 'eslint-plugin-import';

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  eslintConfigPrettier,
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
      // === CRITIQUE : PAS DE ANY ===
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unsafe-assignment': 'error',
      '@typescript-eslint/no-unsafe-call': 'error',
      '@typescript-eslint/no-unsafe-member-access': 'error',
      '@typescript-eslint/no-unsafe-return': 'error',
      '@typescript-eslint/no-unsafe-argument': 'error',

      // === TYPES EXPLICITES REQUIS ===
      '@typescript-eslint/explicit-function-return-type': [
        'error',
        {
          allowExpressions: true,
          allowTypedFunctionExpressions: true,
        },
      ],
      '@typescript-eslint/explicit-module-boundary-types': 'error',

      // === QUALITÉ DU CODE ===
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/await-thenable': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
      '@typescript-eslint/prefer-nullish-coalescing': 'error',
      '@typescript-eslint/prefer-optional-chain': 'error',

      // === ORGANISATION DES IMPORTS ===
      'import/order': [
        'error',
        {
          groups: [
            'builtin',
            'external',
            'internal',
            'parent',
            'sibling',
            'index',
          ],
          'newlines-between': 'always',
          alphabetize: {
            order: 'asc',
            caseInsensitive: true,
          },
        },
      ],
      'import/no-duplicates': 'error',
    },
  },
  {
    ignores: ['dist/', 'node_modules/', '*.config.*', 'coverage/'],
  }
);
```

---

## Configuration Prettier

Créer `prettier.config.mjs` :

```javascript
/** @type {import('prettier').Config} */
export default {
  semi: true,
  singleQuote: true,
  tabWidth: 2,
  trailingComma: 'es5',
  printWidth: 80,
  bracketSpacing: true,
  arrowParens: 'always',
  endOfLine: 'lf',
  useTabs: false,
  quoteProps: 'as-needed',
  jsxSingleQuote: false,
  bracketSameLine: false,
  proseWrap: 'preserve',
};
```

---

## Scripts package.json

```json
{
  "scripts": {
    "lint": "eslint src/",
    "lint:fix": "eslint src/ --fix",
    "format": "prettier --write src/",
    "format:check": "prettier --check src/",
    "check": "npm run lint && npm run format:check && npm run test"
  }
}
```

---

## Commandes d'Utilisation

```bash
# Vérifier les problèmes de lint
npm run lint

# Corriger automatiquement les problèmes
npm run lint:fix

# Formater tous les fichiers
npm run format

# Vérifier si les fichiers sont formatés
npm run format:check

# Exécuter toutes les vérifications
npm run check
```

---

## Intégration VS Code

Créer `.vscode/settings.json` :

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  },
  "typescript.preferences.importModuleSpecifier": "relative"
}
```

Extensions recommandées (`.vscode/extensions.json`) :

```json
{
  "recommendations": [
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint"
  ]
}
```

---

## Pre-commit Hooks (Optionnel)

Installer Husky et lint-staged :

```bash
npm install -D husky lint-staged
npx husky init
```

Créer `.husky/pre-commit` :

```bash
npx lint-staged
```

Ajouter au `package.json` :

```json
{
  "lint-staged": {
    "*.ts": ["eslint --fix", "prettier --write"]
  }
}
```

---

## Erreurs Courantes et Solutions

### Erreur : `@typescript-eslint/no-explicit-any`

```typescript
// ❌ MAUVAIS
function process(data: any): any {
  return data;
}

// ✅ SOLUTION : Utiliser des types spécifiques ou unknown
function process(data: unknown): ProcessedData {
  // Valider et traiter
}
```

### Erreur : `@typescript-eslint/explicit-function-return-type`

```typescript
// ❌ MAUVAIS
function add(a: number, b: number) {
  return a + b;
}

// ✅ SOLUTION : Ajouter le type de retour
function add(a: number, b: number): number {
  return a + b;
}
```

### Erreur : `@typescript-eslint/no-floating-promises`

```typescript
// ❌ MAUVAIS
async function fetchData(): Promise<void> {
  fetch('/api/data'); // Promise non awaited
}

// ✅ SOLUTION : Await ou gérer la promesse
async function fetchData(): Promise<void> {
  await fetch('/api/data');
}

// OU void explicite si le résultat n'est pas nécessaire
function triggerFetch(): void {
  void fetch('/api/data');
}
```

### Erreur : `@typescript-eslint/no-unused-vars`

```typescript
// ❌ MAUVAIS
function process(data: Data, options: Options): void {
  console.log(data);
  // options n'est pas utilisé
}

// ✅ SOLUTION : Préfixer avec underscore
function process(data: Data, _options: Options): void {
  console.log(data);
}
```

### Erreur : `@typescript-eslint/no-unsafe-assignment`

```typescript
// ❌ MAUVAIS
const data = JSON.parse(jsonString); // type any implicite

// ✅ SOLUTION : Typer et valider
const data: unknown = JSON.parse(jsonString);
const validatedData = MySchema.parse(data); // Avec Zod
```

---

## Dépannage

### ESLint ne trouve pas tsconfig

S'assurer que `tsconfig.json` existe et inclut tous les fichiers source :

```json
{
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### Conflit Prettier et ESLint

Le package `eslint-config-prettier` désactive les règles ESLint qui entrent en conflit avec Prettier. S'assurer qu'il est inclus en dernier dans la config.

### Trop d'erreurs à corriger

Commencer par corriger les erreurs par petits lots :

```bash
# Corriger uniquement des fichiers spécifiques
npx eslint src/domain/ --fix

# Voir la progression avec un nombre max de warnings
npx eslint src/ --max-warnings 50
```

### Ignorer temporairement une règle

```typescript
// Pour une ligne
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const legacy: any = oldCode();

// Pour un bloc
/* eslint-disable @typescript-eslint/no-explicit-any */
// ... code legacy
/* eslint-enable @typescript-eslint/no-explicit-any */
```

⚠️ **Attention** : N'utiliser que pour du code legacy en cours de migration. Ne jamais désactiver pour du nouveau code.

---

## Règles Critiques Expliquées

| Règle | Pourquoi |
|-------|----------|
| `no-explicit-any` | Empêche l'utilisation de `any` |
| `no-unsafe-*` | Empêche les opérations non sûres avec `any` |
| `explicit-function-return-type` | Force à documenter les types de retour |
| `no-floating-promises` | Empêche les promesses non gérées |
| `no-unused-vars` | Garde le code propre |
| `import/order` | Organise les imports de manière cohérente |
