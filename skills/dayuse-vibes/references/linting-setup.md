# Linting and Formatting Configuration

This guide explains how to configure and use ESLint and Prettier.

## Why Lint?

Linting:
- Catches bugs before execution
- Enforces a consistent code style
- Prevents the `any` type
- Makes code reviews easier

---

## Installation

```bash
npm install -D eslint @eslint/js typescript-eslint prettier eslint-config-prettier eslint-plugin-import eslint-plugin-security eslint-plugin-no-secrets
```

---

## ESLint Configuration

Create `eslint.config.mjs`:

```javascript
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import eslintConfigPrettier from 'eslint-config-prettier';
import importPlugin from 'eslint-plugin-import';
import securityPlugin from 'eslint-plugin-security';
// @ts-expect-error - no types available
import noSecretsPlugin from 'eslint-plugin-no-secrets';

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
      security: securityPlugin,
      'no-secrets': noSecretsPlugin,
    },
    rules: {
      // === SECURITY ===
      'security/detect-object-injection': 'warn',
      'security/detect-non-literal-regexp': 'error',
      'security/detect-unsafe-regex': 'error',
      'no-secrets/no-secrets': 'error',

      // === CRITICAL: NO ANY ===
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unsafe-assignment': 'error',
      '@typescript-eslint/no-unsafe-call': 'error',
      '@typescript-eslint/no-unsafe-member-access': 'error',
      '@typescript-eslint/no-unsafe-return': 'error',
      '@typescript-eslint/no-unsafe-argument': 'error',

      // === EXPLICIT TYPES REQUIRED ===
      '@typescript-eslint/explicit-function-return-type': [
        'error',
        {
          allowExpressions: true,
          allowTypedFunctionExpressions: true,
        },
      ],
      '@typescript-eslint/explicit-module-boundary-types': 'error',

      // === CODE QUALITY ===
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

      // === IMPORT ORGANIZATION ===
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

## Prettier Configuration

Create `prettier.config.mjs`:

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

## package.json Scripts

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

## Usage Commands

```bash
# Check for lint issues
npm run lint

# Automatically fix issues
npm run lint:fix

# Format all files
npm run format

# Check if files are formatted
npm run format:check

# Run all checks
npm run check
```

---

## VS Code Integration

Create `.vscode/settings.json`:

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

Recommended extensions (`.vscode/extensions.json`):

```json
{
  "recommendations": [
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint"
  ]
}
```

---

## Pre-commit Hooks (Optional)

Install Husky and lint-staged:

```bash
npm install -D husky lint-staged
npx husky init
```

Create `.husky/pre-commit`:

```bash
npx lint-staged
```

Add to `package.json`:

```json
{
  "lint-staged": {
    "*.ts": ["eslint --fix", "prettier --write"]
  }
}
```

---

## Common Errors and Solutions

### Error: `@typescript-eslint/no-explicit-any`

```typescript
// BAD
function process(data: any): any {
  return data;
}

// SOLUTION: Use specific types or unknown
function process(data: unknown): ProcessedData {
  // Validate and process
}
```

### Error: `@typescript-eslint/explicit-function-return-type`

```typescript
// BAD
function add(a: number, b: number) {
  return a + b;
}

// SOLUTION: Add the return type
function add(a: number, b: number): number {
  return a + b;
}
```

### Error: `@typescript-eslint/no-floating-promises`

```typescript
// BAD
async function fetchData(): Promise<void> {
  fetch('/api/data'); // Promise not awaited
}

// SOLUTION: Await or handle the promise
async function fetchData(): Promise<void> {
  await fetch('/api/data');
}

// OR explicit void if the result is not needed
function triggerFetch(): void {
  void fetch('/api/data');
}
```

### Error: `@typescript-eslint/no-unused-vars`

```typescript
// BAD
function process(data: Data, options: Options): void {
  console.log(data);
  // options is not used
}

// SOLUTION: Prefix with underscore
function process(data: Data, _options: Options): void {
  console.log(data);
}
```

### Error: `@typescript-eslint/no-unsafe-assignment`

```typescript
// BAD
const data = JSON.parse(jsonString); // implicit any type

// SOLUTION: Type and validate
const data: unknown = JSON.parse(jsonString);
const validatedData = MySchema.parse(data); // With Zod
```

---

## Troubleshooting

### ESLint cannot find tsconfig

Make sure `tsconfig.json` exists and includes all source files:

```json
{
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### Prettier and ESLint Conflict

The `eslint-config-prettier` package disables ESLint rules that conflict with Prettier. Make sure it is included last in the config.

### Too Many Errors to Fix

Start by fixing errors in small batches:

```bash
# Fix only specific files
npx eslint src/domain/ --fix

# See progress with a max number of warnings
npx eslint src/ --max-warnings 50
```

### Temporarily Ignore a Rule

```typescript
// For a single line
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const legacy: any = oldCode();

// For a block
/* eslint-disable @typescript-eslint/no-explicit-any */
// ... legacy code
/* eslint-enable @typescript-eslint/no-explicit-any */
```

**Warning**: Only use this for legacy code being migrated. Never disable rules for new code.

---

## Critical Rules Explained

| Rule | Why |
|------|-----|
| `no-explicit-any` | Prevents the use of `any` |
| `no-unsafe-*` | Prevents unsafe operations with `any` |
| `explicit-function-return-type` | Forces documenting return types |
| `no-floating-promises` | Prevents unhandled promises |
| `no-unused-vars` | Keeps the code clean |
| `import/order` | Organizes imports consistently |
