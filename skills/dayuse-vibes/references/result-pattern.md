# Pattern Result pour la Gestion d'Erreurs

Ce guide explique comment utiliser le pattern Result au lieu de throw/catch.

## Pourquoi Éviter les Exceptions ?

### Problèmes avec throw/catch

```typescript
// ❌ Problèmes avec les exceptions
function createUser(input: CreateUserInput): User {
  if (!isValidEmail(input.email)) {
    throw new Error('Email invalide'); // 1. On ne sait pas que ça peut throw
  }
  if (await emailExists(input.email)) {
    throw new Error('Email déjà utilisé'); // 2. Plusieurs types d'erreurs mélangés
  }
  return new User(input);
}

// L'appelant ne sait pas qu'il doit gérer des erreurs
const user = createUser(input); // Peut exploser !
```

### Avantages du Pattern Result

```typescript
// ✅ Avec Result, les erreurs sont explicites
function createUser(input: CreateUserInput): Result<User, CreateUserError> {
  if (!isValidEmail(input.email)) {
    return err({ type: 'INVALID_EMAIL', email: input.email });
  }
  // ...
  return ok(new User(input));
}

// L'appelant DOIT gérer le résultat
const result = createUser(input);
if (!result.success) {
  // Gérer l'erreur - TypeScript l'exige
}
```

---

## Implémentation du Type Result

```typescript
// src/shared/result.ts

/**
 * Type Result pour la gestion explicite des erreurs
 * Inspiré de Rust et autres langages fonctionnels
 */
export type Result<T, E = Error> =
  | { success: true; data: T }
  | { success: false; error: E };

/**
 * Crée un résultat réussi
 */
export function ok<T>(data: T): Result<T, never> {
  return { success: true, data };
}

/**
 * Crée un résultat en erreur
 */
export function err<E>(error: E): Result<never, E> {
  return { success: false, error };
}

/**
 * Vérifie si un résultat est un succès (type guard)
 */
export function isOk<T, E>(result: Result<T, E>): result is { success: true; data: T } {
  return result.success;
}

/**
 * Vérifie si un résultat est une erreur (type guard)
 */
export function isErr<T, E>(result: Result<T, E>): result is { success: false; error: E } {
  return !result.success;
}
```

---

## Utilisation de Base

### Retourner un Result

```typescript
import { Result, ok, err } from '../shared/result';

interface DivisionError {
  type: 'DIVISION_BY_ZERO';
}

function divide(a: number, b: number): Result<number, DivisionError> {
  if (b === 0) {
    return err({ type: 'DIVISION_BY_ZERO' });
  }
  return ok(a / b);
}
```

### Consommer un Result

```typescript
const result = divide(10, 2);

// Pattern 1: if/else
if (result.success) {
  console.log(`Résultat: ${result.data}`);
} else {
  console.error(`Erreur: ${result.error.type}`);
}

// Pattern 2: Early return
if (!result.success) {
  return handleError(result.error);
}
// Ici result.data est disponible et typé
console.log(result.data);
```

---

## Types d'Erreurs Structurés

### Définir les Types d'Erreur

```typescript
// Types d'erreur spécifiques pour un use case
export type CreateUserError =
  | { type: 'VALIDATION_ERROR'; message: string; field?: string }
  | { type: 'EMAIL_EXISTS'; email: string }
  | { type: 'INVALID_EMAIL'; email: string }
  | { type: 'DATABASE_ERROR'; cause: Error };

// Utilisation
function createUser(input: unknown): Result<User, CreateUserError> {
  // Validation
  const parseResult = CreateUserSchema.safeParse(input);
  if (!parseResult.success) {
    return err({
      type: 'VALIDATION_ERROR',
      message: parseResult.error.message,
    });
  }

  // Vérification email
  const emailResult = Email.create(parseResult.data.email);
  if (!emailResult.success) {
    return err({
      type: 'INVALID_EMAIL',
      email: parseResult.data.email,
    });
  }

  // ... reste de la logique
  return ok(user);
}
```

### Gérer les Erreurs par Type

```typescript
const result = await createUser(input);

if (!result.success) {
  switch (result.error.type) {
    case 'VALIDATION_ERROR':
      return res.status(400).json({
        error: 'Données invalides',
        message: result.error.message,
      });

    case 'EMAIL_EXISTS':
      return res.status(409).json({
        error: 'Conflit',
        message: `L'email ${result.error.email} est déjà utilisé`,
      });

    case 'INVALID_EMAIL':
      return res.status(400).json({
        error: 'Email invalide',
        email: result.error.email,
      });

    case 'DATABASE_ERROR':
      console.error('Erreur BDD:', result.error.cause);
      return res.status(500).json({
        error: 'Erreur interne',
      });
  }
}

// Succès
return res.status(201).json(result.data);
```

---

## Chaînage de Results

### Map - Transformer la Valeur

```typescript
/**
 * Transforme la valeur d'un Result réussi
 */
export function map<T, U, E>(
  result: Result<T, E>,
  fn: (value: T) => U
): Result<U, E> {
  if (result.success) {
    return ok(fn(result.data));
  }
  return result;
}

// Utilisation
const numberResult = divide(10, 2); // Result<number, DivisionError>
const stringResult = map(numberResult, (n) => n.toString()); // Result<string, DivisionError>
```

### FlatMap - Chaîner des Opérations

```typescript
/**
 * Chaîne des opérations qui retournent des Results
 */
export function flatMap<T, U, E>(
  result: Result<T, E>,
  fn: (value: T) => Result<U, E>
): Result<U, E> {
  if (result.success) {
    return fn(result.data);
  }
  return result;
}

// Utilisation
function parseNumber(str: string): Result<number, ParseError> {
  const num = Number(str);
  if (isNaN(num)) {
    return err({ type: 'PARSE_ERROR', value: str });
  }
  return ok(num);
}

function divideStrings(a: string, b: string): Result<number, ParseError | DivisionError> {
  const numA = parseNumber(a);
  if (!numA.success) return numA;

  const numB = parseNumber(b);
  if (!numB.success) return numB;

  return divide(numA.data, numB.data);
}
```

### Exemple Complet de Chaînage

```typescript
type UserCreationError =
  | { type: 'VALIDATION_ERROR'; message: string }
  | { type: 'EMAIL_INVALID'; email: string }
  | { type: 'EMAIL_EXISTS'; email: string }
  | { type: 'DATABASE_ERROR'; cause: Error };

async function createUser(
  rawInput: unknown
): Promise<Result<User, UserCreationError>> {
  // Étape 1: Valider l'input
  const validationResult = validate(CreateUserSchema, rawInput);
  if (!validationResult.success) {
    return err({
      type: 'VALIDATION_ERROR',
      message: validationResult.error.message,
    });
  }
  const input = validationResult.data;

  // Étape 2: Créer le Value Object Email
  const emailResult = Email.create(input.email);
  if (!emailResult.success) {
    return err({
      type: 'EMAIL_INVALID',
      email: input.email,
    });
  }

  // Étape 3: Vérifier l'unicité
  const exists = await userRepository.existsByEmail(emailResult.data.value);
  if (exists) {
    return err({
      type: 'EMAIL_EXISTS',
      email: input.email,
    });
  }

  // Étape 4: Créer et sauvegarder
  const user = new User(generateId(), input.name, emailResult.data);

  try {
    await userRepository.save(user);
  } catch (cause) {
    return err({
      type: 'DATABASE_ERROR',
      cause: cause instanceof Error ? cause : new Error(String(cause)),
    });
  }

  return ok(user);
}
```

---

## Helpers Utiles

### FromPromise - Wrapper pour les Promesses

```typescript
/**
 * Convertit une Promise en Result
 */
export async function fromPromise<T, E = Error>(
  promise: Promise<T>,
  mapError?: (error: unknown) => E
): Promise<Result<T, E>> {
  try {
    const data = await promise;
    return ok(data);
  } catch (error) {
    if (mapError) {
      return err(mapError(error));
    }
    return err(error as E);
  }
}

// Utilisation
const result = await fromPromise(
  fetch('/api/users').then((r) => r.json()),
  (error) => ({ type: 'FETCH_ERROR' as const, cause: error })
);
```

### Combine - Combiner Plusieurs Results

```typescript
/**
 * Combine plusieurs Results en un seul
 * Échoue dès qu'un Result échoue
 */
export function combine<T, E>(results: Result<T, E>[]): Result<T[], E> {
  const values: T[] = [];

  for (const result of results) {
    if (!result.success) {
      return result;
    }
    values.push(result.data);
  }

  return ok(values);
}

// Utilisation
const emailResults = [
  Email.create('a@example.com'),
  Email.create('b@example.com'),
  Email.create('invalid'),
];

const combined = combine(emailResults);
// Si un échoue, retourne l'erreur
// Si tous réussissent, retourne ok([Email, Email, Email])
```

### GetOrDefault - Valeur par Défaut

```typescript
/**
 * Retourne la valeur ou un défaut si erreur
 */
export function getOrDefault<T, E>(result: Result<T, E>, defaultValue: T): T {
  return result.success ? result.data : defaultValue;
}

// Utilisation
const count = getOrDefault(parseNumber(input), 0);
```

---

## Quand Utiliser Result vs Exceptions

### Utiliser Result Pour

- Erreurs métier prévisibles (email existe, validation échouée)
- Cas où l'erreur fait partie du flux normal
- Quand l'appelant doit gérer l'erreur

```typescript
// ✅ Erreur métier = Result
function withdraw(amount: number): Result<void, InsufficientFunds> {
  if (this.balance < amount) {
    return err({ type: 'INSUFFICIENT_FUNDS', balance: this.balance, requested: amount });
  }
  this.balance -= amount;
  return ok(undefined);
}
```

### Utiliser Exceptions Pour

- Bugs et erreurs de programmation
- Situations vraiment exceptionnelles
- Erreurs irrécupérables

```typescript
// ✅ Bug = Exception
function getElementById(id: string): Element {
  const element = document.getElementById(id);
  if (!element) {
    throw new Error(`Element ${id} not found - this is a bug`);
  }
  return element;
}
```

---

## Bonnes Pratiques

### 1. Toujours Typer les Erreurs

```typescript
// ❌ MAUVAIS - erreur non typée
function process(): Result<Data, Error> { ... }

// ✅ BON - erreur typée explicitement
type ProcessError =
  | { type: 'VALIDATION_ERROR'; message: string }
  | { type: 'NOT_FOUND'; id: string };

function process(): Result<Data, ProcessError> { ... }
```

### 2. Nommer les Types d'Erreur de Manière Descriptive

```typescript
// ❌ MAUVAIS
type Error = { type: 'ERROR_1' | 'ERROR_2' };

// ✅ BON
type CreateOrderError =
  | { type: 'PRODUCT_NOT_FOUND'; productId: string }
  | { type: 'INSUFFICIENT_STOCK'; available: number; requested: number }
  | { type: 'INVALID_QUANTITY'; quantity: number };
```

### 3. Inclure le Contexte dans les Erreurs

```typescript
// ❌ MAUVAIS - pas de contexte
return err({ type: 'NOT_FOUND' });

// ✅ BON - contexte inclus
return err({
  type: 'USER_NOT_FOUND',
  userId: id,
  searchedAt: new Date(),
});
```
